import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { createTreeStyleStrategy, provideTreeStyles, TREE_STYLE_STRATEGY } from "./tree.styles";

describe("tree style strategy", () => {
    it("uses a distinct Apple-inspired recipe for Reina", () => {
        const strategy = createTreeStyleStrategy();

        const mona = strategy.resolve("mona").treeNodeBase({ selected: true });
        const reina = strategy.resolve("reina").treeNodeBase({ selected: true });

        expect(reina).not.toBe(mona);
        expect(reina).toContain("rounded-md");
    });

    it("merges provider overrides after the built-in recipe for the targeted sub-recipe only", () => {
        const strategy = createTreeStyleStrategy([
            {
                treeNodeBase: { base: "provider-tree-node-base" }
            }
        ]);

        const nodeBaseClasses = strategy.resolve("mona").treeNodeBase();
        const containerClasses = strategy.resolve("mona").treeNodeContainer();

        expect(nodeBaseClasses).toContain("provider-tree-node-base");
        expect(containerClasses).not.toContain("provider-tree-node-base");
    });

    it("supports theme-specific provider overrides", () => {
        const strategy = createTreeStyleStrategy([
            {
                theme: "reina",
                treeNodeBase: { selected: { true: "reina-provider-selected" } }
            }
        ]);

        expect(strategy.resolve("mona").treeNodeBase({ selected: true })).not.toContain("reina-provider-selected");
        expect(strategy.resolve("reina").treeNodeBase({ selected: true })).toContain("reina-provider-selected");
    });

    it("resolves provider overrides through Angular dependency injection", () => {
        TestBed.configureTestingModule({
            providers: [
                provideTreeStyles({
                    treeNodeExpander: { base: "injected-tree-node-expander" }
                })
            ]
        });

        const strategy = TestBed.inject(TREE_STYLE_STRATEGY);

        expect(strategy.resolve("mona").treeNodeExpander()).toContain("injected-tree-node-expander");
    });

    it("accepts a complete replacement strategy", () => {
        TestBed.configureTestingModule({
            providers: [
                provideTreeStyles({
                    strategy: {
                        resolve: () => ({
                            subTreeList: () => "replacement-sub-tree-list",
                            subTreeListItem: () => "replacement-sub-tree-list-item",
                            treeBase: () => "replacement-tree-base",
                            treeDropHintBase: () => "replacement-tree-drop-hint-base",
                            treeDropHintIcon: () => "replacement-tree-drop-hint-icon",
                            treeNodeBase: () => "replacement-tree-node-base",
                            treeNodeContainer: () => "replacement-tree-node-container",
                            treeNodeDragging: () => "replacement-tree-node-dragging",
                            treeNodeExpander: () => "replacement-tree-node-expander"
                        })
                    }
                })
            ]
        });

        const strategy = TestBed.inject(TREE_STYLE_STRATEGY);

        expect(strategy.resolve("mona").treeNodeBase()).toBe("replacement-tree-node-base");
    });
});
