import { ComponentFixture, TestBed } from "@angular/core/testing";
import axe from "axe-core";
import { beforeEach, describe, expect, it } from "vitest";
import type { ComponentMetadata } from "../../models/ComponentMetadata";
import type { ProcessedConfigItem } from "../../utils/componentConfig";
import { ApiInputListItemComponent } from "./api-input-list-item.component";

const METADATA: ComponentMetadata = {
    inputs: [
        { description: "What the control holds.", kind: "input", name: "value", type: "string" },
        { alias: "class", description: "Classes for the host.", kind: "input", name: "userClass", type: "string" }
    ],
    name: "TestComponent",
    selector: "app-test"
};

/** One of each control the API list renders, named and aliased as the tester's demos do. */
const ENTRIES: readonly ProcessedConfigItem[] = [
    { configType: "boolean", name: "disabled", value: false, valueType: "boolean" },
    { configType: "number", name: "max", value: 10, valueType: "number" },
    { alias: "class", configType: "string", name: "userClass", value: "", valueType: "string" },
    {
        configType: "dropdown",
        defaultValue: "medium",
        name: "size",
        value: ["small", "medium", "large"],
        valueType: "array"
    },
    {
        configType: "customDropdown",
        defaultValue: { id: 1, text: "One" },
        name: "item",
        textField: "text",
        value: [
            { id: 1, text: "One" },
            { id: 2, text: "Two" }
        ],
        valueField: "id",
        valueType: "array"
    },
    { configType: "color", name: "color", value: "#336699", valueType: "string" }
];

describe("ApiInputListItemComponent", () => {
    let component: ApiInputListItemComponent;
    let fixture: ComponentFixture<ApiInputListItemComponent>;

    /** Renders a row, and waits for `ngModel` to hand the control its value. */
    async function render(entry: ProcessedConfigItem): Promise<HTMLElement> {
        fixture.componentRef.setInput("entry", entry);
        fixture.componentRef.setInput("metadata", METADATA);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
        return fixture.nativeElement as HTMLElement;
    }

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ApiInputListItemComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ApiInputListItemComponent);
        component = fixture.componentInstance;
    });

    it("should create", async () => {
        await render(ENTRIES[0]);
        expect(component).toBeTruthy();
    });

    it("renders a description's code, links, formatting and lists instead of dropping the elements they name", () => {
        fixture.componentRef.setInput("entry", { configType: "string", name: "inputId", valueType: "string" });
        fixture.componentRef.setInput("metadata", {
            inputs: [
                {
                    description:
                        "Id of the inner `<input>` element, see {@link placeholder}.\nOnly every n<sup>th</sup> one.\n\n- `true`: yes\n- `false`: no",
                    kind: "input",
                    name: "inputId",
                    type: "string"
                }
            ],
            name: "TextBoxComponent",
            selector: "mona-text-box"
        });
        fixture.detectChanges();

        const prose = (fixture.nativeElement as HTMLElement).querySelector(".api-prose");
        const codes = Array.from(prose?.querySelectorAll("code") ?? [], code => code.textContent);
        expect(codes).toEqual(["<input>", "placeholder", "true", "false"]);
        expect(prose?.querySelector("input")).toBeNull();
        expect(prose?.querySelector("sup")?.textContent).toBe("th");
        expect(prose?.querySelectorAll("li")).toHaveLength(2);
        expect(prose?.textContent).not.toContain("{@link");
    });

    describe.each(ENTRIES.map(entry => [entry.configType, entry] as const))("a %s input", (_type, entry) => {
        it("names its control after the input, as the row shows it", async () => {
            const host = await render(entry);
            const label = entry.alias ?? entry.name;

            expect(host.querySelector(".font-semibold")?.textContent?.trim()).toBe(label);
            expect(host.querySelector(`[aria-label="${label}"]`)).not.toBeNull();
        });

        it("passes axe", async () => {
            const result = await axe.run(await render(entry), { rules: { "color-contrast": { enabled: false } } });
            expect(result.violations).toEqual([]);
        });
    });

    // The description sits on the demo background, whose color each theme sets. A fixed palette shade such as
    // text-gray-500 is 2.5:1 to 3.3:1 on the dark ones, so the row's text takes its color from theme tokens.
    it("colors its text with theme tokens", async () => {
        const host = await render({ ...ENTRIES[2], note: "Applied after the built-in classes." });
        const classes = Array.from(host.querySelectorAll("[class]")).flatMap(element => Array.from(element.classList));

        expect(classes.filter(name => /^text-(gray|slate|zinc|neutral|stone)-\d+$/.test(name))).toEqual([]);
        expect(host.querySelector(".api-prose")?.parentElement?.classList).toContain("text-muted-foreground");
    });
});
