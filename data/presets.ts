export interface Preset {
  label: string;
  instruction: string;
  context?: string;
}

export const PRESETS: Preset[] = [
  {
    label: "Open instruction",
    instruction:
      "Explain how mixture-of-experts routing differs from dense attention.",
  },
  {
    label: "Closed QA",
    instruction: "Using only the passage, state how many experts are active per token.",
    context:
      "Mixtral-8x7B is a sparse mixture-of-experts model with eight expert feed-forward blocks per layer. A router selects two experts per token.",
  },
  {
    label: "Summarization",
    instruction: "Summarize the passage in two sentences.",
    context:
      "QLoRA fine-tunes a large language model by freezing a 4-bit quantized base and training small low-rank adapters, which reduces the memory required to fine-tune large models.",
  },
  {
    label: "Structured extraction",
    instruction: "Extract each configuration value from the text as a JSON object.",
    context:
      "The run used LoRA rank 64, LoRA alpha 16, two epochs, and a learning rate of 2e-4.",
  },
];
