import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

const TITLE = "Mixtral 8x7B QLoRA Fine-Tuning";
const OG_IMAGE = "/mixtral-qlora-fine-tuning.png";

/**
 * Absolute URLs are required for Open Graph. `metadataBase` supplies the
 * prefix so every field below stays a relative path.
 *
 * A localhost prefix is not merely cosmetic: a crawler that cannot fetch the
 * image silently falls back to scraping whatever picture it finds on the page.
 * RENDER_EXTERNAL_URL is injected by Render and already carries the scheme, so
 * a deploy there is correct even when NEXT_PUBLIC_SITE_URL was never set.
 *
 * Vercel injects VERCEL_PROJECT_PRODUCTION_URL as a bare host with no scheme,
 * so it is prefixed here. The production host is used rather than VERCEL_URL
 * because the latter is unique per deployment and would make the canonical URL
 * point at a preview build.
 *
 * Candidates are filtered on emptiness and then on parseability rather than
 * with `??`: a host that declares the variable with a blank value yields an
 * empty string, which is neither null nor undefined and so would survive the
 * chain and throw ERR_INVALID_URL inside `new URL`, failing the build.
 */
const LOCAL_URL = "http://localhost:3000";

function resolveSiteUrl(): string {
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();

  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.RENDER_EXTERNAL_URL,
    vercelHost ? `https://${vercelHost}` : undefined,
  ];

  for (const candidate of candidates) {
    const trimmed = candidate?.trim();
    if (!trimmed) continue;
    if (URL.canParse(trimmed)) return trimmed;
  }

  return LOCAL_URL;
}

const SITE_URL = resolveSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description:
    "Parameter-efficient fine-tuning of Mixtral 8x7B using 4-bit quantization and QLoRA on the Dolly 15K instruction dataset.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    title: TITLE,
    description:
      "Fine-tuned Mixtral 8x7B with 4-bit NF4 quantization and QLoRA, training only 3.96% of the model parameters.",
    url: "/",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 627,
        alt: "Mixtral 8x7B expert layers with QLoRA adapters",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description:
      "Parameter-efficient Mixtral fine-tuning using 4-bit quantization and QLoRA.",
    images: [OG_IMAGE],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
