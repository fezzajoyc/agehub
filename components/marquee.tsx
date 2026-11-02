"use client";

import { ReactNode } from "react";

/** 无缝横向滚动:内容渲染两份,第二份 aria-hidden 供循环;hover 暂停;reverse 反向。 */
export function Marquee({
  children,
  reverse = false,
  duration = 42,
}: {
  children: ReactNode;
  reverse?: boolean;
  duration?: number;
}) {
  return (
    <div className="marquee overflow-hidden">
      <div
        className={`marquee-track ${reverse ? "marquee-reverse" : ""}`}
        style={{ animationDuration: `${duration}s` }}
      >
        <div className="marquee-group">{children}</div>
        <div className="marquee-group" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
