#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const CONTROLLER_ROOT = path.join(ROOT, "backend-spring/src/main/java/com/sourcelens");
const API_DOC = path.join(ROOT, "docs/API_DESIGN.md");
const HTTP_METHOD_BY_ANNOTATION = new Map([
  ["GetMapping", "GET"],
  ["PostMapping", "POST"],
  ["PutMapping", "PUT"],
  ["PatchMapping", "PATCH"],
  ["DeleteMapping", "DELETE"],
]);

const args = new Set(process.argv.slice(2));
const allowDocsOnly = args.has("--allow-docs-only");
const DOCS_ONLY_ALLOWLIST = new Map([
  ["GET /api-docs", "Springdoc/OpenAPI metadata endpoint, provided by framework instead of SourceLens controller"],
]);
const REQUEST_BODY_SKIP_TYPES = new Set(["String", "Object"]);
const SIMPLE_DTO_FIELD_TYPES = new Set([
  "String",
  "Long",
  "Integer",
  "Short",
  "Byte",
  "Double",
  "Float",
  "Boolean",
  "BigDecimal",
  "BigInteger",
  "LocalDate",
  "LocalDateTime",
  "Instant",
  "OffsetDateTime",
]);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return walk(fullPath);
    }
    if (entry.isFile() && entry.name.endsWith("Controller.java")) {
      return [fullPath];
    }
    return [];
  });
}

function walkJava(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return walkJava(fullPath);
    }
    if (entry.isFile() && entry.name.endsWith(".java")) {
      return [fullPath];
    }
    return [];
  });
}

function lineNumber(source, index) {
  return source.slice(0, index).split(/\r?\n/).length;
}

function findAnnotation(source, atIndex) {
  const nameMatch = source.slice(atIndex + 1).match(/^([A-Za-z][A-Za-z0-9_]*)/);
  if (!nameMatch) {
    return null;
  }
  const name = nameMatch[1];
  let cursor = atIndex + 1 + name.length;
  while (/\s/.test(source[cursor] ?? "")) {
    cursor += 1;
  }
  if (source[cursor] !== "(") {
    return { name, args: "", start: atIndex, end: cursor, line: lineNumber(source, atIndex) };
  }
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let i = cursor; i < source.length; i += 1) {
    const ch = source[i];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === "\"" || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === "(") {
      depth += 1;
    } else if (ch === ")") {
      depth -= 1;
      if (depth === 0) {
        return {
          name,
          args: source.slice(cursor + 1, i),
          start: atIndex,
          end: i + 1,
          line: lineNumber(source, atIndex),
        };
      }
    }
  }
  throw new Error(`Unclosed annotation @${name} near line ${lineNumber(source, atIndex)}`);
}

function findAnnotations(source) {
  const annotations = [];
  for (let index = source.indexOf("@"); index !== -1; index = source.indexOf("@", index + 1)) {
    const annotation = findAnnotation(source, index);
    if (annotation) {
      annotations.push(annotation);
      index = annotation.end - 1;
    }
  }
  return annotations;
}

function parseStringLiterals(annotationArgs) {
  const values = [];
  const pattern = /"((?:\\.|[^"\\])*)"/g;
  let match;
  while ((match = pattern.exec(annotationArgs)) !== null) {
    values.push(match[1].replace(/\\"/g, "\""));
  }
  return values.length ? values : [""];
}

function parseRequestMappingMethods(annotationArgs) {
  const matches = [...annotationArgs.matchAll(/RequestMethod\.([A-Z]+)/g)].map((match) => match[1]);
  return matches.length ? matches : ["GET", "POST", "PUT", "PATCH", "DELETE"];
}

function joinPaths(basePath, methodPath) {
  const base = basePath || "";
  const suffix = methodPath || "";
  const joined = `${base.replace(/\/+$/, "")}/${suffix.replace(/^\/+/, "")}`;
  return joined.replace(/\/+$/, "") || "/";
}

