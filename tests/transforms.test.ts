/**
 * Engine tests for tools/_lib/transforms.ts — every exported pure function.
 * Matrix per the zoyku standard: normal values (exact, hand-computed),
 * empty input, boundaries (single char / 0 / ≥10⁴ chars), invalid input
 * (graceful, never an unhandled throw), Unicode & CJK, roundtrip.
 */
import { describe, it, expect } from "vitest";
import {
  cleanText,
  cssMinify,
  dedupeLines,
  fancyText,
  findJsonError,
  htmlBeautify,
  htmlEscapeEntities,
  htmlMinify,
  htmlUnescapeEntities,
  jsMinify,
  jsonBeautify,
  jsonMinify,
  jsonValidate,
  loremParagraphs,
  loremWords,
  removeExtraSpaces,
  reverseText,
  slugify,
  sortLines,
  toAlternating,
  toCamel,
  toConstant,
  toInverse,
  toKebab,
  toPascal,
  toSentenceCase,
  toSnake,
  toTitleCase,
  xmlFormat,
  xmlValidate,
  type FancyStyle,
} from "@/tools/_lib/transforms";

/** 1e4+ char stress inputs must terminate quickly and stay coherent. */
const LONG = "Ab café 中文本 😀 ".repeat(1500); // ~21k chars

describe("dedupeLines", () => {
  it("keeps the first occurrence of duplicate lines and preserves case-distinct lines", () => {
    expect(dedupeLines("a\nb\na\nA")).toBe("a\nb\nA");
  });

  it("ignores case, trims before comparing, drops empty lines and sorts when all options are on", () => {
    expect(
      dedupeLines("b \n\na\nB\n a", { ignoreCase: true, trimFirst: true, removeEmpty: true, sortAfter: true }),
    ).toBe("a\nb");
  });

  it("treats CRLF and LF line endings identically", () => {
    expect(dedupeLines("x\r\ny\r\nx")).toBe("x\ny");
  });

  it("sorts with locale collation after dedupe", () => {
    expect(dedupeLines("b\na\nc\nb", { sortAfter: true })).toBe("a\nb\nc");
  });

  it("dedupes CJK and emoji lines exactly", () => {
    expect(dedupeLines("中文\n日本語\n中文\n😀\n😀")).toBe("中文\n日本語\n😀");
  });

  it("returns empty string for empty input", () => {
    expect(dedupeLines("")).toBe("");
  });

  it("handles thousands of lines without blowing up", () => {
    const input = Array.from({ length: 3000 }, (_, i) => `line-${i % 500}`).join("\n");
    const out = dedupeLines(input);
    expect(out.split("\n")).toHaveLength(500);
    expect(new Set(out.split("\n")).size).toBe(500);
  });
});

describe("removeExtraSpaces", () => {
  it("collapses runs of two or more spaces into one and keeps single spaces", () => {
    expect(removeExtraSpaces("a  b   c    d")).toBe("a b c d");
  });

  it("leaves tabs alone unless the tabs option is set", () => {
    expect(removeExtraSpaces("a  b\tc")).toBe("a b\tc");
    expect(removeExtraSpaces("a\t\tb", { tabs: true })).toBe("a b");
  });

  it("trims line edges and removes empty lines with the options on", () => {
    expect(
      removeExtraSpaces("  a\t\tb   c \n\n  d  \n e ", { tabs: true, trimLines: true, removeEmptyLines: true }),
    ).toBe("a b c\nd\ne");
  });

  it("returns empty string for empty input", () => {
    expect(removeExtraSpaces("")).toBe("");
  });

  it("works on CJK text", () => {
    expect(removeExtraSpaces("中文  数据  测试")).toBe("中文 数据 测试");
  });
});

describe("sortLines", () => {
  it("sorts ascending with numeric-aware collation", () => {
    expect(sortLines("b10\nb2\na\nB", "asc")).toBe("a\nB\nb2\nb10");
  });

  it("sorts descending by reversing the collator", () => {
    expect(sortLines("a\nB\nb2", "desc")).toBe("b2\nB\na");
  });

  it("sorts by length with stable ties", () => {
    expect(sortLines("ccc\nbb\naa", "length")).toBe("bb\naa\nccc");
  });

  it("sorts numerically and treats non-numeric lines as 0", () => {
    expect(sortLines("10\n2\nabc\n-1\n0.5", "numeric")).toBe("-1\nabc\n0.5\n2\n10");
  });

  it("normalizes CRLF to LF", () => {
    expect(sortLines("b\r\na", "asc")).toBe("a\nb");
  });

  it("returns empty string for empty input and passes a single line through", () => {
    expect(sortLines("", "asc")).toBe("");
    expect(sortLines("only", "numeric")).toBe("only");
  });
});

