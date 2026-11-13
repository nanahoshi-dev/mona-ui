import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import axe from "axe-core";
import { type Observable, of } from "rxjs";
import { beforeEach, describe, expect, it } from "vitest";
import { PageService } from "../../../layout/services/page.service";
import type { ApiReferenceIndex, ApiSymbolSummary } from "../../api-model";
import { ApiReferenceService } from "../../api-reference.service";
import { ApiIndexPageComponent, MAX_MATCHES } from "./api-index-page.component";

const many: ApiSymbolSummary[] = Array.from({ length: MAX_MATCHES + 5 }, (_, index) => ({
    kind: "interface",
    name: `GridThing${index}`,
    summary: ""
}));

const INDEX: ApiReferenceIndex = {
    entryPoints: [
        {
            name: "chart",
            pages: [{ path: "chart", title: "Chart Overview" }],
            symbols: [
                { kind: "component", name: "ChartComponent", summary: "Renders a chart." },
                { kind: "interface", name: "ChartExportOptions", summary: "" },
                { kind: "interface", name: "ExportOptions", summary: "" }
            ]
        },
        { name: "grid", pages: [], symbols: many }
    ]
};

describe("ApiIndexPageComponent", () => {
    let fixture: ComponentFixture<ApiIndexPageComponent>;

    function filter(query: string): void {
        const input = fixture.nativeElement.querySelector("input") as HTMLInputElement;
        input.value = query;
        input.dispatchEvent(new Event("input"));
        fixture.detectChanges();
    }

    const resultNames = (): (string | undefined)[] =>
        Array.from(fixture.nativeElement.querySelectorAll("li a")).map(link => (link as Element).textContent?.trim());

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ApiIndexPageComponent],
            providers: [
                PageService,
                provideRouter([]),
                { provide: ApiReferenceService, useValue: { index: (): Observable<ApiReferenceIndex> => of(INDEX) } }
            ]
        }).compileComponents();
        fixture = TestBed.createComponent(ApiIndexPageComponent);
        fixture.detectChanges();
    });

    it("links every entry point, with what it exports by kind", () => {
        const card = fixture.nativeElement.querySelector("a[href='/api/chart']") as HTMLElement;

        expect(card.textContent).toContain("1 component · 2 interfaces");
        expect(card.textContent).toContain("Guide: Chart Overview");
        expect(fixture.nativeElement.textContent).toContain(`${3 + many.length} exports in 2 entry points.`);
    });

    it("finds exports by name, those that start with the query first", () => {
        filter("exportoptions");

        expect(resultNames()).toEqual(["ExportOptions", "ChartExportOptions"]);
        expect(fixture.nativeElement.querySelector("a[href='/api/chart/ExportOptions']")).not.toBeNull();
        expect(fixture.nativeElement.textContent).toContain("2 exports match.");
    });

    it("lists only the first matches of a broad query, and says so", () => {
        filter("gridthing");

        expect(resultNames()).toHaveLength(MAX_MATCHES);
        expect(fixture.nativeElement.textContent).toContain(
            `${many.length} exports match, showing the first ${MAX_MATCHES}.`
        );
    });

    it("passes axe, with the filter labelled", async () => {
        const results = await axe.run(fixture.nativeElement, { rules: { "color-contrast": { enabled: false } } });

        expect(results.violations).toEqual([]);
        expect((fixture.nativeElement.querySelector("input") as HTMLInputElement).labels?.[0]?.textContent).toBe(
            "Find an export"
        );
    });
});
