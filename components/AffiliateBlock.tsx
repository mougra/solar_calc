import {
  CATEGORY_LABELS,
  offerHref,
  SHOP_LABELS,
  type OfferCategory,
  type Shop,
} from "@/lib/offers";

const SHOPS: Shop[] = ["ozon", "yandex", "wb"];

/**
 * Блок «где купить». Партнёрские ссылки помечены и открываются через /go.
 * TODO: заменить поисковые ссылки на deep-link после подключения CPA-сети
 * и получить erid через ОРД (маркировка рекламы, 38-ФЗ).
 */
export function AffiliateBlock({
  category,
  title,
  note,
}: {
  category: OfferCategory;
  title?: string;
  note?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-bold text-slate-900">
          {title ?? `Где искать: ${CATEGORY_LABELS[category].toLowerCase()}`}
        </h3>
        <span className="text-xs font-medium text-slate-400">
          Реклама · партнёрские ссылки
        </span>
      </div>

      {note ? <p className="mt-2 text-sm text-slate-600">{note}</p> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {SHOPS.map((shop) => (
          <a
            key={shop}
            href={offerHref(category, shop)}
            rel="sponsored nofollow noopener"
            target="_blank"
            className="btn btn-outline"
          >
            {SHOP_LABELS[shop]}
          </a>
        ))}
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-400">
        Переход по партнёрской ссылке может принести нам комиссию. Цена для вас
        не меняется, расчёт от этого не зависит.
      </p>
    </div>
  );
}
