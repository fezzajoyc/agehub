import type { Locale } from "@/lib/site";

export type Unit = {
  id: string;
  symbol: string;
  /** 相对基准单位的倍率(线性单位) */
  factor: number;
  name: Record<string, string>;
};

export type UnitCategory = {
  id: string;
  /** 温度等非线性类别走 convert() 特例 */
  convert?: (v: number, from: string, to: string) => number;
  defaults: [string, string];
  units: Unit[];
};

const n = (
  en: string,
  zh: string,
  ja: string,
  es: string,
  pt: string,
): Record<string, string> => ({ en, zh, ja, es, pt });

const u = (
  id: string,
  symbol: string,
  factor: number,
  name: Record<string, string>,
): Unit => ({ id, symbol, factor, name });

export const LENGTH: UnitCategory = {
  id: "length",
  defaults: ["cm", "in"],
  units: [
    u("km", "km", 1000, n("kilometer", "千米", "キロメートル", "kilómetro", "quilômetro")),
    u("m", "m", 1, n("meter", "米", "メートル", "metro", "metro")),
    u("cm", "cm", 0.01, n("centimeter", "厘米", "センチメートル", "centímetro", "centímetro")),
    u("mm", "mm", 0.001, n("millimeter", "毫米", "ミリメートル", "milímetro", "milímetro")),
    u("um", "µm", 1e-6, n("micrometer", "微米", "マイクロメートル", "micrómetro", "micrômetro")),
    u("mi", "mi", 1609.344, n("mile", "英里", "マイル", "milla", "milha")),
    u("yd", "yd", 0.9144, n("yard", "码", "ヤード", "yarda", "jarda")),
    u("ft", "ft", 0.3048, n("foot", "英尺", "フィート", "pie", "pé")),
    u("in", "in", 0.0254, n("inch", "英寸", "インチ", "pulgada", "polegada")),
    u("nmi", "nmi", 1852, n("nautical mile", "海里", "海里", "milla náutica", "milha náutica")),
  ],
};

export const WEIGHT: UnitCategory = {
  id: "weight",
  defaults: ["kg", "lb"],
  units: [
    u("t", "t", 1000, n("metric ton", "吨", "トン", "tonelada métrica", "tonelada métrica")),
    u("kg", "kg", 1, n("kilogram", "千克", "キログラム", "kilogramo", "quilograma")),
    u("g", "g", 0.001, n("gram", "克", "グラム", "gramo", "grama")),
    u("mg", "mg", 1e-6, n("milligram", "毫克", "ミリグラム", "miligramo", "miligrama")),
    u("lb", "lb", 0.45359237, n("pound", "磅", "ポンド", "libra", "libra")),
    u("oz", "oz", 0.028349523125, n("ounce", "盎司", "オンス", "onza", "onça")),
    u("st", "st", 6.35029318, n("stone", "英石", "ストーン", "stone", "stone")),
    u("ct", "ct", 0.0002, n("carat", "克拉", "カラット", "quilate", "quilate")),
  ],
};

export const AREA: UnitCategory = {
  id: "area",
  defaults: ["m2", "ft2"],
  units: [
    u("km2", "km²", 1e6, n("square kilometer", "平方千米", "平方キロメートル", "kilómetro cuadrado", "quilômetro quadrado")),
    u("ha", "ha", 1e4, n("hectare", "公顷", "ヘクタール", "hectárea", "hectare")),
    u("m2", "m²", 1, n("square meter", "平方米", "平方メートル", "metro cuadrado", "metro quadrado")),
    u("cm2", "cm²", 1e-4, n("square centimeter", "平方厘米", "平方センチメートル", "centímetro cuadrado", "centímetro quadrado")),
    u("mi2", "mi²", 2589988.110336, n("square mile", "平方英里", "平方マイル", "milla cuadrada", "milha quadrada")),
    u("acre", "ac", 4046.8564224, n("acre", "英亩", "エーカー", "acre", "acre")),
    u("yd2", "yd²", 0.83612736, n("square yard", "平方码", "平方ヤード", "yarda cuadrada", "jarda quadrada")),
    u("ft2", "ft²", 0.09290304, n("square foot", "平方英尺", "平方フィート", "pie cuadrado", "pé quadrado")),
    u("in2", "in²", 0.00064516, n("square inch", "平方英寸", "平方インチ", "pulgada cuadrada", "polegada quadrada")),
  ],
};

