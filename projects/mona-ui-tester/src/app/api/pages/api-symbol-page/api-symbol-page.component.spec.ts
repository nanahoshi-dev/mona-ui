import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { RouterTestingHarness } from "@angular/router/testing";
import axe from "axe-core";
import { type Observable, of, throwError } from "rxjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PageService } from "../../../layout/services/page.service";
import type { ApiEntryPointReference } from "../../api-model";
import { ApiReferenceService } from "../../api-reference.service";
import { ApiSymbolPageComponent } from "./api-symbol-page.component";

const REFERENCE: ApiEntryPointReference = {
    links: { BaseOptions: "chart", ChartComponent: "chart", PngOptions: "chart" },
    name: "chart",
    pages: [{ path: "chart", title: "Chart Overview" }],
    symbols: [
        {
            description: "Options for a PNG, with <title> left as text.",
            extends: ["BaseOptions"],
            inherited: [
                { from: "BaseOptions", properties: [{ description: "The width.", name: "width", type: "number" }] }
            ],
            kind: "interface",
            name: "PngOptions",
            page: { path: "chart", title: "Chart Overview" },
            properties: [
                { description: "See `BaseOptions`.", name: "ratio", optional: true, readonly: true, type: "number" }
            ],
            usedBy: ["ChartComponent"]
        },
        {
            description: "Draws a chart.",
            exportAs: "monaChart",
            inputs: [
                { defaultValue: "10", description: "How far a key moves it.", name: "keyboardStep", type: "number" },
                { description: "How it exports.", name: "options", required: true, type: "PngOptions" }
            ],
            kind: "component",
            methods: [{ description: "Exports it.", name: "export", signature: "export(): Promise<Blob>" }],
            name: "ChartComponent",
            outputs: [{ description: "Emitted on a click.", name: "pointClick", type: "ChartPoint" }],
            selector: "mona-chart, div[monaChart]"
        },
        { description: "A curve.", kind: "type", name: "ChartCurve", signature: 'type ChartCurve = "linear" | "step";' }
    ]
};

class StubReferenceService {
    public entryPoint(name: string): Observable<ApiEntryPointReference> {
        return name === "chart" ? of(REFERENCE) : throwError(() => new Error("Not found"));
    }
}

