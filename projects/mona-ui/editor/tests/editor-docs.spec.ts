import { reflectComponentType } from "@angular/core";
import { describe, expect, it, vi } from "vitest";
import * as PublicApi from "@nanahoshi/mona-ui/editor";

interface FsModule {
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

describe("Editor documentation", () => {
    it("lists exactly the inputs and outputs of the editor", async () => {
        const doc = await readDoc("api.md");
        const section = doc
            .split("### `EditorComponent`\n")[1]
            .split(/^### /m)[0]
            .split(/^#### (?:Properties|Methods)$/m)[0];
        const documented = [...section.matchAll(/^\|\s*`([\w-]+)`[^|]*\|/gm)].map(match => match[1]).sort();
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
