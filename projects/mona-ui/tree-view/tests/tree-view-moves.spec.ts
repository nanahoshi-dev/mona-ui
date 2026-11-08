import { LiveAnnouncer } from "@angular/cdk/a11y";
import type { CdkDragEnd } from "@angular/cdk/drag-drop";
import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import {
    moveFlatTreeNode,
    moveTreeNode,
    type NodeDragEndEvent,
    NodeDropEvent,
    NodeDropEventSansTree,
    type TreeNode,
    TreeService
} from "@nanahoshi/mona-ui/internal/tree";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SubTreeComponent } from "../../internal/tree/components/sub-tree/sub-tree.component";
import { TreeViewComponent } from "../components/tree-view/tree-view.component";
import { TreeViewDisableDirective } from "../directives/tree-view-disable.directive";
import { TreeViewDragAndDropDirective } from "../directives/tree-view-drag-and-drop.directive";
import { TreeViewExpandableDirective } from "../directives/tree-view-expandable.directive";

interface Food {
    readonly children?: Food[];
    readonly id: string;
    readonly text: string;
}

interface FlatFood {
    readonly id: string;
    readonly parentId: string | null;
    readonly text: string;
}

function foods(): Food[] {
    return [
        {
            id: "A",
            text: "Fruits",
            children: [
                { id: "A1", text: "Apple" },
                { id: "A2", text: "Avocado" }
            ]
        },
        { id: "B", text: "Vegetables", children: [{ id: "B1", text: "Beet" }] },
        { id: "C", text: "Cereals" }
    ];
}

@Component({
    imports: [TreeViewComponent, TreeViewExpandableDirective, TreeViewDragAndDropDirective, TreeViewDisableDirective],
    template: `
        <mona-tree-view
            aria-label="Food"
            [data]="data()"
            children="children"
            textField="text"
            monaTreeViewExpandable
            expandBy="id"
            [(expandedKeys)]="expanded"
            [monaTreeViewDragAndDrop]="draggable()"
            monaTreeViewDisable
            disableBy="id"
            [disabledKeys]="disabled()"
            (nodeDragEnd)="onDragEnd($event)"
            (nodeDrop)="onDrop($event)"></mona-tree-view>
    `
})
class HostComponent {
    public readonly data = signal<Food[]>(foods());
    public readonly disabled = signal<string[]>([]);
    public readonly draggable = signal<"" | { enabled: false }>("");
    public readonly drops: NodeDropEvent<Food>[] = [];
    public readonly expanded = signal<string[]>([]);
    public apply = true;
    public prevent = false;

    public onDragEnd(event: NodeDragEndEvent<Food>): void {
        event.preventDefault();
    }

    public onDrop(event: NodeDropEvent<Food>): void {
        this.drops.push(event);
        if (this.prevent) {
            event.preventDefault();
        } else if (this.apply) {
            this.data.set(moveTreeNode(this.data(), event, "id", "children"));
        }
    }
}

@Component({
    imports: [TreeViewComponent, TreeViewExpandableDirective, TreeViewDragAndDropDirective],
    template: `
        <mona-tree-view
            aria-label="Food"
            [data]="data()"
            mode="flat"
            idField="id"
            parentIdField="parentId"
            textField="text"
            monaTreeViewExpandable
            expandBy="id"
            [expandedKeys]="['A']"
            monaTreeViewDragAndDrop
            (nodeDrop)="data.set(move(data(), $event))"></mona-tree-view>
    `
})
class FlatHostComponent {
    public readonly data = signal<FlatFood[]>([
        { id: "A", parentId: null, text: "Fruits" },
        { id: "A1", parentId: "A", text: "Apple" },
        { id: "A2", parentId: "A", text: "Avocado" },
        { id: "B", parentId: null, text: "Vegetables" }
    ]);

    public move(data: FlatFood[], event: NodeDropEvent<FlatFood>): FlatFood[] {
        return moveFlatTreeNode(data, event, "id", "parentId");
    }
}

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve, 5));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

