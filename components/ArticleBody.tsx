import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import type { ArticleSection } from "@/data/articles";

/** Поддерживает внутренние ссылки вида [текст](/path) внутри абзацев. */
function renderInline(text: string): ReactNode {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, index) => {
    const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (!match) return <Fragment key={index}>{part}</Fragment>;
    const [, label, href] = match;
    return (
      <Link key={index} href={href ?? "/"}>
        {label}
      </Link>
    );
  });
}

export function ArticleBody({ sections }: { sections: ArticleSection[] }) {
  return (
    <div className="prose-basic">
      {sections.map((section, index) => (
        <section key={index}>
          {section.heading ? <h2>{section.heading}</h2> : null}

          {section.paragraphs?.map((paragraph, pIndex) => (
            <p key={pIndex}>{renderInline(paragraph)}</p>
          ))}

          {section.list ? (
            <ul>
              {section.list.map((item, lIndex) => (
                <li key={lIndex}>{renderInline(item)}</li>
              ))}
            </ul>
          ) : null}

          {section.note ? (
            <div className="not-prose my-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
              {renderInline(section.note)}
            </div>
          ) : null}
        </section>
      ))}
    </div>
  );
}
