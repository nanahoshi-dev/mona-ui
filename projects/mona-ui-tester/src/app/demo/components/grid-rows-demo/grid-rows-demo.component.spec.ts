import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { GridComponent } from "@nanahoshi/mona-ui/grid";
import { of } from "rxjs";
import { beforeEach, describe, expect, it } from "vitest";
import metadata from "../../../../assets/component-metadata.json";
import { DemoService } from "../../services/demo.service";
import { PartsDemoContainerComponent } from "../parts-demo-container/parts-demo-container.component";
import { GridRowsDemoComponent } from "./grid-rows-demo.component";

describe("GridRowsDemoComponent", () => {
    let fixture: ComponentFixture<GridRowsDemoComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GridRowsDemoComponent],
            providers: [{ provide: DemoService, useValue: { metadata$: of(metadata) } }]
        }).compileComponents();

        fixture = TestBed.createComponent(GridRowsDemoComponent);
        await settle();
    });

    const container = (): PartsDemoContainerComponent =>
        fixture.debugElement.query(By.directive(PartsDemoContainerComponent)).componentInstance;

    const expandedToggles = (): NodeListOf<HTMLElement> =>
        fixture.nativeElement.querySelectorAll("mona-grid [aria-expanded='true']");

    async function settle(): Promise<void> {
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    it("renders a grid with a panel for the grid, its directive and each column", () => {
        expect(fixture.debugElement.query(By.directive(GridComponent))).toBeTruthy();
        const headers = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll("th[role='columnheader']"));
        expect(headers.map(header => header.textContent?.trim())).toEqual(
            expect.arrayContaining(["Order ID", "Customer", "Freight", "Shipped"])
        );
        const parts = container().parts();
        expect(parts.map(part => part.id)).toEqual([
            "grid",
            "rowReorderable",
            "orderId",
            "customer",
            "freight",
            "shipped"
        ]);
        for (const part of parts) {
            expect(Object.keys(part.config.inputs).length).toBeGreaterThan(0);
        }
    });

    it("writes the directive on the grid and the columns inside it in its code sample", () => {
        const code: string = (container() as unknown as { generatedCode: () => string }).generatedCode();
        expect(code).toMatch(/^<mona-grid/);
        expect(code).toContain("[monaGridRowReorderable]=");
        expect(code).toContain("monaGridDetailTemplate");
        expect(code).toMatch(/<mona-grid-column\s+field="freight"\s+type="number"/);
        expect(code.trimEnd().endsWith("</mona-grid>")).toBe(true);
    });

    it("opens the detail rows of the page from code and closes them again", async () => {
        const buttons = Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll("button[monaButton]"));
        const expand = buttons.find(button => button.textContent?.includes("Expand all on page"));
        const collapse = buttons.find(button => button.textContent?.includes("Collapse all"));
        expand?.click();
        await settle();
        expect(expandedToggles().length).toBe(10);
        collapse?.click();
        await settle();
        expect(expandedToggles().length).toBe(0);
    });

    it("keeps rendering through every data set", async () => {
        const options = fixture.debugElement.queryAll(By.css("mona-segmented input"));
        expect(options.length).toBe(2);
        for (const option of options) {
            (option.nativeElement as HTMLInputElement).click();
            await settle();
            expect(fixture.debugElement.query(By.directive(GridComponent))).toBeTruthy();
        }
    });
});
