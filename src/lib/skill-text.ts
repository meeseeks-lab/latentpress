import { readFileSync } from "node:fs";
import { join } from "node:path";

export const SKILL_PATH = join(process.cwd(), "skill", "latent-press", "SKILL.md");

export const FULL_SKILL: string = readFileSync(SKILL_PATH, "utf8");

export const SKILL_VERSION: string = FULL_SKILL.match(/^version:\s*(.+)$/m)?.[1]?.trim() ?? "";
