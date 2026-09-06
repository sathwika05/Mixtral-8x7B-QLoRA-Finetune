export interface CaseStudyStage {
  id: string;
  title: string;
  /** One line stating what this stage settles. */
  thesis: string;
  /** Short paragraphs. Prose stays out of components. */
  body: string[];
}

/**
 * The nine narrative stages. Order is fixed and asserted in tests: the case
 * study reads as one argument, so a reordering is a content change, not a
 * layout tweak.
 */
export const CASE_STUDY_STAGES: CaseStudyStage[] = [
  {
    id: "problem",
    title: "Problem",
    thesis: "Instruction-following was the goal. Available memory decided how it could be reached.",
    body: [
      "Mixtral-8x7B-v0.1 is a base sparse mixture-of-experts checkpoint, not an instruction-tuned one. Reliable instruction-following required supervised fine-tuning on an instruction corpus.",
      "Full fine-tuning at this parameter scale was not feasible on the available hardware. The binding constraint was memory, and it dictated the whole approach: the model had to be made smaller to train before it could be trained at all.",
    ],
  },
  {
    id: "approach",
    title: "Fine-Tuning Approach",
    thesis: "Freeze a quantized base, train small adapters.",
    body: [
      "Full fine-tuning updates every parameter and carries optimizer state proportional to the model. Ruled out by the constraint.",
      "LoRA over a 16-bit base cuts trainable parameters but still holds the full-precision base resident. Still too large.",
      "QLoRA holds the base in 4-bit NF4 and trains low-rank adapters above it, leaving roughly 3.96% of parameters receiving gradients. That is the trade-off that made the run possible; the costs are a quantized base and an adapter the deployment has to carry alongside it.",
    ],
  },
  {
    id: "qlora-architecture",
    title: "QLoRA Training Architecture",
    thesis: "One training step: a frozen quantized base does the work, and only the adapters change.",
    body: [
      "The base is quantized to 4-bit NF4 once, before training, and never updated again. LoRA A/B adapters attach to it and are the sole destination of gradients \u2014 roughly 3.96% of parameters. Forward and backward computation runs in BF16 above the quantized weights.",
      "That asymmetry is the whole design: the expensive tensor stays read-only and can be held in 4 bits, while the tensors that must be written are small enough to keep in higher precision. The final step yields an adapter artifact, which is what gets deployed.",
    ],
  },
  {
    id: "training-configuration",
    title: "Training Configuration",
    thesis: "The recorded run configuration, grouped by the problem each setting solves.",
    body: [
      "Anything never recorded is shown as unrecorded rather than filled with a plausible default, because a fabricated hyperparameter is worse than a missing one. No loss curve, validation figure, or utilization number appears here: none was captured.",
    ],
  },
  {
    id: "aws-deployment",
    title: "AWS Training & Deployment",
    thesis: "Corpus to training job to artifact to a served endpoint, with two links attested by console evidence.",
    body: [
      "Two points in the chain can be shown rather than asserted: that the training job completed, and that the endpoint reached service. Both are console readings reported by the project owner \u2014 this application did not measure them, and no utilization, throughput, or cost figure is claimed.",
      "Evidence is supplied by the project owner and reviewed by hand before it is committed. The application performs no automated redaction, so what a screenshot or recording contains is a publication decision made deliberately, not one the code enforces.",
    ],
  },
  {
    id: "runtime-architecture",
    title: "Runtime Inference Architecture",
    thesis: "A request crosses one trust boundary, and credentials never cross it.",
    body: [
      "The browser calls this application's own route handler and nothing else. The endpoint URL and API key are read server-side and are never bundled into client JavaScript, returned in a response, or included in an error.",
    ],
  },
  {
    id: "inference-request",
    title: "Inference Request",
    thesis: "How a single request is issued, and what the application records about it.",
    body: [
      "The console below issues a request through the server-side path described above: the browser posts an instruction to this application's route handler, which forwards it to the configured endpoint and normalizes the reply.",
      "Whether that endpoint is reachable at any given moment is reported by the status line, not asserted here. Any figure shown is measured by the application for the request that produced it.",
    ],
  },
  {
    id: "evaluation-observability",
    title: "Evaluation & Observability",
    thesis: "Only what the application actually observed.",
    body: [
      "Session telemetry covers real requests: total round-trip, HTTP status, whether parameters were transmitted, and output size. Statistics over an empty set return nothing rather than zero, and every aggregate carries its sample size.",
      "There is no quality score, benchmark result, or base-model comparison here, because none was measured.",
    ],
  },
  {
    id: "engineering-decisions",
    title: "Engineering Decisions",
    thesis: "The choices that shaped this system, and what each one cost.",
    body: [],
  },
];

