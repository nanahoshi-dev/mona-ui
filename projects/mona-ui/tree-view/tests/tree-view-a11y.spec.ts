import { LiveAnnouncer } from "@angular/cdk/a11y";
import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { FilterChangeEvent, type FilterableOptions } from "@nanahoshi/mona-ui/common";
import { FilterInputComponent } from "@nanahoshi/mona-ui/internal/filter-input";
import {
    type CheckableOptions,
    type ChildrenLoadErrorEvent,
    type DisableOptions,
    type SelectableOptions,
    TreeService
} from "@nanahoshi/mona-ui/internal/tree";
import axe from "axe-core";
import { Observable, Subject } from "rxjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TreeViewComponent } from "../components/tree-view/tree-view.component";
import { TreeViewCheckableDirective } from "../directives/tree-view-checkable.directive";
import { TreeViewDisableDirective } from "../directives/tree-view-disable.directive";
import { TreeViewExpandableDirective } from "../directives/tree-view-expandable.directive";
import { TreeViewFilterableDirective } from "../directives/tree-view-filterable.directive";
import { TreeViewNodeTemplateDirective } from "../directives/tree-view-node-template.directive";
import { TreeViewSelectableDirective } from "../directives/tree-view-selectable.directive";

interface Food {
    readonly children?: Food[];
    readonly id: string;
    readonly lazy?: boolean;
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

const OFF = { enabled: false };

@Component({
    imports: [
        TreeViewComponent,
        TreeViewExpandableDirective,
        TreeViewCheckableDirective,
        TreeViewSelectableDirective,
        TreeViewFilterableDirective,
        TreeViewDisableDirective
    ],
    template: `
        <span id="food-label">Food</span>
        <mona-tree-view
            [aria-label]="ariaLabel()"
            [aria-labelledby]="ariaLabelledBy()"
            [data]="data()"
            children="children"
            textField="text"
            monaTreeViewExpandable
            expandBy="id"
            [(expandedKeys)]="expanded"
            [monaTreeViewCheckable]="checkable()"
            checkBy="id"
            [monaTreeViewSelectable]="selectable()"
            selectBy="id"
            [monaTreeViewFilterable]="filterable()"
            [monaTreeViewDisable]="disable()"
            disableBy="id"
            [disabledKeys]="['B']"></mona-tree-view>
    `
})
class FeaturesHostComponent {
    public readonly ariaLabel = signal("Food");
    public readonly ariaLabelledBy = signal("");
    public readonly checkable = signal<Partial<CheckableOptions> | "">(OFF);
    public readonly data = signal<Food[]>(FOODS);
    public readonly disable = signal<Partial<DisableOptions> | "">(OFF);
    public readonly expanded = signal<string[]>(["A"]);
    public readonly filterable = signal<Partial<FilterableOptions> | "">(OFF);
    public readonly selectable = signal<Partial<SelectableOptions> | "">(OFF);
}

@Component({
    imports: [TreeViewComponent, TreeViewExpandableDirective],
    template: `
        <mona-tree-view
            aria-label="Food"
            [data]="data"
            [children]="children"
            [hasChildren]="hasChildren"
            textField="text"
            monaTreeViewExpandable
            expandBy="id"
            [expandedKeys]="expanded()"
            (childrenLoadError)="errors.push($event)"></mona-tree-view>
    `
})
class LazyHostComponent {
    public readonly data: Food[] = [{ id: "A", lazy: true, text: "Fruits" }];
    public readonly errors: Array<ChildrenLoadErrorEvent<Food>> = [];
    public readonly expanded = signal<string[]>([]);
    public readonly loads: Array<Subject<Food[]>> = [];
    /** Each subscription is a load (the tree also calls the selector, without subscribing, to build the nodes). */
    public readonly children = (_food: Food): Observable<Food[]> =>
        new Observable<Food[]>(subscriber => {
            const load = new Subject<Food[]>();
            this.loads.push(load);
            return load.subscribe(subscriber);
        });
    public readonly hasChildren = (food: Food): boolean => food.lazy === true;
}

@Component({
    imports: [TreeViewComponent, TreeViewNodeTemplateDirective],
    template: `
        <mona-tree-view aria-label="Food" [data]="data" children="children" textField="text">
            <ng-template monaTreeViewNodeTemplate [monaTreeViewNodeTemplateOf]="data" let-food let-element="element">
                <span class="typed">{{ food.text.toUpperCase() }} {{ element.tagName.toLowerCase() }}</span>
            </ng-template>
        </mona-tree-view>
    `
})
class TemplateHostComponent {
    public readonly data = FOODS;
}

@Component({
    imports: [TreeViewComponent],
    template: `<mona-tree-view [data]="data" children="children" textField="text" />`
})
class UnnamedHostComponent {
    public readonly data = FOODS;
}

const AXE_OPTIONS: axe.RunOptions = {
    rules: { "color-contrast": { enabled: false }, region: { enabled: false } }
};

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    // The filter text passes through a debounceTime(0).
    await new Promise(resolve => setTimeout(resolve, 5));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

async function violations(fixture: ComponentFixture<unknown>): Promise<string[]> {
    const results = await axe.run(fixture.nativeElement as HTMLElement, AXE_OPTIONS);
    // Rules that passed show the run reached the tree; an empty run would also have no violations.
    expect(results.passes.some(rule => rule.id.startsWith("aria-"))).toBe(true);
    return results.violations.map(
        violation => `${violation.id}: ${violation.nodes.map(node => node.target.join(" ")).join(", ")}`
    );
}

describe("tree view accessibility", () => {
    let announce: ReturnType<typeof vi.fn>;

    function rowOf(root: HTMLElement, text: string): HTMLElement {
        const found = Array.from(root.querySelectorAll<HTMLElement>("li[role='treeitem']")).find(
            item => item.querySelector("mona-tree-node")?.textContent?.trim() === text
        );
        if (!found) {
            throw new Error(`No row "${text}"`);
        }
        return found;
    }

    function referenced(element: Element, attribute: string): string | null {
        const id = element.getAttribute(attribute);
        return id ? (document.getElementById(id)?.textContent?.trim() ?? null) : null;
    }

    beforeEach(() => {
        announce = vi.fn();
        TestBed.configureTestingModule({ providers: [{ provide: LiveAnnouncer, useValue: { announce } }] });
    });

    describe("with the feature directives", () => {
        let fixture: ComponentFixture<FeaturesHostComponent>;
        let host: FeaturesHostComponent;
        let root: HTMLElement;

        function tree(): HTMLElement {
            return root.querySelector("[role='tree']") as HTMLElement;
        }

        async function type(text: string): Promise<void> {
            const filterInput = fixture.debugElement.query(By.directive(FilterInputComponent))
                .componentInstance as FilterInputComponent;
            filterInput.filterChange.emit(new FilterChangeEvent(text));
            await settle(fixture);
        }

        beforeEach(async () => {
            fixture = TestBed.createComponent(FeaturesHostComponent);
            host = fixture.componentInstance;
            root = fixture.nativeElement as HTMLElement;
            document.body.appendChild(root);
            await settle(fixture);
        });

        afterEach(() => root.remove());

        it("loads a lazy node that expandedKeys expands from the start", async () => {
            const expandedFixture = TestBed.createComponent(LazyHostComponent);
            const expandedHost = expandedFixture.componentInstance;
            expandedHost.expanded.set(["A"]);
            const expandedRoot = expandedFixture.nativeElement as HTMLElement;
            document.body.appendChild(expandedRoot);
            try {
                await settle(expandedFixture);
                expect(expandedHost.loads.length).toBe(1);
                expect(rowOf(expandedRoot, "Fruits").getAttribute("aria-busy")).toBe("true");

                expandedHost.loads[0].next([{ id: "A1", text: "Apple" }]);
                await settle(expandedFixture);
                expect(rowOf(expandedRoot, "Fruits").getAttribute("aria-expanded")).toBe("true");
                expect(rowOf(expandedRoot, "Apple")).toBeTruthy();
                expect(expandedHost.loads.length).toBe(1);
            } finally {
                expandedRoot.remove();
            }
        });

        it("names the tree, and each node by its text alone", () => {
            expect(tree().getAttribute("aria-label")).toBe("Food");
            expect(root.querySelector("mona-tree-view")?.hasAttribute("aria-label")).toBe(false);
            const fruits = rowOf(root, "Fruits");
            // The expander's "Collapse Fruits" and the nested nodes aren't part of the node's name.
            expect(referenced(fruits, "aria-labelledby")).toBe("Fruits");
        });

        it("takes its name from aria-labelledby", async () => {
            host.ariaLabel.set("");
            host.ariaLabelledBy.set("food-label");
            await settle(fixture);
            expect(tree().hasAttribute("aria-label")).toBe(false);
            expect(referenced(tree(), "aria-labelledby")).toBe("Food");
        });

        it("draws a solid 2px ring on the active node", async () => {
            const treeService = fixture.debugElement.query(By.directive(TreeViewComponent)).injector.get(TreeService);
            treeService.navigatedNode.set(
                treeService.getNodeByUid(rowOf(root, "Apple").getAttribute("data-uid") ?? "")
            );
            await settle(fixture);
            const classes = rowOf(root, "Apple").querySelector("mona-tree-node > div")?.classList;
            expect(classes?.contains("inset-ring-2")).toBe(true);
            expect(classes?.contains("inset-ring-focus-indicator")).toBe(true);
            expect(classes?.contains("inset-ring-focus-indicator/35")).toBe(false);
        });

        describe("checkboxes and selection", () => {
            it("reports checks and not selection when both are on, and isn't multiselectable", async () => {
                host.checkable.set("");
                host.selectable.set({ mode: "multiple" });
                await settle(fixture);
                const items = Array.from(root.querySelectorAll("li[role='treeitem']"));
                expect(items.every(item => item.getAttribute("aria-checked") === "false")).toBe(true);
                expect(items.some(item => item.hasAttribute("aria-selected"))).toBe(false);
                expect(tree().hasAttribute("aria-multiselectable")).toBe(false);
                expect(await violations(fixture)).toEqual([]);
            });

            it("reports multiple selection without checkboxes", async () => {
                host.selectable.set({ mode: "multiple" });
                await settle(fixture);
                expect(tree().getAttribute("aria-multiselectable")).toBe("true");
                expect(rowOf(root, "Fruits").getAttribute("aria-selected")).toBe("false");
                expect(rowOf(root, "Fruits").hasAttribute("aria-checked")).toBe(false);
                expect(await violations(fixture)).toEqual([]);
            });
        });

        describe("filter", () => {
            beforeEach(async () => {
                host.filterable.set("");
                await settle(fixture);
            });

            it("names the filter input from the tree, points it at the tree, and leaves focus alone", () => {
                const input = root.querySelector("mona-filter-input input") as HTMLInputElement;
                expect(input.getAttribute("aria-label")).toBe("Filter Food");
                expect(input.getAttribute("aria-controls")).toBe(tree().id);
                expect(tree().id).not.toBe("");
                expect(input.hasAttribute("role")).toBe(false);
                expect(document.activeElement).not.toBe(input);
            });

            it("announces how many nodes match after the user types", async () => {
                await type("Apple");
                expect(announce).toHaveBeenLastCalledWith("1 result", "polite");

                await type("a");
                // Apple, Avocado and Vegetables match; Fruits is shown for context and isn't counted.
                expect(announce).toHaveBeenLastCalledWith("3 results", "polite");
            });

            it("shows, describes and announces no matches", async () => {
                await type("zzz");
                expect(announce).toHaveBeenLastCalledWith("No matching items", "polite");
                expect(root.querySelectorAll("li[role='treeitem']").length).toBe(0);
                expect(tree().getAttribute("tabindex")).toBe("0");
                expect(referenced(tree(), "aria-describedby")).toBe("No matching items");
                expect(await violations(fixture)).toEqual([]);
            });

            it("doesn't announce a filter set from code", async () => {
                const filterable = fixture.debugElement
                    .query(By.directive(TreeViewComponent))
                    .injector.get(TreeViewFilterableDirective);
                filterable.filter.set("Apple");
                await settle(fixture);
                expect(root.querySelectorAll("li[role='treeitem']").length).toBe(2);
                expect(announce).not.toHaveBeenCalled();
            });

            it("names the filter input from the elements that name the tree", async () => {
                host.ariaLabel.set("");
                host.ariaLabelledBy.set("food-label");
                await settle(fixture);
                await settle(fixture);
                const input = root.querySelector("mona-filter-input input") as HTMLInputElement;
                expect(input.getAttribute("aria-label")).toBe("Filter Food");
            });

            it("applies typing after one debounce, not two", async () => {
                host.filterable.set({ debounce: 100 });
                await settle(fixture);
                const input = root.querySelector("mona-filter-input input") as HTMLInputElement;
                input.value = "Apple";
                input.dispatchEvent(new Event("input", { bubbles: true }));
                await new Promise(resolve => setTimeout(resolve, 160));
                await settle(fixture);
                expect(root.querySelectorAll("li[role='treeitem']").length).toBe(2);
            });

            it("passes axe", async () => {
                expect(await violations(fixture)).toEqual([]);
            });
        });

        it("keeps an empty tree a Tab stop described by No data, with a ring of its own", async () => {
            host.data.set([]);
            await settle(fixture);
            expect(tree().getAttribute("tabindex")).toBe("0");
            expect(referenced(tree(), "aria-describedby")).toBe("No data");
            expect(tree().classList.contains("focus-visible:inset-ring-2")).toBe(true);
            expect(await violations(fixture)).toEqual([]);
        });

        it("passes axe with plain, checkable and disabled nodes", async () => {
            expect(await violations(fixture)).toEqual([]);
            host.checkable.set("");
            host.disable.set("");
            await settle(fixture);
            expect(rowOf(root, "Vegetables").getAttribute("aria-disabled")).toBe("true");
            expect(await violations(fixture)).toEqual([]);
        });
    });

    describe("lazy loading", () => {
        let fixture: ComponentFixture<LazyHostComponent>;
        let host: LazyHostComponent;
        let root: HTMLElement;

        function fruits(): HTMLElement {
            return rowOf(root, "Fruits");
        }

        function expander(): HTMLButtonElement {
            return fruits().querySelector("button") as HTMLButtonElement;
        }

        beforeEach(async () => {
            fixture = TestBed.createComponent(LazyHostComponent);
            host = fixture.componentInstance;
            root = fixture.nativeElement as HTMLElement;
            document.body.appendChild(root);
            await settle(fixture);
        });

        afterEach(() => root.remove());

        it("marks a loading node busy and expanded, and announces a load that takes a while", async () => {
            expander().click();
            await settle(fixture);
            expect(fruits().getAttribute("aria-busy")).toBe("true");
            expect(fruits().getAttribute("aria-expanded")).toBe("true");
            expect(expander().getAttribute("aria-label")).toBe("Loading Fruits");
            expect(announce).not.toHaveBeenCalled();
            expect(await violations(fixture)).toEqual([]);

            await new Promise(resolve => setTimeout(resolve, 450));
            expect(announce).toHaveBeenCalledWith("Loading Fruits", "polite");

            host.loads[0].next([{ id: "A1", text: "Apple" }]);
            await settle(fixture);
            expect(fruits().hasAttribute("aria-busy")).toBe(false);
            expect(rowOf(root, "Apple")).toBeTruthy();
        });

        it("reports a failed load, collapses the node, and retries when it is expanded again", async () => {
            expander().click();
            await settle(fixture);
            const error = new Error("offline");
            host.loads[0].error(error);
            await settle(fixture);

            expect(host.errors.length).toBe(1);
            expect(host.errors[0].error).toBe(error);
            expect(host.errors[0].node.data.id).toBe("A");
            expect(fruits().getAttribute("aria-expanded")).toBe("false");
            expect(fruits().hasAttribute("aria-busy")).toBe(false);
            expect(referenced(fruits(), "aria-describedby")).toBe("Couldn't load the items in Fruits");
            expect(referenced(fruits(), "aria-labelledby")).toBe("Fruits");
            expect(expander().getAttribute("aria-label")).toBe("Retry loading Fruits");
            expect(announce).toHaveBeenCalledWith("Couldn't load the items in Fruits", "polite");
            expect(await violations(fixture)).toEqual([]);

            expander().click();
            await settle(fixture);
            expect(host.loads.length).toBe(2);
            expect(fruits().getAttribute("aria-busy")).toBe("true");
            expect(fruits().hasAttribute("aria-describedby")).toBe(false);

            host.loads[1].next([{ id: "A1", text: "Apple" }]);
            await settle(fixture);
            expect(rowOf(root, "Apple")).toBeTruthy();
            expect(expander().getAttribute("aria-label")).toBe("Collapse Fruits");
        });
    });

    it("types the node template from monaTreeViewNodeTemplateOf", async () => {
        const fixture = TestBed.createComponent(TemplateHostComponent);
        await settle(fixture);
        const typed = (fixture.nativeElement as HTMLElement).querySelector(".typed");
        expect(typed?.textContent?.trim()).toBe("FRUITS mona-tree-node");
    });

    describe("naming in development", () => {
        it("warns when the tree has no name", async () => {
            const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
            const fixture = TestBed.createComponent(UnnamedHostComponent);
            await settle(fixture);
            expect(warn).toHaveBeenCalledWith(expect.stringContaining("[Mona TreeView]"), expect.anything());
            warn.mockRestore();
        });

        it("doesn't warn when the tree is named", async () => {
            const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
            const fixture = TestBed.createComponent(TemplateHostComponent);
            await settle(fixture);
            expect(warn).not.toHaveBeenCalled();
            warn.mockRestore();
        });
    });
});
