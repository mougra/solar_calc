"use client";

import { useEffect } from "react";

/**
 * Переход в магазин. Работает и на статическом хостинге, и на SSR:
 * без JS остаётся обычная ссылка.
 */
export function OfferRedirect({ url }: { url: string }) {
  useEffect(() => {
    window.location.replace(url);
  }, [url]);

  return (
    <div className="container-x py-24 text-center">
      <p className="text-base text-slate-600">Переходим в магазин…</p>
      <a
        href={url}
        rel="sponsored nofollow noopener"
        className="btn btn-primary mt-4"
      >
        Перейти вручную
      </a>
      <p className="mt-6 text-xs text-slate-400">
        Реклама. Переход по партнёрской ссылке.
      </p>
    </div>
  );
}
