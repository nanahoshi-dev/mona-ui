import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { GridComponent } from "@nanahoshi/mona-ui/grid";
import { of } from "rxjs";
import { beforeEach, describe, expect, it } from "vitest";
import metadata from "../../../../assets/component-metadata.json";
import { DemoService } from "../../services/demo.service";
import { PartsDemoContainerComponent } from "../parts-demo-container/parts-demo-container.component";
import { GridTreeDemoComponent } from "./grid-tree-demo.component";
import { treeTasks } from "./grid-tree-demo.data";

describe("GridTreeDemoComponent", () => {
    let fixture: ComponentFixture<GridTreeDemoComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GridTreeDemoComponent],
            providers: [{ provide: DemoService, useValue: { metadata$: of(metadata) } }]
        }).compileComponents();

        fixture = TestBed.createComponent(GridTreeDemoComponent);
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

    function expandedText(): string {
        return (fixture.nativeElement.querySelector("p[aria-live='polite']") as HTMLElement).textContent?.trim() ?? "";
    }

    function rowNames(): string[] {
        return Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll("tr[monaGridRow]")).map(
            row => row.querySelector("[data-field='name']")?.textContent?.trim() ?? ""
        );
    }

    it("renders a tree grid with a panel for the grid, the tree and each column", () => {
        const grid = fixture.debugElement.query(By.directive(GridComponent));
        expect(grid).toBeTruthy();
        expect(fixture.nativeElement.querySelector("[role='treegrid']")).toBeTruthy();
        expect(
            container()
                .parts()
                .map(part => part.id)
        ).toEqual(["grid", "tree", "name", "owner", "hours"]);
        for (const part of container().parts()) {
            expect(Object.keys(part.config.inputs).length).toBeGreaterThan(0);
        }
    });

    it("writes the tree's binding on the grid in its code sample, for the data shape shown", async () => {
        expect(container()["generatedCode"]()).toContain('children="subtasks"');

        const flat = fixture.debugElement.queryAll(By.css("mona-segmented input"))[1];
        (flat.nativeElement as HTMLInputElement).click();
        await settle();

        const code: string = container()["generatedCode"]();
        expect(code).toContain('parentKey="parentId"');
        expect(code).not.toContain("children=");
        expect(code).toMatch(/^<mona-grid/);
    });

    it("shows the same tree from nested and from flat data", async () => {
        const nested = rowNames();
        expect(nested.slice(0, 3)).toEqual(["Website relaunch", "Design", "Wireframes"]);

        const flat = fixture.debugElement.queryAll(By.css("mona-segmented input"))[1];
        (flat.nativeElement as HTMLInputElement).click();
        await settle();

        expect(rowNames()).toEqual(nested);
    });

    it("expands and collapses every task from the buttons, and reports the keys", async () => {
        expect(expandedText()).toBe("Expanded: 1, 2");

        button("Expand all").click();
        await settle();
        expect(expandedText()).toBe("Expanded: 1, 2, 6, 11, 15");

        button("Collapse all").click();
        await settle();
        expect(expandedText()).toBe("Expanded: none");
        expect(rowNames()).toEqual(treeTasks("nested").map(task => task.name));
    });
});