function splitTopLevel(value, delimiter = ",") {
  const parts = [];
  let current = "";
  let angleDepth = 0;
  let parenDepth = 0;
  let quote = null;
  let escaped = false;
  for (const ch of value) {
    if (quote) {
      current += ch;
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === "\"" || ch === "'") {
      quote = ch;
      current += ch;
      continue;
    }
    if (ch === "<") angleDepth += 1;
    if (ch === ">") angleDepth = Math.max(0, angleDepth - 1);
    if (ch === "(") parenDepth += 1;
    if (ch === ")") parenDepth = Math.max(0, parenDepth - 1);
    if (ch === delimiter && angleDepth === 0 && parenDepth === 0) {
      parts.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim()) {
    parts.push(current.trim());
  }
  return parts;
}

function extractMethodSignatureAfter(source, startIndex) {
  const tail = source.slice(startIndex, Math.min(source.length, startIndex + 2500));
  const openBrace = tail.indexOf("{");
  if (openBrace < 0) {
    return "";
  }
  return tail.slice(0, openBrace).replace(/\s+/g, " ").trim();
}

function parseRequestBody(signature) {
  const paramsMatch = signature.match(/\((.*)\)\s*(?:throws\s+[^{]+)?$/);
  if (!paramsMatch) {
    return null;
  }
  const requestParam = splitTopLevel(paramsMatch[1]).find((part) => part.includes("@RequestBody"));
  if (!requestParam) {
    return null;
  }
  const optional = /@RequestBody\s*\([^)]*required\s*=\s*false/.test(requestParam);
  const cleaned = requestParam
    .replace(/@\w+(?:\([^)]*\))?\s*/g, "")
    .replace(/\bfinal\s+/g, "")
    .trim();
  const nameMatch = cleaned.match(/\s+([A-Za-z_][A-Za-z0-9_]*)$/);
  if (!nameMatch) {
    return null;
  }
  const name = nameMatch[1];
  const type = cleaned.slice(0, cleaned.length - name.length).trim();
  return { type, name, optional };
}

function extractRoutes(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  const classIndex = source.search(/\bclass\s+[A-Za-z0-9_]+/);
  if (classIndex < 0) {
    throw new Error(`No class declaration found in ${filePath}`);
  }
  const annotations = findAnnotations(source);
  const classRequestMapping = annotations
    .filter((annotation) => annotation.name === "RequestMapping" && annotation.start < classIndex)
    .at(-1);
  const classPaths = classRequestMapping ? parseStringLiterals(classRequestMapping.args) : [""];
  const methodAnnotations = annotations.filter((annotation) => {
    if (annotation.start < classIndex) {
      return false;
    }
    return HTTP_METHOD_BY_ANNOTATION.has(annotation.name) || annotation.name === "RequestMapping";
  });

  return methodAnnotations.flatMap((annotation) => {
    const methods = annotation.name === "RequestMapping"
      ? parseRequestMappingMethods(annotation.args)
      : [HTTP_METHOD_BY_ANNOTATION.get(annotation.name)];
    const methodPaths = parseStringLiterals(annotation.args);
    const requestBody = parseRequestBody(extractMethodSignatureAfter(source, annotation.end));
    return classPaths.flatMap((classPath) => methodPaths.flatMap((methodPath) => methods.map((method) => ({
      method,
      path: joinPaths(classPath, methodPath),
      file: path.relative(ROOT, filePath),
      line: annotation.line,
      requestBody,
    }))));
  });
}

function extractDocumentedRoutes() {
  const text = fs.readFileSync(API_DOC, "utf8");
  const routes = new Set();
  const pattern = /\b(GET|POST|PUT|DELETE|PATCH)\s+(\/api(?:-[A-Za-z0-9_-]+|\/)[^\s`)]*)/g;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    routes.add(`${match[1]} ${match[2]}`);
  }
  return routes;
}

function extractDocumentedSections() {
  const text = fs.readFileSync(API_DOC, "utf8");
  const headingPattern = /^###\s+(GET|POST|PUT|DELETE|PATCH)\s+(\/api(?:-[A-Za-z0-9_-]+|\/)[^\s`)]*)\s*$/gm;
  const headings = [];
  let match;
  while ((match = headingPattern.exec(text)) !== null) {
    headings.push({
      key: `${match[1]} ${match[2]}`,
      start: match.index,
      endOfHeading: headingPattern.lastIndex,
    });
  }
  const sections = new Map();
  for (let i = 0; i < headings.length; i += 1) {
    const end = i + 1 < headings.length ? headings[i + 1].start : text.length;
    sections.set(headings[i].key, text.slice(headings[i].endOfHeading, end));
  }
  return sections;
}

