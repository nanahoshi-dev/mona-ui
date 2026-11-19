import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { findSymbols, selectorNames } from "./api-render.js";
import { DocsContext } from "./docs-context.js";
import { MonaDocs } from "./docs-data.js";
import { getApi, getDocsPage, searchDocs } from "./tools.js";

/*
 * The tools against the docs `npm run build:prod` puts in dist/mona-ui, and the checker against every example the
 * docs show: they're known to compile, so any error it reports there is its own mistake.
 */

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const packageRoot = join(repositoryRoot, "dist/mona-ui");
const built = existsSync(join(packageRoot, "docs/manifest.json"));
if (!built && process.env["CI"]) {
    throw new Error("dist/mona-ui has no docs/manifest.json. Run npm run build:prod first.");
}

describe.skipIf(!built)("the built package's docs", () => {
    const context = new DocsContext(new MonaDocs({ origin: "option", root: packageRoot }));

    it("has every page and every entry point's reference", () => {
        for (const page of context.docs.manifest.pages) {
            expect(getDocsPage(context, page.slug)).toMatch(/^# /);
        }
        for (const { name } of context.docs.index.entryPoints) {
            expect(getApi(context, name)).toMatch(new RegExp(`^# @nanahoshi/mona-ui/${name}\\n`));
        }
    });

    it("finds every component and directive by each name in its selector", () => {
        const missing = context.symbols
            .filter(({ symbol }) => symbol.selector)
            .flatMap(exported =>
                selectorNames(exported.symbol.selector ?? "")
                    .filter(name => /^mona/i.test(name))
                    .filter(name => !findSymbols(context.symbols, name).includes(exported))
                    .map(name => `${exported.symbol.name}: ${name}`)
            );

        expect(missing).toEqual([]);
    });

    it("finds a component's page first when searching for it by name", () => {
        for (const [query, page] of [
            ["date range picker", "Date Range Picker"],
            ["kanban board", "Kanban"],
            ["sparkline", "Sparkline"],
            ["drag to reorder a list with the keyboard", "Sortable"],
            ["how to show a toast notification", "Notification"]
        ]) {
            expect(searchDocs(context, query, 1, "docs")).toContain(`1. ${page}`);
        }
    });

    it("finds no problems in the examples' templates", () => {
        const examples = join(repositoryRoot, "projects/mona-ui-tester/src/app/examples");
        const templates = listFiles(examples).flatMap(file => {
            const source = readFileSync(file, "utf8");
            if (file.endsWith(".html")) {
                return [{ file, template: source }];
            }
            return [...source.matchAll(/\btemplate:\s*`([\s\S]*?)`/g)].map(match => ({ file, template: match[1] }));
        });
        const problems = templates.flatMap(({ file, template }) =>
            context.checker
                .check(template)
                .problems.map(
                    problem =>
                        `${relative(examples, file)}:${problem.line}:${problem.column} ${problem.severity}: ${problem.message}`
                )
        );

        expect(templates.length).toBeGreaterThan(50);
        expect(problems).toEqual([]);
    });
});

function listFiles(directory: string): string[] {
    return readdirSync(directory, { withFileTypes: true }).flatMap(entry =>
        entry.isDirectory() ? listFiles(join(directory, entry.name)) : [join(directory, entry.name)]
    );
}
