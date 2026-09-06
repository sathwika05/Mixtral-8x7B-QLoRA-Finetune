import os 
import argparse


from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    set_seed,
    default_data_collator,
    BitsAndBytesConfig,
    Trainer,
    TrainingArguments
)

from datasets import load_from_disk

import torch 

import bitsandbytes as bnb # for efficient 4 bit training
from huggingface_hub import login, HfFolder # fetch with huggingface token and login eventually


def parse_args():
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--model_id",
        type = str,
        help = "Model id used for training"
    )

    parser.add_argument(
      "--dataset_path",
       type = str,
       default ="lm_dataset",
       help = "path to dataset"
    )

    parser.add_argument(
        "--hf_token",
        type = str,
        default = HfFolder.get_token(),
        help = "hf token"
    )

    parser.add_argument(
        "--epochs",
        type=int,
        default = 3,
        help = "number of epochs to run for"
    )

    parser.add_argument(
        "--per_device_train_batch_size",
        type = int,
        default = 1,
        help = "batch size to use for training"
    )

    parser.add_argument(
        "--lr",
        type = float,
        default = 5e-5,
        help = "learning rate to use for training"
    )

    parser.add_argument(
        "--seed",
        type=int,
        default = 42,
        help = "Seed to use for training"
    )

    parser.add_argument(
        "--gradient_checkpointing",
        type = bool,
        default = True,
        help = "Use or not use gradient checkpointing"
    )

    parser.add_argument(
        "--bf16",
        type = bool,
        default = True if torch.cuda.get_device_capability()[0] == 8 else False,
        help = "whether to use bf16 or not"
    )

    parser.add_argument(
        "--merge_weights",
        type = bool,
        default = True,
        help = "Whether to merge LoRA weights with base model's weights"
    )

    args, _ = parser.parse_known_args()

    if args.hf_token:
        print("logging into hf hub with token")
        login(token = args.hf_token)

    return args

# how many trainable parameters our model is going to have
# use_4bit is false because we are going to use the mixed precision and Bfloat16
# This function calculates:
# 1. Total number of parameters in the model
# 2. Number of parameters that are trainable
#
# use_4bit=False because we are using mixed precision / BFloat16
# instead of 4-bit quantization.

def trainable_parameters(model, use_4bit=False):

    # Parameters that will receive gradients during backpropagation
    # and can therefore be updated by the optimizer
    trainable_params = 0

    # Total number of parameters in the whole model
    all_params = 0

    # Go through every parameter tensor in the model
    for _, param in model.named_parameters():

        # Count how many individual values are inside this tensor
        num_params = param.numel()

        # Special case for DeepSpeed ZeRO:
        # A parameter may temporarily appear to contain 0 elements
        # because it is partitioned across GPUs.
        if num_params == 0 and hasattr(param, "ds_numel"):
            num_params = param.ds_numel

        # Add this tensor's parameters to the total parameter count
        all_params += num_params

        # requires_grad=True means:
        # During BACKPROPAGATION, PyTorch calculates the gradient
        # of the loss with respect to this parameter.
        #
        # Gradient tells us:
        # "How should this parameter change to reduce the loss?"
        if param.requires_grad:

            # Since this parameter receives gradients during
            # backpropagation, it is considered trainable.
            trainable_params += num_params

    # If the model is loaded in 4-bit precision,
# the weights require less memory than 8-bit/16-bit weights.
#
# Some older parameter-reporting code divides the count by 2
# as an adjustment for 4-bit storage representation.
#
# IMPORTANT:
# This does NOT mean the model has half the trainable parameters.
# Quantization reduces memory usage, not the actual parameter count.
#
# This also does NOT change backpropagation.
# Parameters that are trainable (requires_grad=True) still receive gradients.

    if use_4bit:
        trainable_params /= 2


# Print the total number of parameters in the model.
#
# :,d means:
#   d  -> format as an integer
#   ,  -> add commas to make large numbers easier to read
#
# Example:
# 234567896 -> 234,567,896
    print(
        f"all params: {all_params:,d} || trainable params: {trainable_params:,d} || trainable%: {100 * trainable_params/ all_params}"
    )

# We are going to bfloat16 need not worry for use_4bit
           

