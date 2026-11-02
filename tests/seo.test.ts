import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import { GET as badgeGET } from "@/app/badge/[variant]/route";
import { GET as toolsMdGET } from "@/app/[lang]/tools-md/[slug]/route";
import { LOCALES, SITE, CATEGORIES } from "@/lib/site";
import { ALL_TOOLS, TOOL_BY_SLUG, toolsByCategory } from "@/tools/registry";
import { dict } from "@/lib/i18n";
import en from "@/lib/dictionaries/en";
import zh from "@/lib/dictionaries/zh";
import ja from "@/lib/dictionaries/ja";
import es from "@/lib/dictionaries/es";
import pt from "@/lib/dictionaries/pt";
import fr from "@/lib/dictionaries/fr";
import de from "@/lib/dictionaries/de";
import ru from "@/lib/dictionaries/ru";
import itDict from "@/lib/dictionaries/it";
import tr from "@/lib/dictionaries/tr";
import ko from "@/lib/dictionaries/ko";
import ar from "@/lib/dictionaries/ar";
import hi from "@/lib/dictionaries/hi";
import id from "@/lib/dictionaries/id";
import vi from "@/lib/dictionaries/vi";
import { toolCopy } from "@/lib/tool-copy";

/* ------------------------------------------------------------------ */
/* sitemap — every tool × every locale, plus categories/home/directory */
/* ------------------------------------------------------------------ */

describe("sitemap", () => {
  const entries = sitemap();
  const urls = entries.map((e) => e.url);
  const urlSet = new Set(urls);

  it("covers every tool in every locale on /{lang}/tools/{slug}", () => {
    let toolUrls = 0;
    for (const lang of LOCALES) {
      for (const tool of ALL_TOOLS) {
        const url = `${SITE.domain}/${lang}/tools/${tool.slug}`;
        expect(urlSet.has(url), `missing sitemap entry ${url}`).toBe(true);
        toolUrls++;
      }
    }
    expect(urls.filter((u) => /\/tools\/[^/]+$/.test(u)).length).toBe(toolUrls);
  });

  it("covers every category, the home page and the tools directory in every locale", () => {
    for (const lang of LOCALES) {
      expect(urlSet.has(`${SITE.domain}/${lang}`), `missing home ${lang}`).toBe(true);
      expect(urlSet.has(`${SITE.domain}/${lang}/tools`), `missing directory ${lang}`).toBe(true);
      for (const cat of CATEGORIES) {
        expect(urlSet.has(`${SITE.domain}/${lang}/categories/${cat}`), `missing category ${lang}/${cat}`).toBe(true);
      }
    }
  });

  it("total entry count accounts for tools + categories + home + directory across all locales, with no duplicates", () => {
    const expectedMinimum = LOCALES.length * (ALL_TOOLS.length + CATEGORIES.length + 2);
    expect(entries.length).toBeGreaterThanOrEqual(expectedMinimum);
    expect(urls.length).toBe(new Set(urls).size); // no duplicate URLs hiding in the count
  });

  it("every URL is an absolute URL starting with SITE.domain", () => {
    for (const url of urls) {
      expect(url.startsWith(`${SITE.domain}/`), `bad url ${url}`).toBe(true);
    }
  });

  it("tool entries carry hreflang alternates for all locales", () => {
    for (const entry of entries) {
      if (!/\/tools\/[^/]+$/.test(entry.url)) continue;
      const langs = entry.alternates?.languages as Record<string, string> | undefined;
      expect(langs, `no alternates for ${entry.url}`).toBeTruthy();
      expect(Object.keys(langs ?? {}).sort()).toEqual([...LOCALES].sort());
      for (const l of LOCALES) {
        expect((langs ?? {})[l]).toBe(`${SITE.domain}/${l}/tools/${entry.url.split("/tools/")[1]}`);
      }
    }
  });
});

/* ------------------------------------------------------------------ */
/* robots — wildcard allow + named AI crawlers + sitemap                */
/* ------------------------------------------------------------------ */

