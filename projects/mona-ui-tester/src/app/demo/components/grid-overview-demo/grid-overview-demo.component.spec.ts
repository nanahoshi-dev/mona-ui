import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { GridComponent } from "@nanahoshi/mona-ui/grid";
import { of } from "rxjs";
import { beforeEach, describe, expect, it } from "vitest";
import metadata from "../../../../assets/component-metadata.json";
import { DemoService } from "../../services/demo.service";
import { PartsDemoContainerComponent } from "../parts-demo-container/parts-demo-container.component";
import { GridOverviewDemoComponent } from "./grid-overview-demo.component";

describe("GridOverviewDemoComponent", () => {
    let fixture: ComponentFixture<GridOverviewDemoComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GridOverviewDemoComponent],
            providers: [{ provide: DemoService, useValue: { metadata$: of(metadata) } }]
        }).compileComponents();

        fixture = TestBed.createComponent(GridOverviewDemoComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    });

    const container = (): PartsDemoContainerComponent =>
        fixture.debugElement.query(By.directive(PartsDemoContainerComponent)).componentInstance;

    it("renders a grid with a panel for the grid and each column", () => {
        expect(fixture.debugElement.query(By.directive(GridComponent))).toBeTruthy();
        const headers = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll("th[role='columnheader']"));
        expect(headers.map(header => header.textContent?.trim())).toEqual([
            "Order ID",
            "Customer",
            "Freight",
            "Ordered",
            "Shipped"
        ]);
        const parts = container().parts();
        expect(parts.map(part => part.id)).toEqual(["grid", "orderId", "customer", "freight", "orderDate", "shipped"]);
        for (const part of parts) {
            expect(Object.keys(part.config.inputs).length).toBeGreaterThan(0);
        }
    });

    it("writes the columns inside the grid in its code sample", () => {
        const container = fixture.debugElement.query(By.directive(PartsDemoContainerComponent));
        const code: string = container.componentInstance["generatedCode"]();
        expect(code).toMatch(/^<mona-grid/);
        expect(code).toMatch(/<mona-grid-column\s+field="freight"\s+type="number"/);
        expect(code.trimEnd().endsWith("</mona-grid>")).toBe(true);
    });

    it("keeps rendering through every data set", async () => {
        const options = fixture.debugElement.queryAll(By.css("mona-segmented input"));
        expect(options.length).toBe(3);
        for (const option of options) {
            (option.nativeElement as HTMLInputElement).click();
            fixture.detectChanges();
            await fixture.whenStable();
            fixture.detectChanges();
            expect(fixture.debugElement.query(By.directive(GridComponent))).toBeTruthy();
        }
    });
});
