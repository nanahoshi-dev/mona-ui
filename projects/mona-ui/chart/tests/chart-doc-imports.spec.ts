import { describe, expect, it, vi } from "vitest";
import * as PublicApi from "@nanahoshi/mona-ui/chart";

interface FsModule {
    existsSync(path: string): boolean;
    readFileSync(path: string, encoding: string): string;
}

interface PathModule {
    resolve(...paths: string[]): string;
}

interface ProcessModule {
    cwd(): string;
}

/**
 * Extracts runtime imported identifiers from Markdown TypeScript/JavaScript import blocks
 * that target a specific module (default: `@nanahoshi/mona-ui/chart`).
 *
 * - Parses single-line and multiline named imports
 * - Ignores `import type { ... }` declarations
 * - Ignores inline `type Identifier` specifiers within named import lists
 * - Strips comments, whitespace, and handles aliases (`Original as Alias` -> `Original`)
 */
export function extractRuntimeImportsFromMarkdown(
    markdown: string,
    targetModule: string = "@nanahoshi/mona-ui/chart"
): string[] {
    const symbols: string[] = [];
    const escapedModule = targetModule.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const importBlockRegex = new RegExp(
        `(?:^|\\n)[ \\t]*import(?:\\s+(type))?\\s*\\{([\\s\\S]*?)\\}\\s*from\\s*["']${escapedModule}["']`,
        "g"
    );

    let match: RegExpExecArray | null;
    while ((match = importBlockRegex.exec(markdown)) !== null) {
        const isTypeImport = match[1] === "type";
        if (isTypeImport) {
            continue;
        }

        const rawSpecifiers = match[2];
        const entries = rawSpecifiers.split(",");

        for (const entry of entries) {
            const clean = entry.replace(/\/\/.*$/gm, "").trim();
            if (!clean) {
                continue;
            }

            if (/^type\s+/.test(clean)) {
                continue;
            }

            const aliasMatch = clean.match(/^(\w+)\s+as\s+(\w+)$/);
            if (aliasMatch) {
                symbols.push(aliasMatch[1]);
            } else {
                const nameMatch = clean.match(/^(\w+)$/);
                if (nameMatch) {
                    symbols.push(nameMatch[1]);
                }
            }
        }
    }

    return symbols;
}

async function readApiDocContent(): Promise<string> {
    const fs = await vi.importActual<FsModule>("node:fs");
    const path = await vi.importActual<PathModule>("node:path");
    const nodeProcess = await vi.importActual<ProcessModule>("node:process");
    const cwd = nodeProcess.cwd();
    const candidatePaths = [
        path.resolve(cwd, "projects/mona-ui-tester/src/assets/docs/chart/api.md"),
        path.resolve("projects/mona-ui-tester/src/assets/docs/chart/api.md")
    ];

    for (const candidate of candidatePaths) {
        if (fs.existsSync(candidate)) {
            return fs.readFileSync(candidate, "utf-8");
        }
    }

    throw new Error(`Could not find api.md in candidate paths: ${candidatePaths.join(", ")}`);
}

describe("Chart Documentation Imports (FWF-F3)", () => {
    describe("extractRuntimeImportsFromMarkdown", () => {
        it("extracts single-line and multiline named imports", () => {
            const sample = `
\`\`\`typescript
import {
    ChartComponent,
    ChartLegendComponent,
    ChartTooltipComponent
} from "@nanahoshi/mona-ui/chart";
\`\`\`
            `;

            const imports = extractRuntimeImportsFromMarkdown(sample);
            expect(imports).toEqual(["ChartComponent", "ChartLegendComponent", "ChartTooltipComponent"]);
        });

        it("ignores import type statements", () => {
            const sample = `
import type { ChartField, ChartValueFormatter } from "@nanahoshi/mona-ui/chart";
import { ChartComponent } from "@nanahoshi/mona-ui/chart";
            `;

            const imports = extractRuntimeImportsFromMarkdown(sample);
            expect(imports).toEqual(["ChartComponent"]);
        });

        it("ignores inline type specifiers within named imports", () => {
            const sample = `
import {
    ChartComponent,
    type ChartField,
    RadarSeriesComponent
} from "@nanahoshi/mona-ui/chart";
            `;

            const imports = extractRuntimeImportsFromMarkdown(sample);
            expect(imports).toEqual(["ChartComponent", "RadarSeriesComponent"]);
        });

        it("extracts original exported identifier from aliased imports", () => {
            const sample = `
import { ChartComponent as CustomChart, ChartLegendComponent } from "@nanahoshi/mona-ui/chart";
            `;

            const imports = extractRuntimeImportsFromMarkdown(sample);
            expect(imports).toEqual(["ChartComponent", "ChartLegendComponent"]);
        });

        it("handles trailing commas, whitespace, and comments", () => {
            const sample = `
import {
    ChartComponent, // Primary container
    ChartAngularAxisComponent,
    ChartRadialAxisComponent,
} from "@nanahoshi/mona-ui/chart";
            `;

            const imports = extractRuntimeImportsFromMarkdown(sample);
            expect(imports).toEqual(["ChartComponent", "ChartAngularAxisComponent", "ChartRadialAxisComponent"]);
        });
    });

    describe("api.md import verification", () => {
        it("reads real api.md and validates all documented @nanahoshi/mona-ui/chart runtime imports exist in public-api.ts", async () => {
            const markdown = await readApiDocContent();
            const documentedImports = extractRuntimeImportsFromMarkdown(markdown);

            expect(documentedImports.length).toBeGreaterThan(0);

            const exportedKeys = new Set(Object.keys(PublicApi));

            for (const symbol of documentedImports) {
                expect(
                    exportedKeys.has(symbol),
                    `Documented import "${symbol}" in api.md is not exported in public-api.ts`
                ).toBe(true);
            }
        });

        it("ensures Funnel and Waterfall series components and directives are exported in public-api.ts", () => {
            const requiredSeriesExports = [
                "FunnelSeriesComponent",
                "WaterfallSeriesComponent",
                "ChartFunnelLabelTemplateDirective",
                "ChartWaterfallLabelTemplateDirective"
            ];

            const exportedKeys = new Set(Object.keys(PublicApi));

            for (const symbol of requiredSeriesExports) {
                expect(
                    exportedKeys.has(symbol),
                    `Required chart export "${symbol}" was not found in public-api.ts`
                ).toBe(true);
            }
        });
    });
});
