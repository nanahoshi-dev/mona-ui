import { describe, expect, it } from "vitest";
import {
    TreemapKeyboardNavigation,
    type TreemapNavigationEntry,
    type TreemapNavigationIndex
} from "./treemap-keyboard-navigation";

describe("TreemapKeyboardNavigation", () => {
    // Structure:
    // Root
    // ├── Parent1 (p1)
    // │   ├── Child1A (c1a)
    // │   └── Child1B (c1b)
    // └── Parent2 (p2)
    //     └── Child2A (c2a)

    const entries = new Map<string, TreemapNavigationEntry>([
        [
            "p1",
            {
                firstChildId: "c1a",
                lastChildId: "c1b",
                nextDepthFirstId: "c1a",
                nextSiblingId: "p2",
                nodeId: "p1"
            }
        ],
        [
            "c1a",
            {
                nextDepthFirstId: "c1b",
                nextSiblingId: "c1b",
                nodeId: "c1a",
                parentId: "p1",
                previousDepthFirstId: "p1"
            }
        ],
        [
            "c1b",
            {
                nextDepthFirstId: "p2",
                nodeId: "c1b",
                parentId: "p1",
                previousDepthFirstId: "c1a",
                previousSiblingId: "c1a"
            }
        ],
        [
            "p2",
            {
                firstChildId: "c2a",
                lastChildId: "c2a",
                nextDepthFirstId: "c2a",
                nodeId: "p2",
                previousDepthFirstId: "c1b",
                previousSiblingId: "p1"
            }
        ],
        [
            "c2a",
            {
                nodeId: "c2a",
                parentId: "p2",
                previousDepthFirstId: "p2"
            }
        ]
    ]);

    const navIndex: TreemapNavigationIndex = {
        entries,
        firstNodeId: "p1",
        lastNodeId: "c2a"
    };

    it("navigates to first/last node on Home/End", () => {
        expect(TreemapKeyboardNavigation.navigate(undefined, "Home", navIndex)).toBe("p1");
        expect(TreemapKeyboardNavigation.navigate("c1a", "Home", navIndex)).toBe("p1");
        expect(TreemapKeyboardNavigation.navigate("p1", "End", navIndex)).toBe("c2a");
    });

    it("enters first child on ArrowRight from a parent node", () => {
        const next = TreemapKeyboardNavigation.navigate("p1", "ArrowRight", navIndex);
        expect(next).toBe("c1a");
    });

    it("moves to next sibling or depth-first next on ArrowRight from a leaf node", () => {
        const nextFromLeaf = TreemapKeyboardNavigation.navigate("c1a", "ArrowRight", navIndex);
        expect(nextFromLeaf).toBe("c1b");

        const nextFromLastInBranch = TreemapKeyboardNavigation.navigate("c1b", "ArrowRight", navIndex);
        expect(nextFromLastInBranch).toBe("p2");
    });

    it("returns to parent node on ArrowLeft", () => {
        const parentOfC1a = TreemapKeyboardNavigation.navigate("c1a", "ArrowLeft", navIndex);
        expect(parentOfC1a).toBe("p1");

        const parentOfC2a = TreemapKeyboardNavigation.navigate("c2a", "ArrowLeft", navIndex);
        expect(parentOfC2a).toBe("p2");

        // ArrowLeft on top-level node stays on top-level node
        const parentOfP1 = TreemapKeyboardNavigation.navigate("p1", "ArrowLeft", navIndex);
        expect(parentOfP1).toBe("p1");
    });

    it("navigates siblings and depth-first on ArrowDown and ArrowUp", () => {
        const nextSibling = TreemapKeyboardNavigation.navigate("p1", "ArrowDown", navIndex);
        expect(nextSibling).toBe("p2");

        const prevSibling = TreemapKeyboardNavigation.navigate("p2", "ArrowUp", navIndex);
        expect(prevSibling).toBe("p1");

        const nextFromC1a = TreemapKeyboardNavigation.navigate("c1a", "ArrowDown", navIndex);
        expect(nextFromC1a).toBe("c1b");

        const prevFromC1b = TreemapKeyboardNavigation.navigate("c1b", "ArrowUp", navIndex);
        expect(prevFromC1b).toBe("c1a");
    });

    it("returns undefined for non-navigation keys such as Enter, Space, Escape, and letters", () => {
        expect(TreemapKeyboardNavigation.navigate("p1", "Enter", navIndex)).toBeUndefined();
        expect(TreemapKeyboardNavigation.navigate("p1", " ", navIndex)).toBeUndefined();
        expect(TreemapKeyboardNavigation.navigate("p1", "Escape", navIndex)).toBeUndefined();
        expect(TreemapKeyboardNavigation.navigate("p1", "Tab", navIndex)).toBeUndefined();
        expect(TreemapKeyboardNavigation.navigate("p1", "a", navIndex)).toBeUndefined();
        expect(TreemapKeyboardNavigation.navigate(undefined, "Enter", navIndex)).toBeUndefined();
        expect(TreemapKeyboardNavigation.navigate(undefined, "Escape", navIndex)).toBeUndefined();
        expect(TreemapKeyboardNavigation.navigate(undefined, "a", navIndex)).toBeUndefined();
    });
});
