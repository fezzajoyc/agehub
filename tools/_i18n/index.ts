import type { ToolCopy } from "../_lib/types";

/**
 * 扩展语言覆盖层(见 site-engineering skill §1.5)。
 * 契约(tests/overlays.test.ts):注册进 OVERLAYS 的语言必须覆盖注册表全部 slug。
 */
export type Overlay = Record<string, ToolCopy>;

export const OVERLAYS: Record<string, Overlay> = {};