describe("reverseText", () => {
  it("reverses by code point so astral emoji stay intact", () => {
    expect(reverseText("a😀b中")).toBe("中b😀a");
  });

  it("reverses line order only in by-lines mode", () => {
    expect(reverseText("1\n2\n3", true)).toBe("3\n2\n1");
  });

  it("keeps the trailing empty line when reversing lines", () => {
    expect(reverseText("a\nb\n", true)).toBe("\nb\na");
  });

  it("returns empty string for empty input", () => {
    expect(reverseText("")).toBe("");
  });
});

describe("cleanText", () => {
  it("normalizes punctuation, strips invisibles, collapses spaces, trims and drops empty lines in one pass", () => {
    expect(
      cleanText("“x” — a\u00a0\u200bb…\n  c  d \n\n e ", {
        removePrintable: true,
        normalizePunct: true,
        collapseSpaces: true,
        trimLines: true,
        removeEmpty: true,
      }),
    ).toBe('"x" - a b...\nc d\ne');
  });

  it("removes control and zero-width characters but preserves tabs and newlines", () => {
    expect(
      cleanText("a\tb\nc\u0000d\u001fe\u007ff\u009fg\u200bh\u200di\ufeffj", { removePrintable: true }),
    ).toBe("a\tb\ncdefghij");
  });

  it("collapses only runs of two or more horizontal whitespaces, never newlines", () => {
    expect(cleanText("a \t b\nc", { collapseSpaces: true })).toBe("a b\nc");
  });

  it("leaves CJK and emoji untouched", () => {
    expect(cleanText("中文 😀", { normalizePunct: true, collapseSpaces: true })).toBe("中文 😀");
  });

  it("returns empty string for empty input", () => {
    expect(cleanText("")).toBe("");
  });
});

describe("toTitleCase", () => {
  it("capitalizes words and lowercases the rest, keeping small words lowercase mid-title", () => {
    expect(toTitleCase("the great GATSBY of wall street")).toBe("The Great Gatsby of Wall Street");
  });

  it("capitalizes small words at the title edges", () => {
    expect(toTitleCase("war of the worlds")).toBe("War of the Worlds");
  });

  it("treats apostrophes as part of the word", () => {
    expect(toTitleCase("don’t stop me now")).toBe("Don’t Stop Me Now");
  });

  it("handles accented Latin", () => {
    expect(toTitleCase("émile cazé")).toBe("Émile Cazé");
  });

  it("passes CJK through while capitalizing Latin words", () => {
    expect(toTitleCase("你好 world")).toBe("你好 World");
  });

  it("capitalizes a single character", () => {
    expect(toTitleCase("a")).toBe("A");
  });
});

describe("toSentenceCase", () => {
  it("uppercases sentence starts after . ? ! and lowercases the rest", () => {
    expect(toSentenceCase("hello THERE. how ARE you? fine! GO。yes")).toBe(
      "Hello there. How are you? Fine! Go。yes",
    );
  });

  it("uppercases the very first letter of the string", () => {
    expect(toSentenceCase("i AM OK")).toBe("I am ok");
  });

  it("returns empty string for empty input", () => {
    expect(toSentenceCase("")).toBe("");
  });
});

describe("identifier case family (camel/pascal/snake/kebab/constant)", () => {
  it("splits on spaces, punctuation, underscores and lower→upper boundaries", () => {
    expect(toCamel("hello world-test_case 2")).toBe("helloWorldTestCase2");
    expect(toPascal("foo Bar baz--qux")).toBe("FooBarBazQux");
    expect(toSnake("some_prop name-v2")).toBe("some_prop_name_v2");
    expect(toKebab("Hello 2024 Dogs")).toBe("hello-2024-dogs");
    expect(toConstant("some prop name")).toBe("SOME_PROP_NAME");
  });

  it("splits only at lower→upper boundaries, so ALL-CAPS acronyms stay one word", () => {
    expect(toCamel("XMLHttpRequest")).toBe("xmlhttpRequest");
    expect(toSnake("JSONData v2")).toBe("jsondata_v2");
  });

  it("keeps accented letters inside words and drops other separators", () => {
    expect(toKebab("Hello, Wörld! café")).toBe("hello-wörld-café");
  });

  it("drops CJK because they are not word characters for identifiers", () => {
    expect(toSnake("你好 world")).toBe("world");
  });

  it("returns empty string for empty or separator-only input", () => {
    expect(toCamel("")).toBe("");
    expect(toCamel("---___***")).toBe("");
    expect(toPascal("///")).toBe("");
  });

  it("lowercases a single uppercase letter in camel case", () => {
    expect(toCamel("A")).toBe("a");
  });
});

