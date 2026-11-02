import { ComponentFixture, TestBed } from "@angular/core/testing";
import axe from "axe-core";
import { of } from "rxjs";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { TreeService } from "../../services/tree.service";
import { SubTreeComponent } from "../sub-tree/sub-tree.component";
import { TreeDropHintComponent } from "../tree-drop-hint/tree-drop-hint.component";

import { TreeComponent } from "./tree.component";

interface TestItem {
    children?: TestItem[];
    id: string;
    text: string;
}

function buildData(): TestItem[] {
    return [
        {
            children: [
                { id: "1.1", text: "Node 1.1" },
                { id: "1.2", text: "Node 1.2" }
            ],
            id: "1",
            text: "Node 1"
        },
        { id: "2", text: "Node 2" }
    ];
}

describe("TreeComponent", () => {
    let component: TreeComponent<TestItem>;
    let fixture: ComponentFixture<TreeComponent<TestItem>>;
    let treeService: TreeService<TestItem>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TreeComponent, SubTreeComponent, TreeDropHintComponent],
            providers: [TreeService]
        }).compileComponents();

        fixture = TestBed.createComponent(TreeComponent) as unknown as ComponentFixture<TreeComponent<TestItem>>;
        component = fixture.componentInstance;
        treeService = fixture.debugElement.injector.get(TreeService);
        fixture.detectChanges();
        await fixture.whenStable();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    function setupTree(): void {
        treeService.setDataStructure("hierarchical");
        treeService.setChildrenSelector("children");
        treeService.setTextField("text");
        treeService.setData(buildData());
        treeService.setExpandableOptions({ enabled: true });
        treeService.setSelectableOptions({ enabled: true, mode: "single", childrenOnly: false });
        treeService.setCheckableOptions({ enabled: true, mode: "multiple", checkChildren: true, checkParents: true });
        fixture.detectChanges();
    }

    function dispatchKeydown(key: string): void {
        fixture.nativeElement.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
        fixture.detectChanges();
    }

    describe("keyboard navigation", () => {
        it("navigates to the next and previous node with ArrowDown/ArrowUp", () => {
            setupTree();
            dispatchKeydown("ArrowDown");
            expect(treeService.navigatedNode()?.data.id).toBe("1");

            dispatchKeydown("ArrowDown");
            expect(treeService.navigatedNode()?.data.id).toBe("2");

            dispatchKeydown("ArrowUp");
            expect(treeService.navigatedNode()?.data.id).toBe("1");
        });

        it("jumps to the first and last node with Home/End", () => {
            setupTree();
            dispatchKeydown("End");
            expect(treeService.navigatedNode()?.data.id).toBe("2");

            dispatchKeydown("Home");
            expect(treeService.navigatedNode()?.data.id).toBe("1");
        });

        it("expands and collapses the navigated node with ArrowRight/ArrowLeft", () => {
            setupTree();
            dispatchKeydown("Home");
            const node1 = treeService.navigatedNode()!;
            expect(treeService.isExpanded(node1)).toBe(false);

            dispatchKeydown("ArrowRight");
            expect(treeService.isExpanded(node1)).toBe(true);

            dispatchKeydown("ArrowLeft");
            expect(treeService.isExpanded(node1)).toBe(false);
        });

        it("inverts expand/collapse keys in RTL (ArrowLeft expands, ArrowRight collapses)", async () => {
            const i18n = TestBed.inject(MonaI18nService);
            i18n.use({
                direction: "rtl",
                id: "ar",
                messages: {}
            });
            fixture.nativeElement.setAttribute("dir", "rtl");
            fixture.detectChanges();
            await fixture.whenStable();

            setupTree();
            dispatchKeydown("Home");
            const node1 = treeService.navigatedNode()!;
            expect(treeService.isExpanded(node1)).toBe(false);

            dispatchKeydown("ArrowLeft");
            expect(treeService.isExpanded(node1)).toBe(true);

            dispatchKeydown("ArrowRight");
            expect(treeService.isExpanded(node1)).toBe(false);
        });

        it("does not navigate into a collapsed node's children", () => {
            setupTree();
            dispatchKeydown("Home");
            dispatchKeydown("ArrowDown");
            expect(treeService.navigatedNode()?.data.id).toBe("2");
        });

        it("selects the navigated node with Enter", () => {
            setupTree();
            dispatchKeydown("Home");
            const node1 = treeService.navigatedNode()!;
            expect(treeService.isSelected(node1)).toBe(false);

            dispatchKeydown("Enter");
            expect(treeService.isSelected(node1)).toBe(true);
        });

        it("checks the navigated node with Space", () => {
            setupTree();
            dispatchKeydown("Home");
            const node1 = treeService.navigatedNode()!;
            expect(treeService.isChecked(node1)).toBe(false);

            dispatchKeydown(" ");
            expect(treeService.isChecked(node1)).toBe(true);
        });
    });

    describe("aria-activedescendant", () => {
        it("reflects the currently navigated node's element id", () => {
            setupTree();
            expect(fixture.nativeElement.getAttribute("aria-activedescendant")).toBeNull();

            dispatchKeydown("Home");
            const node1 = treeService.navigatedNode()!;
            expect(fixture.nativeElement.getAttribute("aria-activedescendant")).toBe(
                treeService.getNodeElementId(node1.uid)
            );

            dispatchKeydown("ArrowDown");
            const node2 = treeService.navigatedNode()!;
            expect(fixture.nativeElement.getAttribute("aria-activedescendant")).toBe(
                treeService.getNodeElementId(node2.uid)
            );
        });
    });

    describe("WAI-ARIA tree keyboard contract", () => {
        it("moves to the parent with ArrowLeft on a child, and to the first child with ArrowRight on an open node", () => {
            setupTree();
            const node1 = treeService.nodeSet().first();
            treeService.setExpandedKeys([node1.data]);
            treeService.navigatedNode.set(node1.children().first());
            fixture.detectChanges();

            dispatchKeydown("ArrowLeft");
            expect(treeService.navigatedNode()).toBe(node1);
            expect(treeService.isExpanded(node1)).toBe(true);

            dispatchKeydown("ArrowRight");
            expect(treeService.navigatedNode()?.data.id).toBe("1.1");
        });

        it("expands all siblings with *", () => {
            const data: TestItem[] = [
                { id: "1", text: "One", children: [{ id: "1.1", text: "One.One" }] },
                { id: "2", text: "Two", children: [{ id: "2.1", text: "Two.One" }] }
            ];
            treeService.setChildrenSelector("children");
            treeService.setTextField("text");
            treeService.setData(data);
            treeService.setExpandableOptions({ enabled: true });
            treeService.navigatedNode.set(treeService.nodeSet().first());
            fixture.detectChanges();

            dispatchKeydown("*");
            expect(treeService.nodeSet().all(n => treeService.isExpanded(n))).toBe(true);
        });

        it("moves to the next node starting with a typed character", () => {
            vi.useFakeTimers();
            try {
                setupTree();
                treeService.navigatedNode.set(treeService.nodeSet().first());
                fixture.detectChanges();
                dispatchKeydown("n");
                vi.advanceTimersByTime(250);
                expect(treeService.navigatedNode()?.data.id).toBe("2");
            } finally {
                vi.useRealTimers();
            }
        });

        it("expands a lazily loaded node with the keyboard and loads its children once", () => {
            const load = vi.fn((item: TestItem) =>
                of<TestItem[]>(item.id === "1" ? [{ id: "1.1", text: "Lazy" }] : [])
            );
            treeService.setChildrenSelector(load);
            treeService.setHasChildrenPredicate((item: TestItem) => item.id === "1");
            treeService.setTextField("text");
            treeService.setData([{ id: "1", text: "Node 1" }]);
            treeService.setExpandableOptions({ enabled: true });
            treeService.navigatedNode.set(treeService.nodeSet().first());
            fixture.detectChanges();
            load.mockClear();

            dispatchKeydown("ArrowRight");
            const node = treeService.nodeSet().first();
            expect(treeService.isExpanded(node)).toBe(true);
            expect(node.children().single().data.text).toBe("Lazy");

            dispatchKeydown("ArrowLeft");
            dispatchKeydown("ArrowRight");
            expect(load).toHaveBeenCalledTimes(1);
        });

        it("does not expand a disabled node from its expander button", () => {
            setupTree();
            const node1 = treeService.nodeSet().first();
            treeService.setDisableOptions({ enabled: true });
            treeService.setDisabledKeys([node1.data]);
            fixture.detectChanges();
            const expander = fixture.nativeElement.querySelector("li[role=treeitem] button") as HTMLButtonElement;
            expect(expander.disabled).toBe(true);
            expect(treeService.toggleNodeExpand(node1, true)).toBe(false);
            expect(treeService.isExpanded(node1)).toBe(false);
        });
    });

    describe("accessibility", () => {
        it("has no axe violations for an expanded tree", async () => {
            setupTree();
            fixture.componentRef.setInput("ariaLabel", "Files");
            treeService.setExpandedKeys([treeService.nodeSet().first().data]);
            fixture.detectChanges();
            await fixture.whenStable();
            const results = await axe.run(fixture.nativeElement, { rules: { "color-contrast": { enabled: false } } });
            const summary = results.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(" ")).join(", ")}`);
            expect(summary).toEqual([]);
        });
    });
});
