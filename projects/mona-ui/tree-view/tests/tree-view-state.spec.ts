import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { FilterChangeEvent } from "@nanahoshi/mona-ui/common";
import { FilterInputComponent } from "@nanahoshi/mona-ui/internal/filter-input";
import { TreeService } from "@nanahoshi/mona-ui/internal/tree";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { TreeViewComponent } from "../components/tree-view/tree-view.component";
import { TreeViewCheckableDirective } from "../directives/tree-view-checkable.directive";
import { TreeViewExpandableDirective } from "../directives/tree-view-expandable.directive";
import { TreeViewFilterableDirective } from "../directives/tree-view-filterable.directive";
import { TreeViewSelectableDirective } from "../directives/tree-view-selectable.directive";

interface Food {
    readonly children?: Food[];
    readonly id: string;
    readonly text: string;
}

const FOODS: Food[] = [
    {
        id: "A",
        text: "Fruits",
        children: [
            { id: "A1", text: "Apple" },
            { id: "A2", text: "Avocado" }
        ]
    },
    { id: "B", text: "Vegetables", children: [{ id: "B1", text: "Beet" }] }
];

type Log = Array<[string, unknown]>;

@Component({
    imports: [
        TreeViewComponent,
        TreeViewExpandableDirective,
        TreeViewCheckableDirective,
        TreeViewSelectableDirective,
        TreeViewFilterableDirective
    ],
    template: `
        <mona-tree-view
            aria-label="Food"
            [data]="data"
            children="children"
            [textField]="textField()"
            monaTreeViewExpandable
            expandBy="id"
            [(expandedKeys)]="expanded"
            (expandedKeysChange)="log.push(['expanded', $event])"
            monaTreeViewCheckable
            checkBy="id"
            [checkedKeys]="checked()"
            (checkedKeysChange)="log.push(['checked', $event])"
            monaTreeViewSelectable
            selectBy="id"
            [selectedKeys]="selected()"
            (selectedKeysChange)="log.push(['selected', $event])"
            monaTreeViewFilterable
            [(filter)]="filter"
            (filterInput)="onFilterInput($event)"></mona-tree-view>
    `
})
class HostComponent {
    public readonly checked = signal<string[]>([]);
    public readonly data = FOODS;
    public readonly expanded = signal<string[]>([]);
    public readonly filter = signal("");
    public readonly log: Log = [];
    public readonly selected = signal<string[]>([]);
    public readonly textField = signal<string | ((food: Food) => string)>("text");
    public preventFilter = false;

    public onFilterInput(event: FilterChangeEvent): void {
        if (this.preventFilter) {
            event.preventDefault();
        }
    }
}

@Component({
    imports: [TreeViewComponent],
    template: `<mona-tree-view aria-label="Food" [data]="data" children="children" textField="text" animate="false" />`
})
class AnimateHostComponent {
    public readonly data = FOODS;
}

