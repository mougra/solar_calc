import { buildOfferUrl, parseOfferId } from "@/lib/offers";

export const dynamic = "force-dynamic";

/**
 * Единая точка выхода на партнёрские ссылки.
 * 302 + UTM, чтобы не отдавать вес и видеть переходы в аналитике.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ offer: string }> },
) {
  const { offer } = await params;
  const parsed = parseOfferId(offer);

  if (!parsed) {
    return Response.redirect(new URL("/", request.url), 302);
  }

  const target = new URL(buildOfferUrl(parsed));
  target.searchParams.set("utm_source", "solarcalc");
  target.searchParams.set("utm_medium", "affiliate");
  target.searchParams.set("utm_campaign", parsed.category);

  return Response.redirect(target.toString(), 302);
}
