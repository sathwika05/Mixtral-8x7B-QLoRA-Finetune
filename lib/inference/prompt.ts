const PREAMBLE_NO_CONTEXT =
  "Below is an instruction that describes a task. " +
  "Write a response that appropriately completes the request.";

const PREAMBLE_WITH_CONTEXT =
  "Below is an instruction that describes a task, paired with an input " +
  "that provides further context. Write a response that appropriately " +
  "completes the request.";

/**
 * Renders the Databricks Dolly 15K instruction format the adapter was trained
 * on. Content is trimmed at the edges but never truncated.
 */
export function renderPrompt(instruction: string, context?: string): string {
  const trimmedInstruction = instruction.trim();
  if (!trimmedInstruction) {
    throw new Error("renderPrompt requires a non-empty instruction.");
  }

  const trimmedContext = context?.trim();

  const lines = trimmedContext
    ? [
        PREAMBLE_WITH_CONTEXT,
        "",
        "### Instruction:",
        trimmedInstruction,
        "",
        "### Input:",
        trimmedContext,
        "",
        "### Response:",
        "",
      ]
    : [
        PREAMBLE_NO_CONTEXT,
        "",
        "### Instruction:",
        trimmedInstruction,
        "",
        "### Response:",
        "",
      ];

  return lines.join("\n");
}
