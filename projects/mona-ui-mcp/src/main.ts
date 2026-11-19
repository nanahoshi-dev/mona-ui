#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { createServer, DocsProvider } from "./server.js";

/*
 * Runs the server over stdio. stdout carries the protocol, so everything else goes to stderr.
 */

const USAGE = `Usage: mona-ui-mcp [--project <folder>]... [--docs <folder>]

An MCP server for Mona UI. It answers from the docs of the @nanahoshi/mona-ui the project has installed, looking from
each --project folder, then the client's roots, then the working folder. Without an installed copy that ships docs,
it uses the docs bundled with it.

  --project <folder>  Where the Angular project is. Repeat for several.
  --docs <folder>     Read the docs from a folder laid out like the package (docs/manifest.json and docs/api).
  --help              Show this.
  --version           Show the version.`;
const ROOTS_TIMEOUT = 2000;

const here = dirname(fileURLToPath(import.meta.url));
const packageFile = [join(here, "package.json"), join(here, "../package.json")].find(file => existsSync(file));
const version = packageFile ? (JSON.parse(readFileSync(packageFile, "utf8")) as { version: string }).version : "0.0.0";

const { values } = parseArgs({
    options: {
        docs: { type: "string" },
        help: { type: "boolean" },
        project: { multiple: true, type: "string" },
        version: { type: "boolean" }
    }
});
if (values.help || values.version) {
    process.stderr.write(`${values.help ? USAGE : version}\n`);
    process.exit(0);
}

let roots: string[] = [];
const provider = new DocsProvider({
    bundledRoot: join(here, "data"),
    docsRoot: values.docs,
    searchFrom: () => [...(values.project ?? []), ...roots, process.cwd()]
});
const server = createServer(provider, version);

const listRoots = async (): Promise<void> => {
    if (!server.server.getClientCapabilities()?.roots) {
        return;
    }
    const result = await server.server.listRoots();
    roots = result.roots.filter(root => root.uri.startsWith("file:")).map(root => fileURLToPath(root.uri));
};

// The first tool call waits for the client's roots, which it sends after the handshake, but not for long.
let rootsListed: () => void = () => undefined;
const listed = new Promise<void>(resolve => {
    rootsListed = resolve;
    setTimeout(resolve, ROOTS_TIMEOUT).unref();
});
provider.reset(listed);
server.server.oninitialized = () => {
    listRoots()
        .catch((error: unknown) => process.stderr.write(`Couldn't list the client's roots: ${String(error)}\n`))
        .finally(rootsListed);
    if (server.server.getClientCapabilities()?.roots?.listChanged) {
        server.server.setNotificationHandler("notifications/roots/list_changed", () => {
            provider.reset(listRoots());
        });
    }
};

await server.connect(new StdioServerTransport());
