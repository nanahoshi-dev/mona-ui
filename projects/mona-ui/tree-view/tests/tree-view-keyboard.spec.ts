import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { TreeViewComponent } from "../components/tree-view/tree-view.component";
import { TreeViewCheckableDirective } from "../directives/tree-view-checkable.directive";
import { TreeViewDisableDirective } from "../directives/tree-view-disable.directive";
import { TreeViewExpandableDirective } from "../directives/tree-view-expandable.directive";
import { TreeViewNodeTemplateDirective } from "../directives/tree-view-node-template.directive";
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
            { id: "A3", text: "Apricot" },
            { id: "A2", text: "Avocado" }
        ]
    },
    {
        id: "B",
        text: "Vegetables",
        children: [
            { id: "B1", text: "Beet" },
            { id: "B2", text: "Roots", children: [{ id: "B21", text: "Carrot" }] }
        ]
    },
    { id: "C", text: "Cereals" }
];

@Component({
    imports: [
        TreeViewComponent,
        TreeViewExpandableDirective,
        TreeViewSelectableDirective,
        TreeViewCheckableDirective,
        TreeViewDisableDirective
    ],
    template: `
        <div [attr.dir]="dir()">
            <mona-tree-view
                aria-label="Food"
                [data]="data"
                children="children"
                textField="text"
                [monaTreeViewExpandable]="expandable()"
                expandBy="id"
                [(expandedKeys)]="expanded"
                monaTreeViewSelectable
                selectBy="id"
                [(selectedKeys)]="selected"
                (nodeSelect)="nodeSelects = nodeSelects + 1"
                (selectionChange)="selectionChanges = selectionChanges + 1"
                [monaTreeViewCheckable]="checkable()"
                checkBy="id"
                [(checkedKeys)]="checked"
                monaTreeViewDisable
                disableBy="id"
                [disabledKeys]="disabled()"></mona-tree-view>
        </div>
    `
})
class HostComponent {
    public readonly checkable = signal<"" | { enabled: false }>({ enabled: false });
    public readonly checked = signal<string[]>([]);
    public readonly data = FOODS;
    public readonly dir = signal<"ltr" | "rtl">("ltr");
    public readonly disabled = signal<string[]>([]);
    public readonly expandable = signal<"" | { enabled: false }>("");
    public readonly expanded = signal<string[]>([]);
    public readonly selected = signal<string[]>([]);
    public nodeSelects = 0;
    public selectionChanges = 0;
}

@Component({
    imports: [TreeViewComponent, TreeViewExpandableDirective, TreeViewNodeTemplateDirective],
    template: `
        <mona-tree-view
            aria-label="Food"
            [data]="data"
            children="children"
            textField="text"
            monaTreeViewExpandable
            expandBy="id"
            [(expandedKeys)]="expanded">
            <ng-template monaTreeViewNodeTemplate let-item>
                {{ item.text }} <input [attr.aria-label]="'Rename ' + item.text" />
            </ng-template>
        </mona-tree-view>
    `
})
class TemplateHostComponent {
    public readonly data = FOODS;
    public readonly expanded = signal<string[]>([]);
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

    async function press(key: string, init: KeyboardEventInit = {}): Promise<KeyboardEvent> {
        const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init });
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

    it("reports nothing for Enter on the node that is already selected", async () => {
        await press("Enter");
        expect(host.selected()).toEqual(["A"]);
        expect([host.nodeSelects, host.selectionChanges]).toEqual([1, 1]);

        await press("Enter");
        expect(host.selected()).toEqual(["A"]);
        expect([host.nodeSelects, host.selectionChanges]).toEqual([1, 1]);
    });

    it("keeps the active node while a longer typeahead still matches it", async () => {
        await press("ArrowRight");
        await press("a");
        expect(active()).toBe("Apple");
        await press("p");
        expect(active()).toBe("Apple");
        await press("r");
        expect(active()).toBe("Apricot");
    });

    it("leaves keys with Ctrl, Alt or Meta, and keys while composing, to the page", async () => {
        for (const init of [{ ctrlKey: true }, { altKey: true }, { metaKey: true }, { isComposing: true }]) {
            const event = await press("ArrowDown", init);
            expect(event.defaultPrevented).toBe(false);
            expect(active()).toBe("Fruits");
        }
    });

    it("moves to the parent with ArrowLeft when expanding is off, without writing expanded keys", async () => {
        host.expandable.set({ enabled: false });
        await settle();
        await press("ArrowRight");
        expect(active()).toBe("Apple");

        await press("ArrowLeft");
        expect(active()).toBe("Fruits");
        await press("ArrowLeft");
        expect(active()).toBe("Fruits");
        await press("*");
        expect(host.expanded()).toEqual([]);
    });

    it("moves from a disabled open node to its parent with ArrowLeft", async () => {
        host.expanded.set(["B", "B2"]);
        host.disabled.set(["B2"]);
        await settle();
        await press("End");
        await press("ArrowUp");
        await press("ArrowUp");
        expect(active()).toBe("Roots");

        await press("ArrowLeft");
        expect(active()).toBe("Vegetables");
        expect(host.expanded()).toEqual(["B", "B2"]);
    });
});

describe("tree view keyboard with controls in node templates", () => {
    it("leaves keys typed into a control in a node template to that control", async () => {
        const fixture: ComponentFixture<TemplateHostComponent> = TestBed.createComponent(TemplateHostComponent);
        const root = fixture.nativeElement as HTMLElement;
        document.body.appendChild(root);
        try {
            fixture.detectChanges();
            await fixture.whenStable();
            const tree = root.querySelector("[role='tree']") as HTMLElement;
            tree.focus();
            await new Promise(resolve => setTimeout(resolve, 5));
            fixture.detectChanges();
            const input = root.querySelector("input") as HTMLInputElement;
            for (const key of ["ArrowRight", "Home", " ", "a"]) {
                const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
                input.dispatchEvent(event);
                expect(event.defaultPrevented).toBe(false);
            }
            fixture.detectChanges();
            expect(fixture.componentInstance.expanded()).toEqual([]);

            const event = new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true });
            tree.dispatchEvent(event);
            expect(event.defaultPrevented).toBe(true);
        } finally {
            root.remove();
        }
    });
});