function extractRequestJson(section) {
  if (!section || !/\*\*Request:\*\*/.test(section)) {
    return null;
  }
  const afterRequest = section.slice(section.indexOf("**Request:**"));
  const jsonMatch = afterRequest.match(/```json\s*([\s\S]*?)```/);
  if (!jsonMatch) {
    return null;
  }
  try {
    const parsed = JSON.parse(jsonMatch[1]);
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
      return null;
    }
    return parsed;
  } catch (error) {
    throw new Error(`Invalid Request JSON block in docs/API_DESIGN.md: ${error.message}`);
  }
}

function parsePackageName(source) {
  return source.match(/^\s*package\s+([^;]+);/m)?.[1] || "";
}

function parseImports(source) {
  return [...source.matchAll(/^\s*import\s+([^;]+);/gm)].map((match) => match[1]);
}

function javaPathForFqcn(fqcn) {
  return path.join(ROOT, "backend-spring/src/main/java", `${fqcn.replaceAll(".", "/")}.java`);
}

function simpleTypeName(type) {
  return type.replace(/<[\s\S]*>/g, "").replace(/\[\]$/, "").split(".").at(-1).trim();
}

function isSkippableRequestBodyType(type) {
  const simple = simpleTypeName(type);
  return REQUEST_BODY_SKIP_TYPES.has(simple) || simple === "Map" || type.startsWith("Map<");
}

function isSimpleDtoFieldType(type) {
  const simple = simpleTypeName(type);
  return SIMPLE_DTO_FIELD_TYPES.has(simple)
    || type.endsWith("[]")
    || type.startsWith("List<")
    || type.startsWith("Set<")
    || type.startsWith("Collection<")
    || type.startsWith("Map<");
}

function findClassBlock(source, className) {
  const classMatch = new RegExp(`\\b(?:class|record)\\s+${className}\\b`).exec(source);
  if (!classMatch) {
    return "";
  }
  const openIndex = source.indexOf("{", classMatch.index);
  if (openIndex < 0) {
    return "";
  }
  let depth = 0;
  for (let i = openIndex; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(openIndex + 1, i);
      }
    }
  }
  return "";
}

function stripNestedClassBlocks(block) {
  let result = block;
  let classMatch = /\b(?:class|record)\s+[A-Za-z0-9_]+\b/.exec(result);
  while (classMatch) {
    const openIndex = result.indexOf("{", classMatch.index);
    if (openIndex < 0) break;
    let depth = 0;
    let endIndex = -1;
    for (let i = openIndex; i < result.length; i += 1) {
      if (result[i] === "{") depth += 1;
      if (result[i] === "}") {
        depth -= 1;
        if (depth === 0) {
          endIndex = i + 1;
          break;
        }
      }
    }
    if (endIndex < 0) break;
    result = `${result.slice(0, classMatch.index)}${result.slice(endIndex)}`;
    classMatch = /\b(?:class|record)\s+[A-Za-z0-9_]+\b/.exec(result);
  }
  return result;
}

function extractDtoFieldDescriptors(source, className) {
  const classBlock = stripNestedClassBlocks(findClassBlock(source, className));
  if (!classBlock) {
    return [];
  }
  return [...classBlock.matchAll(/^\s*private\s+(?:final\s+)?([\w<>, ?.$]+)\s+([a-z][A-Za-z0-9_]*)\s*(?:=.*)?;/gm)]
    .map((match) => ({ type: match[1].trim(), name: match[2] }));
}

