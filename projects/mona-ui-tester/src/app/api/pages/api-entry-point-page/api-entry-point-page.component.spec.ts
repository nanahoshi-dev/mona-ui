import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { RouterTestingHarness } from "@angular/router/testing";
import axe from "axe-core";
import { type Observable, of, throwError } from "rxjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PageService } from "../../../layout/services/page.service";
import type { ApiEntryPointReference } from "../../api-model";
import { ApiReferenceService } from "../../api-reference.service";
import { ApiEntryPointPageComponent } from "./api-entry-point-page.component";

const REFERENCES: Readonly<Record<string, ApiEntryPointReference>> = {
    chart: {
        links: {},
        name: "chart",
        pages: [{ path: "chart", title: "Chart Overview" }],
        symbols: [
            { description: "Renders a chart. With much more.", kind: "component", name: "ChartComponent" },
            { description: "", kind: "type", name: "ChartCurve" },
            { description: "A point.", kind: "interface", name: "ChartPoint" },
            { description: "An axis.", kind: "interface", name: "ChartAxis" }
        ]
    },
    grid: {
        links: {},
        name: "grid",
        pages: [
            { path: "grid", title: "Grid" },
            { path: "grid-editing", title: "Grid Editing" }
        ],
        symbols: [{ description: "Shows rows.", kind: "component", name: "GridComponent" }]
    }
};

class StubReferenceService {
    public entryPoint(name: string): Observable<ApiEntryPointReference> {
        return Object.hasOwn(REFERENCES, name) ? of(REFERENCES[name]) : throwError(() => new Error("Not found"));
    }
}

