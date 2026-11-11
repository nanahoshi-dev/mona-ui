import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { GridComponent } from "@nanahoshi/mona-ui/grid";
import { of } from "rxjs";
import { beforeEach, describe, expect, it } from "vitest";
import metadata from "../../../../assets/component-metadata.json";
import { DemoService } from "../../services/demo.service";
import { PartsDemoContainerComponent } from "../parts-demo-container/parts-demo-container.component";
import { GridColumnsDemoComponent } from "./grid-columns-demo.component";

describe("GridColumnsDemoComponent", () => {
    let fixture: ComponentFixture<GridColumnsDemoComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GridColumnsDemoComponent],
            providers: [{ provide: DemoService, useValue: { metadata$: of(metadata) } }]
        }).compileComponents();

        fixture = TestBed.createComponent(GridColumnsDemoComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    });

    const container = (): PartsDemoContainerComponent =>
        fixture.debugElement.query(By.directive(PartsDemoContainerComponent)).componentInstance;

    it("renders a grid with a panel for the grid, its directives and each column", () => {
        expect(fixture.debugElement.query(By.directive(GridComponent))).toBeTruthy();
        const headers = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll("th[role='columnheader']"));
        expect(headers.map(header => header.textContent?.trim())).toEqual(
            expect.arrayContaining(["Order ID", "Customer", "Ship city", "Ship country", "Ordered", "Freight"])
        );
        const parts = container().parts();
        expect(parts.map(part => part.id)).toEqual([
            "grid",
            "resizable",
            "reorderable",
            "orderId",
            "customer",
            "shipCity",
            "shipCountry",
            "orderDate",
            "freight"
        ]);
        for (const part of parts) {
            expect(Object.keys(part.config.inputs).length).toBeGreaterThan(0);
        }
    });

    it("writes the directives on the grid and the columns inside it in its code sample", () => {
        const code: string = (container() as unknown as { generatedCode: () => string }).generatedCode();
        expect(code).toMatch(/^<mona-grid/);
        expect(code).toContain("[monaGridResizable]=");
        expect(code).toContain("[monaGridReorderable]=");
        expect(code).toMatch(/<mona-grid-column\s+field="freight"\s+type="number"/);
        expect(code.trimEnd().endsWith("</mona-grid>")).toBe(true);
    });

    it("keeps rendering through every data set", async () => {
        const options = fixture.debugElement.queryAll(By.css("mona-segmented input"));
        expect(options.length).toBe(2);
        for (const option of options) {
            (option.nativeElement as HTMLInputElement).click();
            fixture.detectChanges();
            await fixture.whenStable();
            fixture.detectChanges();
            expect(fixture.debugElement.query(By.directive(GridComponent))).toBeTruthy();
        }
    });
});
