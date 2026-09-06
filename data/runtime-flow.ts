export interface RuntimeNode {
  id: string;
  label: string;
  sublabel: string;
}

/**
 * The runtime request path: what a single inference request traverses.
 * This is the ONLY sequence that animates during a request, and it is
 * deliberately disjoint from LIFECYCLE_STAGES -- a user request does not
 * pass through training.
 */
export const RUNTIME_NODES: RuntimeNode[] = [
  { id: "app", label: "Next.js", sublabel: "Route Handler" },
  { id: "api-gateway", label: "API Gateway", sublabel: "HTTPS" },
  { id: "lambda", label: "Lambda", sublabel: "Invoke" },
  { id: "endpoint", label: "SageMaker", sublabel: "Endpoint" },
  { id: "model", label: "Mixtral", sublabel: "8x7B + adapter" },
  { id: "response", label: "Response", sublabel: "Normalized" },
];