describe("robots", () => {
  const robotsTxt = robots();
  // MetadataRoute.Robots types rules as a union that obscures .find/iteration — normalize once.
  type Rule = { userAgent: string; allow?: string | string[]; disallow?: string | string[] };
  const rules = robotsTxt.rules as unknown as Rule[];

  it("allows the wildcard agent to crawl everything", () => {
    const star = rules.find((r) => r.userAgent === "*");
    expect(star).toBeDefined();
    expect(star?.allow).toBe("/");
  });

  it("explicitly allows the major AI crawlers (GPTBot, ClaudeBot, PerplexityBot at minimum)", () => {
    const required = ["GPTBot", "ClaudeBot", "PerplexityBot"];
    for (const bot of required) {
      const rule = rules.find((r) => r.userAgent === bot);
      expect(rule, `missing AI crawler rule ${bot}`).toBeDefined();
      expect(rule?.allow).toBe("/");
    }
    // every named rule is an allow rule — no accidental disallow sneaks in
    for (const rule of rules) {
      expect(rule.allow).toBe("/");
    }
  });

  it("points the sitemap at SITE.domain/sitemap.xml", () => {
    expect(robotsTxt.sitemap).toBe(`${SITE.domain}/sitemap.xml`);
    expect(robotsTxt.host).toBe(SITE.domain);
  });
});

/* ------------------------------------------------------------------ */
/* /badge/[variant] — shields-style SVG badges                          */
/* ------------------------------------------------------------------ */

const STATIC_BADGES = [
  "made-with-zoyku",
  "privacy-first",
  "no-upload",
  "free-browser-tools",
  "zoyku",
] as const;

function textNodesOf(svg: string): string[] {
  const nodes: string[] = [];
  for (const m of svg.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)) nodes.push(m[1]);
  const title = svg.match(/<title>([\s\S]*?)<\/title>/);
  if (title) nodes.push(title[1]);
  const aria = svg.match(/aria-label="([^"]*)"/);
  if (aria) nodes.push(aria[1]);
  return nodes;
}

function expectEscapedText(svg: string) {
  const nodes = textNodesOf(svg);
  expect(nodes.length).toBeGreaterThan(0);
  for (const s of nodes) {
    expect(s, `raw < leaked into text node: ${JSON.stringify(s)}`).not.toContain("<");
    expect(s, `unescaped & in text node: ${JSON.stringify(s)}`).not.toMatch(/&(?!amp;|lt;|gt;)/);
  }
}

describe("badge route", () => {
  async function get(variant: string): Promise<Response> {
    return badgeGET(new Request(`https://x/badge/${variant}`), {
      params: Promise.resolve({ variant }),
    });
  }

  it("renders every static variant as image/svg+xml with escaped text", async () => {
    for (const variant of STATIC_BADGES) {
      const res = await get(variant);
      expect(res.status, variant).toBe(200);
      expect(res.headers.get("content-type"), variant).toContain("image/svg+xml");
      const body = await res.text();
      expect(body, variant).toContain("<svg");
      expect(body, variant).toContain("</svg>");
      expectEscapedText(body);
    }
  });

  it("static badges show their label and value text", async () => {
    const cases: Record<string, [string, string]> = {
      "made-with-zoyku": ["made with", "Zoyku"],
      "zoyku": ["tools on", "Zoyku"],
      "privacy-first": ["privacy", "first"],
      "no-upload": ["files", "stay local"],
      "free-browser-tools": ["tools", "free in browser"],
    };
    for (const [variant, [label, value]] of Object.entries(cases)) {
      const body = await (await get(variant)).text();
      expect(body, variant).toContain(`>${label}</text>`);
      expect(body, variant).toContain(`>${value}</text>`);
    }
  });

  it("category badges report the live tool count from the registry", async () => {
    for (const cat of CATEGORIES.filter((c) => toolsByCategory(c).length > 0)) {
      const n = toolsByCategory(cat).length;
      expect(n).toBeGreaterThan(0);
      const res = await get(`${cat}-tools`);
      expect(res.status, `${cat}-tools`).toBe(200);
      const body = await res.text();
      expect(body, `${cat}-tools`).toContain(`>${n} free tools</text>`);
      expectEscapedText(body);
    }
    // spot-check the documented variants resolve the same way
    expect((await get("utility-tools")).status).toBe(200);
    expect((await get("utility-tools")).status).toBe(200);
  });

  it("the .svg suffix is optional", async () => {
    const withSvg = await (await get("zoyku.svg")).text();
    const bare = await (await get("zoyku")).text();
    expect(withSvg).toBe(bare);
    const pdfWithSvg = await (await get("utility-tools.svg")).text();
    expect(pdfWithSvg).toContain(`>${toolsByCategory("utility").length} free tools</text>`);
  });

  it("unknown variants return 404", async () => {
    expect((await get("no-such-badge")).status).toBe(404);
    expect((await get("notacategory-tools")).status).toBe(404);
  });
});

/* ------------------------------------------------------------------ */
/* /{lang}/tools-md/{slug} — markdown answer pages for AI engines      */
/* ------------------------------------------------------------------ */

