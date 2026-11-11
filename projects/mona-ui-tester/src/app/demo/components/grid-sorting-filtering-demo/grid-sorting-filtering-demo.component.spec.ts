import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { GridComponent } from "@nanahoshi/mona-ui/grid";
import { of } from "rxjs";
import { beforeEach, describe, expect, it } from "vitest";
import metadata from "../../../../assets/component-metadata.json";
import { DemoService } from "../../services/demo.service";
import { PartsDemoContainerComponent } from "../parts-demo-container/parts-demo-container.component";
import { GridSortingFilteringDemoComponent } from "./grid-sorting-filtering-demo.component";

describe("GridSortingFilteringDemoComponent", () => {
    let fixture: ComponentFixture<GridSortingFilteringDemoComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GridSortingFilteringDemoComponent],
            providers: [{ provide: DemoService, useValue: { metadata$: of(metadata) } }]
        }).compileComponents();

        fixture = TestBed.createComponent(GridSortingFilteringDemoComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    });

    const container = (): PartsDemoContainerComponent =>
        fixture.debugElement.query(By.directive(PartsDemoContainerComponent)).componentInstance;

    it("renders a grid with a panel for the grid, its directives and each column", () => {
        expect(fixture.debugElement.query(By.directive(GridComponent))).toBeTruthy();
        const headers = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll("th[role='columnheader']"));
        expect(headers.map(header => header.textContent?.trim())).toEqual([
            "Order ID",
            "Customer",
            "Country",
            "Freight",
            "Ordered"
        ]);
        const parts = container().parts();
        expect(parts.map(part => part.id)).toEqual([
            "grid",
            "sorting",
            "filtering",
            "orderId",
            "customer",
            "country",
            "freight",
            "orderDate"
        ]);
        for (const part of parts) {
            if (part.placement === "host") {
                expect(Object.keys(part.config.featureHandler?.data() ?? {}).length).toBeGreaterThan(0);
            } else {
                expect(Object.keys(part.config.inputs).length).toBeGreaterThan(0);
            }
        }
    });

    it("writes the directives on the grid and the columns inside it in its code sample", () => {
        const code: string = container()["generatedCode"]();
        expect(code).toMatch(/^<mona-grid/);
        expect(code).toContain("[monaGridSortable]=");
        expect(code).toContain("[monaGridFilterable]=");
        expect(code).toContain('[(sort)]="sort"');
        expect(code).toContain('[(filter)]="filter"');
        expect(code).toMatch(/<mona-grid-column\s+field="freight"\s+type="number"/);
        expect(code).not.toContain("[sortable]");
        expect(code).not.toContain("[filterable]");
        expect(code.trimEnd().endsWith("</mona-grid>")).toBe(true);
    });

    it("keeps rendering through every preset", async () => {
        const options = fixture.debugElement.queryAll(By.css("mona-segmented input"));
        expect(options.length).toBe(4);
        for (const option of options) {
            (option.nativeElement as HTMLInputElement).click();
            fixture.detectChanges();
            await fixture.whenStable();
            fixture.detectChanges();
            expect(fixture.debugElement.query(By.directive(GridComponent))).toBeTruthy();
        }
    });
});
