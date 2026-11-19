import type { JSONRPCMessage } from "@modelcontextprotocol/server";
import { InMemoryTransport, LATEST_PROTOCOL_VERSION } from "@modelcontextprotocol/server";
import { rmSync } from "node:fs";
import { afterAll, describe, expect, it } from "vitest";
import { createServer, DocsProvider, INSTRUCTIONS } from "./server.js";
import { writeFixturePackage } from "./test-fixture.js";

/** Talks to the server the way a client would, over a linked pair of in-memory transports. */
async function connect(
    provider: DocsProvider
): Promise<(method: string, params?: object) => Promise<Record<string, unknown>>> {
    const [client, server] = InMemoryTransport.createLinkedPair();
    const pending = new Map<number, (message: Record<string, unknown>) => void>();
    client.onmessage = (message: JSONRPCMessage) => {
        const response = message as unknown as { id?: number } & Record<string, unknown>;
        if (typeof response.id === "number") {
            pending.get(response.id)?.(response);
        }
    };
    await createServer(provider, "9.9.9").connect(server);
    await client.start();
    let id = 0;
    const request = (method: string, params?: object): Promise<Record<string, unknown>> => {
        const requestId = ++id;
        const answered = new Promise<Record<string, unknown>>(resolve => pending.set(requestId, resolve));
        void client.send({ id: requestId, jsonrpc: "2.0", method, params } as JSONRPCMessage);
        return answered;
    };
    await request("initialize", {
        capabilities: {},
        clientInfo: { name: "spec", version: "1.0.0" },
        protocolVersion: LATEST_PROTOCOL_VERSION
    });
    await client.send({ jsonrpc: "2.0", method: "notifications/initialized" } as JSONRPCMessage);
    return request;
}

describe("server", () => {
    const fixture = writeFixturePackage();
    const bundled = writeFixturePackage("0.1.0");

    afterAll(() => {
        rmSync(fixture, { force: true, recursive: true });
        rmSync(bundled, { force: true, recursive: true });
    });

    it("introduces itself with the instructions, and lists its read-only tools", async () => {
        const [client, server] = InMemoryTransport.createLinkedPair();
        const answers: Record<string, unknown>[] = [];
        client.onmessage = message => answers.push(message as unknown as Record<string, unknown>);
        await createServer(
            new DocsProvider({ bundledRoot: bundled, docsRoot: fixture, searchFrom: () => [] }),
            "9.9.9"
        ).connect(server);
        await client.start();
        await client.send({
            id: 1,
            jsonrpc: "2.0",
            method: "initialize",
            params: {
                capabilities: {},
                clientInfo: { name: "spec", version: "1" },
                protocolVersion: LATEST_PROTOCOL_VERSION
            }
        } as JSONRPCMessage);
        await expect.poll(() => answers.length).toBe(1);

        expect(answers[0]).toMatchObject({
            result: { instructions: INSTRUCTIONS, serverInfo: { name: "mona-ui", version: "9.9.9" } }
        });
    });

    it("answers tool calls from the docs it finds", async () => {
        const request = await connect(
            new DocsProvider({ bundledRoot: bundled, docsRoot: fixture, searchFrom: () => [] })
        );

        const tools = (await request("tools/list")) as { result: { tools: { annotations: object; name: string }[] } };
        expect(tools.result.tools.map(tool => tool.name)).toEqual([
            "list_components",
            "search_docs",
            "get_docs_page",
            "get_api",
            "check_template"
        ]);
        expect(tools.result.tools.every(tool => (tool.annotations as { readOnlyHint?: boolean }).readOnlyHint)).toBe(
            true
        );

        const call = (await request("tools/call", {
            arguments: { template: `<mona-grid [data]="rows" [pageSzie]="5"></mona-grid>` },
            name: "check_template"
        })) as { result: { content: { text: string }[]; isError?: boolean } };
        expect(call.result.isError).toBeFalsy();
        expect(call.result.content[0].text).toContain("Did you mean [pageSize]?");
    });

    it("says once where the docs came from when they may not match the project", async () => {
        const request = await connect(new DocsProvider({ bundledRoot: bundled, searchFrom: () => [] }));
        const text = async (): Promise<string> =>
            (
                (await request("tools/call", { arguments: { name: "grid" }, name: "get_api" })) as {
                    result: { content: { text: string }[] };
                }
            ).result.content[0].text;

        expect(await text()).toMatch(
            /^Note: @nanahoshi\/mona-ui isn't installed where this server looked \(\), so these answers come from the 0\.1\.0 docs/
        );
        expect(await text()).toMatch(/^# @nanahoshi\/mona-ui\/grid/);
    });

    it("reports a failure to find docs as a tool error", async () => {
        const request = await connect(
            new DocsProvider({ bundledRoot: bundled, docsRoot: "missing-folder", searchFrom: () => [] })
        );

        const call = (await request("tools/call", { arguments: { name: "grid" }, name: "get_api" })) as {
            result: { content: { text: string }[]; isError?: boolean };
        };
        expect(call.result.isError).toBe(true);
        expect(call.result.content[0].text).toContain("has no docs/manifest.json");
    });
});
