import { beforeAll, describe, expect, it, vi } from "vitest";
import * as PublicApi from "@nanahoshi/mona-ui/chart";
import type * as Ts from "typescript";
import type { ApiEntryPointReference, ApiSymbol } from "../../../mona-ui-tester/src/app/api/api-model";

interface DirectoryEntry {
    isDirectory(): boolean;
    name: string;
}

interface FsModule {
    existsSync(path: string): boolean;
    readFileSync(path: string, encoding: string): string;
    readdirSync(path: string, options: { withFileTypes: true }): DirectoryEntry[];
}

interface PathModule {
    resolve(...paths: string[]): string;
}

interface ProcessModule {
    cwd(): string;
}

interface SourceMember {
    readonly defaultText?: string;
    readonly deprecated: boolean;
    readonly isModel: boolean;
    readonly name: string;
    readonly required: boolean;
}

interface SourceComponent {
    readonly className: string;
    readonly contextType?: string;
    readonly members: readonly SourceMember[];
    readonly selector: string;
}

interface DocumentedRow {
    readonly defaultCell: string;
    readonly description: string;
    readonly name: string;
    readonly typeCell: string;
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
        `(?:^|\\n)[ \\t]*import(?:\\s+(type))?\\s*\\{([^}]*)\\}\\s*from\\s*["']${escapedModule}["']`,
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

/**
 * Extracts every type imported from a module: `import type { ... }` lists and inline `type X` specifiers.
 */
function extractTypeImportsFromMarkdown(markdown: string, targetModule = "@nanahoshi/mona-ui/chart"): string[] {
    const escapedModule = targetModule.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const blocks = markdown.matchAll(
        new RegExp(`(?:^|\\n)[ \\t]*import(\\s+type)?\\s*\\{([^}]*)\\}\\s*from\\s*["']${escapedModule}["']`, "g")
    );
    const types: string[] = [];
    for (const [, typeKeyword, specifiers] of blocks) {
        for (const entry of specifiers.split(",")) {
            const clean = entry.replace(/\/\/.*$/gm, "").trim();
            const inline = /^type\s+(\w+)/.exec(clean)?.[1];
            const whole = typeKeyword ? /^\w+/.exec(clean)?.[0] : undefined;
            if (inline ?? whole) {
                types.push((inline ?? whole) as string);
            }
        }
    }
    return types;
}

/** The text after a `<selector>` heading, up to the next heading of any level. */
function readSections(markdown: string): Map<string, string> {
    const sections = new Map<string, string>();
    const parts = markdown.replace(/\r\n/g, "\n").split(/^(#{2,4} .*)$/m);
    for (let index = 1; index < parts.length; index += 2) {
        const selector = /^#{2,4} `<(mona-[\w-]+)>`$/.exec(parts[index].trim())?.[1];
        if (selector) {
            sections.set(selector, parts[index + 1]);
        }
    }
    return sections;
}

function readRows(section: string): DocumentedRow[] {
    const rows: DocumentedRow[] = [];
    for (const line of section.split("\n")) {
        const name = /^\|\s*`([\w-]+)`\s*\|/.exec(line)?.[1];
        if (!name) {
            continue;
        }
        const cells = line
            .trim()
            .replace(/^\||\|$/g, "")
            .split(/(?<!\\)\|/)
            .map(cell => cell.trim());
        rows.push({ defaultCell: cells[2] ?? "", description: cells[3] ?? "", name, typeCell: cells[1] ?? "" });
    }
    return rows;
}

function isLiteralDefault(text: string): boolean {
    return /^(?:"[^"]*"|-?\d+(?:\.\d+)?|true|false|undefined|\[\])$/.test(text);
}

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
        expect(extractTypeImportsFromMarkdown(sample)).toEqual(["ChartField", "ChartValueFormatter"]);
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
        expect(extractTypeImportsFromMarkdown(sample)).toEqual(["ChartField"]);
    });