describe("ApiSymbolPageComponent", () => {
    let harness: RouterTestingHarness;

    async function open(url: string): Promise<HTMLElement> {
        await harness.navigateByUrl(url);
        harness.detectChanges();
        return harness.routeNativeElement as HTMLElement;
    }

    function headings(page: HTMLElement): (string | undefined)[] {
        return Array.from(page.querySelectorAll("h2")).map(heading => heading.textContent?.replace(/\s+/g, " ").trim());
    }

    function members(page: HTMLElement): (string | undefined)[] {
        return Array.from(page.querySelectorAll("h3")).map(heading => heading.textContent?.trim());
    }

    function filter(page: HTMLElement, query: string): void {
        const input = page.querySelector<HTMLInputElement>("#symbol-filter");
        if (!input) {
            throw new Error("The page has no filter.");
        }
        input.value = query;
        input.dispatchEvent(new Event("input"));
        harness.detectChanges();
    }

    function sectionFilter(page: HTMLElement, label: string): HTMLButtonElement | undefined {
        return Array.from(page.querySelectorAll<HTMLButtonElement>("[role='group'] button")).find(button =>
            button.textContent?.trim().startsWith(label)
        );
    }

    function status(page: HTMLElement): string | undefined {
        return page.querySelector("header p[aria-live]")?.textContent?.trim();
    }

    function text(element: Element | null | undefined): string | undefined {
        return element?.textContent?.replace(/\s+/g, " ").trim();
    }

    beforeEach(async () => {
        TestBed.configureTestingModule({
            providers: [
                PageService,
                provideRouter([{ component: ApiSymbolPageComponent, path: "api/:entryPoint/:symbol" }]),
                { provide: ApiReferenceService, useClass: StubReferenceService }
            ]
        });
        harness = await RouterTestingHarness.create();
    });

    afterEach(() => {
        Reflect.deleteProperty(navigator, "clipboard");
    });

    it("shows the symbol's kind, import, base type and guide, linking each", async () => {
        const page = await open("/api/chart/PngOptions");

        expect(page.querySelector("h1")?.textContent?.trim()).toBe("PngOptions");
        expect(page.querySelector("header")?.textContent).toContain("Interface");
        expect(page.querySelector("a[href='/api/chart']")?.textContent?.trim()).toBe("@nanahoshi/mona-ui/chart");
        expect(page.textContent).toContain('import type { PngOptions } from "@nanahoshi/mona-ui/chart";');
        expect(page.querySelector(".api-code-keyword")?.textContent).toBe("import type");
        expect(page.querySelector("dd a[href='/api/chart/BaseOptions']")).not.toBeNull();
        expect(text(page.querySelector("a[href='/components/chart']"))).toBe("Guide: Chart Overview");
    });

    it("keeps a tag in a description as text", async () => {
        const page = await open("/api/chart/PngOptions");

        expect(page.querySelector("title")).toBeNull();
        expect(page.textContent).toContain("with <title> left as text.");
    });

    it("copies each selector and the name it's exported as, naming the kind of each only once", async () => {
        const writeText = vi.fn((): Promise<void> => Promise.resolve());
        Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
        const page = await open("/api/chart/ChartComponent");

        const uses = Array.from(page.querySelectorAll<HTMLButtonElement>("button[title^='Copy the']"));
        expect(uses.map(text)).toEqual([
            "Copy Selector mona-chart",
            "Copy Selector div[monaChart]",
            "Copy Exported as monaChart"
        ]);
        expect(uses.map(use => use.children[1].classList.contains("sr-only"))).toEqual([false, true, false]);

        uses[1].click();

        expect(writeText).toHaveBeenCalledWith("div[monaChart]");
        // The status clears after two seconds, so it's read before then rather than when the page is stable.
        await vi.waitFor(() => {
            harness.detectChanges();
            expect(text(page.querySelector("header > span[aria-live]"))).toBe("Copied div[monaChart]");
        });

        page.querySelector<HTMLButtonElement>("button[aria-label='Copy import']")?.click();

        expect(writeText).toHaveBeenLastCalledWith('import { ChartComponent } from "@nanahoshi/mona-ui/chart";');
        await vi.waitFor(() => {
            harness.detectChanges();
            expect(text(page.querySelector("header > span[aria-live]"))).toBe("Import copied");
        });
    });

    it("lists its members, its inherited members and what uses it, each under an anchor", async () => {
        const page = await open("/api/chart/PngOptions");

        expect(headings(page)).toEqual(["Properties", "Inherited from BaseOptions", "Used by"]);
        expect(page.querySelector("#ratio")?.textContent).toContain("read-only");
        expect(page.querySelector("#ratio a[href='/api/chart/BaseOptions']")).not.toBeNull();
        expect(page.querySelector("#width")).not.toBeNull();
        expect(page.querySelector("a[href='/api/chart/ChartComponent']")?.textContent?.trim()).toBe("ChartComponent");
    });

    it("shows a member's type, flags and default beside its name, and a method's signature", async () => {
        const page = await open("/api/chart/ChartComponent");

        const keyboardStep = page.querySelector("#keyboardstep");
        expect(text(keyboardStep?.querySelector("h3 + span + app-api-type"))).toBe("number");
        expect(text(keyboardStep?.querySelector(".uppercase")?.parentElement)).toBe("Default 10");
        expect(text(page.querySelector("#options"))).toContain("required");
        expect(page.querySelector("#options app-api-type a[href='/api/chart/PngOptions']")).not.toBeNull();
        expect(text(page.querySelector("#export app-api-type"))).toBe("export(): Promise<Blob>");
    });

    it("puts its sections in the table of contents", async () => {
        await open("/api/chart/PngOptions");

        const sections = Array.from(TestBed.inject(PageService).sections()).map(section => [
            section.id(),
            section.depth()
        ]);
        expect(sections).toEqual([
            ["pngoptions", 0],
            ["properties", 1],
            ["inherited-from-baseoptions", 1],
            ["used-by", 1]
        ]);
    });

    it("narrows to one section, marks its filter on, and keeps the outline to what's shown", async () => {
        const page = await open("/api/chart/ChartComponent");
        expect(headings(page)).toEqual(["Inputs", "Outputs", "Methods"]);

        sectionFilter(page, "Outputs")?.click();
        harness.detectChanges();

        expect(headings(page)).toEqual(["Outputs"]);
        expect(sectionFilter(page, "Outputs")?.getAttribute("aria-pressed")).toBe("true");
        expect(sectionFilter(page, "All")?.getAttribute("aria-pressed")).toBe("false");
        expect(status(page)).toBe("1 of 4 members shown.");
        expect(Array.from(TestBed.inject(PageService).sections()).map(section => section.id())).toEqual([
            "chartcomponent",
            "outputs"
        ]);
    });

    it("filters members by name, type, signature or description", async () => {
        const page = await open("/api/chart/ChartComponent");

        filter(page, "STEP");
        expect(members(page)).toEqual(["keyboardStep"]);

        filter(page, "pngoptions");
        expect(members(page)).toEqual(["options"]);

        filter(page, "promise");
        expect(members(page)).toEqual(["export"]);

        filter(page, "click");
        expect(members(page)).toEqual(["pointClick"]);
        expect(status(page)).toBe("1 of 4 members shown.");
    });

    it("says when no member matches, and resets the filters back at the text box", async () => {
        const page = await open("/api/chart/ChartComponent");
        sectionFilter(page, "Inputs")?.click();
        filter(page, "nothing");

        expect(headings(page)).toEqual([]);
        expect(page.textContent).toContain("No members match “nothing”.");

        Array.from(page.querySelectorAll("button"))
            .find(button => button.textContent?.trim() === "Reset filters")
            ?.click();
        harness.detectChanges();

        expect(headings(page)).toEqual(["Inputs", "Outputs", "Methods"]);
        expect(page.querySelector<HTMLInputElement>("#symbol-filter")?.value).toBe("");
        expect(document.activeElement?.id).toBe("symbol-filter");
        expect(status(page)).toBe("");
    });

    it("shows a type's signature, with no filter when there are no members", async () => {
        const page = await open("/api/chart/ChartCurve");

        expect(headings(page)).toEqual(["Signature"]);
        expect(page.querySelector("section[aria-labelledby='signature'] pre")?.textContent).toBe(
            'type ChartCurve = "linear" | "step";'
        );
        expect(page.querySelector("#symbol-filter")).toBeNull();
        expect(page.textContent).not.toContain("No members match");
    });

    it("opens another symbol with nothing filtered", async () => {
        const chart = await open("/api/chart/ChartComponent");
        sectionFilter(chart, "Methods")?.click();
        filter(chart, "export");

        const options = await open("/api/chart/PngOptions");

        expect(headings(options)).toEqual(["Properties", "Inherited from BaseOptions", "Used by"]);
        expect(options.querySelector<HTMLInputElement>("#symbol-filter")?.value).toBe("");
    });

    it("says so when the entry point documents no such name", async () => {
        const page = await open("/api/chart/Missing");

        expect(page.querySelector("h1")?.textContent?.trim()).toBe("Export not found");
        expect(page.textContent?.replace(/\s+/g, " ")).toContain(
            "@nanahoshi/mona-ui/chart has no documented export named Missing."
        );
    });

    it("says so when there is no such entry point", async () => {
        const page = await open("/api/nothing/Missing");

        expect(page.querySelector("h1")?.textContent?.trim()).toBe("Export not found");
    });

    it("passes axe", async () => {
        for (const url of ["/api/chart/PngOptions", "/api/chart/ChartComponent", "/api/chart/ChartCurve"]) {
            const page = await open(url);

            const results = await axe.run(page, { rules: { "color-contrast": { enabled: false } } });

            expect(results.violations).toEqual([]);
        }
    });
});
