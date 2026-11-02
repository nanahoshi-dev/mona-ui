import { TestBed } from "@angular/core/testing";
import { of } from "rxjs";

import { TreeNode } from "../models/TreeNode";
import { TreeService } from "./tree.service";

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

describe("TreeService", () => {
    let service: TreeService<TestItem>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [TreeService]
        });
        service = TestBed.inject(TreeService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    function setupTree(): { node1: TreeNode<TestItem>; node2: TreeNode<TestItem>; data: TestItem[] } {
        const data = buildData();
        service.setDataStructure("hierarchical");
        service.setChildrenSelector("children");
        service.setTextField("text");
        service.setData(data);
        const node1 = service.nodeSet().first(n => n.data.id === "1");
        const node2 = service.nodeSet().first(n => n.data.id === "2");
        return { node1, node2, data };
    }

    describe("getNodeElementId", () => {
        it("derives a stable id from the node uid", () => {
            expect(service.getNodeElementId("abc")).toBe("mona-tree-node-abc");
        });
    });

    describe("selection", () => {
        it("replaces the selection when in single mode", () => {
            const { node1, node2 } = setupTree();
            service.setSelectableOptions({ enabled: true, mode: "single", childrenOnly: false });

            service.setNodeSelect(node1, true);
            expect(service.isSelected(node1)).toBe(true);

            service.setNodeSelect(node2, true);
            expect(service.isSelected(node2)).toBe(true);
            expect(service.isSelected(node1)).toBe(false);
        });

        it("deselects an already-selected node when toggleable", () => {
            const { node1 } = setupTree();
            service.setSelectableOptions({ enabled: true, mode: "single", toggleable: true, childrenOnly: false });

            service.setNodeSelect(node1, true);
            expect(service.isSelected(node1)).toBe(true);

            service.setNodeSelect(node1, true);
            expect(service.isSelected(node1)).toBe(false);
        });

        it("keeps selections independent in multiple mode", () => {
            const { node1, node2 } = setupTree();
            service.setSelectableOptions({ enabled: true, mode: "multiple", childrenOnly: false });

            service.setNodeSelect(node1, true);
            service.setNodeSelect(node2, true);
            expect(service.isSelected(node1)).toBe(true);
            expect(service.isSelected(node2)).toBe(true);

            service.setNodeSelect(node1, false);
            expect(service.isSelected(node1)).toBe(false);
            expect(service.isSelected(node2)).toBe(true);
        });
    });

    describe("checking", () => {
        it("checks all descendants when a parent is checked", () => {
            const { node1 } = setupTree();
            service.setCheckableOptions({ enabled: true, mode: "multiple", checkChildren: true, checkParents: true });

            service.setNodeCheck(node1, true);

            node1.children().forEach(child => expect(service.isChecked(child)).toBe(true));
        });

        it("marks a parent indeterminate when only some children are checked, and checked when all are", () => {
            const { node1 } = setupTree();
            service.setCheckableOptions({ enabled: true, mode: "multiple", checkChildren: true, checkParents: true });
            const [child1, child2] = node1.children().toArray();

            service.setNodeCheck(child1, true);
            expect(service.isIndeterminate(node1)).toBe(true);
            expect(service.isChecked(node1)).toBe(false);

            service.setNodeCheck(child2, true);
            expect(service.isIndeterminate(node1)).toBe(false);
            expect(service.isChecked(node1)).toBe(true);
        });

        it("unchecks all descendants when a checked parent is unchecked", () => {
            const { node1 } = setupTree();
            service.setCheckableOptions({ enabled: true, mode: "multiple", checkChildren: true, checkParents: true });

            service.setNodeCheck(node1, true);
            service.setNodeCheck(node1, false);

            node1.children().forEach(child => expect(service.isChecked(child)).toBe(false));
        });
    });

    describe("disabling", () => {
        it("disables descendants of a disabled node when disableChildren is enabled", () => {
            const { node1 } = setupTree();
            service.setDisableOptions({ enabled: true, disableChildren: true });
            service.setDisabledKeys([node1.data]);

            node1.children().forEach(child => expect(service.isDisabled(child)).toBe(true));
        });

        it("does not disable descendants when disableChildren is false", () => {
            const { node1 } = setupTree();
            service.setDisableOptions({ enabled: true, disableChildren: false });
            service.setDisabledKeys([node1.data]);

            node1.children().forEach(child => expect(service.isDisabled(child)).toBe(false));
        });
    });

    describe("navigate", () => {
        it("moves through visible nodes in document order", () => {
            const { node1, node2 } = setupTree();
            service.setExpandableOptions({ enabled: true });
            service.setExpandedKeys([node1.data]);

            const first = service.navigate("first");
            expect(first).toBe(node1);

            const next = service.navigate("next");
            expect(next?.data.id).toBe("1.1");

            const last = service.navigate("last");
            expect(last).toBe(node2);

            const previous = service.navigate("previous");
            expect(previous?.data.id).toBe("1.2");
        });

        it("does not navigate into collapsed nodes", () => {
            const { node1 } = setupTree();
            service.setExpandableOptions({ enabled: true });

            const first = service.navigate("first");
            expect(first).toBe(node1);

            const next = service.navigate("next");
            expect(next?.data.id).toBe("2");
        });
    });

    describe("navigation order", () => {
        it("follows document order with ten or more siblings", () => {
            const data: TestItem[] = Array.from({ length: 12 }, (_, i) => ({ id: String(i), text: `Node ${i}` }));
            service.setChildrenSelector("children");
            service.setTextField("text");
            service.setData(data);
            const visited: string[] = [service.navigate("first")?.data.id ?? ""];
            for (let i = 0; i < 11; i++) {
                visited.push(service.navigate("next")?.data.id ?? "");
            }
            expect(visited).toEqual(data.map(d => d.id));
        });

        it("places lazily loaded children right after their parent", () => {
            const lazyChildren: TestItem[] = [
                { id: "1.1", text: "Lazy 1.1" },
                { id: "1.2", text: "Lazy 1.2" }
            ];
            const data: TestItem[] = [
                { id: "1", text: "Node 1" },
                { id: "2", text: "Node 2" }
            ];
            service.setChildrenSelector(item => (item.id === "1" ? of(lazyChildren) : []));
            service.setTextField("text");
            service.setData(data);
            service.setExpandableOptions({ enabled: true });
            service.setExpandedKeys([data[0]]);
            service.loadNodeChildren(service.nodeSet().first());

            expect(service.navigate("first")?.data.id).toBe("1");
            expect(service.navigate("next")?.data.id).toBe("1.1");
            expect(service.navigate("next")?.data.id).toBe("1.2");
            expect(service.navigate("next")?.data.id).toBe("2");
        });
    });

    describe("data", () => {
        it("renders leaf items when no children selector is set", () => {
            service.setTextField("text");
            service.setData([
                { id: "a", text: "A" },
                { id: "b", text: "B" }
            ]);
            expect(service.nodeSet().size()).toBe(2);
        });

        it("gives a data object that appears twice a node for each occurrence", () => {
            const shared: TestItem = { id: "s", text: "Shared" };
            const data: TestItem[] = [
                { id: "1", text: "Node 1", children: [shared] },
                { id: "2", text: "Node 2", children: [shared] }
            ];
            service.setChildrenSelector("children");
            service.setTextField("text");
            service.setData(data);
            expect(() => service.setData([...data])).not.toThrow();
            const [first, second] = service.nodeSet().toArray();
            const firstChild = first.children().single();
            const secondChild = second.children().single();
            expect(firstChild).not.toBe(secondChild);
            expect(firstChild.parent).toBe(first);
            expect(secondChild.parent).toBe(second);
        });

        it("keeps node instances when the same data is set again", () => {
            const { node1, data } = setupTree();
            service.setData([...data]);
            expect(service.nodeSet().first()).toBe(node1);
        });
    });

    describe("disabling performance", () => {
        it("checks ancestors in linear time", () => {
            let data: TestItem = { id: "leaf", text: "Leaf" };
            for (let depth = 0; depth < 24; depth++) {
                data = { id: `d${depth}`, text: `Depth ${depth}`, children: [data] };
            }
            service.setChildrenSelector("children");
            service.setTextField("text");
            service.setData([data]);
            service.setDisableOptions({ enabled: true, disableChildren: true });
            service.setDisabledKeys([]);
            const leaf = TreeService.flatten(service.nodeSet()).last();
            const getDisableKey = vi.spyOn(service as unknown as { getDisableKey: () => unknown }, "getDisableKey");
            expect(service.isDisabled(leaf)).toBe(false);
            expect(getDisableKey.mock.calls.length).toBeLessThanOrEqual(26);
        });
    });

    describe("moveNode", () => {
        it("ignores moving a node into its own subtree", () => {
            const { node1 } = setupTree();
            const child = node1.children().first();
            service.moveNode(node1, child, "inside");
            service.moveNode(node1, child, "before");
            service.moveNode(node1, node1, "after");
            expect(node1.parent).toBeNull();
            expect(child.parent).toBe(node1);
            expect(service.nodeSet().first()).toBe(node1);
        });
    });
});