    it("does not read an import from another module as part of the next one", () => {
        const sample = `
import { Component, signal } from "@angular/core";
import { ChartComponent } from "@nanahoshi/mona-ui/chart";
        `;

        expect(extractRuntimeImportsFromMarkdown(sample)).toEqual(["ChartComponent"]);
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

describe("Chart documentation", () => {
    const docs = new Map<string, string>();
    let components: SourceComponent[] = [];
    let contexts = new Map<string, string[]>();
    let publicApiSource = "";
    /** What the API reference shows for the chart entry point, which `npm run build:api-data` writes before `test:lib`. */
    let reference: readonly ApiSymbol[] = [];
    let sourceText = "";

    function referenceFor(selector: string): ApiSymbol | undefined {
        return reference.find(symbol => symbol.selector === selector);
    }

    function readDoc(name: string): string {
        const doc = docs.get(name);
        if (doc === undefined) {
            throw new Error(`The test does not load ${name}`);
        }
        return doc;
    }

    function componentFor(selector: string): SourceComponent {
        const component = components.find(candidate => candidate.selector === selector);
        if (!component) {
            throw new Error(`No component has the selector ${selector}`);
        }
        return component;
    }

    function expectRowsToBeReal(document: string, selector: string, rows: readonly DocumentedRow[]): void {
        const { members } = componentFor(selector);
        for (const row of rows) {
            const label = `${document} <${selector}> ${row.name}`;
            const member = members.find(candidate => candidate.name === row.name);
            if (!member) {
                expect.fail(`${label} does not exist`);
            }
            const cell = row.defaultCell.replace(/^`|`$/g, "");
            if (member.required) {
                expect(cell, `${label} is required`).toMatch(/required/i);
            } else if (member.defaultText !== undefined && isLiteralDefault(member.defaultText)) {
                expect(cell, `Default of ${label}`).toBe(member.defaultText);
            }
            if (member.deprecated) {
                expect(row.description, `${label} is deprecated`).toContain("**Deprecated.**");
            }
        }
    }

    beforeAll(async () => {
        const fs = await vi.importActual<FsModule>("node:fs");
        const path = await vi.importActual<PathModule>("node:path");
        const nodeProcess = await vi.importActual<ProcessModule>("node:process");
        const ts = await vi.importActual<typeof Ts>("typescript");
        const root = nodeProcess.cwd();
        const chartRoot = path.resolve(root, "projects/mona-ui/chart");

        const docsRoot = "projects/mona-ui-tester/src/assets/docs";
        const chartPages = fs
            .readdirSync(path.resolve(root, docsRoot), { withFileTypes: true })
            .filter(entry => entry.isDirectory() && /^chart(?:-|$)/.test(entry.name))
            .map(entry => entry.name);
        expect(chartPages.length).toBe(11);
        for (const name of [
            ...chartPages.flatMap(page => ["api", "guide", "intro"].map(file => `${docsRoot}/${page}/${file}.md`)),
            "projects/mona-ui/chart/README.md",
            "docs/charts.md"
        ]) {
            docs.set(name.split("/").slice(-2).join("/"), fs.readFileSync(path.resolve(root, name), "utf-8"));
        }
        publicApiSource = fs.readFileSync(path.resolve(chartRoot, "public-api.ts"), "utf-8");
        const referenceFile = path.resolve(root, "dist/docs-api/chart.json");
        if (!fs.existsSync(referenceFile)) {
            throw new Error(
                `${referenceFile} is missing. Run npm run build:api-data, which npm run test:lib runs first.`
            );
        }
        reference = (JSON.parse(fs.readFileSync(referenceFile, "utf-8")) as ApiEntryPointReference).symbols;

        const files: string[] = [];
        const walk = (directory: string): void => {
            for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
                const entryPath = path.resolve(directory, entry.name);
                if (entry.isDirectory()) {
                    walk(entryPath);
                } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".spec.ts")) {
                    files.push(entryPath);
                }
            }
        };
        walk(chartRoot);

        const interfaces = new Map<string, { extended: string[]; members: string[] }>();
        const aliases = new Map<string, string[]>();
        const found: SourceComponent[] = [];
        const sources: string[] = [];

        const readClass = (node: Ts.ClassDeclaration): void => {
            const decorator = (ts.getDecorators(node) ?? []).find(candidate =>
                /^(?:Component|Directive)\(/.test(candidate.expression.getText())
            );
            if (!node.name || !decorator || !ts.isCallExpression(decorator.expression)) {
                return;
            }
            const metadata = decorator.expression.arguments[0] as Ts.ObjectLiteralExpression;
            const selector = metadata.properties
                .find(property => property.name?.getText() === "selector")
                ?.getText()
                .replace(/^selector:\s*["'`]|["'`]$/g, "");
            if (!selector) {
                return;
            }
            const members: SourceMember[] = [];
            let contextType: string | undefined;
            for (const member of node.members) {
                if (!ts.isPropertyDeclaration(member) || !member.initializer) {
                    continue;
                }
                const contextMatch = /TemplateRef<(\w+)/.exec(member.initializer.getText());
                if (member.name.getText() === "templateRef" && contextMatch) {
                    contextType = contextMatch[1];
                }
                if (!ts.isCallExpression(member.initializer)) {
                    continue;
                }
                const call = member.initializer.expression.getText();
                if (!/^(?:input|input\.required|model|model\.required|output)$/.test(call)) {
                    continue;
                }
                const required = call.endsWith(".required");
                const isOutput = call === "output";
                const args = member.initializer.arguments;
                const options = isOutput || required ? args[0] : args[1];
                const alias =
                    options && ts.isObjectLiteralExpression(options)
                        ? options.properties
                              .find(property => property.name?.getText() === "alias")
                              ?.getText()
                              .replace(/^alias:\s*["']|["']$/g, "")
                        : undefined;
                members.push({
                    defaultText: !isOutput && !required && args[0] ? args[0].getText() : undefined,
                    deprecated: ts.getJSDocTags(member).some(tag => tag.tagName.text === "deprecated"),
                    isModel: call.startsWith("model"),
                    name: alias ?? member.name.getText(),
                    required
                });
            }
            found.push({ className: node.name.text, contextType, members, selector });
        };

        for (const file of files) {
            const text = fs.readFileSync(file, "utf-8");
            sources.push(text);
            const sourceFile = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
            sourceFile.forEachChild(node => {
                if (ts.isInterfaceDeclaration(node)) {
                    interfaces.set(node.name.text, {
                        extended: (node.heritageClauses ?? []).flatMap(clause =>
                            clause.types.map(type => type.expression.getText())
                        ),
                        members: node.members.flatMap(member => (member.name ? [member.name.getText()] : []))
                    });
                } else if (ts.isTypeAliasDeclaration(node) && ts.isUnionTypeNode(node.type)) {
                    aliases.set(
                        node.name.text,
                        node.type.types.flatMap(type => (ts.isTypeReferenceNode(type) ? [type.typeName.getText()] : []))
                    );
                } else if (ts.isClassDeclaration(node)) {
                    readClass(node);
                }
            });
        }

        const membersOf = (type: string): string[] => {
            const union = aliases.get(type);
            if (union) {
                return [...new Set(union.flatMap(membersOf))];
            }
            const declared = interfaces.get(type);
            return declared ? [...new Set([...declared.members, ...declared.extended.flatMap(membersOf)])] : [];
        };
        contexts = new Map(
            found.flatMap(component =>
                component.contextType
                    ? ([[component.contextType, membersOf(component.contextType)]] as [string, string[]][])
                    : []
            )
        );
        components = found;
        sourceText = sources.join("\n");
    });

    describe("imports", () => {
        it("documents only runtime imports the entry point exports", () => {
            const exported = new Set(Object.keys(PublicApi));
            let checked = 0;
            for (const [name, markdown] of docs) {
                for (const symbol of extractRuntimeImportsFromMarkdown(markdown)) {
                    checked++;
                    expect(exported.has(symbol), `${name} imports ${symbol}, which is not exported`).toBe(true);
                }
            }
            expect(checked).toBeGreaterThan(10);
        });

        it("documents only type imports the entry point exports", () => {
            let checked = 0;
            for (const [name, markdown] of docs) {
                for (const symbol of extractTypeImportsFromMarkdown(markdown)) {
                    checked++;
                    expect(publicApiSource, `${name} imports the type ${symbol}`).toMatch(
                        new RegExp(`\\b${symbol}\\b`)
                    );
                }
            }
            expect(checked).toBeGreaterThan(0);
        });
    });

    describe("selectors", () => {
        it("uses only selectors that exist", () => {
            const selectors = new Set(components.map(component => component.selector));
            for (const [name, markdown] of docs) {
                for (const [, selector] of markdown.matchAll(/<(mona-[\w-]+)/g)) {
                    expect(selectors.has(selector), `${name} uses <${selector}>, which does not exist`).toBe(true);
                }
            }
        });

        it("lists every exported component on one page, gives it a reference, and names it in the README", () => {
            const readme = readDoc("chart/README.md");
            const apiPages = [...docs].filter(([name]) => name.endsWith("/api.md"));
            const exported = components.filter(
                component => component.selector.startsWith("mona-") && component.className in PublicApi
            );
            expect(exported.length).toBe(33);
            for (const { className, selector } of exported) {
                const listing = apiPages.filter(([, markdown]) => markdown.includes(`[\`${className}\`]`));
                expect(listing.length, `<${selector}> is listed by ${listing.length} api.md files, not one`).toBe(1);
                expect(referenceFor(selector), `The API reference has no <${selector}>`).toBeTruthy();
                expect(readme.includes(`<${selector}`), `The README does not mention <${selector}>`).toBe(true);
            }
        });

        it("names every exported template directive and its context members in the guide", () => {
            const lines = readDoc("chart/guide.md").split("\n");
            const directives = components.filter(
                component => component.selector.startsWith("ng-template") && component.className in PublicApi
            );
            expect(directives.length).toBe(16);
            for (const { contextType, selector } of directives) {
                const primary = /monaChart\w+/.exec(selector)?.[0];
                const line = lines.find(text => text.startsWith(`- \`ng-template[${primary}]`));
                expect(line, `guide.md does not list ${primary}`).toBeTruthy();
                if (contextType && contextType !== "void") {
                    const documented = /with `\{ ([^}]*) \}`/.exec(line ?? "")?.[1].split(", ") ?? [];
                    expect([...documented].sort(), `Context of ${primary}`).toEqual(
                        [...(contexts.get(contextType) ?? [])].sort()
                    );
                }
            }
        });
    });

    describe("tables", () => {
        it("lists exactly the inputs and outputs of each component in its API reference", () => {
            const exported = components.filter(
                component => component.selector.startsWith("mona-") && component.className in PublicApi
            );
            for (const { members, selector } of exported) {
                const symbol = referenceFor(selector);
                const documented = [...(symbol?.inputs ?? []), ...(symbol?.outputs ?? [])];
                for (const { alias, name } of documented) {
                    const known = members.some(member => member.name === (alias ?? name));
                    expect(known, `The reference of <${selector}> lists ${alias ?? name}, which does not exist`).toBe(
                        true
                    );
                }
                for (const member of members) {
                    const row = documented.find(candidate => (candidate.alias ?? candidate.name) === member.name);
                    const label = `The reference of <${selector}> ${member.name}`;
                    expect(row, `${label} is missing`).toBeTruthy();
                    if (member.required) {
                        expect(row?.required, `${label} is required`).toBe(true);
                    }
                    if (member.isModel) {
                        expect(row?.twoWay, `${label} is a model`).toBe(true);
                    }
                    if (member.deprecated) {
                        expect(row?.description, `${label} is deprecated`).toContain("**Deprecated.**");
                    }
                    if (!member.required && member.defaultText !== undefined && isLiteralDefault(member.defaultText)) {
                        expect(row?.defaultValue, `Default of ${label}`).toBe(member.defaultText);
                    }
                }
            }
        });

        it("lists only real inputs with their real defaults in the README", () => {
            const sections = readSections(readDoc("chart/README.md"));
            expect(sections.size).toBeGreaterThan(10);
            for (const [selector, section] of sections) {
                expectRowsToBeReal("README.md", selector, readRows(section));
            }
        });

        it("lists only public methods in the reference of ChartComponent", () => {
            const chart = reference.find(symbol => symbol.name === "ChartComponent");
            const methods = (chart?.methods ?? []).map(method => method.name);
            expect(methods.length).toBeGreaterThan(8);
            const prototype = PublicApi.ChartComponent.prototype as unknown as Record<string, unknown>;
            for (const method of methods) {
                expect(typeof prototype[method], `The reference documents ${method}()`).toBe("function");
            }
        });
    });

    describe("examples", () => {
        it("uses only real bindings and sets every required input in examples", () => {
            let checked = 0;
            for (const [name, markdown] of docs) {
                const blocks = markdown.replace(/\r\n/g, "\n").matchAll(/```(?:html|typescript)\n([\s\S]*?)```/g);
                for (const [, block] of blocks) {
                    const code = block.replace(/<!--[\s\S]*?-->/g, "");
                    for (const [tag, selector, attributes] of code.matchAll(/<(mona-[\w-]+)((?:[^>"]|"[^"]*")*)>/g)) {
                        const { members } = componentFor(selector);
                        const memberNames = new Set(members.map(member => member.name));
                        const names = attributes.replace(/="[^"]*"/g, " ");
                        const bindings = [...names.matchAll(/(?:^|\s)[[(]*([\w.-]+)[\])]*/g)].map(match => match[1]);
                        for (const binding of bindings) {
                            checked++;
                            expect(
                                memberNames.has(binding) ||
                                    memberNames.has(binding.replace(/Change$/, "")) ||
                                    /^(?:aria-.*|class|id|style)$/.test(binding),
                                `${name}: ${binding} is not a binding of ${tag}`
                            ).toBe(true);
                        }
                        for (const member of members.filter(candidate => candidate.required)) {
                            expect(bindings, `${name}: ${tag} needs ${member.name}`).toContain(member.name);
                        }
                    }
                }
            }
            expect(checked).toBeGreaterThan(50);
        });
    });

    describe("theming", () => {
        it("documents only CSS variables the chart reads", () => {
            for (const [name, markdown] of docs) {
                for (const [variable] of markdown.matchAll(/--mona-chart-[a-z\d-]+/g)) {
                    expect(sourceText.includes(variable), `${name} documents ${variable}`).toBe(true);
                }
            }
        });
    });
});