export const VOLUME: UnitCategory = {
  id: "volume",
  defaults: ["l", "galus"],
  units: [
    u("m3", "m³", 1000, n("cubic meter", "立方米", "立方メートル", "metro cúbico", "metro cúbico")),
    u("l", "L", 1, n("liter", "升", "リットル", "litro", "litro")),
    u("ml", "mL", 0.001, n("milliliter", "毫升", "ミリリットル", "mililitro", "mililitro")),
    u("galus", "gal (US)", 3.785411784, n("gallon (US)", "美制加仑", "ガロン(米)", "galón (EE. UU.)", "galão (EUA)")),
    u("galuk", "gal (UK)", 4.54609, n("gallon (UK)", "英制加仑", "ガロン(英)", "galón (R. U.)", "galão (R. U.)")),
    u("qtus", "qt (US)", 0.946352946, n("quart (US)", "美制夸脱", "クォート(米)", "cuarto (EE. UU.)", "quarto (EUA)")),
    u("ptus", "pt (US)", 0.473176473, n("pint (US)", "美制品脱", "パイント(米)", "pinta (EE. UU.)", "pinta (EUA)")),
    u("cup", "cup", 0.2365882365, n("cup (US)", "杯(美制)", "カップ(米)", "taza (EE. UU.)", "xícara (EUA)")),
    u("flozus", "fl oz (US)", 0.0295735295625, n("fluid ounce (US)", "液量盎司", "液量オンス", "onza líquida (EE. UU.)", "onça fluida (EUA)")),
    u("ft3", "ft³", 28.316846592, n("cubic foot", "立方英尺", "立方フィート", "pie cúbico", "pé cúbico")),
  ],
};

export const SPEED: UnitCategory = {
  id: "speed",
  defaults: ["kmh", "mph"],
  units: [
    u("ms", "m/s", 1, n("meter per second", "米每秒", "メートル毎秒", "metro por segundo", "metro por segundo")),
    u("kmh", "km/h", 1 / 3.6, n("kilometer per hour", "千米每小时", "キロメートル毎時", "kilómetro por hora", "quilômetro por hora")),
    u("mph", "mph", 0.44704, n("mile per hour", "英里每小时", "マイル毎時", "milla por hora", "milha por hora")),
    u("fts", "ft/s", 0.3048, n("foot per second", "英尺每秒", "フィート毎秒", "pie por segundo", "pé por segundo")),
    u("kn", "kn", 0.514444444444, n("knot", "节", "ノット", "nudo", "nó")),
    u("mach", "Mach", 340.29, n("Mach (sea level)", "马赫(海平面)", "マッハ(海面)", "Mach (nivel del mar)", "Mach (nível do mar)")),
  ],
};

export const DATA: UnitCategory = {
  id: "data",
  defaults: ["mb", "gb"],
  units: [
    u("bit", "bit", 0.125, n("bit", "比特", "ビット", "bit", "bit")),
    u("b", "B", 1, n("byte", "字节", "バイト", "byte", "byte")),
    u("kb", "KB", 1e3, n("kilobyte (1000 B)", "千字节 (1000 B)", "キロバイト (1000 B)", "kilobyte (1000 B)", "kilobyte (1000 B)")),
    u("kib", "KiB", 1024, n("kibibyte (1024 B)", "二进制千字节 (1024 B)", "キビバイト (1024 B)", "kibibyte (1024 B)", "kibibyte (1024 B)")),
    u("mb", "MB", 1e6, n("megabyte (1000 KB)", "兆字节 (1000 KB)", "メガバイト (1000 KB)", "megabyte (1000 KB)", "megabyte (1000 KB)")),
    u("mib", "MiB", 1048576, n("mebibyte (1024 KiB)", "二进制兆字节 (1024 KiB)", "メビバイト (1024 KiB)", "mebibyte (1024 KiB)", "mebibyte (1024 KiB)")),
    u("gb", "GB", 1e9, n("gigabyte (1000 MB)", "吉字节 (1000 MB)", "ギガバイト (1000 MB)", "gigabyte (1000 MB)", "gigabyte (1000 MB)")),
    u("gib", "GiB", 1073741824, n("gibibyte (1024 MiB)", "二进制吉字节 (1024 MiB)", "ギビバイト (1024 MiB)", "gibibyte (1024 MiB)", "gibibyte (1024 MiB)")),
    u("tb", "TB", 1e12, n("terabyte", "太字节", "テラバイト", "terabyte", "terabyte")),
    u("tib", "TiB", 1099511627776, n("tebibyte", "二进制太字节", "テビバイト", "tebibyte", "tebibyte")),
  ],
};

export const TIME: UnitCategory = {
  id: "time",
  defaults: ["h", "min"],
  units: [
    u("ms", "ms", 0.001, n("millisecond", "毫秒", "ミリ秒", "milisegundo", "milissegundo")),
    u("s", "s", 1, n("second", "秒", "秒", "segundo", "segundo")),
    u("min", "min", 60, n("minute", "分钟", "分", "minuto", "minuto")),
    u("h", "h", 3600, n("hour", "小时", "時間", "hora", "hora")),
    u("d", "d", 86400, n("day", "天", "日", "día", "dia")),
    u("wk", "wk", 604800, n("week", "周", "週", "semana", "semana")),
    u("mo", "mo", 2629746, n("month (average)", "月(平均)", "月(平均)", "mes (promedio)", "mês (médio)")),
    u("yr", "yr", 31556952, n("year (365.2425 d)", "年(365.2425 天)", "年(365.2425 日)", "año (365,2425 días)", "ano (365,2425 dias)")),
  ],
};