interface DecisionBase {
  id: string;
  decision: string;
  constraint: string;
  tradeoff: string;
}

/**
 * A training decision. These are not enforced by code -- they were made once,
 * for this run, under this run's constraints. Each cites the configuration
 * value actually recorded rather than a file, and none is presented as a
 * generally correct choice.
 */
export interface TrainingDecision extends DecisionBase {
  recordedAs: string;
}

/** What a card can render. */
export type AnyDecision = DecisionBase & {
  enforcedBy?: string[];
  recordedAs?: string;
};


export const TRAINING_DECISIONS: TrainingDecision[] = [
  {
    id: "why-qlora",
    decision: "Adapt the model with QLoRA rather than full-weight fine-tuning.",
    constraint:
      "Full fine-tuning carries optimizer state proportional to the model, which did not fit the available hardware.",
    tradeoff:
      "Confining updates to adapters made the run possible at all. The costs are a quantized base and an adapter the deployment has to carry alongside it. With a smaller model or a larger memory budget, full fine-tuning would have been a viable option; here it was not.",
    recordedAs: "QLoRA",
  },
  {
    id: "why-nf4",
    decision: "Hold the frozen base in 4-bit NF4.",
    constraint:
      "The base had to stay resident for every step, and at full precision it was too large to keep there.",
    tradeoff:
      "Quantization buys residency and spends fidelity in the frozen weights. This is a memory decision for this hardware, not a claim that 4-bit storage is preferable once memory stops being the binding constraint.",
    recordedAs: "4-bit NF4",
  },
  {
    id: "why-lora",
    decision: "Train low-rank adapters and freeze the base weights.",
    constraint: "Only a small parameter budget could receive gradients.",
    tradeoff:
      "About 3.96% of parameters carry the update, which keeps optimizer state small and the resulting artifact portable. The base cannot move, so anything that would require shifting the base representations is outside what this approach can reach.",
    recordedAs: "~3.96% trainable",
  },
  {
    id: "why-bf16",
    decision: "Run forward and backward computation in BF16.",
    constraint:
      "Arithmetic needed more dynamic range than the 4-bit storage format carries, without paying full FP32 width.",
    tradeoff:
      "BF16 keeps the exponent range of FP32 at half the width, so steps stay numerically stable without loss scaling. It gives up mantissa precision against FP16 at equal width. Appropriate for this run's hardware rather than a universally correct precision.",
    recordedAs: "BF16",
  },
  {
    id: "why-grad-checkpointing",
    decision: "Enable gradient checkpointing.",
    constraint:
      "Once the base was quantized, activation memory rather than weight memory was the remaining ceiling.",
    tradeoff:
      "Activations are recomputed during the backward pass instead of being stored, which buys headroom and spends wall-clock time. A direct exchange of compute for memory, worth making only while memory is what binds.",
    recordedAs: "Enabled",
  },
  {
    id: "why-rank-64",
    decision: "Set adapter rank to 64 with alpha 16.",
    constraint:
      "Rank bounds what the adapter can express: too low limits what it can learn, too high erodes the parameter savings the approach exists to provide.",
    tradeoff:
      "64 is the capacity this run was configured with. No comparison against other ranks is recorded for this project, so it is presented as a configured choice rather than a tuned optimum. A lower rank would shrink the artifact further; a higher one would spend more of the efficiency.",
    recordedAs: "rank 64 · alpha 16",
  },
];
