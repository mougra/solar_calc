# SolarCalc

Независимый калькулятор автономного солнечного электроснабжения для России:
панели, аккумуляторы, инвертор, MPPT и сечение кабеля. 85 городов, данные
инсоляции PVGIS, расчёт по месяцам.

## Стек

- Next.js 16 (App Router, SSG/SSR)
- React 19, TypeScript strict
- Tailwind CSS 4, lucide-react
- Zustand для состояния визарда, состояние дублируется в URL
- Без БД: данные в `data/*.json` и `data/*.ts`
- Тесты — `node:test` (без Vitest: под Windows-песочницей Vite падает на `exec`)

## Быстрый старт

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # 23 теста
npm run build        # прод-сборка, 100+ страниц
npm start            # прод-сервер
```

## Структура

```
app/                    маршруты
  kalkulyator-*/        5 калькуляторов
  solnechnaya-elektrostanciya/[city]/   85 городов (SSG)
  blog/[slug]/          10 статей
  go/[offer]/           партнёрский редирект
components/             UI, визард, графики
lib/core/calc.ts        вся физика + тесты
lib/state/query.ts      сериализация состояния в URL
data/                   города, приборы, инсоляция, статьи
scripts/                генератор PVGIS, OG-картинки
deploy/                 nginx, docker-compose
```

## Данные инсоляции

Генерируются из PVGIS v5.3:

```bash
npm run insolation
```

Скрипт кэширует ответы в `.cache/pvgis/`, повторный прогон мгновенный.
SARAH3 покрывает запад РФ; восточнее PVGIS отдаёт ERA5 — поле `source` фиксирует
фактическую базу.

## Лицензия

Код — для внутреннего использования проекта SolarCalc. Данные PVGIS — JRC,
условия использования см. на сайте PVGIS.