describe("ApiEntryPointPageComponent", () => {
    let harness: RouterTestingHarness;

    async function open(url: string): Promise<HTMLElement> {
        await harness.navigateByUrl(url);
        harness.detectChanges();
        return harness.routeNativeElement as HTMLElement;
    }

    function headings(page: HTMLElement): (string | undefined)[] {
        return Array.from(page.querySelectorAll("h2")).map(heading => heading.textContent?.trim());
    }

    function filter(page: HTMLElement, query: string): void {
        const input = page.querySelector<HTMLInputElement>("#entry-point-filter");
        if (!input) {
            throw new Error("The page has no filter.");
        }
        input.value = query;
        input.dispatchEvent(new Event("input"));
        harness.detectChanges();
    }

    function kindFilter(page: HTMLElement, label: string): HTMLButtonElement | undefined {
        return Array.from(page.querySelectorAll<HTMLButtonElement>("[role='group'] button")).find(button =>
            button.textContent?.trim().startsWith(label)
        );
    }

    function status(page: HTMLElement): string | undefined {
        return page.querySelector("header p[aria-live]")?.textContent?.trim();
    }

    beforeEach(async () => {
        TestBed.configureTestingModule({
            providers: [
                PageService,
                provideRouter([{ component: ApiEntryPointPageComponent, path: "api/:entryPoint" }]),
                { provide: ApiReferenceService, useClass: StubReferenceService }
            ]
        });
        harness = await RouterTestingHarness.create();
    });

    afterEach(() => {
        Reflect.deleteProperty(navigator, "clipboard");
    });

    it("names the import path, its export count and its guide", async () => {
        const page = await open("/api/chart");

        expect(page.querySelector("h1")?.textContent?.trim()).toBe("@nanahoshi/mona-ui/chart");
        expect(page.querySelector("header")?.textContent).toContain("4 exports");
        expect(page.querySelector("a[href='/components/chart']")?.textContent?.replace(/\s+/g, " ").trim()).toBe(
            "Guide: Chart Overview"
        );
    });

    it("lists each guide when the entry point has several", async () => {
        const page = await open("/api/grid");

        const guides = page.querySelector("ul[aria-labelledby='entry-point-guides']");
        expect(Array.from(guides?.querySelectorAll("a") ?? []).map(link => link.getAttribute("href"))).toEqual([
            "/components/grid",
            "/components/grid-editing"
        ]);
    });

    it("copies the import path, and says so", async () => {
        const writeText = vi.fn((): Promise<void> => Promise.resolve());
        Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
        const page = await open("/api/chart");

        const copy = Array.from(page.querySelectorAll("button")).find(button => button.textContent?.includes("Copy"));
        copy?.click();

        expect(writeText).toHaveBeenCalledWith("@nanahoshi/mona-ui/chart");
        // The status clears after two seconds, so it's read before then rather than when the page is stable.
        await vi.waitFor(() => {
            harness.detectChanges();
            expect(copy?.nextElementSibling?.textContent?.trim()).toBe("Copied @nanahoshi/mona-ui/chart");
        });
    });

    it("groups the exports by kind, in order, each as a card linking its page with its first sentence", async () => {
        const page = await open("/api/chart");

        expect(headings(page)).toEqual(["Components", "Interfaces", "Type aliases"]);
        const interfaces = Array.from(page.querySelectorAll("section[aria-labelledby='interfaces'] li a")).map(link =>
            link.textContent?.trim()
        );
        expect(interfaces).toEqual(["ChartAxis", "ChartPoint"]);
        expect(page.querySelector("a[href='/api/chart/ChartComponent']")?.closest("li")?.textContent).toContain(
            "Renders a chart."
        );
        expect(page.textContent).not.toContain("With much more.");
    });

    it("narrows to one kind, marks its filter on, and keeps the outline to what's shown", async () => {
        const page = await open("/api/chart");

        kindFilter(page, "Interfaces")?.click();
        harness.detectChanges();

        expect(headings(page)).toEqual(["Interfaces"]);
        expect(kindFilter(page, "Interfaces")?.getAttribute("aria-pressed")).toBe("true");
        expect(kindFilter(page, "All")?.getAttribute("aria-pressed")).toBe("false");
        expect(status(page)).toBe("2 of 4 exports shown.");
        expect(Array.from(TestBed.inject(PageService).sections()).map(section => section.id())).toEqual([
            "entry-point",
            "interfaces"
        ]);
    });

    it("filters by name or description", async () => {
        const page = await open("/api/chart");

        filter(page, "POINT");
        expect(Array.from(page.querySelectorAll("li a")).map(link => link.textContent?.trim())).toEqual(["ChartPoint"]);

        filter(page, "renders");
        expect(Array.from(page.querySelectorAll("li a")).map(link => link.textContent?.trim())).toEqual([
            "ChartComponent"
        ]);
        expect(status(page)).toBe("1 of 4 exports shown.");
    });

    it("says when nothing matches, and resets the filters back at the text box", async () => {
        const page = await open("/api/chart");
        kindFilter(page, "Components")?.click();
        filter(page, "nothing");

        expect(headings(page)).toEqual([]);
        expect(page.textContent).toContain("No exports match “nothing”.");

        Array.from(page.querySelectorAll("button"))
            .find(button => button.textContent?.trim() === "Reset filters")
            ?.click();
        harness.detectChanges();

        expect(headings(page)).toEqual(["Components", "Interfaces", "Type aliases"]);
        expect(page.querySelector<HTMLInputElement>("#entry-point-filter")?.value).toBe("");
        expect(document.activeElement?.id).toBe("entry-point-filter");
        expect(status(page)).toBe("");
    });

    it("hides the kind filters when there is only one kind", async () => {
        const page = await open("/api/grid");

        expect(page.querySelector("[role='group']")).toBeNull();
        expect(page.querySelector("#entry-point-filter")).not.toBeNull();
    });

    it("opens another entry point with nothing filtered", async () => {
        const chart = await open("/api/chart");
        kindFilter(chart, "Interfaces")?.click();
        filter(chart, "axis");

        const grid = await open("/api/grid");

        expect(headings(grid)).toEqual(["Components"]);
        expect(grid.querySelector<HTMLInputElement>("#entry-point-filter")?.value).toBe("");
    });

    it("says so when there is no such entry point", async () => {
        const page = await open("/api/nothing");

        expect(page.querySelector("h1")?.textContent?.trim()).toBe("Entry point not found");
    });

    it("passes axe", async () => {
        const page = await open("/api/chart");

        const results = await axe.run(page, { rules: { "color-contrast": { enabled: false } } });

        expect(results.violations).toEqual([]);
    });
});