def find_all_linear_names(model):

    # Store the names of linear layers where LoRA adapters
    # can be injected. A set avoids duplicate names.
    lora_module_names = set()

    # Loop through every module/layer in the model.
    for name, module in model.named_modules():

        # Check whether this module is a BitsAndBytes
        # 4-bit quantized linear layer.
        #
        # bnb = BitsAndBytes library
        # nn = neural-network layers
        # Linear4bit = linear layer whose base weights
        # are stored in 4-bit precision to save GPU memory.
        #
        # During computation, the required 4-bit weights
        # are temporarily dequantized to BF16 because
        # 4-bit precision is too low for reliable matrix math.
        #
        # These are the layers where LoRA can inject
        # the small trainable A and B matrices while
        # keeping the original base weights frozen.
        if isinstance(module, bnb.nn.Linear4bit):

            # Example full module name:
            # model.layers.0.self_attn.q_proj
            #
            # Split the name at ".".
            names = name.split(".")

            # Keep only the last part of the module name.
            # Example:
            # model.layers.0.self_attn.q_proj
            #                         ↓
            #                      q_proj
            lora_module_names.add(
                names[0] if len(names) == 1 else names[-1]
            )

    # Exclude the final language-model output layer.
    # LoRA is usually applied to transformer linear layers,
    # not the lm_head output layer.
    if "lm_head" in lora_module_names:
        lora_module_names.remove("lm_head")

    # Return the layer names where LoRA adapters can be added.
    # Example:
    # ['q_proj', 'k_proj', 'v_proj', 'o_proj', ...]
    #q_proj → Query Projection, k_proj → Key Projection, v_proj → Value Projection, o_proj → Output Projection
    return list(lora_module_names)


def create_peft_model(model, gradient_checkpointing=True, bf16=True):

    # PEFT = Parameter-Efficient Fine-Tuning
    # Instead of training the entire large model,
    # we train only a small number of additional parameters (LoRA adapters).

    from peft import (
        get_peft_model,                  # Injects LoRA adapters into the model
        LoraConfig,                      # Defines LoRA settings (rank, alpha, target layers, etc.)
        TaskType,                        # Specifies the type of model/task, e.g. causal language modeling
        prepare_model_for_kbit_training  # Prepares a quantized (4-bit/8-bit) model for PEFT training
    )

    # Used to identify modules/layers where LoRA has been injected.
    from peft.tuners.lora import LoraLayer


    # Prepare the 4-bit quantized model for QLoRA training.
    #
    # Important:
    # The base model is stored in 4-bit to save GPU memory.
    # We are NOT training the base weights in 4-bit.
    #
    # When base weights are needed for computation,
    # they are dequantized to the configured compute dtype
    # (e.g. BF16) for the matrix operations.
    #
    # The original base-model weights remain frozen.
    model = prepare_model_for_kbit_training(
        model,
        use_gradient_checkpointing=gradient_checkpointing
    )


    # Enable gradient checkpointing if requested.
    #
    # Normally, intermediate activations from the forward pass
    # are stored because they are needed during backpropagation.
    #
    # Gradient checkpointing stores fewer activations.
    # During backpropagation, some activations are recomputed.
    #
    # Benefit:
    # Less GPU memory usage.
    #
    # Trade-off:
    # Slightly slower training because some forward computations
    # have to be performed again.
    if gradient_checkpointing:
        model.gradient_checkpointing_enable() 

    modules = find_all_linear_names(model)

    # Find the 4-bit quantized linear layers where LoRA adapters can be injected.
    # Example: ['q_proj', 'k_proj', 'v_proj', 'o_proj', ...]
    print(f"found {len(modules)} modules to quantize: {modules}")

    peft_config = LoraConfig(
        # LoRA rank.
        # 64 is NOT bits.
        # It is the intermediate dimension used by the small LoRA A and B matrices.
    #
        # If W has shape (k x d):
        # A -> (64 x d)
        # B -> (k x 64)
        r=64,
        # Scaling factor for the LoRA update.
        # Scaling is usually alpha / r = 16 / 64 = 0.25
        lora_alpha = 16,
        # Inject LoRA into the linear layers found above.
        target_modules = modules,
        # Drop 10% of LoRA activations during training
        # to reduce overfitting.
        lora_dropout = 0.1,
        # Do not train bias parameters.
        bias = "none",
         # Causal Language Modeling = decoder-only next-token prediction.
        task_type = TaskType.CAUSAL_LM
    )
    
    # Inject the LoRA A and B matrices into the selected layers.
    # Base-model weights remain frozen.
    # LoRA A and B become trainable.
    model = get_peft_model(model, peft_config)

    # Adjust data types for mixed-precision training.
    for name, module in model.named_modules():
        # LoRA layers are converted to BF16.
        # BF16 provides good precision for training while using less memory than FP32.
 
        if isinstance(module,LoraLayer):
            if bf16:
                module = module.to(torch.bfloat16)
        # Normalization layers are numerically sensitive,
        # so keep them in FP32 for stability.
        if "norm" in name:
            module.to(torch.float32)


         # Embedding layer and final LM output layer.
        if "lm_head" in name or "embed_tokens" in name:
            # Check that the module actually has weights.
            if hasattr(module,"weight"):
                # If BF16 is enabled and the weights are currently FP32,
            # convert them to BF16.
                if bf16 and module.weight.dtype==torch.float32:
                    module=module.to(torch.bfloat16)
    # Show how many parameters are actually trainable.
    # In QLoRA, this should mainly be the LoRA A and B parameters.
    model.print_trainable_parameters()

    # Return the prepared PEFT/QLoRA model.

    return model


