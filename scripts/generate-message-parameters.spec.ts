import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
    generateMessageParametersModuleContent,
    MESSAGE_PARAMETERS_FILE,
    readMessageParameterTable
} from "./generate-message-parameters";

function withModel(namespaceInterface: string, check: (modelFile: string) => void): void {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mona-message-parameters-"));
    try {
        fs.mkdirSync(path.join(dir, "models"));
        fs.mkdirSync(path.join(dir, "message-types"));
        fs.writeFileSync(path.join(dir, "message-types", "sample.messages.ts"), namespaceInterface);
        const modelFile = path.join(dir, "models", "mona-locale-messages.ts");
        fs.writeFileSync(
            modelFile,
            `import type { SampleMessages } from "../message-types/sample.messages";\n` +
                `export interface MonaLocaleMessages {\n    sample: SampleMessages;\n}\n`
        );
        check(modelFile);
    } finally {
        fs.rmSync(dir, { force: true, recursive: true });
    }
}

describe("generate-message-parameters", () => {
    it("generates content identical to the checked-in message-parameters.ts", async () => {
        const existing = fs.readFileSync(MESSAGE_PARAMETERS_FILE, "utf8").replace(/\r\n/g, "\n");

        expect(await generateMessageParametersModuleContent()).toBe(existing);
    });

    it("lists methods and function properties with their ordered, optional parameters", () => {
        withModel(
            `export interface SampleMessages {
                readonly title: string;
                rangeLabel(start: number, end: number): string;
                readonly removeLabel: (label?: string) => string;
            }`,
            modelFile => {
                const sample = readMessageParameterTable(modelFile).get("sample")!;

                expect([...sample.keys()]).toEqual(["rangeLabel", "removeLabel", "title"]);
                expect(sample.get("title")).toBeNull();
                expect(sample.get("rangeLabel")).toEqual([
                    { name: "start", optional: false, type: "number" },
                    { name: "end", optional: false, type: "number" }
                ]);
                expect(sample.get("removeLabel")).toEqual([{ name: "label", optional: true, type: "string" }]);
            }
        );
    });

    it.each([
        ["readonly count: number;", "must be a string or a function"],
        ["label(date: Date): string;", "must be a number or a string"],
        ["label(count: number): number;", "must return a string"]
    ])("rejects %s", (member, message) => {
        withModel(`export interface SampleMessages {\n    ${member}\n}`, modelFile => {
            expect(() => readMessageParameterTable(modelFile)).toThrow(message);
        });
    });

    it("covers every message namespace", () => {
        const table = readMessageParameterTable();

        expect(table.size).toBe(43);
        expect(table.get("pager")!.get("pageStatus")).toEqual([
            { name: "page", optional: false, type: "number" },
            { name: "totalPages", optional: false, type: "number" }
        ]);
    });
});
