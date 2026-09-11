import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MonaI18nService, MonaTreeViewMessages } from "@nanahoshi/mona-ui/i18n";
import { NodeItem, TreeService } from "@nanahoshi/mona-ui/internal/tree";

import { TreeViewComponent } from "./tree-view.component";

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

describe("TreeViewComponent", () => {
    let component: TreeViewComponent<TestItem>;
    let fixture: ComponentFixture<TreeViewComponent<TestItem>>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TreeViewComponent],
            providers: []
        }).compileComponents();

        fixture = TestBed.createComponent(TreeViewComponent) as unknown as ComponentFixture<
            TreeViewComponent<TestItem>
        >;
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("moveNode / undoMoveNode", () => {
        async function setupTree(): Promise<void> {
            fixture.componentRef.setInput("data", buildData());
            fixture.componentRef.setInput("children", "children");
            fixture.componentRef.setInput("textField", "text");
            fixture.componentRef.setInput("mode", "hierarchical");
            fixture.detectChanges();
            await fixture.whenStable();
        }

        it("moves a node inside another node and can undo the move", async () => {
            await setupTree();
            const nodeSet = component["treeService"].nodeSet();
            const node1 = nodeSet.first(n => n.data.id === "1");
            const node2 = nodeSet.first(n => n.data.id === "2");

            const snapshot = component.moveNode(node2.nodeItem, node1.nodeItem, "inside");

            expect(snapshot).not.toBeNull();
            expect(snapshot!.sourceNodeUid).toBe(node2.uid);
            expect(snapshot!.originalParentUid).toBeNull();
            expect(node2.parent).toBe(node1);

            component.undoMoveNode(snapshot!);

            expect(node2.parent).toBeNull();
            expect(component["treeService"].nodeSet().contains(node2)).toBe(true);
        });

        it("returns null when the drop position is outside", async () => {
            await setupTree();
            const nodeSet = component["treeService"].nodeSet();
            const node1: NodeItem<TestItem> = nodeSet.first(n => n.data.id === "1").nodeItem;
            const node2: NodeItem<TestItem> = nodeSet.first(n => n.data.id === "2").nodeItem;

            expect(component.moveNode(node2, node1, "outside")).toBeNull();
        });

        it("is a no-op when undoing with a stale/unknown source node uid", async () => {
            await setupTree();
            expect(() =>
                component.undoMoveNode({ originalIndex: 0, originalParentUid: null, sourceNodeUid: "unknown-uid" })
            ).not.toThrow();
        });
    });

    describe("i18n & messages", () => {
        it("provides default messages", () => {
            const internals = component as unknown as TreeViewComponentInternals;
            expect(internals.messages()).toEqual({
                collapse: "Collapse",
                expand: "Expand",
                filter: "Filter",
                filterTree: "Filter tree"
            });
        });

        it("derives filterAriaLabel from ariaLabel and messages", () => {
            const internals = component as unknown as TreeViewComponentInternals;
            expect(internals.filterAriaLabel()).toBe("Filter tree");

            fixture.componentRef.setInput("ariaLabel", "Files");
            fixture.detectChanges();
            expect(internals.filterAriaLabel()).toBe("Filter Files");
        });

        it("reacts to dynamic locale change", () => {
            const i18n = TestBed.inject(MonaI18nService);
            const internals = component as unknown as TreeViewComponentInternals;

            i18n.use({
                direction: "rtl",
                id: "ar",
                messages: {
                    treeView: {
                        collapse: "طي",
                        expand: "توسيع",
                        filter: "تصفية",
                        filterTree: "تصفية الشجرة"
                    }
                }
            });
            fixture.detectChanges();

            expect(internals.filterAriaLabel()).toBe("تصفية الشجرة");

            fixture.componentRef.setInput("ariaLabel", "الملفات");
            fixture.detectChanges();
            expect(internals.filterAriaLabel()).toBe("تصفية الملفات");
        });
    });
});

interface TreeViewComponentInternals {
    readonly filterAriaLabel: () => string;
    readonly messages: () => MonaTreeViewMessages;
    readonly treeService: TreeService<unknown>;
}
