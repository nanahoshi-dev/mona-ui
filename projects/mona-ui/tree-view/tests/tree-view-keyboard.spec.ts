import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { TreeViewComponent } from "../components/tree-view/tree-view.component";
import { TreeViewCheckableDirective } from "../directives/tree-view-checkable.directive";
import { TreeViewExpandableDirective } from "../directives/tree-view-expandable.directive";
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
    { id: "B", text: "Vegetables", children: [{ id: "B1", text: "Beet" }] },
    { id: "C", text: "Cereals" }
];

@Component({
    imports: [TreeViewComponent, TreeViewExpandableDirective, TreeViewSelectableDirective, TreeViewCheckableDirective],
    template: `
        <div [attr.dir]="dir()">
            <mona-tree-view
                ariaLabel="Food"
                [data]="data"
                children="children"
                textField="text"
                monaTreeViewExpandable
                expandBy="id"
                [(expandedKeys)]="expanded"
                monaTreeViewSelectable
                selectBy="id"
                [(selectedKeys)]="selected"
                [monaTreeViewCheckable]="checkable()"
                checkBy="id"
                [(checkedKeys)]="checked"></mona-tree-view>
        </div>
    `
})
class HostComponent {
    public readonly checkable = signal<"" | { enabled: false }>({ enabled: false });
    public readonly checked = signal<string[]>([]);
    public readonly data = FOODS;
    public readonly dir = signal<"ltr" | "rtl">("ltr");
    public readonly expanded = signal<string[]>([]);
    public readonly selected = signal<string[]>([]);
}

describe("tree view keyboard", () => {
    let fixture: ComponentFixture<HostComponent>;
    let host: HostComponent;
    let root: HTMLElement;

    async function settle(): Promise<void> {
        fixture.detectChanges();
        await fixture.whenStable();
        await new Promise(resolve => setTimeout(resolve, 5));
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    function tree(): HTMLElement {
        return root.querySelector("[role='tree']") as HTMLElement;
    }

    function active(): string | null {
        const id = tree().getAttribute("aria-activedescendant");
        return id ? (document.getElementById(id)?.querySelector("mona-tree-node")?.textContent?.trim() ?? null) : null;
    }

    async function press(key: string): Promise<KeyboardEvent> {
        const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
        tree().dispatchEvent(event);
        await settle();
        return event;
    }

    beforeEach(async () => {
        fixture = TestBed.createComponent(HostComponent);
        host = fixture.componentInstance;
        root = fixture.nativeElement as HTMLElement;
        document.body.appendChild(root);
        await settle();
        tree().focus();
        await settle();
    });

    afterEach(() => root.remove());

    it("activates the first node on focus and moves with the arrows, Home and End", async () => {
        expect(active()).toBe("Fruits");
        await press("ArrowDown");
        expect(active()).toBe("Vegetables");
        await press("End");
        expect(active()).toBe("Cereals");
        await press("Home");
        expect(active()).toBe("Fruits");
        expect((await press("ArrowUp")).defaultPrevented).toBe(true);
    });

    it("opens with ArrowRight, then moves to the first child; ArrowLeft goes to the parent, then collapses", async () => {
        await press("ArrowRight");
        expect(host.expanded()).toEqual(["A"]);
        expect(active()).toBe("Fruits");

        await press("ArrowRight");
        expect(active()).toBe("Apple");

        await press("ArrowLeft");
        expect(active()).toBe("Fruits");

        await press("ArrowLeft");
        expect(host.expanded()).toEqual([]);
        expect(active()).toBe("Fruits");
    });

    it("swaps ArrowLeft and ArrowRight in RTL", async () => {
        host.dir.set("rtl");
        await settle();

        await press("ArrowRight");
        expect(host.expanded()).toEqual([]);

        await press("ArrowLeft");
        expect(host.expanded()).toEqual(["A"]);
        await press("ArrowLeft");
        expect(active()).toBe("Apple");

        await press("ArrowRight");
        expect(active()).toBe("Fruits");
        await press("ArrowRight");
        expect(host.expanded()).toEqual([]);
    });

    it("expands every sibling with *", async () => {
        await press("*");
        expect([...host.expanded()].sort()).toEqual(["A", "B"]);
    });

    it("moves to the next node starting with the typed text", async () => {
        await press("v");
        expect(active()).toBe("Vegetables");
        await press("End");
        // Let the typeahead buffer reset, so "f" starts a new search.
        await new Promise(resolve => setTimeout(resolve, 300));
        await press("f");
        expect(active()).toBe("Fruits");
    });

    it("selects with Enter and checks with Space", async () => {
        await press("ArrowDown");
        await press("Enter");
        expect(host.selected()).toEqual(["B"]);

        host.checkable.set("");
        await settle();
        await press(" ");
        expect(host.checked()).toContain("B");
    });
});
