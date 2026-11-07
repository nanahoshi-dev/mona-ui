/* eslint-disable @typescript-eslint/naming-convention -- The keys are file paths and package names. */
import { describe, expect, it } from "vitest";
import { createExampleProject } from "../src/app/layout/example-project";
import { checkExampleSource, findExampleReferences, renderRegistry } from "./generate-examples";

const source = (body: string): string => `${body}
@Component({ selector: "app-button-looks-example", templateUrl: "./looks-example.component.html" })
export class ButtonLooksExampleComponent {}
`;

describe("generate-examples", () => {
    it("accepts an example that stands alone", () => {
        const imports = `
            import { Component } from "@angular/core";
            import { LucideX } from "@lucide/angular";
            import { ButtonDirective } from "@nanahoshi/mona-ui/button";
            import { map } from "rxjs";
            import { helper } from "./helper";
        `;

        expect(checkExampleSource("button/looks", source(imports))).toEqual([]);
    });

    it("rejects what a generated project wouldn't have", () => {
        const problems = checkExampleSource(
            "button/looks",
            source(`import { x } from "../../../layout/x";\nimport { y } from "lodash";`)
        );

        expect(problems).toHaveLength(2);
    });

    it("wants the selector its id implies", () => {
        expect(checkExampleSource("button/icons", source(""))[0]).toContain("app-button-icons-example");
    });

    it("wants the markup in its own file", () => {
        const inline = "@Component({ selector: \"app-button-looks-example\", template: `<a></a>` })\nexport class A {}";

        expect(checkExampleSource("button/looks", inline)[0]).toContain("template file");
    });

    it("finds the blocks that show an example, and only those", () => {
        const markdown = "Text\n\n```example\nbutton/looks\n```\n\n```html\nnot/this\n```\n\n```example\r\nbutton/icons\r\n```";

        expect(findExampleReferences(markdown)).toEqual(["button/looks", "button/icons"]);
    });

    it("writes a sorted registry with lazy imports", () => {
        const registry = renderRegistry([
            { className: "B", files: ["b-example.component.ts"], id: "z/b", mainFile: "b-example.component.ts" },
            { className: "A", files: ["a-example.component.ts"], id: "a/a", mainFile: "a-example.component.ts" }
        ]);

        expect(registry.indexOf('"a/a"')).toBeLessThan(registry.indexOf('"z/b"'));
        expect(registry).toContain('import("./a/a/a-example.component").then(module => module.A)');
    });

    it("generates a project that boots the example", () => {
        const project = createExampleProject({
            files: {
                "looks-example.component.html": "<a></a>",
                "looks-example.component.ts": source("")
            },
            mainFile: "looks-example.component.ts",
            title: "Looks"
        });

        expect(project["src/app/looks-example.component.html"]).toBe("<a></a>");
        expect(project["src/main.ts"]).toContain('import { ButtonLooksExampleComponent } from "./app/looks-example.component";');
        expect(project["src/index.html"]).toContain("<app-button-looks-example></app-button-looks-example>");
        expect(JSON.parse(project["package.json"]).dependencies["@nanahoshi/mona-ui"]).toBe("latest");
    });
});
