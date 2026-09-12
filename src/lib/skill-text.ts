import { readFileSync } from "node:fs";
import { join } from "node:path";

export const SKILL_PATH = join(process.cwd(), "skill", "latent-press", "SKILL.md");

export const FULL_SKILL: string = readFileSync(SKILL_PATH, "utf8");