describe("toAlternating", () => {
  it("alternates casing across letters only, ignoring non-letters in the count", () => {
    expect(toAlternating("hello world")).toBe("hElLo WoRlD");
    expect(toAlternating("a1b2!")).toBe("a1B2!");
  });

  it("counts CJK letters for the alternation but leaves their glyphs unchanged", () => {
    expect(toAlternating("a中文b")).toBe("a中文B");
  });

  it("returns empty string for empty input", () => {
    expect(toAlternating("")).toBe("");
  });
});

describe("toInverse", () => {
  it("flips letter case and leaves digits and punctuation alone", () => {
    expect(toInverse("AbC 123!")).toBe("aBc 123!");
  });

  it("expands ß to SS because toUpperCase does", () => {
    expect(toInverse("ß")).toBe("SS");
  });

  it("leaves CJK glyphs unchanged", () => {
    expect(toInverse("中文AbC")).toBe("中文aBc");
  });
});

describe("loremWords", () => {
  it("produces the exact deterministic sequence for a fixed seed", () => {
    expect(loremWords(3, 1)).toBe("Commodo tempor do.");
  });

  it("always starts with a capital letter and ends with a period", () => {
    const text = loremWords(12, 987654);
    expect(text[0]).toMatch(/[A-Z]/);
    expect(text.endsWith(".")).toBe(true);
  });

  it("returns just the period for zero words", () => {
    expect(loremWords(0, 42)).toBe(".");
  });

  it("is deterministic for the same seed and differs across seeds", () => {
    expect(loremWords(6, 77)).toBe(loremWords(6, 77));
    expect(loremWords(6, 77)).not.toBe(loremWords(6, 78));
  });

  it("only draws words from the lorem vocabulary", () => {
    const vocab = new Set(
      "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum".split(
        " ",
      ),
    );
    const words = loremWords(50, 2026).slice(0, -1).split(" ");
    expect(words.length).toBe(50);
    expect(words.every((w) => vocab.has(w.toLowerCase()))).toBe(true);
  });
});

describe("loremParagraphs", () => {
  it("returns the requested number of paragraphs separated by blank lines", () => {
    expect(loremParagraphs(3, 11).split("\n\n")).toHaveLength(3);
  });

  it("ends every paragraph with a period", () => {
    expect(loremParagraphs(3, 11).split("\n\n").every((p) => p.endsWith("."))).toBe(true);
  });

  it("is deterministic per seed and varies across seeds", () => {
    expect(loremParagraphs(2, 5)).toBe(loremParagraphs(2, 5));
    expect(loremParagraphs(2, 5)).not.toBe(loremParagraphs(2, 6));
  });
});

