export interface EvidenceItem {
  id: string;
  title: string;
  /** Path under /public. Absence renders an explicit missing state. */
  file: string;
  alt: string;
  caption: string;
  /** Owner-reported reading from the AWS console, not measured by this app. */
  statedFact: string;
  /** Screenshot by default; a recording is never implied to be happening now. */
  kind?: "image" | "video";
  /** Poster frame for a video, so nothing downloads before play. */
  poster?: string;
}

export const EVIDENCE_ITEMS: EvidenceItem[] = [
  {
    id: "training-job",
    title: "The job that produced the adapter",
    file: "/evidence/training-job.png",
    alt: "SageMaker training job list showing a completed QLoRA fine-tuning job.",
    caption: "",
    statedFact: "Completed · approximately 7 hours",
  },
  {
    id: "endpoint",
    title: "The endpoint that serves it",
    file: "/evidence/endpoint.png",
    alt: "SageMaker endpoint detail showing status InService.",
    caption: "",
    statedFact: "InService",
  },
  {
    id: "training-logs",
    title: "Watch the run finish",
    kind: "video",
    file: "/evidence/training-logs.mp4",
    poster: "/evidence/training-logs-poster.jpg",
    alt:
      "Screen recording of CloudWatch log events for the QLoRA training job, showing training progress climb from 1359 of 1528 steps to 1528 of 1528, followed by the SageMaker training toolkit reporting training SUCCESS.",
    caption: "",
    statedFact: "1528/1528 steps · SUCCESS",
  },
];


export interface EvidenceChainNode {
  id: string;
  label: string;
  sublabel: string;
  /** Evidence item attesting to this node, when one exists. */
  evidenceId?: string;
}

/**
 * The delivery chain from corpus to served request. Two nodes are attested by
 * a console screenshot; the rest are asserted by the artifacts they produce.
 * Nothing here carries a measurement.
 */
export const EVIDENCE_CHAIN: EvidenceChainNode[] = [
  { id: "data", label: "Training Data", sublabel: "Dolly 15K" },
  {
    id: "training",
    label: "SageMaker Training",
    sublabel: "managed training job",
    evidenceId: "training-job",
  },
  { id: "qlora", label: "QLoRA Fine-Tuning", sublabel: "adapters over frozen 4-bit base" },
  { id: "artifact", label: "Model Artifact", sublabel: "adapter + config" },
  {
    id: "serving",
    label: "SageMaker Endpoint",
    sublabel: "hosted inference",
    evidenceId: "endpoint",
  },
  { id: "runtime", label: "Runtime Inference", sublabel: "invoked by this application" },
];

/**
 * Removed before an image is committed. The application performs no automated
 * redaction and cannot detect a leak in a raster image -- this list is the
 * manual gate.
 */
export const SANITIZATION_CHECKLIST = [
  "AWS account ID",
  "ARNs",
  "IAM user and role names",
  "credentials and API keys",
  "S3 bucket paths",
  "endpoint and job identifiers not needed to read the status",
];