describe("tree view state", () => {
    let fixture: ComponentFixture<HostComponent>;
    let host: HostComponent;
    let root: HTMLElement;
    let treeService: TreeService<Food>;

    async function settle(): Promise<void> {
        fixture.detectChanges();
        await fixture.whenStable();
        // The filter text passes through a debounceTime(0).
        await new Promise(resolve => setTimeout(resolve, 5));
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    function rows(): string[] {
        return Array.from(root.querySelectorAll("li[role='treeitem'] mona-tree-node")).map(
            node => node.textContent?.trim() ?? ""
        );
    }

    function row(text: string): HTMLElement {
        const found = Array.from(root.querySelectorAll<HTMLElement>("li[role='treeitem']")).find(
            item => item.querySelector("mona-tree-node")?.textContent?.trim() === text
        );
        if (!found) {
            throw new Error(`No row "${text}"`);
        }
        return found;
    }

    async function type(text: string): Promise<void> {
        const filterInput = fixture.debugElement.query(By.directive(FilterInputComponent))
            .componentInstance as FilterInputComponent;
        filterInput.filterChange.emit(new FilterChangeEvent(text));
        await settle();
    }

    beforeEach(async () => {
        fixture = TestBed.createComponent(HostComponent);
        host = fixture.componentInstance;
        root = fixture.nativeElement as HTMLElement;
        document.body.appendChild(root);
        treeService = fixture.debugElement.query(By.directive(TreeViewComponent)).injector.get(TreeService);
        await settle();
    });

    afterEach(() => root.remove());

    describe("expandedKeys", () => {
        it("keeps a filter's expansion out of expandedKeys, and undoes it when the filter is cleared", async () => {
            await type("Apple");
            expect(rows()).toEqual(["Fruits", "Apple"]);
            expect(host.log).toEqual([]);
            expect(host.expanded()).toEqual([]);

            host.filter.set("");
            await settle();
            expect(rows()).toEqual(["Fruits", "Vegetables"]);
            expect(host.expanded()).toEqual([]);
        });

        it("reports the expansion the user makes", async () => {
            (row("Fruits").querySelector("button[aria-label='Expand Fruits']") as HTMLButtonElement).click();
            await settle();

            expect(host.log).toEqual([["expanded", ["A"]]]);
            expect(host.expanded()).toEqual(["A"]);
            expect(rows()).toEqual(["Fruits", "Apple", "Avocado", "Vegetables"]);
        });
    });

    describe("keys set from code", () => {
        it("aren't echoed back, including parents derived from checked children", async () => {
            host.expanded.set(["A"]);
            host.checked.set(["A1", "A2"]);
            host.selected.set(["B"]);
            await settle();

            expect(host.log).toEqual([]);
            expect(row("Fruits").getAttribute("aria-checked")).toBe("true");
            // With checkboxes, selection is shown but not reported as aria-selected.
            expect(
                treeService
                    .selectedNodes()
                    .select(node => node.data.id)
                    .toArray()
            ).toEqual(["B"]);
        });

        it("are followed by the user's checks, with the parents they derive", async () => {
            host.expanded.set(["A"]);
            await settle();

            (row("Apple").querySelector("mona-check-box") as HTMLElement).click();
            await settle();
            expect(host.log.at(-1)).toEqual(["checked", ["A1"]]);

            (row("Avocado").querySelector("mona-check-box") as HTMLElement).click();
            await settle();
            const [kind, keys] = host.log.at(-1) ?? [];
            expect(kind).toBe("checked");
            expect([...(keys as string[])].sort()).toEqual(["A", "A1", "A2"]);
        });

        it("are followed by the user's selection", async () => {
            (row("Vegetables").querySelector("mona-tree-node > div") as HTMLElement).click();
            await settle();
            expect(host.log).toEqual([["selected", ["B"]]]);
        });
    });

    describe("aria-activedescendant", () => {
        function activeDescendant(): HTMLElement | null {
            const tree = root.querySelector("[role='tree']") as HTMLElement;
            const id = tree.getAttribute("aria-activedescendant");
            return id ? document.getElementById(id) : null;
        }

        it("moves to the parent when the active node is collapsed", async () => {
            host.expanded.set(["A"]);
            await settle();
            const apple = treeService.getNodeByUid(row("Apple").getAttribute("data-uid") ?? "");
            treeService.navigatedNode.set(apple ?? null);
            await settle();
            expect(activeDescendant()).toBe(row("Apple"));

            host.expanded.set([]);
            await settle();
            expect(activeDescendant()).toBe(row("Fruits"));
        });

        it("stays on a rendered node when a filter hides the active node", async () => {
            host.expanded.set(["B"]);
            await settle();
            const beet = treeService.getNodeByUid(row("Beet").getAttribute("data-uid") ?? "");
            treeService.navigatedNode.set(beet ?? null);
            await settle();

            await type("Apple");
            const active = activeDescendant();
            expect(active).not.toBeNull();
            expect(root.contains(active)).toBe(true);
        });
    });

    describe("filter", () => {
        it("is two-way, and a reset from code applies after the user typed", async () => {
            await type("Beet");
            expect(host.filter()).toBe("Beet");
            expect(rows()).toEqual(["Vegetables", "Beet"]);

            host.filter.set("");
            await settle();
            expect(rows()).toEqual(["Fruits", "Vegetables"]);
        });

        it("keeps the current filter when filterInput is prevented", async () => {
            host.preventFilter = true;
            await type("Beet");
            expect(host.filter()).toBe("");
            expect(rows()).toEqual(["Fruits", "Vegetables"]);
        });
    });

    it("keeps moved nodes when textField changes", async () => {
        const treeView = fixture.debugElement.query(By.directive(TreeViewComponent))
            .componentInstance as TreeViewComponent<Food>;
        const fruits = { data: FOODS[0], hasChildren: true, uid: row("Fruits").getAttribute("data-uid") ?? "" };
        const vegetables = { data: FOODS[1], hasChildren: true, uid: row("Vegetables").getAttribute("data-uid") ?? "" };
        treeView.moveNode(vegetables, fruits, "before");
        await settle();
        expect(rows()).toEqual(["Vegetables", "Fruits"]);

        host.textField.set(food => food.text.toUpperCase());
        await settle();
        expect(rows()).toEqual(["VEGETABLES", "FRUITS"]);
    });
});

describe("tree view inputs", () => {
    it("takes animate as an attribute", () => {
        const fixture = TestBed.createComponent(AnimateHostComponent);
        fixture.detectChanges();
        const treeService = fixture.debugElement.query(By.directive(TreeViewComponent)).injector.get(TreeService);
        expect(treeService.animationEnabled()).toBe(false);
    });
});
