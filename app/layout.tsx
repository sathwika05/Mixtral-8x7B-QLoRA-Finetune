import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

const TITLE = "Mixtral 8x7B QLoRA Fine-Tuning";
const OG_IMAGE = "/mixtral-qlora-fine-tuning.png";

/**
 * Absolute URLs are required for Open Graph. `metadataBase` supplies the
 * prefix so every field below stays a relative path; set NEXT_PUBLIC_SITE_URL
 * at deploy time or previews will point at localhost.
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

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