describe("findJsonError", () => {
  it("returns null for valid JSON covering all value types", () => {
    expect(findJsonError('{ "a": [1, 2.5e3, true, null], "b": "\\u0041", "c": {} }')).toBeNull();
    expect(findJsonError("[]")).toBeNull();
    expect(findJsonError("42")).toBeNull();
  });

  it("reports the 1-based line and column of a bare token", () => {
    expect(findJsonError('{"a": tru}')).toEqual({ line: 1, col: 7, msg: "Unexpected token 'tru'" });
  });

  it("counts lines and columns across newlines", () => {
    expect(findJsonError('{\n  "a": 1,\n  "b": @@\n}')).toEqual({ line: 3, col: 8, msg: "Unexpected token '@'" });
  });

  it("reports unterminated strings at end of input", () => {
    expect(findJsonError('{"a": "abc}')).toEqual({ line: 1, col: 12, msg: "Unterminated string" });
  });

  it("reports invalid escapes with their position", () => {
    expect(findJsonError('{"a": "\\x"}')).toEqual({ line: 1, col: 9, msg: "Invalid escape '\\x'" });
    expect(findJsonError('{"a": "\\u00zz"}')).toEqual({ line: 1, col: 10, msg: "Invalid \\u escape" });
  });

  it("reports content after the top-level value", () => {
    expect(findJsonError("[1,2] x")).toEqual({ line: 1, col: 7, msg: "Unexpected content after JSON value 'x'" });
    expect(findJsonError("1.")).toEqual({ line: 1, col: 2, msg: "Unexpected content after JSON value '.'" });
  });

  it("reports doubled commas and missing property names", () => {
    expect(findJsonError("[1,,2]")).toEqual({ line: 1, col: 4, msg: "Unexpected token ','" });
    expect(findJsonError("{a:1}")).toEqual({ line: 1, col: 2, msg: "Expected property name, got 'a'" });
  });

  it("flags raw control characters inside strings", () => {
    expect(findJsonError('{"a": "x\ty"}')).toEqual({
      line: 1,
      col: 9,
      msg: "Unescaped control character in string",
    });
  });

  it("returns a graceful error for empty input and garbage bytes instead of throwing", () => {
    expect(findJsonError("")).toEqual({ line: 1, col: 1, msg: "Unexpected end of input" });
    expect(findJsonError("\u0000\u0001garbage")).toEqual({ line: 1, col: 1, msg: "Unexpected token '\u0000'" });
  });

  it("caps runaway nesting with a clear message instead of hanging", () => {
    expect(findJsonError("[".repeat(3000))).toEqual({
      line: 1,
      col: 2002,
      msg: "JSON nesting is too deep to analyze",
    });
  });
});

describe("jsonBeautify", () => {
  it("formats with 2-space indent and preserves key order and non-ASCII text", () => {
    expect(jsonBeautify('{"b":1,"a":[1,2],"s":"é\\n"}')).toBe(
      '{\n  "b": 1,\n  "a": [\n    1,\n    2\n  ],\n  "s": "é\\n"\n}',
    );
  });

  it("supports tab indentation", () => {
    expect(jsonBeautify("[1]", "\t")).toBe("[\n\t1\n]");
  });

  it("decodes unicode escapes into their characters", () => {
    expect(jsonBeautify('{"x":"\\u0041é"}')).toBe('{\n  "x": "Aé"\n}');
  });

  it("throws an Error carrying the 1-based line and column for malformed input", () => {
    expect(() => jsonBeautify('{\n  bad: 1\n}')).toThrow("Line 2, column 3: Expected property name, got 'bad'");
  });

  it("survives empty input by reporting the problem, not crashing the process", () => {
    expect(() => jsonBeautify("")).toThrow(/Line 1, column 1/);
  });
});

describe("jsonMinify", () => {
  it("removes all insignificant whitespace", () => {
    expect(jsonMinify('  { "b" : 1 , "a" : [ 1 , 2 ] }  ')).toBe('{"b":1,"a":[1,2]}');
  });

  it("throws an Error with line and column for malformed input", () => {
    expect(() => jsonMinify("[1,]")).toThrow("Line 1, column 4: Unexpected token ']'");
  });

  it("roundtrips with jsonBeautify without losing data", () => {
    const src = '{"x":{"y":[true,null,"éA"]},"z":1.5e3}';
    expect(jsonMinify(jsonBeautify(src))).toBe('{"x":{"y":[true,null,"éA"]},"z":1500}');
  });
});

describe("jsonValidate", () => {
  it("returns OK for valid JSON", () => {
    expect(jsonValidate('{"a": [1, 2]}')).toBe("OK");
  });

  it("returns empty string for empty or whitespace-only input", () => {
    expect(jsonValidate("")).toBe("");
    expect(jsonValidate("  \n\t ")).toBe("");
  });

  it("returns a line/column message for broken JSON", () => {
    expect(jsonValidate('{\n  "a": tru\n}')).toBe("Line 2, column 8: Unexpected token 'tru'");
    expect(jsonValidate("nul")).toBe("Line 1, column 1: Unexpected token 'nul'");
  });

  it("degrades gracefully on garbage bytes and runaway nesting (never throws)", () => {
    expect(jsonValidate("\u0000\u0001garbage \u00ff")).toBe("Line 1, column 1: Unexpected token '\u0000'");
    expect(jsonValidate("[".repeat(3000))).toBe("Line 1, column 2002: JSON nesting is too deep to analyze");
  });

  it("validates long documents without blowing up", () => {
    const doc = JSON.stringify({ items: Array.from({ length: 2000 }, (_, i) => ({ id: i, name: "n" + i })) });
    expect(jsonValidate(doc)).toBe("OK");
  });
});

