import type { CSSProperties, ElementType, ReactNode } from "react";

type TextUnveilProps = {
  /** One entry per line. Each rises from behind its own mask. */
  lines: ReactNode[];
  as?: ElementType;
  /** Delay before the first line, in ms. Lines are 120ms apart. */
  delay?: number;
  className?: string;
};

/** Line-by-line masked reveal for display names. CSS only, runs once on first paint. */
export function TextUnveil({ lines, as: Tag = "h1", delay = 0, className }: TextUnveilProps) {
  return (
    <Tag className={className} style={{ "--unveil-delay": `${delay}ms` } as CSSProperties}>
      {lines.map((line, i) => (
        <span key={i} className="unveil-line">
          <span className="unveil-inner" style={{ "--i": i } as CSSProperties}>
            {line}
          </span>
        </span>
      ))}
    </Tag>
  );
}
