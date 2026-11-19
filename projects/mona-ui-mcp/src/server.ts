import type { CallToolResult } from "@modelcontextprotocol/server";
import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { DocsContext } from "./docs-context.js";
import type { ResolveDocsOptions } from "./docs-data.js";
import { MonaDocs, resolveDocsSource } from "./docs-data.js";
import { checkTemplate, getApi, getDocsPage, listComponents, searchDocs } from "./tools.js";

export const INSTRUCTIONS = `Mona UI (@nanahoshi/mona-ui) is an Angular component library. Use these tools instead of guessing its API, which changes between versions. They answer for the version the project has installed.

1. list_components: every page, and the setup essentials. Start here once.
2. search_docs: find the page section or API symbol for a task, such as "editable grid rows" or "date range".
3. get_docs_page: read a page, or one section of a long one. Examples come with their full code.
4. get_api: the exact inputs, outputs, methods and import path of a component, directive, pipe or type.
5. check_template: after writing or changing a template that uses Mona UI, check it for unknown elements, inputs and outputs, and get the imports it needs.

Essentials: import every symbol from its entry point, such as @nanahoshi/mona-ui/grid, never from @nanahoshi/mona-ui itself. Components are standalone: add them to the component's imports. The app needs Tailwind CSS 4 and @import "@nanahoshi/mona-ui/styles.css" after Tailwind in its main stylesheet.`;

const READ_ONLY = { idempotentHint: true, openWorldHint: false, readOnlyHint: true } as const;

/** Where to find the docs, with the folders to look in read on each search, since the client's roots can change. */
export type DocsProviderOptions = Omit<ResolveDocsOptions, "searchFrom"> & {
    readonly searchFrom: () => readonly string[];
};

/** Finds the docs on first use, and again when the folders to look in change. */
export class DocsProvider {
    readonly #options: DocsProviderOptions;
    #context?: DocsContext;
    #noteShown = false;
    #ready: Promise<unknown> = Promise.resolve();

    public constructor(options: DocsProviderOptions) {
        this.#options = options;
    }

    public async get(): Promise<DocsContext> {
        await this.#ready;
        this.#context ??= new DocsContext(
            new MonaDocs(resolveDocsSource({ ...this.#options, searchFrom: this.#options.searchFrom() }))
        );
        return this.#context;
    }

    /** Forgets the docs, so the next call finds them again, once `ready` settles. */
    public reset(ready: Promise<unknown> = Promise.resolve()): void {
        this.#context = undefined;
        this.#noteShown = false;
        this.#ready = ready.catch(() => undefined);
    }

    /** The source's note, the first time it's asked for after the docs were found. */
    public takeNote(context: DocsContext): string | undefined {
        if (this.#noteShown || !context.docs.source.note) {
            return undefined;
        }
        this.#noteShown = true;
        return context.docs.source.note;
    }
}

export function createServer(provider: DocsProvider, version: string): McpServer {
    const server = new McpServer({ name: "mona-ui", title: "Mona UI", version }, { instructions: INSTRUCTIONS });
    const answer = async (run: (context: DocsContext) => string): Promise<CallToolResult> => {
        try {
            const context = await provider.get();
            const note = provider.takeNote(context);
            const text = run(context);
            return { content: [{ text: note ? `Note: ${note}\n\n${text}` : text, type: "text" }] };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            return { content: [{ text: message, type: "text" }], isError: true };
        }
    };

    server.registerTool(
        "list_components",
        {
            annotations: READ_ONLY,
            description:
                "Lists every Mona UI docs page by category, with the entry point each one imports from, after the setup essentials. Call it once before using Mona UI.",
            inputSchema: z.object({
                category: z.string().optional().describe('Only list one category, such as "Data" or "Forms".')
            }),
            title: "List Mona UI components"
        },
        ({ category }) => answer(context => listComponents(context, category))
    );

    server.registerTool(
        "search_docs",
        {
            annotations: READ_ONLY,
            description:
                "Searches the Mona UI docs and API reference. Returns the best matching page sections and symbols, each with the call that reads it in full.",
            inputSchema: z.object({
                limit: z
                    .number()
                    .int()
                    .min(1)
                    .max(25)
                    .optional()
                    .describe("How many results to return. Defaults to 8."),
                query: z
                    .string()
                    .min(1)
                    .describe('What to find, in words or names, such as "grid inline editing" or "monaTooltip".'),
                scope: z
                    .enum(["all", "api", "docs"])
                    .optional()
                    .describe('"docs" for page sections only, "api" for symbols only. Defaults to "all".')
            }),
            title: "Search the Mona UI docs"
        },
        ({ limit, query, scope }) => answer(context => searchDocs(context, query, limit, scope))
    );

    server.registerTool(
        "get_docs_page",
        {
            annotations: READ_ONLY,
            description:
                "Reads a Mona UI docs page as markdown, with each example's code. A long page comes back as its intro and an outline; then ask for a section.",
            inputSchema: z.object({
                full: z.boolean().optional().describe("Return a long page in full instead of its outline."),
                page: z
                    .string()
                    .min(1)
                    .describe('The page, by name or title, such as "grid", "sidebar-state" or "Date Picker".'),
                section: z
                    .string()
                    .optional()
                    .describe(
                        'A heading of the page, such as "Editing" or "Examples > Looks". Returns it with its sub-sections.'
                    )
            }),
            title: "Read a Mona UI docs page"
        },
        ({ full, page, section }) => answer(context => getDocsPage(context, page, section, full))
    );

    server.registerTool(
        "get_api",
        {
            annotations: READ_ONLY,
            description:
                "Returns the API reference of a Mona UI symbol: import path, selector, inputs with types and defaults, outputs, methods. Takes a class name, a selector, a pipe name or an entry point.",
            inputSchema: z.object({
                name: z
                    .string()
                    .min(1)
                    .describe(
                        'Such as "GridComponent", "mona-grid", "monaButton", "monaSlice" or the entry point "grid".'
                    )
            }),
            title: "Get a Mona UI API reference"
        },
        ({ name }) => answer(context => getApi(context, name))
    );

    server.registerTool(
        "check_template",
        {
            annotations: READ_ONLY,
            description:
                "Checks an Angular template's use of Mona UI: unknown elements and directives, made-up inputs and outputs, missing required inputs, two-way bindings on one-way inputs. Also lists the imports the template needs.",
            inputSchema: z.object({
                template: z.string().min(1).describe("The component's template: the HTML file, or its inline template.")
            }),
            title: "Check a template's Mona UI usage"
        },
        ({ template }) => answer(context => checkTemplate(context, template))
    );

    return server;
}
