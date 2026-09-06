import { Nav } from "@/components/shell/nav";
import { Workbench } from "@/components/console/workbench";
import { SectionHeading } from "@/components/system/section-heading";
import { RouteLink } from "@/components/system/route-link";

export const dynamic = "force-dynamic";

export default function InferencePage() {
  return (
    <main className="min-h-screen">
      <Nav />
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
        <SectionHeading
          eyebrow="Inference"
          title="Mixtral-8x7B Inference with SageMaker"
          description="Enter a prompt below to get a response from the model."
        />
        <Workbench />
        <RouteLink
          href="/case-study"
          label="Full engineering case study — problem, approach, architecture, decisions"
        />
      </div>
    </main>
  );
}