function resolveRequestBodyFields(route, controllerSource) {
  if (!route.requestBody || isSkippableRequestBodyType(route.requestBody.type)) {
    return null;
  }
  const className = simpleTypeName(route.requestBody.type);
  const innerFields = extractDtoFieldDescriptors(controllerSource, className);
  if (innerFields.length) {
    return { className, fields: innerFields, source: route.file, sourceText: controllerSource };
  }
  const imports = parseImports(controllerSource);
  const packageName = parsePackageName(controllerSource);
  const imported = imports.find((value) => value.endsWith(`.${className}`));
  const candidates = [];
  if (imported) {
    candidates.push(javaPathForFqcn(imported));
  }
  if (packageName) {
    candidates.push(javaPathForFqcn(`${packageName}.${className}`));
  }
  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) {
      continue;
    }
    const source = fs.readFileSync(candidate, "utf8");
    const fields = extractDtoFieldDescriptors(source, className);
    if (fields.length) {
      return { className, fields, source: path.relative(ROOT, candidate), sourceText: source };
    }
  }
  return { className, fields: [], source: "unresolved", sourceText: "" };
}

function resolveNestedDtoFields(parentDto, field) {
  if (isSimpleDtoFieldType(field.type)) {
    return null;
  }
  const className = simpleTypeName(field.type);
  const fields = extractDtoFieldDescriptors(parentDto.sourceText, className);
  if (!fields.length) {
    return { className, fields: [], source: "unresolved" };
  }
  return { className, fields, source: parentDto.source };
}

function compareFieldNames(routeKey, dtoName, dtoPath, dtoFields, requestJson, failures) {
  const documentedFields = Object.keys(requestJson).sort();
  const expectedFields = dtoFields.map((field) => field.name).sort();
  const missingFields = expectedFields.filter((field) => !documentedFields.includes(field));
  const extraFields = documentedFields.filter((field) => !expectedFields.includes(field));
  if (missingFields.length || extraFields.length) {
    failures.push(`${routeKey}: ${dtoName}${dtoPath} field mismatch (missing=${missingFields.join(",") || "-"} extra=${extraFields.join(",") || "-"})`);
    return false;
  }
  return true;
}

function validateNestedDtoFields(routeKey, parentDto, requestJson, failures) {
  const checked = [];
  for (const field of parentDto.fields) {
    const nestedDto = resolveNestedDtoFields(parentDto, field);
    if (!nestedDto) {
      continue;
    }
    const fieldPath = `.${field.name}`;
    if (!nestedDto.fields.length) {
      failures.push(`${routeKey}: cannot resolve nested RequestBody DTO fields for ${parentDto.className}${fieldPath} (${field.type})`);
      continue;
    }
    const documentedNested = requestJson[field.name];
    if (!documentedNested || Array.isArray(documentedNested) || typeof documentedNested !== "object") {
      failures.push(`${routeKey}: ${parentDto.className}${fieldPath} must be documented as a JSON object`);
      continue;
    }
    if (compareFieldNames(routeKey, parentDto.className, fieldPath, nestedDto.fields, documentedNested, failures)) {
      checked.push(`${parentDto.className}${fieldPath} (${nestedDto.className})`);
    }
  }
  return checked;
}

