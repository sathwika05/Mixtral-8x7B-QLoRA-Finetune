import { existsSync } from "node:fs";
import { join } from "node:path";
import { Nav } from "@/components/shell/nav";
import { SectionHeading } from "@/components/system/section-heading";
import { RouteLink } from "@/components/system/route-link";
import { TrainingConfig } from "@/components/case-study/training-config";
import { EvidenceCard } from "@/components/evidence/evidence-card";
import { EvidenceVideo } from "@/components/evidence/evidence-video";
import { LifecycleTrack } from "@/components/flow/lifecycle-track";
import { RuntimeFlowRail } from "@/components/flow/runtime-flow-rail";
import { StageSection } from "@/components/case-study/stage-section";
import { StageIndex } from "@/components/case-study/stage-index";
import { DecisionCard } from "@/components/case-study/decision-card";
import { SessionRunLog } from "@/components/evaluation/session-run-log";
import { TrainingArchitecture } from "@/components/case-study/training-architecture";
import { SecurityBoundary } from "@/components/case-study/security-boundary";
import {
  CASE_STUDY_STAGES,
  TRAINING_DECISIONS,
} from "@/data/case-study";
import { EvidenceChain } from "@/components/case-study/evidence-chain";
import { EVIDENCE_ITEMS } from "@/data/evidence";

export const dynamic = "force-dynamic";

/** Body content per stage, keyed by stage id. Prose lives in data/case-study.ts. */
function stageContent(id: string, evidence: Array<{ item: (typeof EVIDENCE_ITEMS)[number]; available: boolean }>) {
  switch (id) {
    case "approach":
      return <LifecycleTrack />;
    case "qlora-architecture":
      return <TrainingArchitecture />;
    case "training-configuration":
      return <TrainingConfig />;
    case "aws-deployment": {
      const availability = Object.fromEntries(
        evidence.map(({ item, available }) => [item.id, available]),
      );
      return (
        <div className="flex flex-col gap-5">
          <EvidenceChain availability={availability} />
          <div className="grid gap-4 md:grid-cols-2">
            {evidence.map(({ item, available }) =>
              item.kind === "video" ? (
                <EvidenceVideo
                  key={item.id}
                  item={item}
                  available={available}
                />
              ) : (
                <EvidenceCard
                  key={item.id}
                  item={item}
                  available={available}
                />
              ),
            )}
          </div>
        </div>
      );
    }
    case "runtime-architecture":
      return (
        <div className="flex flex-col gap-4">
          {/* Static here: only the console animates a request. */}
          <RuntimeFlowRail active={false} durationMs={null} />
          <SecurityBoundary />
        </div>
      );
    case "evaluation-observability":
      return <SessionRunLog />;
    case "inference-request":
      return (
        <RouteLink
          href="/inference"
          label="Run inference against the deployed endpoint"
        />
      );
    case "engineering-decisions":
      return (
        <div className="flex flex-col gap-3">
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {TRAINING_DECISIONS.map((decision) => (
              <DecisionCard key={decision.id} decision={decision} />
            ))}
          </div>
        </div>
      );
    default:
      return null;
  }
}

export default function CaseStudyPage() {
  const evidence = EVIDENCE_ITEMS.map((item) => ({
    item,
    available: existsSync(join(process.cwd(), "public", item.file)),
  }));

  return (
    <main className="min-h-screen">
      <Nav />
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
        <SectionHeading
          eyebrow="Case study"
          title="A fine-tuned model, and the system that serves it"
          description="How Mixtral-8x7B-v0.1 was adapted with QLoRA, deployed to SageMaker, and put behind an API Gateway and Lambda path that this application invokes for real."
        />

        <div className="grid gap-8 lg:grid-cols-[13rem_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="sticky top-6">
              <StageIndex />
            </div>
          </aside>

          <div className="flex flex-col gap-10">
            {CASE_STUDY_STAGES.map((stage, index) => (
              <StageSection key={stage.id} stage={stage} index={index}>
                {stageContent(stage.id, evidence)}
              </StageSection>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
