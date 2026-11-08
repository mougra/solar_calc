import type { ReactNode } from "react";
import Link from "next/link";
import { clsx } from "clsx";

export function Container({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "main";
}) {
  return <Tag className={clsx("container-x", className)}>{children}</Tag>;
}

export function Card({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
}) {
  return <Tag className={clsx("card", className)}>{children}</Tag>;
}

export function Badge({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: "slate" | "green" | "amber" | "blue";
}) {
  const tones = {
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    green: "bg-emerald-50 text-emerald-800 border-emerald-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    blue: "bg-sky-50 text-sky-800 border-sky-200",
  } as const;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  as: Tag = "h2",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div className="max-w-3xl">
      {eyebrow ? (
        <p className="mb-2 text-sm font-semibold tracking-wide text-emerald-700 uppercase">
          {eyebrow}
        </p>
      ) : null}
      <Tag className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        {title}
      </Tag>
      {description ? (
        <p className="mt-3 text-base leading-7 text-slate-600">{description}</p>
      ) : null}
    </div>
  );
}

export function Stat({
  label,
  value,
  unit,
  hint,
  tone = "green",
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  tone?: "green" | "blue" | "amber";
}) {
  const tones = {
    green: "bg-emerald-50 border-emerald-200 text-emerald-950",
    blue: "bg-sky-50 border-sky-200 text-sky-950",
    amber: "bg-amber-50 border-amber-200 text-amber-950",
  } as const;
  return (
    <div className={clsx("rounded-2xl border p-4 sm:p-5", tones[tone])}>
      <p className="text-xs font-medium tracking-wide uppercase opacity-70">
        {label}
      </p>
      <p className="mt-1.5 text-3xl font-bold tracking-tight">
        {value}
        {unit ? (
          <span className="ml-1 text-base font-semibold opacity-70">{unit}</span>
        ) : null}
      </p>
      {hint ? <p className="mt-1 text-xs leading-5 opacity-70">{hint}</p> : null}
    </div>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className,
  prefetch,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "outline" | "ghost";
  className?: string;
  prefetch?: boolean;
}) {
  const variants = {
    primary: "btn-primary",
    outline: "btn-outline",
    ghost: "btn-ghost",
  } as const;
  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={clsx("btn", variants[variant], className)}
    >
      {children}
    </Link>
  );
}

export function Note({
  children,
  tone = "amber",
}: {
  children: ReactNode;
  tone?: "amber" | "blue" | "slate";
}) {
  const tones = {
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    blue: "border-sky-200 bg-sky-50 text-sky-900",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
  } as const;
  return (
    <div className={clsx("rounded-xl border p-4 text-sm leading-6", tones[tone])}>
      {children}
    </div>
  );
}

export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="7" fill="#059669" />
      <g stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round">
        <path d="M16 2.5v3.2M16 26.3v3.2M2.5 16h3.2M26.3 16h3.2" />
        <path d="M6.4 6.4l2.3 2.3M23.3 23.3l2.3 2.3M6.4 25.6l2.3-2.3M23.3 8.7l2.3-2.3" />
      </g>
    </svg>
  );
}
