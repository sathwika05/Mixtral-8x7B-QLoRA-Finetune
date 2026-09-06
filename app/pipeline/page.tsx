import { Nav } from "@/components/shell/nav";
import { SectionHeading } from "@/components/system/section-heading";
import { Panel, PanelBody } from "@/components/system/panel";
import { LifecycleTrack } from "@/components/flow/lifecycle-track";
import { RuntimeFlowRail } from "@/components/flow/runtime-flow-rail";
import { StageRow } from "@/components/pipeline/stage-row";
import { LIFECYCLE_STAGES } from "@/data/lifecycle";

export default function PipelinePage() {
  return (
    <main className="min-h-screen">
      <Nav />
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
        <SectionHeading
          eyebrow="Engineering lifecycle"
          title="How the model was built and how a request is served"
          description="Two separate sequences. The development lifecycle is work that already happened; the runtime path is what a single request traverses. A request does not pass through training."
        />

        <Panel title="Model development lifecycle · historical">
          <PanelBody className="flex flex-col gap-3">
            <LifecycleTrack />
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              This sequence is static. It records completed work and is never
              driven by request state.
            </p>
          </PanelBody>
        </Panel>

        <Panel title="Runtime request path · per request">
          <PanelBody>
            <RuntimeFlowRail active={false} durationMs={null} />
          </PanelBody>
        </Panel>

        <Panel title="Stage detail">
          {LIFECYCLE_STAGES.map((stage, index) => (
            <StageRow key={stage.id} stage={stage} index={index} />
          ))}
        </Panel>
      </div>
    </main>
  );
}
