"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const YM_ID = process.env.NEXT_PUBLIC_YM_ID;

/**
 * Клиентские переходы Next.js не перезагружают страницу, поэтому Метрика
 * не видит смену URL. Отправляем hit вручную (первый хит она шлёт сама).
 */
export function MetrikaHits() {
  const pathname = usePathname();
  const firstRender = useRef(true);

  useEffect(() => {
    if (!YM_ID || firstRender.current) {
      firstRender.current = false;
      return;
    }

    const ym = (window as unknown as { ym?: (...args: unknown[]) => void }).ym;
    if (typeof ym !== "function") return;

    ym(Number(YM_ID), "hit", window.location.href, {
      referer: document.referrer,
    });
  }, [pathname]);

  return null;
}
