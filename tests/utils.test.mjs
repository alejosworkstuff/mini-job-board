import assert from "node:assert";
import { describe, it } from "node:test";
import { escapeHtml, normalizeUrlFilter, slugify } from "../scripts/utils.mjs";

describe("escapeHtml", () => {
  it("escapes HTML-significant characters", () => {
    assert.equal(
      escapeHtml('<a href="x">&"'),
      "&lt;a href=&quot;x&quot;&gt;&amp;&quot;"
    );
  });

  it("coerces null/undefined to an empty string", () => {
    assert.equal(escapeHtml(null), "");
    assert.equal(escapeHtml(undefined), "");
  });

  it("leaves plain text untouched", () => {
    assert.equal(escapeHtml("Senior Engineer"), "Senior Engineer");
  });
});

describe("slugify", () => {
  it("lowercases, trims, and dashes spaces", () => {
    assert.equal(slugify("  Semi Senior  "), "semi-senior");
  });

  it("preserves existing dashes", () => {
    assert.equal(slugify("Semi-Senior"), "semi-senior");
  });

  it("defaults to an empty string", () => {
    assert.equal(slugify(), "");
  });
});

describe("normalizeUrlFilter", () => {
  const allowed = new Set(["all", "remote", "hybrid", "onsite"]);

  it("returns a normalized value when allowed", () => {
    assert.equal(normalizeUrlFilter("Remote", allowed), "remote");
  });

  it("returns null for disallowed values", () => {
    assert.equal(normalizeUrlFilter("contract", allowed), null);
  });

  it("returns null for empty input", () => {
    assert.equal(normalizeUrlFilter("", allowed), null);
    assert.equal(normalizeUrlFilter(null, allowed), null);
  });
});
