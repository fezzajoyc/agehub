"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "./i18n-provider";
import { Icon } from "./icons";

export function CopyButton({
  value,
  className = "",
  label,
}: {
  value: string | (() => string);
  className?: string;
  label?: string;
}) {
  const { t } = useI18n();
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = useCallback(async () => {
    const text = typeof value === "function" ? value() : value;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // http 环境降级
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setDone(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setDone(false), 1600);
  }, [value]);

  return (
    <button
      type="button"
      onClick={copy}
      aria-live="polite"
      className={`inline-flex items-center gap-1.5 rounded-full border hairline px-3.5 py-1.5 text-[13px] font-medium transition-colors hover:bg-[var(--color-surface)] ${className}`}
    >
      <Icon name={done ? "check" : "file"} size={14} />
      {done ? t.common.copied : (label ?? t.common.copy)}
    </button>
  );
}

/** 文件选择 + 拖放。onFiles 拿到 File[];accept 传 MIME/后缀。 */
export function DropZone({
  onFiles,
  accept,
  multiple = true,
  children,
}: {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  children?: React.ReactNode;
}) {
  const { t } = useI18n();
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = (list: FileList | null) => {
    if (!list?.length) return;
    onFiles(multiple ? Array.from(list) : [list[0]]);
  };

  // 全局粘贴上传:页面任意位置 Ctrl+V 图片/文件直接进工具(对标 TinyWow)
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? []);
      if (files.length) {
        e.preventDefault();
        onFiles(multiple ? files : [files[0]]);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [onFiles, multiple]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        pick(e.dataTransfer.files);
      }}
      className={`dropzone cursor-pointer ${over ? "over" : ""}`}
      aria-label={multiple ? t.common.dropFiles : t.common.dropFile}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          pick(e.target.files);
          e.target.value = "";
        }}
      />
      <div className="pointer-events-none">
        <Icon name="download" size={22} className="mx-auto mb-2 text-[var(--color-sub)]" />
        {children ?? (
          <p className="text-[14px] text-[var(--color-sub)]">
            {multiple ? t.common.dropFiles : t.common.dropFile}
          </p>
        )}
      </div>
    </div>
  );
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
