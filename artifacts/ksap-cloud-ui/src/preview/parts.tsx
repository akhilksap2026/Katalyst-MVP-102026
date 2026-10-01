import type { ReactNode } from 'react';

export function Row({
  label,
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      {label ? (
        <p className="text-caption font-semibold text-muted-foreground">
          {label}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

export function Stack({
  label,
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      {label ? (
        <p className="text-caption font-semibold text-muted-foreground">
          {label}
        </p>
      ) : null}
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

export function Guidelines({
  items,
}: {
  items: Array<string | { kind: 'do' | 'dont'; text: string }>;
}) {
  return (
    <aside className="ksap-guidelines" aria-label="Usage guidelines">
      <h2 className="ksap-section-title">Usage guidelines</h2>
      <ul>{items.map((item) => {
        const text = typeof item === "string" ? item : item.text;
        return <li key={text}>{typeof item !== "string" && <strong>{item.kind === "do" ? "Do: " : "Don’t: "}</strong>}{text}</li>;
      })}</ul>
    </aside>
  );
}
