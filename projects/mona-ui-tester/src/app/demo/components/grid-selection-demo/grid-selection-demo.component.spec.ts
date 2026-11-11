import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { GridComponent } from "@nanahoshi/mona-ui/grid";
import { of } from "rxjs";
import { beforeEach, describe, expect, it } from "vitest";
import metadata from "../../../../assets/component-metadata.json";
import { DemoService } from "../../services/demo.service";
import { PartsDemoContainerComponent } from "../parts-demo-container/parts-demo-container.component";
import { GridSelectionDemoComponent } from "./grid-selection-demo.component";

describe("GridSelectionDemoComponent", () => {
    let fixture: ComponentFixture<GridSelectionDemoComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GridSelectionDemoComponent],
            providers: [{ provide: DemoService, useValue: { metadata$: of(metadata) } }]
        }).compileComponents();

        fixture = TestBed.createComponent(GridSelectionDemoComponent);
        await settle();
    });

    const container = (): PartsDemoContainerComponent =>
        fixture.debugElement.query(By.directive(PartsDemoContainerComponent)).componentInstance;

    async function settle(): Promise<void> {
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    function button(text: string): HTMLButtonElement {
        const buttons = Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll("button"));
        const found = buttons.find(candidate => candidate.textContent?.trim() === text);
        if (!found) {
            throw new Error(`No ${text} button`);
        }
        return found;
    }

    function selectedText(): string {
        return (fixture.nativeElement.querySelector("[aria-live='polite']") as HTMLElement).textContent?.trim() ?? "";
    }

    it("renders a grid with a panel for the grid, the selection and each column", () => {
        expect(fixture.debugElement.query(By.directive(GridComponent))).toBeTruthy();
        const parts = container().parts();
        expect(parts.map(part => part.id)).toEqual(["grid", "selection", "orderId", "customer", "freight"]);
        for (const part of parts) {
            expect(Object.keys(part.config.inputs).length).toBeGreaterThan(0);
        }
    });

    it("writes the selection options on the grid in its code sample", () => {
        const code: string = container()["generatedCode"]();
        expect(code).toMatch(/^<mona-grid/);
        expect(code).toContain("monaGridSelectable");
        expect(code).toContain('(selectedKeysChange)="selectedKeys.set($event)"');
        expect(code.trimEnd().endsWith("</mona-grid>")).toBe(true);
    });

    it("selects rows from code and clears them", async () => {
        expect(selectedText()).toBe("Selected: 10248, 10251");
        button("Select first five").click();
        await settle();
        expect(selectedText()).toBe("Selected: 10248, 10249, 10250, 10251, 10252");
        button("Clear selection").click();
        await settle();
        expect(selectedText()).toBe("Selected: none");
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
