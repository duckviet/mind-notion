import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, dirname, normalize } from "node:path";

const root = process.cwd();

const layerRank = new Map([
  ["app", 6],
  ["page", 5],
  ["widgets", 4],
  ["features", 3],
  ["entities", 2],
  ["shared", 1],
]);

const fsdLayers = new Set(layerRank.keys());
const sourceExtensions = new Set([".ts", ".tsx"]);
const ignoredDirectories = new Set([".next", "node_modules", "public", "tmp"]);
const ignoredRootFiles = new Set([
  "next-env.d.ts",
  "next.config.ts",
  "orval.config.ts",
  "proxy.ts",
  "shiki-setup.ts",
  "svg.d.ts",
  "tailwind.config.ts",
]);
const packagePrefixes = ["@tiptap/", "@mind-notion/"];

const extensionOf = (filePath) => {
  if (filePath.endsWith(".tsx")) {
    return ".tsx";
  }
  if (filePath.endsWith(".ts")) {
    return ".ts";
  }
  return "";
};

const toUnix = (filePath) => filePath.split("\\").join("/");

const collectSourceFiles = (directory) => {
  const files = [];
  for (const entry of readdirSync(directory)) {
    if (ignoredDirectories.has(entry)) {
      continue;
    }
    const fullPath = join(directory, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      files.push(...collectSourceFiles(fullPath));
      continue;
    }
    const relativePath = toUnix(relative(root, fullPath));
    const isIgnoredRootFile = !relativePath.includes("/") && ignoredRootFiles.has(relativePath);
    if (!isIgnoredRootFile && sourceExtensions.has(extensionOf(fullPath))) {
      files.push(fullPath);
    }
  }
  return files;
};

const importPattern =
  /(?:import\s+(?:type\s+)?[\s\S]*?\s+from\s+["']([^"']+)["']|import\s*["']([^"']+)["']|export\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\))/g;

const extractImports = (source) => {
  const imports = [];
  for (const match of source.matchAll(importPattern)) {
    const specifier = match[1] ?? match[2] ?? match[3] ?? match[4];
    if (specifier) {
      imports.push(specifier);
    }
  }
  return imports;
};

const localPathFor = (specifier, fromFile) => {
  if (specifier.startsWith("@/")) {
    return normalize(join(root, specifier.slice(2)));
  }
  if (specifier.startsWith(".")) {
    const resolvedPath = normalize(join(dirname(fromFile), specifier));
    const relativePath = relative(root, resolvedPath);
    if (relativePath.startsWith("..")) {
      return null;
    }
    return resolvedPath;
  }
  return null;
};

const pathParts = (absolutePath) => toUnix(relative(root, absolutePath)).split("/");

const isStaticAssetPath = (absolutePath) => pathParts(absolutePath)[0] === "public";

const layerOfPath = (absolutePath) => {
  const [layer] = pathParts(absolutePath);
  return fsdLayers.has(layer) ? layer : null;
};

const sliceOfPath = (absolutePath) => {
  const parts = pathParts(absolutePath);
  const [layer, slice] = parts;
  if (!fsdLayers.has(layer)) {
    return null;
  }
  if (layer === "app" || layer === "shared") {
    return null;
  }
  return slice ?? null;
};

const isPackageReexport = (specifier) =>
  packagePrefixes.some((prefix) => specifier.startsWith(prefix));

const isPublicApiImport = (specifier, targetLayer, targetSlice) => {
  if (!targetSlice || targetLayer === "shared" || targetLayer === "app") {
    return true;
  }
  return specifier === `@/${targetLayer}/${targetSlice}`;
};

const files = collectSourceFiles(root);
const violations = [];

for (const file of files) {
  const source = readFileSync(file, "utf8");
  const fromLayer = layerOfPath(file);
  const fromSlice = sliceOfPath(file);

  if (!fromLayer) {
    violations.push({
      rule: "unknown-layer",
      file,
      specifier: null,
      message: "source file is outside an FSD layer",
    });
  }

  for (const specifier of extractImports(source)) {
    if (isPackageReexport(specifier)) {
      continue;
    }

    const targetPath = localPathFor(specifier, file);
    if (!targetPath) {
      continue;
    }

    if (isStaticAssetPath(targetPath)) {
      continue;
    }

    const targetLayer = layerOfPath(targetPath);
    const targetSlice = sliceOfPath(targetPath);

    if (!targetLayer) {
      violations.push({
        rule: "unknown-target-layer",
        file,
        specifier,
        message: "local import targets a file outside an FSD layer",
      });
      continue;
    }

    if (fromLayer && layerRank.get(fromLayer) < layerRank.get(targetLayer)) {
      violations.push({
        rule: "upward-import",
        file,
        specifier,
        message: `${fromLayer} cannot import upward from ${targetLayer}`,
      });
    }

    if (
      fromLayer &&
      fromLayer === targetLayer &&
      fromSlice &&
      targetSlice &&
      fromSlice !== targetSlice
    ) {
      violations.push({
        rule: "same-layer-slice-import",
        file,
        specifier,
        message: `${fromLayer}/${fromSlice} cannot import ${targetLayer}/${targetSlice}`,
      });
    }

    if (
      specifier.startsWith("@/") &&
      fromLayer &&
      !(fromLayer === targetLayer && fromSlice === targetSlice) &&
      !isPublicApiImport(specifier, targetLayer, targetSlice)
    ) {
      violations.push({
        rule: "public-api-import",
        file,
        specifier,
        message: "cross-slice import must target the slice public API",
      });
    }
  }
}

if (violations.length > 0) {
  console.error(`FSD architecture violations: ${violations.length}`);
  for (const violation of violations) {
    const filePath = toUnix(relative(root, violation.file));
    const importText = violation.specifier ? ` -> ${violation.specifier}` : "";
    console.error(`${violation.rule}: ${filePath}${importText} (${violation.message})`);
  }
  process.exit(1);
}

console.log(`FSD architecture check passed for ${files.length} source files.`);
