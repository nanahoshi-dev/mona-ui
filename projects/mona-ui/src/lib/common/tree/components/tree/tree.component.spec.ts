import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TreeService } from "../../services/tree.service";
import { SubTreeComponent } from "../sub-tree/sub-tree.component";
import { TreeDropHintComponent } from "../tree-drop-hint/tree-drop-hint.component";

import { TreeComponent } from "./tree.component";

interface TestItem {
    id: string;
    text: string;
    children?: TestItem[];
}

function buildData(): TestItem[] {
    return [
        {
            id: "1",
            text: "Node 1",
            children: [
                { id: "1.1", text: "Node 1.1" },
                { id: "1.2", text: "Node 1.2" }
            ]
        },
        { id: "2", text: "Node 2" }
    ];
}

describe("TreeComponent", () => {
    let component: TreeComponent<any>;
    let fixture: ComponentFixture<TreeComponent<any>>;
    let treeService: TreeService<any>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TreeComponent, SubTreeComponent, TreeDropHintComponent],
            providers: [TreeService]
        }).compileComponents();

        fixture = TestBed.createComponent(TreeComponent);
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
});
