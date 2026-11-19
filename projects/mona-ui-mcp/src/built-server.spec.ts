import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/*
 * The package `npm run build:mcp` writes, run the way a client runs it: as a process speaking MCP over stdio. From a
 * folder without `@nanahoshi/mona-ui`, it answers from the docs it bundles.
 */

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const main = join(repositoryRoot, "dist/mona-ui-mcp/main.js");
const built = existsSync(main);
if (!built && process.env["CI"]) {
    throw new Error("dist/mona-ui-mcp has no main.js. Run npm run build:mcp first.");
}

describe.skipIf(!built)("the built server", () => {
    it("answers over stdio from its bundled docs", async () => {
        const project = mkdtempSync(join(tmpdir(), "mona-ui-mcp-empty-"));
        const server = spawn(process.execPath, [main], { cwd: project, stdio: ["pipe", "pipe", "inherit"] });
        try {
            const responses = new Map<number, (message: Record<string, unknown>) => void>();
            createInterface({ input: server.stdout }).on("line", line => {
                const message = JSON.parse(line) as { id?: number } & Record<string, unknown>;
                if (typeof message.id === "number") {
                    responses.get(message.id)?.(message);
                }
            });
            const send = (message: object): void => {
                server.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", ...message })}\n`);
            };
            const request = (id: number, method: string, params: object): Promise<Record<string, unknown>> => {
                const answered = new Promise<Record<string, unknown>>(done => responses.set(id, done));
                send({ id, method, params });
                return answered;
            };

            const initialized = (await request(1, "initialize", {
                capabilities: {},
                clientInfo: { name: "spec", version: "1.0.0" },
                protocolVersion: "2025-11-25"
            })) as { result: { serverInfo: { name: string; version: string } } };
            send({ method: "notifications/initialized" });
            const call = (await request(2, "tools/call", {
                arguments: { template: `<button monaButton look="primary">Save</button>` },
                name: "check_template"
            })) as { result: { content: { text: string }[] } };

            expect(initialized.result.serverInfo.name).toBe("mona-ui");
            expect(call.result.content[0].text).toMatch(
                /^Note: @nanahoshi\/mona-ui isn't installed where this server looked/
            );
            expect(call.result.content[0].text).toContain(
                'import { ButtonDirective } from "@nanahoshi/mona-ui/button";'
            );
        } finally {
            // Windows keeps the folder until the process that runs in it has exited.
            if (server.exitCode === null) {
                await new Promise(exited => {
                    server.once("exit", exited);
                    server.kill();
                });
            }
            rmSync(project, { force: true, recursive: true });
        }
    }, 30_000);
});
