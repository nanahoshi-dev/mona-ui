import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { RouterTestingHarness } from "@angular/router/testing";
import axe from "axe-core";
import { type Observable, of, throwError } from "rxjs";
import { beforeEach, describe, expect, it } from "vitest";
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
        }
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

    it("shows the symbol's kind, import, base type and guide, linking each", async () => {
        const page = await open("/api/chart/PngOptions");

        expect(page.querySelector("h1")?.textContent?.trim()).toBe("PngOptions");
        expect(page.textContent).toContain("Interface");
        expect(page.textContent).toContain('import type { PngOptions } from "@nanahoshi/mona-ui/chart";');
        expect(page.querySelector("dd a[href='/api/chart/BaseOptions']")).not.toBeNull();
        expect(page.querySelector("dd a[href='/components/chart']")?.textContent?.trim()).toBe("Chart Overview");
    });

    it("keeps a tag in a description as text", async () => {
        const page = await open("/api/chart/PngOptions");

        expect(page.querySelector("title")).toBeNull();
        expect(page.textContent).toContain("with <title> left as text.");
    });

    it("lists its members, its inherited members and what uses it, each under an anchor", async () => {
        const page = await open("/api/chart/PngOptions");

        expect(Array.from(page.querySelectorAll("h2")).map(heading => heading.textContent?.trim())).toEqual([
            "Properties",
            "Inherited from BaseOptions",
            "Used by"
        ]);
        expect(page.querySelector("#ratio")?.textContent).toContain("read-only");
        expect(page.querySelector("#ratio a[href='/api/chart/BaseOptions']")).not.toBeNull();
        expect(page.querySelector("#width")).not.toBeNull();
        expect(page.querySelector("a[href='/api/chart/ChartComponent']")?.textContent?.trim()).toBe("ChartComponent");
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
        const page = await open("/api/chart/PngOptions");

        const results = await axe.run(page, { rules: { "color-contrast": { enabled: false } } });

        expect(results.violations).toEqual([]);
    });
});