function validateRequestBodyDocs(routes) {
  const sections = extractDocumentedSections();
  const failures = [];
  const checked = [];
  const nestedCheckedAll = [];
  const skipped = [];
  for (const route of routes) {
    if (!route.requestBody) {
      continue;
    }
    if (isSkippableRequestBodyType(route.requestBody.type)) {
      skipped.push(`${route.method} ${route.path} (${route.requestBody.type})`);
      continue;
    }
    const controllerSource = fs.readFileSync(path.join(ROOT, route.file), "utf8");
    const dto = resolveRequestBodyFields(route, controllerSource);
    if (!dto || !dto.fields.length) {
      failures.push(`${route.method} ${route.path}: cannot resolve RequestBody DTO fields for ${route.requestBody.type}`);
      continue;
    }
    const section = sections.get(`${route.method} ${route.path}`);
    const requestJson = extractRequestJson(section);
    if (!requestJson) {
      if (route.requestBody.optional) {
        skipped.push(`${route.method} ${route.path} (${dto.className}, optional body without Request JSON)`);
        continue;
      }
      failures.push(`${route.method} ${route.path}: missing **Request:** JSON block for ${dto.className}`);
      continue;
    }
    const routeKey = `${route.method} ${route.path}`;
    if (!compareFieldNames(routeKey, dto.className, "", dto.fields, requestJson, failures)) {
      continue;
    }
    const nestedChecked = validateNestedDtoFields(routeKey, dto, requestJson, failures);
    if (nestedChecked.length) {
      nestedCheckedAll.push(...nestedChecked);
    }
    checked.push(`${route.method} ${route.path} (${dto.className}${nestedChecked.length ? `; nested=${nestedChecked.join(", ")}` : ""})`);
  }
  return { checked, nestedChecked: nestedCheckedAll, skipped, failures };
}

function main() {
  const controllerFiles = walk(CONTROLLER_ROOT).sort();
  const routes = controllerFiles.flatMap(extractRoutes).sort((a, b) => {
    const left = `${a.method} ${a.path}`;
    const right = `${b.method} ${b.path}`;
    return left.localeCompare(right);
  });
  const actual = new Map(routes.map((route) => [`${route.method} ${route.path}`, route]));
  const documented = extractDocumentedRoutes();
  const missingDocs = [...actual.keys()].filter((route) => !documented.has(route));
  const docsOnlyAll = [...documented].filter((route) => !actual.has(route)).sort();
  const allowedDocsOnly = docsOnlyAll.filter((route) => DOCS_ONLY_ALLOWLIST.has(route));
  const docsOnly = docsOnlyAll.filter((route) => !DOCS_ONLY_ALLOWLIST.has(route));
  const documentedControllerRoutes = documented.size - allowedDocsOnly.length;

  console.log(`API inventory: controllers=${controllerFiles.length} routes=${actual.size} documentedControllerRoutes=${documentedControllerRoutes} docsOnlyAllowed=${allowedDocsOnly.length}`);
  if (allowedDocsOnly.length) {
    console.log("\nAllowed docs-only framework routes:");
    for (const route of allowedDocsOnly) {
      console.log(`- ${route} (${DOCS_ONLY_ALLOWLIST.get(route)})`);
    }
  }
  if (missingDocs.length) {
    console.error("\nMissing from docs/API_DESIGN.md:");
    for (const route of missingDocs) {
      const source = actual.get(route);
      console.error(`- ${route} (${source.file}:${source.line})`);
    }
  }
  if (docsOnly.length) {
    const label = allowDocsOnly ? "Documented but not found in controllers (warning due --allow-docs-only)" : "Documented but not found in controllers";
    console.error(`\n${label}:`);
    for (const route of docsOnly) {
      console.error(`- ${route}`);
    }
  }
  if (missingDocs.length || (!allowDocsOnly && docsOnly.length)) {
    process.exit(1);
  }
  const requestBodyDocs = validateRequestBodyDocs(routes);
  console.log(`\nAPI request body docs: checked=${requestBodyDocs.checked.length} nestedChecked=${requestBodyDocs.nestedChecked.length} skipped=${requestBodyDocs.skipped.length}`);
  if (requestBodyDocs.nestedChecked.length) {
    console.log("Nested RequestBody DTO fields checked:");
    for (const item of requestBodyDocs.nestedChecked) {
      console.log(`- ${item}`);
    }
  }
  if (requestBodyDocs.failures.length) {
    console.error("\nRequestBody DTO fields not aligned with docs/API_DESIGN.md:");
    for (const failure of requestBodyDocs.failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }
  console.log("API inventory gate passed.");
}

main();
