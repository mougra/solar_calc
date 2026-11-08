/**
 * Партнёрские офферы.
 *
 * Пока — поисковые ссылки магазинов с UTM. После регистрации в CPA-сетях
 * (Ozon, Яндекс Маркет, Admitad) заменить `buildOfferUrl` на deep-link
 * с партнёрским идентификатором. Точка входа одна — /go/[offer].
 */

export type OfferCategory = "panels" | "battery" | "inverter" | "mppt" | "cable";
export type Shop = "ozon" | "yandex" | "wb";

export const SHOP_LABELS: Record<Shop, string> = {
  ozon: "Ozon",
  yandex: "Яндекс Маркет",
  wb: "Wildberries",
};

export const CATEGORY_LABELS: Record<OfferCategory, string> = {
  panels: "Солнечные панели",
  battery: "Аккумуляторы",
  inverter: "Инверторы",
  mppt: "MPPT-контроллеры",
  cable: "Кабель и автоматика",
};

const SEARCH_QUERY: Record<OfferCategory, string> = {
  panels: "солнечная панель монокристаллическая",
  battery: "аккумулятор LiFePO4",
  inverter: "инвертор чистый синус 24В",
  mppt: "контроллер заряда MPPT",
  cable: "кабель солнечный",
};

const TEMPLATES: Record<Shop, (query: string) => string> = {
  ozon: (query) => `https://www.ozon.ru/search/?text=${encodeURIComponent(query)}`,
  yandex: (query) =>
    `https://market.yandex.ru/search?text=${encodeURIComponent(query)}`,
  wb: (query) =>
    `https://www.wildberries.ru/catalog/0/search.aspx?search=${encodeURIComponent(query)}`,
};

export interface ParsedOffer {
  category: OfferCategory;
  shop: Shop;
}

/**
 * Партнёрская ссылка из переменных окружения.
 * Имена: PARTNER_PANELS_OZON, PARTNER_BATTERY_YANDEX и т.д.
 * Пока переменная не задана — используется поисковая ссылка магазина.
 */
export function getPartnerLink(
  category: OfferCategory,
  shop: Shop,
): { url: string; erid?: string } | null {
  const key = `PARTNER_${category.toUpperCase()}_${shop.toUpperCase()}`;
  const url = process.env[key];
  if (!url) return null;
  return { url, erid: process.env.NEXT_PUBLIC_ERID };
}

export function parseOfferId(id: string): ParsedOffer | null {
  const [category, shop] = id.split("-");
  if (!category || !shop) return null;
  if (!(category in CATEGORY_LABELS)) return null;
  if (!(shop in SHOP_LABELS)) return null;
  return { category: category as OfferCategory, shop: shop as Shop };
}

export function buildOfferUrl(
  parsed: ParsedOffer,
  options: { query?: string } = {},
): string {
  const partner = getPartnerLink(parsed.category, parsed.shop);
  if (partner) return partner.url;

  const query = options.query ?? SEARCH_QUERY[parsed.category];
  return TEMPLATES[parsed.shop](query);
}

export function offerHref(category: OfferCategory, shop: Shop): string {
  return `/go/${category}-${shop}`;
}
