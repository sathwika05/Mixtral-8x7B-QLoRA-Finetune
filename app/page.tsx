import { existsSync } from "node:fs";
import { join } from "node:path";
import { Nav } from "@/components/shell/nav";
import { SectionHeading } from "@/components/system/section-heading";
import { RouteLink } from "@/components/system/route-link";
import { Panel, PanelBody } from "@/components/system/panel";
import { Metric } from "@/components/system/metric";
import { EvidenceVideo } from "@/components/evidence/evidence-video";
import { EvidenceCard } from "@/components/evidence/evidence-card";
import { EVIDENCE_ITEMS } from "@/data/evidence";
import { MODEL } from "@/data/model";

export const dynamic = "force-dynamic";

export default function ConsolePage() {
  const withAvailability = EVIDENCE_ITEMS.map((item) => ({
    item,
    available: existsSync(join(process.cwd(), "public", item.file)),
  }));
  const video = withAvailability.find(({ item }) => item.kind === "video");
  const shots = withAvailability.filter(({ item }) => item.kind !== "video");

  return (
    <main className="min-h-screen">
      <Nav />
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
        <SectionHeading
          eyebrow="Engineering case study"
          title="A 47B mixture-of-experts model, fine-tuned and served"
          description="Mixtral-8x7B-v0.1 adapted with QLoRA on Databricks Dolly 15K, trained on AWS SageMaker, and served through API Gateway and Lambda behind this console."
        />

        {/* Spec strip: the shape of the work, readable in one pass. */}
        <div className="grid grid-cols-2 gap-4 border border-border bg-card p-4 sm:grid-cols-4">
          <Metric label="Base model" value={MODEL.baseModel} />
          <Metric label="Adaptation" value="QLoRA · rank 64" />
          <Metric label="Quantization" value="4-bit NF4" />
          <Metric label="Trainable params" value="~3.96%" />
        </div>

        {/* Proof before the tool: the training run reaching completion. */}
        <Panel title="Evidence">
          <PanelBody className="flex flex-col gap-4">
            {video ? (
              <EvidenceVideo item={video.item} available={video.available} />
            ) : null}
            <div className="grid gap-4 md:grid-cols-2">
              {shots.map(({ item, available }) => (
                <EvidenceCard key={item.id} item={item} available={available} />
              ))}
            </div>
          </PanelBody>
        </Panel>


        <RouteLink href="/inference" label="Run inference against the deployed endpoint" />
        <RouteLink
          href="/case-study"
          label="Full engineering case study — problem, approach, architecture, decisions"
        />
      </div>
    </main>
  );
}