export const PRESSURE: UnitCategory = {
  id: "pressure",
  defaults: ["bar", "psi"],
  units: [
    u("pa", "Pa", 1, n("pascal", "帕斯卡", "パスカル", "pascal", "pascal")),
    u("kpa", "kPa", 1000, n("kilopascal", "千帕", "キロパスカル", "kilopascal", "quilopascal")),
    u("mpa", "MPa", 1e6, n("megapascal", "兆帕", "メガパスカル", "megapascal", "megapascal")),
    u("bar", "bar", 1e5, n("bar", "巴", "バール", "bar", "bar")),
    u("atm", "atm", 101325, n("atmosphere", "标准大气压", "気圧", "atmósfera", "atmosfera")),
    u("mmhg", "mmHg", 133.322387415, n("millimeter of mercury", "毫米汞柱", "水銀柱ミリメートル", "milímetro de mercurio", "milímetro de mercúrio")),
    u("psi", "psi", 6894.757293168, n("pound per square inch", "磅/平方英寸", "psi", "libra por pulgada cuadrada", "libra por polegada quadrada")),
  ],
};

export const ENERGY: UnitCategory = {
  id: "energy",
  defaults: ["kcal", "kj"],
  units: [
    u("j", "J", 1, n("joule", "焦耳", "ジュール", "julio", "joule")),
    u("kj", "kJ", 1000, n("kilojoule", "千焦", "キロジュール", "kilojulio", "quilojoule")),
    u("cal", "cal", 4.184, n("calorie", "卡路里", "カロリー", "caloría", "caloria")),
    u("kcal", "kcal", 4184, n("kilocalorie", "千卡", "キロカロリー", "kilocaloría", "quilocaloria")),
    u("wh", "Wh", 3600, n("watt-hour", "瓦时", "ワット時", "vatio-hora", "watt-hora")),
    u("kwh", "kWh", 3.6e6, n("kilowatt-hour", "千瓦时", "キロワット時", "kilovatio-hora", "quilowatt-hora")),
    u("btu", "BTU", 1055.05585262, n("British thermal unit", "英热单位", "英熱量", "unidad térmica británica", "unidade térmica britânica")),
  ],
};

const TEMP_TO_C: Record<string, (v: number) => number> = {
  c: (v) => v,
  f: (v) => ((v - 32) * 5) / 9,
  k: (v) => v - 273.15,
};

const TEMP_FROM_C: Record<string, (v: number) => number> = {
  c: (v) => v,
  f: (v) => (v * 9) / 5 + 32,
  k: (v) => v + 273.15,
};

export const TEMPERATURE: UnitCategory = {
  id: "temperature",
  defaults: ["c", "f"],
  convert: (v, from, to) => {
    const f = TEMP_TO_C[from];
    const g = TEMP_FROM_C[to];
    if (!f || !g) return NaN;
    return g(f(v));
  },
  units: [
    { id: "c", symbol: "°C", factor: 1, name: n("Celsius", "摄氏度", "摂氏", "grados Celsius", "graus Celsius") },
    { id: "f", symbol: "°F", factor: 1, name: n("Fahrenheit", "华氏度", "華氏", "grados Fahrenheit", "graus Fahrenheit") },
    { id: "k", symbol: "K", factor: 1, name: n("Kelvin", "开尔文", "ケルビン", "kelvin", "kelvin") },
  ],
};

export const UNIT_CATEGORIES: Record<string, UnitCategory> = {
  length: LENGTH,
  weight: WEIGHT,
  area: AREA,
  volume: VOLUME,
  speed: SPEED,
  data: DATA,
  time: TIME,
  temperature: TEMPERATURE,
  pressure: PRESSURE,
  energy: ENERGY,
};

export function convertValue(cat: UnitCategory, v: number, from: string, to: string): number {
  if (cat.convert) return cat.convert(v, from, to);
  const f = cat.units.find((x) => x.id === from);
  const t = cat.units.find((x) => x.id === to);
  if (!f || !t) return NaN;
  return (v * f.factor) / t.factor;
}

/** 紧凑可读的数字格式:8 位有效数字,去尾零,过大过小转指数 */
export function formatNumber(x: number): string {
  if (!Number.isFinite(x)) return "—";
  if (x === 0) return "0";
  const abs = Math.abs(x);
  if (abs >= 1e15 || abs < 1e-9) return x.toExponential(6).replace(/\.?0+e/, "e");
  const digits = Math.max(0, 8 - Math.floor(Math.log10(abs)) - 1);
  let s = x.toFixed(Math.min(digits, 12));
  if (s.includes(".")) s = s.replace(/0+$/, "").replace(/\.$/, "");
  return s;
}