def training_function(args):

    # Set the random seed so training is reproducible.
    # Running with the same seed helps produce consistent results.
    set_seed(args.seed)


    # Load the already processed/tokenized dataset from disk.
    # This dataset is ready for causal language model training.
    dataset = load_from_disk(args.dataset_path)


    # ---------------------------------------------------------
    # 4-BIT QUANTIZATION CONFIGURATION
    # ---------------------------------------------------------

    bnb_config = BitsAndBytesConfig(

        # Load the base model weights in 4-bit precision
        # instead of FP16/FP32.
        #
        # Main purpose:
        # Reduce GPU memory usage.
        #
        # This also causes many standard Linear layers
        # to become bnb.nn.Linear4bit layers.
        load_in_4bit=True,


        # Enable DOUBLE QUANTIZATION.
        #
        # First quantization:
        #   Model weights -> 4-bit
        #
        # Second quantization:
        #   Quantization/scaling information is also compressed.
        #
        # This gives additional memory savings.
        bnb_4bit_use_double_quant=True,


        # NF4 = NormalFloat 4-bit.
        #
        # This is the 4-bit quantization format used for
        # storing the base-model weights.
        #
        # It is designed to work well with neural-network
        # weight distributions.
        bnb_4bit_quant_type="nf4",


        # The base weights are STORED in 4-bit,
        # but computations need higher precision.
        #
        # Therefore, when matrix operations are required,
        # the 4-bit weights are dequantized on-the-fly
        # to BF16 for computation.
        #
        # 4-bit -> memory-efficient storage
        # BF16  -> higher precision / more stable computation
        bnb_4bit_compute_dtype=torch.bfloat16
    )


    # ---------------------------------------------------------
    # LOAD PRETRAINED MODEL
    # ---------------------------------------------------------

    model = AutoModelForCausalLM.from_pretrained(

        # Hugging Face model ID.
        args.model_id,


        # Disable KV cache when gradient checkpointing is enabled.
        #
        # Gradient checkpointing saves memory by recomputing
        # some activations during backward propagation.
        #
        # use_cache=False is normally used with it because
        # caching and gradient checkpointing conflict with
        # the memory-saving training setup.
        use_cache=False if args.gradient_checkpointing else True,


        # Automatically place model parts on available hardware.
        # Example:
        # GPU / multiple GPUs / CPU as needed.
        device_map="auto",


        # Apply the 4-bit BitsAndBytes configuration above.
        quantization_config=bnb_config,
        force_download = True,
    )


    # ---------------------------------------------------------
    # PREPARE MODEL FOR QLoRA / PEFT
    # ---------------------------------------------------------

    model = create_peft_model(

        model,

        # Enable/disable gradient checkpointing.
        gradient_checkpointing=args.gradient_checkpointing,

        # Use BF16 mixed-precision setup when enabled.
        bf16=args.bf16
    )

    # create_peft_model() does the work we discussed earlier:
    #
    # Find Linear4bit target layers
    #        ->
    # Inject LoRA A and B matrices
    #        ->
    # Freeze base-model weights
    #        ->
    # LoRA A and B become trainable
    #        ->
    # Configure mixed precision


    # Directory where training outputs/logs can be stored.
    output_dir = "/tmp/mixtral"


    # ---------------------------------------------------------
    # TRAINING CONFIGURATION
    # ---------------------------------------------------------

    training_args = TrainingArguments(

        # Directory for training output.
        output_dir=output_dir,


        # Number of training samples processed on each GPU
        # in one training step.
        per_device_train_batch_size=args.per_device_train_batch_size,


        # Enable BF16 training when requested.
        #
        # LoRA calculations can use BF16 for efficient
        # and numerically stable training.
        bf16=args.bf16,


        # Learning rate:
        # controls how much the trainable LoRA parameters
        # change during each optimizer update.
        learning_rate=args.lr,


        # Number of full passes through the training dataset.
        num_train_epochs=args.epochs,


        # Enable gradient checkpointing to reduce GPU memory.
        #
        # Trade-off:
        # less memory, but extra computation because
        # activations are recomputed during backpropagation.
        gradient_checkpointing=args.gradient_checkpointing,


        # Directory where training logs are written.
        logging_dir=f"{output_dir}/logs",


        # Log based on training steps instead of epochs.
        logging_strategy="steps",


        # Do not automatically save intermediate checkpoints.
        #
        # The video notes that in a more production-oriented
        # setup you would normally consider checkpoint saving,
        # because otherwise a failed run must restart.
        save_strategy="no"
    )


    # ---------------------------------------------------------
    # CREATE HUGGING FACE TRAINER
    # ---------------------------------------------------------

    trainer = Trainer(

        # QLoRA/PEFT model.
        model=model,


        # Training configuration defined above.
        args=training_args,


        # Tokenized training dataset.
        train_dataset=dataset,


        # Automatically groups examples into batches
        # in the format expected by the model.
        data_collator=default_data_collator
    )


    # ---------------------------------------------------------
    # START TRAINING
    # ---------------------------------------------------------

    # Start QLoRA fine-tuning.
    # During training:
    # Base model weights -> frozen
    # LoRA A and B       -> trainable
    trainer.train()


    # Standard SageMaker model directory.
    # Files saved here are treated as the final model artifacts
    # and SageMaker can upload them to S3 after training.
    sagemaker_save_dir = "/opt/ml/model/"


    # If we want to merge the trained LoRA adapters
    # with the original base-model weights.
    if args.merge_weights:

        # First save the PEFT model locally.
        # This contains the trained LoRA adapter information.
        trainer.model.save_pretrained(
            output_dir,
            safe_serialization=False
        )


        # Delete the current model and Trainer objects
        # to free GPU memory before loading the model again.
        del model
        del trainer

        # CUDA = Compute Unified Device Architecture.
        # Clear unused cached NVIDIA GPU memory.
        # CUDA is NVIDIA's platform that allows programs like PyTorch to use an NVIDIA GPU for computation.
        torch.cuda.empty_cache()


        # Load the saved PEFT/LoRA model.
        from peft import AutoPeftModelForCausalLM

        model = AutoPeftModelForCausalLM.from_pretrained(
            output_dir,

            # Reduce CPU RAM usage while loading the model.
            low_cpu_mem_usage=True,

            # Load the model in FP16 for the merge.
            # This uses less memory than FP32.
            torch_dtype=torch.float16
        )


        # Merge the trained LoRA update into the base-model weights.
        #
        # Conceptually:
        #
        # Final Weight =
        # Base Weight + Scaled LoRA Update
        #
        # W_final = W_base + (alpha / r) * BA
        #
        # After merging, separate LoRA adapter layers
        # are removed/unloaded.
        model = model.merge_and_unload()


        # Save the final merged model to SageMaker's
        # standard model directory.
        model.save_pretrained(
            sagemaker_save_dir,

            # Save using safe serialization (typically safetensors).
            safe_serialization=True,

            # If the model is very large, split it into
            # multiple files of at most approximately 2 GB each.
            max_shard_size="2GB"
        )


    else:

        # If we are NOT merging the LoRA weights,
        # save the PEFT model/adapters directly.
        trainer.model.save_pretrained(
            sagemaker_save_dir,
            safe_serialization=True
        )


    # Load the tokenizer belonging to the original model.
    # The same tokenizer is needed later during inference
    # to convert text <-> tokens.
    tokenizer = AutoTokenizer.from_pretrained(args.model_id)

    # Save the tokenizer together with the model artifacts.
    tokenizer.save_pretrained(sagemaker_save_dir)


def main():
    args = parse_args()
    training_function(args)

if __name__=="__main__":
    main()
    
    













