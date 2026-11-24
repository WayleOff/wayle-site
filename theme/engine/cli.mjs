#!/usr/bin/env node
/* Usage : node cli.mjs [fichier-thème.json]  → écrit le CSS sur la sortie standard. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { validate } from "../tokens/validate.js";
import { compile } from "./compile.js";
const here = dirname(fileURLToPath(import.meta.url));
const file = process.argv[2] || join(here, "..", "themes", "wayle.json");
const input = JSON.parse(readFileSync(file, "utf8"));
const { ok, errors, theme } = validate(input);
if (!ok) { console.error("Thème invalide :\n" + errors.map((e) => " - " + e.path + " : " + e.message).join("\n")); process.exit(1); }
process.stdout.write(compile(theme));