describe("tools-md route", () => {
  const tool = TOOL_BY_SLUG.get("merge-pdf") ?? ALL_TOOLS[0];

  it("renders text/markdown with the H1, tagline and '## How to use' for every locale", async () => {
    for (const lang of LOCALES) {
      const res = await toolsMdGET(new Request(`https://x/${lang}/tools/${tool.slug}.md`), {
        params: Promise.resolve({ lang, slug: tool.slug }),
      });
      expect(res.status, lang).toBe(200);
      expect(res.headers.get("content-type"), lang).toContain("text/markdown");

      const md = await res.text();
      const copy = toolCopy(tool, lang);
      expect(md, lang).toContain(`# ${copy.name}`);
      expect(md, lang).toContain(copy.tagline);
      expect(md, lang).toContain("## How to use");
      // exactly the tool's steps, numbered 1..N
      copy.steps.forEach((step, i) => {
        expect(md, `${lang} step ${i + 1}`).toContain(`${i + 1}. ${step}`);
      });
      expect(md, lang).toContain("## FAQ");
    }
  });

  it("a slug that is not a tool throws notFound (NEXT_HTTP_ERROR_FALLBACK)", async () => {
    await expect(
      toolsMdGET(new Request("https://x/en/tools/not-a-real-tool.md"), {
        params: Promise.resolve({ lang: "en", slug: "not-a-real-tool" }),
      }),
    ).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK");
  });

  it("an unknown locale throws notFound even for a valid slug", async () => {
    await expect(
      toolsMdGET(new Request(`https://x/xx/tools/${tool.slug}.md`), {
        params: Promise.resolve({ lang: "xx", slug: tool.slug }),
      }),
    ).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK");
  });
});

/* ------------------------------------------------------------------ */
/* dictionaries — runtime twin of the Dictionary type: identical shape  */
/* ------------------------------------------------------------------ */

function shapeDiff(enValue: unknown, other: unknown, path: string): string[] {
  if (Array.isArray(enValue)) {
    if (!Array.isArray(other)) return [`${path}: expected array, got ${typeof other}`];
    if (enValue.length !== other.length) {
      return [`${path}: array length ${other.length} != en ${enValue.length}`];
    }
    return enValue.flatMap((v, i) => shapeDiff(v, other[i], `${path}[${i}]`));
  }
  if (enValue !== null && typeof enValue === "object") {
    if (other === null || typeof other !== "object" || Array.isArray(other)) {
      return [`${path}: expected object, got ${typeof other}`];
    }
    const enKeys = Object.keys(enValue).sort();
    const otherKeys = Object.keys(other).sort();
    const diffs: string[] = [];
    for (const k of enKeys) {
      if (!otherKeys.includes(k)) diffs.push(`${path}.${k}: missing`);
    }
    for (const k of otherKeys) {
      if (!enKeys.includes(k)) diffs.push(`${path}.${k}: extra key not in en`);
    }
    for (const k of enKeys) {
      if (otherKeys.includes(k)) {
        diffs.push(...shapeDiff((enValue as Record<string, unknown>)[k], (other as Record<string, unknown>)[k], `${path}.${k}`));
      }
    }
    return diffs;
  }
  // en leaves are strings (Dictionary widens literals to string)
  if (typeof other !== "string") return [`${path}: expected string, got ${typeof other}`];
  if (other.trim().length === 0) return [`${path}: empty translation`];
  return [];
}

describe("dictionaries", () => {
  const DICTS: Record<(typeof LOCALES)[number], typeof en> = {
    en, zh, ja, es, pt, fr, de, ru, it: itDict, tr, ko, ar, hi, id, vi,
  };

  it("every locale has exactly the en key shape, recursively (runtime twin of the Dictionary type)", () => {
    for (const [name, d] of Object.entries(DICTS)) {
      if (name === "en") continue;
      const diffs = shapeDiff(en, d, name);
      expect(diffs, `${name} dictionary shape mismatch`).toEqual([]);
    }
  });

  it("all 15 dictionaries are present and dict() hands back the right one", () => {
    expect(Object.keys(DICTS).sort()).toEqual([...LOCALES].sort());
    for (const l of LOCALES) {
      expect(DICTS[l].brand.length).toBeGreaterThan(0);
      expect(dict(l)).toBe(DICTS[l]); // dict() round-trip per locale
    }
  });

  it("every dictionary covers a category name for all 7 categories", () => {
    for (const [, d] of Object.entries(DICTS)) {
      for (const cat of CATEGORIES) {
        const entry = (d.categories as Record<string, { name: string }>)[cat];
        expect(entry?.name.trim().length, `${cat} name`).toBeGreaterThan(0);
      }
    }
  });
});
