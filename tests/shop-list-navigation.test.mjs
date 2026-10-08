import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("View All Shops opens the existing nearby shop listing, not Best Shops", () => {
  const source = readFileSync("src/routes/search.tsx", "utf8");
  const link = source.match(/<Link\s+[^>]*>[\s\S]*?<span>View All Shops<\/span>/g)?.at(-1);
  assert.ok(link);
  assert.match(link, /to="\/"/);
  assert.match(link, /hash="shops-section"/);
  assert.doesNotMatch(link, /to="\/best-shops"/);
  assert.match(readFileSync("src/routes/index.tsx", "utf8"), /id="shops-section"/);
});

test("opening the nearby map carries the active category and search into map discovery", () => {
  const source = readFileSync("src/routes/index.tsx", "utf8");
  const mapMount = source.match(/<LocalShoreMapExperience[\s\S]*?\/>/)?.[0];
  assert.ok(mapMount);
  assert.match(mapMount, /initialCategory=\{activeFilter \?\? "all"\}/);
  assert.match(mapMount, /initialQuery=\{query\}/);
});
