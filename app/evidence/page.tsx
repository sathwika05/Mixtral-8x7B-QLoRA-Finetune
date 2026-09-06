import { existsSync } from "node:fs";
import { join } from "node:path";
import { Nav } from "@/components/shell/nav";
import { SectionHeading } from "@/components/system/section-heading";
import { EvidenceCard } from "@/components/evidence/evidence-card";
import { EvidenceVideo } from "@/components/evidence/evidence-video";
import { EVIDENCE_ITEMS } from "@/data/evidence";

export const dynamic = "force-dynamic";

export default function EvidencePage() {
  // Resolved server-side so a missing file renders an explicit missing state
  // rather than a broken image element.
  const items = EVIDENCE_ITEMS.map((item) => ({
    item,
    available: existsSync(join(process.cwd(), "public", item.file)),
  }));

  return (
    <main className="min-h-screen">
      <Nav />
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
        <SectionHeading
          eyebrow="Training & deployment evidence"
          title="Console readings from the AWS account"
          description="Console readings and recordings supplied by the project owner. This application did not measure them and performs no automated redaction of what they contain."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {items.map(({ item, available }) =>
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
    </main>
  );
}
