"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";

/** 诚实 404:不存在的工具真 404,防软 404 */
export default function NotFound() {
  const { locale, t } = useI18n();
  return (
    <div className="mx-auto max-w-xl px-5 py-24 text-center">
      <h1 className="h1">{t.notFound.title}</h1>
      <p className="mt-3 text-[15px] text-[var(--color-sub)]">{t.notFound.body}</p>
      <Link
        href={`/${locale}/tools`}
        className="mt-6 inline-block rounded-full bg-[var(--color-accent)] px-6 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-[var(--color-accent-strong)]"
      >
        {t.nav.tools}
      </Link>
    </div>
  );
}