describe("xmlFormat", () => {
  it("indents nested elements and keeps short text on the same line as its tag", () => {
    expect(xmlFormat('<root><a x="1">hi</a><b/>text</root>')).toBe(
      '<root>\n  <a x="1">hi</a>\n  <b/>\n  text\n</root>',
    );
  });

  it("preserves attribute whitespace verbatim but collapses text whitespace", () => {
    expect(xmlFormat('<root   x = "1"><c>  spaced   text  </c></root>')).toBe(
      '<root x = "1">\n  <c>spaced text</c>\n</root>',
    );
  });

  it("keeps comments, processing instructions and CDATA sections", () => {
    expect(xmlFormat("<r><!-- note --><?php echo 1; ?><![CDATA[a < b]]></r>")).toBe(
      "<r>\n  <!-- note -->\n  <?php echo 1; ?>\n  <![CDATA[a < b]]>\n</r>",
    );
  });

  it("returns empty string for empty input", () => {
    expect(xmlFormat("   ")).toBe("");
  });

  it("degrades gracefully on unbalanced tags instead of throwing", () => {
    expect(xmlFormat("<a><b></a>")).toBe("<a>\n  <b>\n</a>");
  });
});

describe("xmlValidate", () => {
  it("returns empty string in node (no DOMParser) and never throws on malformed input", () => {
    // The DOMParser-based validation only runs in the browser; in node the
    // documented behavior is the environment guard: empty string, no throw.
    if (typeof DOMParser !== "undefined") return;
    expect(xmlValidate("")).toBe("");
    expect(xmlValidate("<a></a>")).toBe("");
    expect(xmlValidate("<a><</a>")).toBe("");
    expect(xmlValidate("\u0000garbage")).toBe("");
  });
});

describe("htmlBeautify", () => {
  it("indents elements, keeps void tags at their own depth, and preserves pre/script content verbatim", () => {
    expect(
      htmlBeautify('<div class="a"><p>hi</p><br><img src="x"><script>if(1<2){a=1;}</script><pre>  keep\n me  </pre></div>'),
    ).toBe(
      '<div class="a">\n  <p>hi</p>\n  <br>\n  <img src="x">\n  <script>\nif(1<2){a=1;}\n  </script>\n  <pre>\n  keep\n me  \n  </pre>\n</div>',
    );
  });

  it("does not end raw text early when script content contains other closing tags", () => {
    const out = htmlBeautify("<div><script>var a=\"</div>\";</script></div>");
    expect(out).toContain('var a="</div>"');
    expect(out.endsWith("</script>\n</div>")).toBe(true);
  });

  it("auto-closes consecutive <li> elements without fabricating closing tags", () => {
    expect(htmlBeautify("<ul><li>a<li>b</ul>")).toBe("<ul>\n  <li>\n    a\n  <li>\n    b\n</ul>");
  });

  it("returns empty string for empty input", () => {
    expect(htmlBeautify("  \n ")).toBe("");
  });
});

describe("htmlMinify", () => {
  it("collapses tag and attribute whitespace and drops blank text between block elements", () => {
    expect(htmlMinify('<div   class="a"  >  Hello   <b>World</b>  <p>x</p> </div>')).toBe(
      '<div class="a" > Hello <b>World</b><p>x</p></div>',
    );
  });

  it("keeps a single space between inline elements so words do not fuse", () => {
    expect(htmlMinify("<i>a</i> <i>b</i>")).toBe("<i>a</i> <i>b</i>");
    expect(htmlMinify("text <span>x</span> <p>y</p>")).toBe("text <span>x</span><p>y</p>");
  });

  it("strips plain comments but preserves IE conditional comments", () => {
    expect(htmlMinify('<div><!-- gone --><!--[if IE]><p>ie</p><![endif]--><p>x</p></div>')).toBe(
      "<div><!--[if IE]><p>ie</p><![endif]--><p>x</p></div>",
    );
  });

  it("preserves script content byte-for-byte including <, multi-spaces and string literals", () => {
    expect(htmlMinify('<script>  if (a < b) { s = "x   y"; }  </script><p>  z  </p>')).toBe(
      '<script>  if (a < b) { s = "x   y"; }  </script><p> z </p>',
    );
  });

  it("preserves textarea content including newlines", () => {
    expect(htmlMinify("<textarea>  a\n   b  </textarea>")).toBe("<textarea>  a\n   b  </textarea>");
  });

  it("leaves HTML entities in text untouched", () => {
    expect(htmlMinify("<p>a &amp; b</p>")).toBe("<p>a &amp; b</p>");
  });

  it("returns empty string for empty input and survives stray angle brackets", () => {
    expect(htmlMinify("   ")).toBe("");
    expect(htmlMinify("a < b")).toBe("a < b");
  });
});

