import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

/*
 * The docs as data, as `@nanahoshi/mona-ui` ships them: `docs/manifest.json`, the pages it lists, and `docs/api`, with
 * `index.json` and one JSON file per entry point. `projects/mona-ui-tester/scripts/generate-ai-docs.ts` writes them.
 * The API types below mirror `projects/mona-ui-tester/src/app/api/api-model.ts`, as far as this server reads them.
 */

/** The `schemaVersion` of `docs/manifest.json` this server reads. */
export const SCHEMA_VERSION = 1;

export const PACKAGE_NAME = "@nanahoshi/mona-ui";

export type ApiSymbolKind =
    "class" | "component" | "constant" | "directive" | "enum" | "function" | "interface" | "pipe" | "service" | "type";

export interface ApiMember {
    /** The name consumers bind, when an input or output is aliased. */
    readonly alias?: string;
    readonly defaultValue?: string;
    readonly description: string;
    readonly name: string;
    readonly optional?: boolean;
    readonly readonly?: boolean;
    readonly required?: boolean;
    readonly twoWay?: boolean;
    readonly type: string;
}

export interface ApiMethod {
    readonly description: string;
    readonly name: string;
    readonly signature: string;
}

export interface ApiEnumMember {
    readonly description: string;
    readonly name: string;
    readonly value: string;
}

export interface ApiInheritance {
    readonly from: string;
    readonly inputs?: readonly ApiMember[];
    readonly methods?: readonly ApiMethod[];
    readonly outputs?: readonly ApiMember[];
    readonly properties?: readonly ApiMember[];
}

export interface ApiGuidePage {
    readonly path: string;
    readonly title: string;
}

export interface ApiSymbol {
    readonly description: string;
    readonly enumMembers?: readonly ApiEnumMember[];
    readonly exportAs?: string;
    readonly extends?: readonly string[];
    readonly implements?: readonly string[];
    readonly inherited?: readonly ApiInheritance[];
    readonly inputs?: readonly ApiMember[];
    readonly kind: ApiSymbolKind;
    readonly methods?: readonly ApiMethod[];
    readonly name: string;
    readonly outputs?: readonly ApiMember[];
    readonly page?: ApiGuidePage;
    readonly pipeName?: string;
    readonly properties?: readonly ApiMember[];
    readonly selector?: string;
    readonly signature?: string;
    readonly templateContext?: { readonly members: readonly ApiMember[]; readonly type: string };
    readonly typeParameters?: readonly string[];
    readonly usedBy?: readonly string[];
}

export interface ApiEntryPoint {
    readonly name: string;
    readonly pages: readonly ApiGuidePage[];
    readonly symbols: readonly ApiSymbol[];
}

export interface ApiIndex {
    readonly entryPoints: readonly {
        readonly name: string;
        readonly pages: readonly ApiGuidePage[];
        readonly symbols: readonly { readonly kind: ApiSymbolKind; readonly name: string; readonly summary: string }[];
    }[];
}

export interface DocsPage {
    readonly category: string;
    readonly description: string;
    readonly entryPoint?: string;
    /** The page's markdown file, relative to the package root. */
    readonly file: string;
    readonly kind: "component" | "guide";
    readonly path: string;
    readonly slug: string;
    readonly title: string;
}

export interface DocsManifest {
    readonly essentials: string;
    readonly pages: readonly DocsPage[];
    readonly schemaVersion: number;
    readonly version: string;
}

/** Where the docs come from, and anything the agent should know about that choice. */
export interface DocsSource {
    /** Said once, at the top of the first answer, when the docs may not match the project. */
    readonly note?: string;
    readonly origin: "bundled" | "installed" | "option";
    /** A folder laid out like the package: `docs/manifest.json` and `docs/api` in it. */
    readonly root: string;
}

/** A symbol, with the entry point that exports it. */
export interface ExportedSymbol {
    readonly entryPoint: string;
    readonly symbol: ApiSymbol;
}

/** Reads one version of the docs, each file on first use. */
export class MonaDocs {
    readonly #entryPoints = new Map<string, ApiEntryPoint>();
    readonly #pages = new Map<string, string>();
    #index?: ApiIndex;
    #manifest?: DocsManifest;

    public constructor(public readonly source: DocsSource) {}

    public get index(): ApiIndex {
        this.#index ??= readJson<ApiIndex>(join(this.source.root, "docs/api/index.json"));
        return this.#index;
    }

    public get manifest(): DocsManifest {
        this.#manifest ??= readJson<DocsManifest>(join(this.source.root, "docs/manifest.json"));
        return this.#manifest;
    }

    public get version(): string {
        return this.manifest.version;
    }

