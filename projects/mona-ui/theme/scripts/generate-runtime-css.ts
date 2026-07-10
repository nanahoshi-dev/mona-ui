import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { themeDefinitions } from "../definitions/theme-definitions";
import { createRuntimeThemeCss } from "../utils/theme-runtime-css";

const outputPath = fileURLToPath(new URL("../theme.runtime.css", import.meta.url));

async function main(): Promise<void> {
    await writeFile(outputPath, createRuntimeThemeCss(themeDefinitions.mona.light), "utf8");
    console.log(`Generated ${outputPath}`);
}

void main();