describe("cssMinify", () => {
  it("removes comments, folds whitespace and tightens separators while keeping strings verbatim", () => {
    expect(
      cssMinify('/* header */\nbody {\n  color : red ;\n  font-family: "Times  New  Roman", serif;\n}\n.a > .b { margin : 0 ; }'),
    ).toBe('body{color :red;font-family:"Times  New  Roman",serif}.a>.b{margin :0}');
  });

  it("protects string contents from comment stripping and space folding", () => {
    expect(cssMinify('a{content:"x  y/*z*/w";b:c}')).toBe('a{content:"x  y/*z*/w";b:c}');
  });

  it("keeps CJK and multi-space strings exactly as authored", () => {
    expect(cssMinify('body{font-family:"中文 字体";color:red}')).toBe('body{font-family:"中文 字体";color:red}');
  });

  it("drops the last semicolon before a closing brace", () => {
    expect(cssMinify("a{color:red;}")).toBe("a{color:red}");
  });

  it("returns empty string for empty input", () => {
    expect(cssMinify("  ")).toBe("");
  });

  it("handles long stylesheets without blowing up", () => {
    const out = cssMinify("/*c*/.a{b:c}\n".repeat(5000));
    expect(out).toBe(".a{b:c}".repeat(5000));
  });
});

describe("jsMinify", () => {
  it("removes line comments while keeping the newline for ASI safety", () => {
    expect(jsMinify("let a = 1; // c1\nlet b = 2;")).toBe("let a = 1;\nlet b = 2;");
  });

  it("removes block comments and keeps single-space separation", () => {
    expect(jsMinify("let a/* x */= 1;")).toBe("let a = 1;");
  });

  it("turns a newline-bearing block comment into a newline for ASI safety", () => {
    expect(jsMinify("let a = 1;\n/* multi\nline */\nlet b = 2;")).toBe("let a = 1;\nlet b = 2;");
  });

  it("does not treat // inside a regex literal as a comment", () => {
    expect(jsMinify("const re = /a\\/\\/b/g; // trailing\nconst x = 1;")).toBe(
      "const re = /a\\/\\/b/g;\nconst x = 1;",
    );
  });

  it("does not treat // inside a regex character class as a comment", () => {
    expect(jsMinify("const re = /[/]{2}/; // c\nconst y = 2;")).toBe("const re = /[/]{2}/;\nconst y = 2;");
  });

  it("treats a regex after a keyword like return as a regex, not division", () => {
    expect(jsMinify("return /a/g.test(x); // done")).toBe("return /a/g.test(x);");
  });

  it("preserves template literal content verbatim, including // and /* inside it", () => {
    expect(jsMinify("const t = `a//b${ 1 + 1 }c/*x*/d`;")).toBe("const t = `a//b${ 1 + 1 }c/*x*/d`;");
  });

  it("keeps nested template literals and their interpolations intact", () => {
    expect(jsMinify("const t = `x${ `y${ 2 }z` }w`; // c")).toBe("const t = `x${ `y${ 2 }z` }w`;");
  });

  it("preserves string literals containing comment lookalikes", () => {
    expect(jsMinify('const s = "a // b" + \'c/*d\';')).toBe('const s = "a // b" + \'c/*d\';');
  });

  it("keeps newlines between statements so automatic semicolon insertion still holds", () => {
    expect(jsMinify("let a\nlet b")).toBe("let a\nlet b");
  });

  it("returns empty string for empty input", () => {
    expect(jsMinify("")).toBe("");
  });

  it("handles long sources without blowing up", () => {
    const out = jsMinify("let x = 1; // c\n".repeat(5000));
    expect(out.split("\n")).toHaveLength(5000);
  });
});

