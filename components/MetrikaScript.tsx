const YM_ID = process.env.NEXT_PUBLIC_YM_ID ?? "114135374";

/**
 * Счётчик Метрики. Рендерится сервером прямо в HTML статической страницы —
 * next/script с afterInteractive в export-режиме оставляет только noscript.
 */
export function MetrikaScript() {
  if (!YM_ID) return null;

  const code = `
    (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
    m[i].l=1*new Date();
    for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
    k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
    (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

    ym(${JSON.stringify(YM_ID)}, "init", {
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: true
    });
  `;

  return (
    <>
      <script
        id="yandex-metrika"
        dangerouslySetInnerHTML={{ __html: code }}
      />
      <noscript>
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://mc.yandex.ru/watch/${YM_ID}`}
            style={{ position: "absolute", left: "-9999px" }}
            alt=""
          />
        </div>
      </noscript>
    </>
  );
}
