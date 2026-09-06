"use client";

import { Nav } from "@/components/shell/nav";
import { SectionHeading } from "@/components/system/section-heading";
import { Panel, PanelBody } from "@/components/system/panel";
import { AbHarness } from "@/components/evaluation/ab-harness";
import { RunLogTable } from "@/components/evaluation/run-log-table";
import { useInference } from "@/hooks/use-inference";

export default function EvaluationPage() {
  const { records, pushRecord, clearLog } = useInference();

  return (
    <main className="min-h-screen">
      <Nav />
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
        <SectionHeading
          eyebrow="Evaluation"
          title="Observation, not benchmarking"
          description="Everything on this page is derived from requests actually issued in this browser session. No rating, benchmark result, or base-model comparison is presented, because none has been measured."
        />

        <Panel title="Side-by-side harness">
          <PanelBody>
            <AbHarness onObserved={pushRecord} />
          </PanelBody>
        </Panel>

        <Panel title="Session run log">
          <PanelBody>
            <RunLogTable records={records} onClear={clearLog} />
          </PanelBody>
        </Panel>
      </div>
    </main>
  );
}