describe("tree view moves", () => {
    let announce: ReturnType<typeof vi.fn>;
    let root: HTMLElement;

    function tree(): HTMLElement {
        return root.querySelector("[role='tree']") as HTMLElement;
    }

    function active(): string | null {
        const id = tree().getAttribute("aria-activedescendant");
        return id ? (document.getElementById(id)?.querySelector("mona-tree-node")?.textContent?.trim() ?? null) : null;
    }

    function texts(nodes: readonly { readonly text: string }[]): string[] {
        return nodes.map(node => node.text);
    }

    beforeEach(() => {
        announce = vi.fn();
        TestBed.configureTestingModule({ providers: [{ provide: LiveAnnouncer, useValue: { announce } }] });
    });

    afterEach(() => root?.remove());

    describe("hierarchical data", () => {
        let fixture: ComponentFixture<HostComponent>;
        let host: HostComponent;

        async function press(key: string, init: KeyboardEventInit = {}): Promise<KeyboardEvent> {
            const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init });
            tree().dispatchEvent(event);
            await settle(fixture);
            return event;
        }

        function move(key: string): Promise<KeyboardEvent> {
            return press(key, { ctrlKey: true, shiftKey: true });
        }

        beforeEach(async () => {
            fixture = TestBed.createComponent(HostComponent);
            host = fixture.componentInstance;
            root = fixture.nativeElement as HTMLElement;
            document.body.appendChild(root);
            await settle(fixture);
            tree().focus();
            await settle(fixture);
        });

        it("lists the move shortcuts while dragging is on", async () => {
            expect(tree().getAttribute("aria-keyshortcuts")).toBe(
                "Control+Shift+ArrowUp Control+Shift+ArrowDown Control+Shift+ArrowLeft Control+Shift+ArrowRight"
            );
            host.draggable.set({ enabled: false });
            await settle(fixture);
            expect(tree().hasAttribute("aria-keyshortcuts")).toBe(false);
        });

        it("moves a node past its siblings with Ctrl+Shift+ArrowDown and ArrowUp, and announces it", async () => {
            expect(active()).toBe("Fruits");
            const event = await move("ArrowDown");
            expect(event.defaultPrevented).toBe(true);
            expect(texts(host.data())).toEqual(["Vegetables", "Fruits", "Cereals"]);
            expect(host.drops[0].position).toBe("after");
            expect(host.drops[0].targetNode.data.text).toBe("Vegetables");
            expect(host.drops[0].originalEvent).toBe(event);
            expect(active()).toBe("Fruits");
            expect(announce).toHaveBeenLastCalledWith("Fruits moved after Vegetables", "polite");

            await move("ArrowUp");
            expect(texts(host.data())).toEqual(["Fruits", "Vegetables", "Cereals"]);
            expect(announce).toHaveBeenLastCalledWith("Fruits moved before Vegetables", "polite");
        });

        it("moves a node into its previous sibling, opening it, and back out after its parent", async () => {
            await press("End");
            expect(active()).toBe("Cereals");

            await move("ArrowRight");
            expect(texts(host.data())).toEqual(["Fruits", "Vegetables"]);
            expect(texts(host.data()[1].children ?? [])).toEqual(["Beet", "Cereals"]);
            expect(host.expanded()).toEqual(["B"]);
            expect(active()).toBe("Cereals");
            expect(announce).toHaveBeenLastCalledWith("Cereals moved into Vegetables", "polite");

            await move("ArrowLeft");
            expect(texts(host.data())).toEqual(["Fruits", "Vegetables", "Cereals"]);
            expect(active()).toBe("Cereals");
            expect(announce).toHaveBeenLastCalledWith("Cereals moved after Vegetables", "polite");
        });

        it("does nothing at the ends, or for a disabled node", async () => {
            await move("ArrowUp");
            await move("ArrowLeft");
            expect(host.drops).toHaveLength(0);

            host.disabled.set(["A"]);
            await settle(fixture);
            await move("ArrowDown");
            expect(host.drops).toHaveLength(0);
        });

        it("doesn't announce a move the handler didn't apply", async () => {
            host.apply = false;
            await move("ArrowDown");
            expect(host.drops).toHaveLength(1);
            expect(announce).not.toHaveBeenCalled();

            host.prevent = true;
            await move("ArrowDown");
            expect(host.drops).toHaveLength(2);
            expect(announce).not.toHaveBeenCalled();
        });

        it("leaves Ctrl+Shift+Arrow alone while dragging is off", async () => {
            host.draggable.set({ enabled: false });
            await settle(fixture);
            const event = await move("ArrowDown");
            expect(event.defaultPrevented).toBe(false);
            expect(host.drops).toHaveLength(0);
        });

        it("passes preventDefault() from the nodeDrop handler on to the tree", () => {
            host.prevent = true;
            const service = fixture.debugElement
                .query(By.directive(TreeViewComponent))
                .injector.get<TreeService<Food>>(TreeService);
            const [fruits, vegetables] = service.nodeSet().toArray();
            const drop = new NodeDropEventSansTree({
                event: new MouseEvent("mouseup"),
                position: "after",
                sourceNode: fruits,
                targetNode: vegetables
            });
            service.nodeDrop$.next(drop);
            expect(drop.isDefaultPrevented()).toBe(true);
        });

        it("ends a drag even when the nodeDragEnd handler calls preventDefault()", () => {
            const subTree = fixture.debugElement.query(By.directive(SubTreeComponent))
                .componentInstance as SubTreeComponent<Food>;
            const service = fixture.debugElement
                .query(By.directive(TreeViewComponent))
                .injector.get<TreeService<Food>>(TreeService);
            service.dragging.set(true);
            service.dropAllowed.set(true);
            const node = service.nodeSet().first();
            subTree.onNodeDragEnd({ source: { data: node }, event: new MouseEvent("mouseup") } as unknown as CdkDragEnd<
                TreeNode<Food>
            >);
            expect(service.dragging()).toBe(false);
            expect(service.dropAllowed()).toBe(false);
        });

        it("follows a touch drag to the node under the finger", async () => {
            const service = fixture.debugElement
                .query(By.directive(TreeViewComponent))
                .injector.get<TreeService<Food>>(TreeService);
            const row = root.querySelectorAll<HTMLElement>("li[role='treeitem']")[1];
            const elementFromPoint = vi.fn(() => row.querySelector("mona-tree-node"));
            Object.defineProperty(document, "elementFromPoint", { configurable: true, value: elementFromPoint });
            try {
                service.dragging.set(true);
                await settle(fixture);
                const touchMove = new Event("touchmove", { bubbles: true });
                Object.defineProperty(touchMove, "touches", { value: [{ clientX: 4, clientY: 0 }] });
                Object.defineProperty(touchMove, "changedTouches", { value: [] });
                document.dispatchEvent(touchMove);
                expect(elementFromPoint).toHaveBeenCalledWith(4, 0);
                expect(service.dropPositionSignal()?.targetNode?.data.text).toBe("Vegetables");
            } finally {
                service.dragging.set(false);
                delete (document as { elementFromPoint?: unknown }).elementFromPoint;
            }
        });

        it("returns no snapshot from moveNode for a move it ignores", () => {
            const treeView = fixture.debugElement.query(By.directive(TreeViewComponent))
                .componentInstance as TreeViewComponent<Food>;
            const service = fixture.debugElement
                .query(By.directive(TreeViewComponent))
                .injector.get<TreeService<Food>>(TreeService);
            const fruits = service.nodeSet().first();
            const apple = fruits.children().first();
            expect(treeView.moveNode(fruits.nodeItem, fruits.nodeItem, "before")).toBeNull();
            expect(treeView.moveNode(fruits.nodeItem, apple.nodeItem, "inside")).toBeNull();
            expect(treeView.moveNode(apple.nodeItem, fruits.nodeItem, "inside")).toBeNull();
            expect(treeView.moveNode(apple.nodeItem, fruits.nodeItem, "after")).not.toBeNull();
        });
    });

    describe("flat data", () => {
        it("keeps the moved node active although moveFlatTreeNode replaces its item", async () => {
            const fixture = TestBed.createComponent(FlatHostComponent);
            root = fixture.nativeElement as HTMLElement;
            document.body.appendChild(root);
            await settle(fixture);
            tree().focus();
            await settle(fixture);
            tree().dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
            await settle(fixture);
            expect(active()).toBe("Apple");

            tree().dispatchEvent(
                new KeyboardEvent("keydown", { key: "ArrowLeft", ctrlKey: true, shiftKey: true, bubbles: true })
            );
            await settle(fixture);
            expect(fixture.componentInstance.data().find(food => food.id === "A1")?.parentId).toBeNull();
            expect(active()).toBe("Apple");
            expect(announce).toHaveBeenLastCalledWith("Apple moved after Fruits", "polite");
        });
    });
});