describe("slugify", () => {
  it("strips accents, lowercases, folds separators into single hyphens and trims the edges", () => {
    expect(slugify("  Café Crème — 中文 & 日本語! -- a  ")).toBe("cafe-creme-a");
  });

  it("collapses punctuation runs (including € and arrows) into one hyphen", () => {
    expect(slugify("€50 → $40")).toBe("50-40");
  });

  it("keeps digits inside the slug", () => {
    expect(slugify("Hello 2024 World!")).toBe("hello-2024-world");
  });

  it("drops pure-CJK input to an empty slug", () => {
    expect(slugify("!!! 中文 ###")).toBe("");
  });

  it("lowercases a single character", () => {
    expect(slugify("A")).toBe("a");
  });

  it("returns empty string for empty input", () => {
    expect(slugify("")).toBe("");
  });

  it("never leaves leading or trailing hyphens on long input", () => {
    const out = slugify(LONG);
    expect(out.length).toBeGreaterThan(1000);
    expect(out.startsWith("-")).toBe(false);
    expect(out.endsWith("-")).toBe(false);
    expect(out).not.toMatch(/--/);
  });
});

describe("fancyText known vectors", () => {
  it("maps Abc in bold to Mathematical Bold symbols", () => {
    expect(fancyText("Abc", "bold")).toBe("𝐀𝐛𝐜");
  });

  it("maps italic h to the Planck constant ℎ because U+1D455 is unassigned", () => {
    expect(fancyText("hh", "italic")).toBe("ℎℎ");
  });

  it("uses the Letterlike exceptions for script B and e", () => {
    expect(fancyText("e", "script")).toBe("ℯ");
    expect(fancyText("B", "script")).toBe("ℬ");
  });

  it("uses the Letterlike exceptions for double-struck R and the number-set letters", () => {
    expect(fancyText("R", "double-struck")).toBe("ℝ");
    expect(fancyText("CHNPQZ", "double-struck")).toBe("ℂℍℕℙℚℤ");
  });

  it("maps digits to circled forms ⓪①–⑨ with the U+24EA zero", () => {
    expect(fancyText("0123456789", "circled")).toBe("⓪①②③④⑤⑥⑦⑧⑨");
  });

  it("maps ASCII space to ideographic space in fullwidth style", () => {
    expect(fancyText("a b", "fullwidth")).toBe("ａ\u3000ｂ");
  });

  it("maps monospace, bold-italic and bold-script letters and digits to their planes", () => {
    expect(fancyText("Az0", "monospace")).toBe("𝙰𝚣𝟶");
    expect(fancyText("Az0", "bold-italic")).toBe("𝑨𝒛𝟒");
    expect(fancyText("aA", "circled")).toBe("ⓐⒶ");
    expect(fancyText("09", "fullwidth")).toBe("０９");
  });

  it("passes unmapped characters (CJK, emoji, punctuation) through unchanged, never tofu", () => {
    expect(fancyText("中文, emoji 😀 & !", "bold")).toBe("中文, 𝐞𝐦𝐨𝐣𝐢 😀 & !");
    expect(fancyText("中文😀", "monospace")).toBe("中文😀");
  });

  it("applies combining strikethrough and underline to every code point including CJK", () => {
    expect(fancyText("ab 中", "strikethrough")).toBe("a\u0336b\u0336 \u0336中\u0336");
    expect(fancyText("a", "underline")).toBe("a\u0332");
  });

  it("maps lowercase squared letters onto the same boxed glyphs as uppercase (documented)", () => {
    expect(fancyText("aA", "squared")).toBe("🄰🄰");
  });

  it("returns empty string for empty input in every style", () => {
    for (const style of ["bold", "italic", "script", "double-struck", "monospace", "circled", "squared", "fullwidth", "strikethrough", "underline"] as FancyStyle[]) {
      expect(fancyText("", style)).toBe("");
    }
  });

  it("handles very long input without blowing up", () => {
    expect(fancyText(LONG, "bold").length).toBeGreaterThan(10000);
  });
});

