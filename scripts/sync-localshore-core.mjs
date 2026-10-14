import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "packages/localshore-core/src");
const workspace = path.dirname(root);
const apps = [
  root,
  path.join(workspace, "SellerHub"),
  path.join(workspace, "Delivery Partner Hub"),
];
const check = process.argv.includes("--check");
const version = JSON.parse(
  fs.readFileSync(path.join(root, "packages/localshore-core/package.json"), "utf8"),
).version;
const prefix = `// Synced from @localshore/core ${version}; edit packages/localshore-core/src in the Shopper repository.\n`;
const manifest = {
  version,
  files: Object.fromEntries(
    fs
      .readdirSync(source)
      .filter((name) => name.endsWith(".ts"))
      .sort()
      .map((name) => [
        name,
        crypto
          .createHash("sha256")
          .update(prefix + fs.readFileSync(path.join(source, name), "utf8"))
          .digest("hex"),
      ]),
  ),
};
let failures = 0;
for (const app of apps) {
  if (!fs.existsSync(path.join(app, "package.json"))) {
    console.error(`Missing consumer checkout: ${app}`);
    failures++;
    continue;
  }
  const target = path.join(app, "src/shared/core");
  if (!check) fs.mkdirSync(target, { recursive: true });
  for (const file of fs.readdirSync(source).filter((name) => name.endsWith(".ts"))) {
    const expected = prefix + fs.readFileSync(path.join(source, file), "utf8");
    const destination = path.join(target, file);
    if (check) {
      if (!fs.existsSync(destination) || fs.readFileSync(destination, "utf8") !== expected) {
        console.error(`Core drift: ${path.basename(app)}/${file}`);
        failures++;
      }
    } else fs.writeFileSync(destination, expected);
  }
  const manifestPath = path.join(target, "manifest.json");
  const manifestText = JSON.stringify(manifest, null, 2) + "\n";
  if (check) {
    if (!fs.existsSync(manifestPath) || fs.readFileSync(manifestPath, "utf8") !== manifestText) {
      console.error(`Core manifest drift: ${path.basename(app)}`);
      failures++;
    }
  } else fs.writeFileSync(manifestPath, manifestText);
  const expectedFiles = new Set(fs.readdirSync(source).filter((name) => name.endsWith(".ts")));
  if (fs.existsSync(target))
    for (const file of fs.readdirSync(target).filter((name) => name.endsWith(".ts"))) {
      if (!expectedFiles.has(file)) {
        console.error(
          `Unexpected snapshot file (manual review required): ${path.basename(app)}/${file}`,
        );
        failures++;
      }
    }
}
console.log(`${check ? "Checked" : "Synchronized"} LocalShore core: ${failures} discrepancies.`);
process.exitCode = failures ? 1 : 0;
