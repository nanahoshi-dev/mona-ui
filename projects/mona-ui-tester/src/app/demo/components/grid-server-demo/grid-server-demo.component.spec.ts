import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { GridComponent, GridServerBindingDirective, GridVirtualScrollDirective } from "@nanahoshi/mona-ui/grid";
import { of } from "rxjs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import metadata from "../../../../assets/component-metadata.json";
import { DemoService } from "../../services/demo.service";
import { PartsDemoContainerComponent } from "../parts-demo-container/parts-demo-container.component";
import { GridServerDemoComponent } from "./grid-server-demo.component";

describe("GridServerDemoComponent", () => {
    let fixture: ComponentFixture<GridServerDemoComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GridServerDemoComponent],
            providers: [{ provide: DemoService, useValue: { metadata$: of(metadata) } }]
        }).compileComponents();

        fixture = TestBed.createComponent(GridServerDemoComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    });

    afterEach(() => {
        fixture.destroy();
    });

    const container = (): PartsDemoContainerComponent =>
        fixture.debugElement.query(By.directive(PartsDemoContainerComponent)).componentInstance;
    const code = (): string => container()["generatedCode"]();
    const settle = async (): Promise<void> => {
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    };
    const modeOptions = () => fixture.debugElement.queryAll(By.css("mona-segmented"))[0].queryAll(By.css("input"));

    it("renders a server-bound grid with a panel for the grid, the directive and each column", () => {
        expect(fixture.debugElement.query(By.directive(GridServerBindingDirective))).toBeTruthy();
        const headers = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll("th[role='columnheader']"));
        expect(headers.map(header => header.textContent?.trim())).toEqual([
            "Order ID",
            "Customer",
            "Ship country",
            "Freight"
        ]);
        const parts = container().parts();
        expect(parts.map(part => part.id)).toEqual([
            "grid",
            "serverBinding",
            "orderId",
            "customer",
            "shipCountry",
            "freight"
        ]);
        for (const part of parts) {
            if (part.id === "serverBinding") {
                // The mock server binds total, skip and loading, so the panel only has features.
                expect(Object.keys(part.config.featureHandler?.data() ?? {}).length).toBeGreaterThan(0);
            } else {
                expect(Object.keys(part.config.inputs).length).toBeGreaterThan(0);
            }
        }
    });

    it("loads the first page itself and shows it once the mock server answers", async () => {
        const text = (): string => fixture.nativeElement.querySelector("[data-request-count]").textContent;
        expect(text()).toContain("Requests: 1");
        await new Promise<void>(resolve => setTimeout(resolve, 450));
        await settle();
        expect(fixture.nativeElement.querySelectorAll("tbody tr[role='row']").length).toBeGreaterThan(0);
        expect(fixture.nativeElement.textContent).toContain("10248");
    });

    it("writes the server binding on the grid in its code sample", () => {
        const sample = code();
        expect(sample).toMatch(/^<mona-grid/);
        expect(sample).toContain("monaGridServerBinding");
        expect(sample).toContain('[total]="total()"');
        expect(sample).toMatch(/<mona-grid-column\s+field="freight"\s+type="number"/);
        expect(sample.trimEnd().endsWith("</mona-grid>")).toBe(true);
    });

    it("switches to virtual scrolling, with its own panel and binding", async () => {
        (modeOptions()[1].nativeElement as HTMLInputElement).click();
        await settle();
        expect(fixture.debugElement.query(By.directive(GridServerBindingDirective))).toBeNull();
        expect(fixture.debugElement.query(By.directive(GridVirtualScrollDirective))).toBeTruthy();
        expect(
            container()
                .parts()
                .map(part => part.id)
        ).toEqual(["grid", "virtualScroll", "orderId", "customer", "shipCountry", "freight"]);
        for (const part of container().parts()) {
            expect(Object.keys(part.config.inputs).length).toBeGreaterThan(0);
        }
        const sample = code();
        expect(sample).toMatch(/^<mona-grid/);
        expect(sample).toContain('[monaGridVirtualScroll]="');
        expect(sample).not.toContain("monaGridServerBinding");
    });

    it("keeps rendering through every mode and row count", async () => {
        const modes = modeOptions();
        expect(modes.length).toBe(2);
        for (const option of modes) {
            (option.nativeElement as HTMLInputElement).click();
            await settle();
            expect(fixture.debugElement.query(By.directive(GridComponent))).toBeTruthy();
        }
        const rowOptions = fixture.debugElement.queryAll(By.css("mona-segmented"))[1].queryAll(By.css("input"));
        expect(rowOptions.length).toBe(3);
        for (const option of rowOptions) {
            (option.nativeElement as HTMLInputElement).click();
            await settle();
            expect(fixture.debugElement.query(By.directive(GridComponent))).toBeTruthy();
        }
        expect(fixture.nativeElement.querySelector("[data-row-count]").textContent).toMatch(/Loaded rows: 1\d{5}/);
    });
});
