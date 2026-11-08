import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ALL_OFFERS, buildOfferUrl, parseOfferId } from "@/lib/offers";
import { OfferRedirect } from "@/components/OfferRedirect";

export const metadata: Metadata = {
  title: "Переход в магазин",
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return ALL_OFFERS.map((offer) => ({ offer }));
}

export default async function OfferPage({
  params,
}: {
  params: Promise<{ offer: string }>;
}) {
  const { offer } = await params;
  const parsed = parseOfferId(offer);

  if (!parsed) notFound();

  const target = new URL(buildOfferUrl(parsed));
  target.searchParams.set("utm_source", "solarcalc");
  target.searchParams.set("utm_medium", "affiliate");
  target.searchParams.set("utm_campaign", parsed.category);

  return <OfferRedirect url={target.toString()} />;
}
