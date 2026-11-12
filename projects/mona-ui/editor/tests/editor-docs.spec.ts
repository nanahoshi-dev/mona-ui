import { reflectComponentType } from "@angular/core";
import { describe, expect, it, vi } from "vitest";
import * as PublicApi from "@nanahoshi/mona-ui/editor";
import type { ApiEntryPointReference } from "../../../mona-ui-tester/src/app/api/api-model";

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

async function readDoc(name: string): Promise<string> {
    const fs = await vi.importActual<FsModule>("node:fs");
    const path = await vi.importActual<PathModule>("node:path");
    const nodeProcess = await vi.importActual<ProcessModule>("node:process");
    const file = path.resolve(nodeProcess.cwd(), `projects/mona-ui-tester/src/assets/docs/editor/${name}`);
    return fs.readFileSync(file, "utf-8").replace(/\r\n/g, "\n");
}

/** What the API reference shows for the editor entry point, which `npm run build:api-data` writes before `test:lib`. */
async function readReference(): Promise<ApiEntryPointReference> {
    const fs = await vi.importActual<FsModule>("node:fs");
    const path = await vi.importActual<PathModule>("node:path");
    const nodeProcess = await vi.importActual<ProcessModule>("node:process");
    const file = path.resolve(nodeProcess.cwd(), "dist/docs-api/editor.json");
    if (!fs.existsSync(file)) {
        throw new Error(`${file} is missing. Run npm run build:api-data, which npm run test:lib runs first.`);
    }
    return JSON.parse(fs.readFileSync(file, "utf-8")) as ApiEntryPointReference;
}

describe("Editor documentation", () => {
    it("lists exactly the inputs and outputs of the editor in its API reference", async () => {
        const editor = (await readReference()).symbols.find(symbol => symbol.name === "EditorComponent");
        const bound = (editor?.inputs ?? []).map(input => input.alias ?? input.name);
        // A two-way input binds its change event too, which the reference lists with the outputs.
        const documented = [
            ...bound,
            ...(editor?.inputs ?? []).filter(input => input.twoWay).map(input => `${input.alias ?? input.name}Change`),
            ...(editor?.outputs ?? []).map(output => output.alias ?? output.name)
        ].sort();
        const mirror = reflectComponentType(PublicApi.EditorComponent);
        const inputs = (mirror?.inputs ?? []).map(input => input.templateName);
        const outputs = (mirror?.outputs ?? []).map(output => output.templateName);

        expect(documented).toEqual([...inputs, ...outputs].sort());
    });

    it("lists every toolbar setting", async () => {
        const doc = await readDoc("guide.md");
        const section = doc.split("## Toolbar Settings\n")[1].split(/^## /m)[0];
        for (const setting of [
            "alignment",
            "blockquote",
            "bold",
            "code",
            "fontColor",
            "fontFamily",
            "fontHighlight",
            "fontList",
            "fontSize",
            "fontSizeList",
            "headings",
            "history",
            "horizontalRule",
            "image",
            "indent",
            "italic",
            "link",
            "list",
            "strikethrough",
            "subscript",
            "superscript",
            "table",
            "taskList",
            "underline"
        ] satisfies (keyof PublicApi.EditorSettings)[]) {
            expect(section, setting).toContain(`\`${setting}\``);
        }
    });
});
