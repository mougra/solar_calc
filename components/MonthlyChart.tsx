import { monthShort } from "@/lib/format";

export interface MonthlyChartProps {
  /** Выработка по месяцам, кВт·ч */
  yieldKwh: number[];
  /** Потребление по месяцам, кВт·ч (опционально) */
  consumptionKwh?: number[];
  /** Подпись под графиком */
  caption?: string;
  height?: number;
}

/**
 * Лёгкий SVG-график без клиентского JS: столбцы выработки + линия потребления.
 * Месяцы с нулевой выработкой (полярная ночь) остаются видимыми.
 */
export function MonthlyChart({
  yieldKwh,
  consumptionKwh,
  caption,
  height = 220,
}: MonthlyChartProps) {
  const width = 720;
  const padding = { top: 16, right: 8, bottom: 28, left: 44 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const maxValue = Math.max(
    ...yieldKwh,
    ...(consumptionKwh ?? []),
    1,
  );
  // Округляем верхнюю границу до «красивого» числа
  const step = maxValue > 500 ? 200 : maxValue > 200 ? 100 : maxValue > 80 ? 50 : 20;
  const top = Math.ceil(maxValue / step) * step;

  const barW = plotW / 12;
  const y = (value: number) => padding.top + plotH - (value / top) * plotH;

  const consumptionPath = consumptionKwh
    ? consumptionKwh
        .map((value, index) => {
          const cx = padding.left + barW * index + barW / 2;
          return `${index === 0 ? "M" : "L"}${cx.toFixed(1)},${y(value).toFixed(1)}`;
        })
        .join(" ")
    : null;

  const gridValues = [0, 0.25, 0.5, 0.75, 1].map((ratio) => Math.round(top * ratio));

  return (
    <figure>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        role="img"
        aria-label="Выработка солнечной электростанции по месяцам"
        className="overflow-visible"
      >
        {gridValues.map((value) => (
          <g key={value}>
            <line
              x1={padding.left}
              x2={width - padding.right}
              y1={y(value)}
              y2={y(value)}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
            <text
              x={padding.left - 8}
              y={y(value) + 4}
              textAnchor="end"
              fontSize="11"
              fill="#94a3b8"
            >
              {value}
            </text>
          </g>
        ))}

        {yieldKwh.map((value, index) => {
          const barHeight = Math.max(0, padding.top + plotH - y(value));
          return (
            <g key={index}>
              <rect
                x={padding.left + barW * index + barW * 0.18}
                y={y(value)}
                width={barW * 0.64}
                height={barHeight}
                rx="3"
                fill="#10b981"
                opacity={value > 0 ? 0.85 : 0.25}
              />
              <text
                x={padding.left + barW * index + barW / 2}
                y={height - 10}
                textAnchor="middle"
                fontSize="11"
                fill="#64748b"
              >
                {monthShort(index)}
              </text>
            </g>
          );
        })}

        {consumptionPath ? (
          <path
            d={consumptionPath}
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="2.5"
            strokeDasharray="6 4"
            strokeLinecap="round"
          />
        ) : null}
      </svg>

      {caption ? (
        <figcaption className="mt-2 text-xs text-slate-500">{caption}</figcaption>
      ) : null}
    </figure>
  );
}
