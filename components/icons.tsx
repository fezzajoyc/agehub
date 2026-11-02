import type { SVGProps } from "react";

/** 24×24 stroke 图标,键名与 ToolDef.icon 对应 */
const PATHS: Record<string, string> = {
  file: "M14 3v4a1 1 0 0 0 1 1h4M5 8V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8Z M8 13h8 M8 17h5",
  pdf: "M14 3v4a1 1 0 0 0 1 1h4M5 8V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8Z M8 15.5c2.5 0 3-6 0-6s-2 8 1 8 2.5-2 2.5-2 M14 11v6c2 0 2.5-1.5 2.5-3S16 11 14 11Z",
  image:
    "M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5Z M3 15l4.5-4.5a1.4 1.4 0 0 1 2 0L16 17 M13.5 12.5l2-2a1.4 1.4 0 0 1 2 0L21 14 M15.5 8.5h.01",
  text: "M4 7V5h16v2 M12 5v14 M9 19h6",
  code: "M8 8 4 12l4 4 M16 8l4 4-4 4 M13 5l-2 14",
  seo: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z M16 16l5 5",
  lock: "M6 11h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1Z M8 11V7a4 4 0 0 1 8 0v4 M12 15v2",
  calc: "M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z M8 7h8 M8 11h.01 M12 11h.01 M16 11h.01 M8 15h.01 M12 15h.01 M16 15v4 M8 19h4",
  ruler: "M3 8h18v8H3V8Z M7 8v3 M11 8v3 M15 8v3 M19 8v3",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z M12 7v5l3 3",
  globe: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z M3 12h18 M12 3c2.5 2.4 4 5.6 4 9s-1.5 6.6-4 9c-2.5-2.4-4-5.6-4-9s1.5-6.6 4-9Z",
  qr: "M4 4h6v6H4V4Z M14 4h6v6h-6V4Z M4 14h6v6H4v-6Z M14 14h2v2h-2v-2Z M18 14h2v2h-2v-2Z M16 16h2v2h-2v-2Z M14 18h2v2h-2v-2Z M18 18h2v2h-2v-2Z",
  shuffle: "M3 7h4l10 10h4 M17 3l4 4-4 4 M3 17h4 M14 14l3 3 M17 17l4 4-4-4Z M21 7l-4 0",
  hash: "M9 4 7 20 M17 4l-2 16 M4 9h17 M3 15h17",
  key: "M14 10a4 4 0 1 0-4 4v3l-1.5 1.5L10 20l1-1 1 1 2-2v-4a4 4 0 0 0 1-4Z M15.5 8.5h.01",
  palette:
    "M12 3a9 9 0 1 0 0 18c1.5 0 2-1 1.4-2-.7-1.2.2-2.5 1.6-2.5H17a4 4 0 0 0 4-4c0-5-4-9.5-9-9.5Z M7.5 10.5h.01 M10.5 7h.01 M14.5 7h.01 M17 10h.01",
  swap: "M7 4 3 8l4 4 M3 8h14 M17 20l4-4-4-4 M21 16H7",
  check: "M4 12.5 9.5 18 20 6",
  shield: "M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6l8-3Z M8.5 12l2.5 2.5 4.5-5",
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z M19 16l.9 2.1L22 19l-2.1.9L19 22l-.9-2.1L16 19l2.1-.9L19 16Z",
  download: "M12 4v11 M7 11l5 5 5-5 M5 20h14",
  crop: "M6 3v14a1 1 0 0 0 1 1h14 M3 6h14a1 1 0 0 1 1 1v14",
  rotate: "M4 12a8 8 0 1 1 2.3 5.7 M4 20v-5h5",
  layers: "M12 3l9 5-9 5-9-5 9-5Z M3 13l9 5 9-5",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z M16 16l5 5",
  link: "M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1 M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1",
};

export type IconKey = keyof typeof PATHS | string;

export function Icon({
  name,
  size = 20,
  ...rest
}: { name: IconKey; size?: number } & SVGProps<SVGSVGElement>) {
  const d = PATHS[name] ?? PATHS.file;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {d.split(/(?=M)/).map((seg, i) => (
        <path key={i} d={seg.trim()} />
      ))}
    </svg>
  );
}
