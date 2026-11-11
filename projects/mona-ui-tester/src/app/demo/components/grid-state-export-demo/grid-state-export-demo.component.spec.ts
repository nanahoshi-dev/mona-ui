import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { GridComponent, GridStatePersistenceDirective } from "@nanahoshi/mona-ui/grid";
import { of } from "rxjs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import metadata from "../../../../assets/component-metadata.json";
import { DemoService } from "../../services/demo.service";
import { PartsDemoContainerComponent } from "../parts-demo-container/parts-demo-container.component";
import { GRID_STATE_STORAGE_KEY, GridStateExportDemoComponent } from "./grid-state-export-demo.component";

describe("GridStateExportDemoComponent", () => {
    const window = document.defaultView as Window;
    const original = Object.getOwnPropertyDescriptor(window, "localStorage");
    let fixture: ComponentFixture<GridStateExportDemoComponent>;
    let stored: Map<string, string>;

    beforeEach(async () => {
        stored = new Map();
        Object.defineProperty(window, "localStorage", {
            configurable: true,
            value: {
                getItem: (key: string) => stored.get(key) ?? null,
                setItem: (key: string, value: string) => stored.set(key, value)
            }
        });
        await TestBed.configureTestingModule({
            imports: [GridStateExportDemoComponent],
            providers: [{ provide: DemoService, useValue: { metadata$: of(metadata) } }]
        }).compileComponents();

        fixture = TestBed.createComponent(GridStateExportDemoComponent);
        await settle();
    });

    afterEach(() => {
        fixture.destroy();
        if (original) {
            Object.defineProperty(window, "localStorage", original);
        } else {
            Reflect.deleteProperty(window, "localStorage");
        }
    });

    async function settle(): Promise<void> {
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    const container = (): PartsDemoContainerComponent =>
        fixture.debugElement.query(By.directive(PartsDemoContainerComponent)).componentInstance;
    const button = (text: string): HTMLButtonElement =>
        Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll("button")).find(
            element => element.textContent?.trim() === text
        )!;
    const status = (): string => fixture.nativeElement.querySelector("[data-state-status]").textContent.trim();

    it("renders a grid with a panel for the grid, both directives and each column", () => {
        expect(fixture.debugElement.query(By.directive(GridStatePersistenceDirective))).toBeTruthy();
        const headers = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll("th[role='columnheader']"));
        expect(headers.map(header => header.textContent?.trim())).toEqual([
            "Order ID",
            "Customer",
            "Product",
            "City",
            "Quantity"
        ]);
        const parts = container().parts();
        expect(parts.map(part => part.id)).toEqual([
            "grid",
            "statePersistence",
            "export",
            "orderId",
            "customer",
            "product",
            "city",
            "quantity"
        ]);
        for (const part of parts) {
            if (part.id === "statePersistence" || part.id === "export") {
                // The state is bound by the page and the export has no inputs, so these panels only have features.
                expect(Object.keys(part.config.featureHandler?.data() ?? {}).length).toBeGreaterThan(0);
            } else {
                expect(Object.keys(part.config.inputs).length).toBeGreaterThan(0);
            }
        }
    });

    it("writes the persistence and export directives on the grid in its code sample", () => {
        const code: string = container()["generatedCode"]();
        expect(code).toMatch(/^<mona-grid/);
        expect(code).toContain("[monaGridStatePersistence]=");
        expect(code).toContain('[(state)]="state"');
        expect(code).toContain("monaGridExport");
        expect(code).toContain('#gridExport="monaGridExport"');
        expect(code).toMatch(/<mona-grid-column\s+field="quantity"\s+type="number"/);
        expect(code.trimEnd().endsWith("</mona-grid>")).toBe(true);
    });

    it("saves the state to the browser and restores it", async () => {
        button("Restore saved state").click();
        await settle();
        expect(status()).toContain("Nothing is saved");

        button("Save to this browser").click();
        await settle();
        const saved = JSON.parse(stored.get(GRID_STATE_STORAGE_KEY) ?? "null");
        expect(saved?.version).toBe(1);
        expect(saved?.columns.length).toBe(5);

        button("Restore saved state").click();
        await settle();
        expect(status()).toContain("Restored");
    });

    it("keeps rendering after a reset", async () => {
        button("Reset").click();
        await settle();
        expect(fixture.debugElement.query(By.directive(GridComponent))).toBeTruthy();
        expect(status()).toContain("defaults");
    });
});