describe("htmlEscapeEntities", () => {
  it("escapes the five markup-dangerous characters with named/numeric entities", () => {
    expect(htmlEscapeEntities('<a href="x?y=1&z=2">\'&"\'</a>')).toBe(
      "&lt;a href=&quot;x?y=1&amp;z=2&quot;&gt;&#39;&amp;&quot;&#39;&lt;/a&gt;",
    );
  });

  it("emits decimal numeric entities for non-ASCII when nonAscii mode is on", () => {
    expect(htmlEscapeEntities("aé中😀", true)).toBe("a&#233;&#20013;&#128512;");
  });

  it("keeps non-ASCII characters literal when nonAscii mode is off", () => {
    expect(htmlEscapeEntities("aé中")).toBe("aé中");
  });

  it("returns empty string for empty input", () => {
    expect(htmlEscapeEntities("")).toBe("");
    expect(htmlEscapeEntities("", true)).toBe("");
  });

  it("handles very long input without blowing up", () => {
    expect(htmlEscapeEntities("<&>".repeat(5000))).toBe("&lt;&amp;&gt;".repeat(5000));
  });
});

describe("htmlUnescapeEntities", () => {
  it("decodes named, decimal and hex entities in one pass without double-decoding", () => {
    expect(htmlUnescapeEntities("&lt;b&gt; &amp; &#65; &#x41; &copy; &bogus; &amp;lt;")).toBe(
      "<b> & A A © &bogus; &lt;",
    );
  });

  it("decodes the full supported named entity table to the exact HTML5 characters", () => {
    const NAMED: Record<string, string> = {
      amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: "\u00a0",
      copy: "\u00a9", reg: "\u00ae", trade: "\u2122", deg: "\u00b0", hellip: "\u2026",
      mdash: "\u2014", ndash: "\u2013", lsquo: "\u2018", rsquo: "\u2019",
      ldquo: "\u201c", rdquo: "\u201d", laquo: "\u00ab", raquo: "\u00bb",
      bull: "\u2022", dagger: "\u2020", Dagger: "\u2021", sect: "\u00a7", para: "\u00b6",
      middot: "\u00b7", times: "\u00d7", divide: "\u00f7", plusmn: "\u00b1", micro: "\u00b5",
      sup2: "\u00b2", sup3: "\u00b3", frac14: "\u00bc", frac12: "\u00bd", frac34: "\u00be",
      euro: "\u20ac", pound: "\u00a3", yen: "\u00a5", cent: "\u00a2", curren: "\u00a4",
      larr: "\u2190", uarr: "\u2191", rarr: "\u2192", darr: "\u2193", harr: "\u2194",
      infin: "\u221e", ne: "\u2260", le: "\u2264", ge: "\u2265", asymp: "\u2248", sum: "\u2211",
      aacute: "\u00e1", eacute: "\u00e9", iacute: "\u00ed", oacute: "\u00f3", uacute: "\u00fa",
      ntilde: "\u00f1", uuml: "\u00fc", ouml: "\u00f6", auml: "\u00e4", szlig: "\u00df",
      agrave: "\u00e0", egrave: "\u00e8", ccedil: "\u00e7", atilde: "\u00e3", otilde: "\u00f5",
      acirc: "\u00e2", ecirc: "\u00ea", ocirc: "\u00f4", ucirc: "\u00fb",
    };
    const names = Object.keys(NAMED);
    expect(names.length).toBeGreaterThanOrEqual(69);
    for (const name of names) {
      expect(htmlUnescapeEntities(`&${name};`)).toBe(NAMED[name]);
    }
  });

  it("decodes astral-plane numeric entities to a single emoji", () => {
    expect(htmlUnescapeEntities("&#x1F600; &#128512;")).toBe("😀 😀");
  });

  it("keeps out-of-range and surrogate code points as the original text instead of throwing", () => {
    expect(htmlUnescapeEntities("&#xD800;|&#1114112;|&#xFFFFFFFF;")).toBe("&#xD800;|&#1114112;|&#xFFFFFFFF;");
  });

  it("leaves entities without a terminating semicolon untouched", () => {
    expect(htmlUnescapeEntities("&amp &copy")).toBe("&amp &copy");
  });

  it("roundtrips the torture markup string with htmlEscapeEntities", () => {
    const torture = `<a href="x?y=1&z=2">'&"'"</a>`;
    expect(htmlUnescapeEntities(htmlEscapeEntities(torture))).toBe(torture);
  });

  it("roundtrips non-ASCII text through numeric-entity mode", () => {
    expect(htmlUnescapeEntities(htmlEscapeEntities("aé中😀", true))).toBe("aé中😀");
  });

  it("returns garbage unchanged and never throws", () => {
    expect(htmlUnescapeEntities("\u0000\u0001 中文 😀")).toBe("\u0000\u0001 中文 😀");
  });
});
