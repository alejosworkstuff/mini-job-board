// Shared utilities used across the job board (browser + Node tests).
// Pure, DOM-free functions so they can be imported by ES modules
// (app.js, filter-logic.mjs) and unit-tested with node --test.

const HTML_ESCAPES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
};

export function escapeHtml(text) {
  return String(text ?? "").replace(/[&<>"]/g, (char) => HTML_ESCAPES[char]);
}

export function slugify(value = "") {
  return String(value).toLowerCase().trim().replace(/\s+/g, "-");
}

// Normalizes a raw URL query value to a known filter slug, or null when it
// isn't part of the allowed set. `allowed` is a Set of valid slugs.
export function normalizeUrlFilter(value, allowed) {
  if (!value) return null;
  const normalized = slugify(value);
  return allowed.has(normalized) ? normalized : null;
}
