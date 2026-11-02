import { describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "@/mcp/server";

async function connect() {
  const server = createServer();
  const client = new Client({ name: "test", version: "0.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return client;
}

describe("zoyku MCP server", () => {
  it("exposes the full tool registry", async () => {
    const client = await connect();
    const { tools } = await client.listTools();
    expect(tools.length).toBeGreaterThanOrEqual(25);
    const names = new Set(tools.map((t) => t.name));
    for (const expected of [
      "convert_unit", "mortgage_payment", "compound_interest", "salary_breakdown",
      "bmr", "tdee", "body_fat_navy", "water_intake", "running_pace", "one_rep_max",
      "workdays_between", "sleep_schedule", "cooking_convert", "contrast_ratio",
      "grade", "slugify", "text_stats", "transform_text", "parse_csv", "json_to_xml",
    ]) {
      expect(names.has(expected), expected).toBe(true);
    }
    await client.close();
  });

  it("converts units (temperature c→f, data GB→GiB)", async () => {
    const client = await connect();
    const c2f = await client.callTool({ name: "convert_unit", arguments: { category: "temperature", from: "c", to: "f", amount: 20 } });
    expect((c2f.content as any)[0].text).toBe("68");
    const gb = await client.callTool({ name: "convert_unit", arguments: { category: "data", from: "gb", to: "gib", amount: 1000 } });
    expect(Number((gb.content as any)[0].text)).toBeCloseTo(931.3225746, 4);
    await client.close();
  });

  it("computes mortgage payment against the closed formula", async () => {
    const client = await connect();
    const r = await client.callTool({
      name: "mortgage_payment",
      arguments: { home_price: 300000, down_payment: 60000, annual_rate_pct: 6, years: 30 },
    });
    const parsed = JSON.parse((r.content as any)[0].text);
    expect(parsed.monthlyPI).toBeCloseTo(1438.92, 1);
    expect(parsed.schedule.length).toBe(30);
    await client.close();
  });

  it("returns health estimates with documented formulas", async () => {
    const client = await connect();
    const b = await client.callTool({ name: "bmr", arguments: { weight_kg: 80, height_cm: 180, age: 30, sex: "male" } });
    expect((b.content as any)[0].text).toContain("1780");
    expect((b.content as any)[0].text).toContain("Mifflin-St Jeor");
    const w = await client.callTool({ name: "water_intake", arguments: { weight_kg: 70, exercise_minutes: 30 } });
    const parsed = JSON.parse((w.content as any)[0].text);
    expect(parsed.totalMl).toBe(2800);
    await client.close();
  });

  it("handles invalid input at two layers: schema (protocol error) and logic (isError)", async () => {
    const client = await connect();
    // 逻辑层:合法 schema 但无效单位 → handler isError
    const bad = await client.callTool({ name: "convert_unit", arguments: { category: "length", from: "nope", to: "m", amount: 1 } });
    expect((bad as any).isError).toBe(true);
    // 逻辑层:down_payment > home_price → 贷款额为负 → isError(JSON 序列化会把 NaN 变 null,必须用 isError 表达)
    const bad2 = await client.callTool({ name: "mortgage_payment", arguments: { home_price: 100, down_payment: 150, annual_rate_pct: 6, years: 30 } });
    expect((bad2 as any).isError).toBe(true);
    expect((bad2.content as any)[0].text).toContain("must be positive");
    // schema 层:负数价格被 zod 拒绝 → SDK 捕获后返回 isError 结果(不 throw)
    const schemaBad = await client.callTool({ name: "mortgage_payment", arguments: { home_price: -5, down_payment: 0, annual_rate_pct: 6, years: 30 } });
    expect((schemaBad as any).isError).toBe(true);
    expect((schemaBad.content as any)[0].text).toContain("-32602");
    await client.close();
  });

  it("transforms text and validates WCAG contrast", async () => {
    const client = await connect();
    const s = await client.callTool({ name: "slugify", arguments: { text: "Café Mémoirs — 2026!" } });
    expect((s.content as any)[0].text).toBe("cafe-memoirs-2026");
    const c = await client.callTool({ name: "contrast_ratio", arguments: { foreground: "#767676", background: "#ffffff" } });
    const parsed = JSON.parse((c.content as any)[0].text);
    expect(parsed.ratio).toBeCloseTo(4.54, 1);
    expect(parsed.aaNormal).toBe(true);
    expect(parsed.aaaNormal).toBe(false);
    await client.close();
  });
});
