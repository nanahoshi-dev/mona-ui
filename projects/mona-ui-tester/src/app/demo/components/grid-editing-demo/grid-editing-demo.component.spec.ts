import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { GridComponent } from "@nanahoshi/mona-ui/grid";
import { of } from "rxjs";
import { beforeEach, describe, expect, it } from "vitest";
import metadata from "../../../../assets/component-metadata.json";
import { DemoService } from "../../services/demo.service";
import type { DemoPart } from "../../utils/demoParts";
import { PartsDemoContainerComponent } from "../parts-demo-container/parts-demo-container.component";
import { GridEditingDemoComponent } from "./grid-editing-demo.component";

describe("GridEditingDemoComponent", () => {
    let fixture: ComponentFixture<GridEditingDemoComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GridEditingDemoComponent],
            providers: [{ provide: DemoService, useValue: { metadata$: of(metadata) } }]
        }).compileComponents();

        fixture = TestBed.createComponent(GridEditingDemoComponent);
        await settle();
    });

    const container = (): PartsDemoContainerComponent =>
        fixture.debugElement.query(By.directive(PartsDemoContainerComponent)).componentInstance;

    async function settle(): Promise<void> {
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    function part(id: string): DemoPart {
        const found = container()
            .parts()
            .find(candidate => candidate.id === id);
        if (!found) {
            throw new Error(`No ${id} part`);
        }
        return found;
    }

    function buttons(text: string): HTMLButtonElement[] {
        return Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll("button")).filter(
            button => button.textContent?.trim() === text
        );
    }

    it("renders a grid with a panel for the grid, the editing, each column and the command column", () => {
        expect(fixture.debugElement.query(By.directive(GridComponent))).toBeTruthy();
        const parts = container().parts();
        expect(parts.map(candidate => candidate.id)).toEqual([
            "grid",
            "editing",
            "orderId",
            "customer",
            "freight",
            "shipped",
            "commands"
        ]);
        for (const candidate of parts) {
            expect(Object.keys(candidate.config.inputs).length).toBeGreaterThan(0);
        }
    });

    it("writes the editing options on the grid and the command column inside it in its code sample", () => {
        const code: string = container()["generatedCode"]();
        expect(code).toMatch(/^<mona-grid/);
        expect(code).toContain("monaGridEditable");
        expect(code).toContain('[newRowFactory]="newOrder"');
        expect(code).toContain("monaGridAddCommand");
        expect(code).toContain("<mona-grid-command-column");
        expect(code.trimEnd().endsWith("</mona-grid>")).toBe(true);
    });

    it("opens the add row from the toolbar and records the add event", async () => {
        const [add] = buttons("Add order");
        expect(add).toBeTruthy();
        add.click();
        await settle();
        const names = container()
            .eventLog()
            ?.entries()
            .map(entry => entry.name);
        expect(names).toContain("add");
    });

    it("renders the custom command buttons", async () => {
        part("commands").config.featureHandler?.updateProperty("boolean", "customCommands", true);
        await settle();
        expect(buttons("Remove").length).toBeGreaterThan(0);
        expect(buttons("Edit").length).toBeGreaterThan(0);
        expect(buttons("Edit")[0].getAttribute("aria-label")).toBe("Edit order 10248");
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