    /** Every exported symbol, in index order. Reads every entry point's file. */
    public allSymbols(): ExportedSymbol[] {
        return this.index.entryPoints.flatMap(({ name }) =>
            (this.entryPoint(name)?.symbols ?? []).map(symbol => ({ entryPoint: name, symbol }))
        );
    }

    public entryPoint(name: string): ApiEntryPoint | undefined {
        if (!this.index.entryPoints.some(entryPoint => entryPoint.name === name)) {
            return undefined;
        }
        let entryPoint = this.#entryPoints.get(name);
        if (!entryPoint) {
            entryPoint = readJson<ApiEntryPoint>(join(this.source.root, "docs/api", `${name}.json`));
            this.#entryPoints.set(name, entryPoint);
        }
        return entryPoint;
    }

    public pageMarkdown(page: DocsPage): string {
        let markdown = this.#pages.get(page.slug);
        if (markdown === undefined) {
            markdown = readFileSync(join(this.source.root, page.file), "utf8").replace(/\r\n/g, "\n");
            this.#pages.set(page.slug, markdown);
        }
        return markdown;
    }
}

export interface ResolveDocsOptions {
    /** The copy that ships with this server, used when the project's own can't be. */
    readonly bundledRoot: string;
    /** A folder laid out like the package, given on the command line. Wins over everything else. */
    readonly docsRoot?: string;
    /** Folders to look for an installed `@nanahoshi/mona-ui` from, walking up from each. */
    readonly searchFrom: readonly string[];
}

/**
 * Picks the docs that match the project: those of the `@nanahoshi/mona-ui` it has installed, nearest to the first
 * folder that has one. Versions before the docs data shipped, or with a newer schema than this server reads, fall back
 * to the bundled copy, with a note saying so.
 */
export function resolveDocsSource(options: ResolveDocsOptions): DocsSource {
    if (options.docsRoot) {
        const root = resolve(options.docsRoot);
        if (!existsSync(join(root, "docs/manifest.json"))) {
            throw new Error(`--docs points at ${root}, which has no docs/manifest.json.`);
        }
        return { origin: "option", root };
    }
    const bundledManifest = join(options.bundledRoot, "docs/manifest.json");
    // Read only when it's needed, so a missing bundled copy doesn't stop the project's own docs being used.
    const bundledVersion = (): string => {
        if (!existsSync(bundledManifest)) {
            throw new Error(
                `The project has no usable ${PACKAGE_NAME} docs, and the copy bundled with this server is missing.`
            );
        }
        return readJson<DocsManifest>(bundledManifest).version;
    };
    const bundled = (note: string): DocsSource => ({ note, origin: "bundled", root: options.bundledRoot });
    for (const start of options.searchFrom) {
        const installed = findInstalledPackage(start);
        if (!installed) {
            continue;
        }
        const manifestPath = join(installed.root, "docs/manifest.json");
        if (!existsSync(manifestPath)) {
            return bundled(
                `The project has ${PACKAGE_NAME} ${installed.version} installed, which ships no docs data. These answers ` +
                    `come from the ${bundledVersion()} docs bundled with this server, so they may describe APIs ` +
                    `${installed.version} doesn't have. Updating ${PACKAGE_NAME} makes them match.`
            );
        }
        const { schemaVersion } = readJson<DocsManifest>(manifestPath);
        if (schemaVersion > SCHEMA_VERSION) {
            return bundled(
                `The project's ${PACKAGE_NAME} ${installed.version} ships docs this server version can't read. These ` +
                    `answers come from the ${bundledVersion()} docs bundled with it. Update @nanahoshi/mona-ui-mcp, or ` +
                    `run it with npx -y @nanahoshi/mona-ui-mcp@latest.`
            );
        }
        return { origin: "installed", root: installed.root };
    }
    return bundled(
        `${PACKAGE_NAME} isn't installed where this server looked (${options.searchFrom.join(", ")}), so these answers ` +
            `come from the ${bundledVersion()} docs bundled with it. Install it with npm install ${PACKAGE_NAME}, or ` +
            `start the server with --project <folder>.`
    );
}

/** The nearest `node_modules/@nanahoshi/mona-ui` from a folder up, as Node would resolve it. */
export function findInstalledPackage(start: string): { root: string; version: string } | undefined {
    let directory = resolve(start);
    for (;;) {
        const root = join(directory, "node_modules", PACKAGE_NAME);
        if (existsSync(join(root, "package.json"))) {
            return { root, version: readJson<{ version: string }>(join(root, "package.json")).version };
        }
        const parent = dirname(directory);
        if (parent === directory) {
            return undefined;
        }
        directory = parent;
    }
}

function readJson<T>(path: string): T {
    return JSON.parse(readFileSync(path, "utf8")) as T;
}
