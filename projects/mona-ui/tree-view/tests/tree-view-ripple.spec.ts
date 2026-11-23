import { Component } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRipple } from "@nanahoshi/mona-ui/ripple";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { TreeViewComponent } from "../components/tree-view/tree-view.component";
import { TreeViewDisableDirective } from "../directives/tree-view-disable.directive";
import { TreeViewExpandableDirective } from "../directives/tree-view-expandable.directive";

interface Folder {
    readonly children?: Folder[];
    readonly id: string;
    readonly text: string;
}

const DOCUMENTS: Folder = { id: "documents", text: "Documents", children: [{ id: "letters", text: "Letters" }] };
const ARCHIVE: Folder = { id: "archive", text: "Archive" };

@Component({
    imports: [TreeViewComponent, TreeViewDisableDirective, TreeViewExpandableDirective],
    template: `
        <mona-tree-view
            aria-label="Folders"
            [data]="data"
            children="children"
            textField="text"
            monaTreeViewExpandable
            monaTreeViewDisable
            [disabledKeys]="disabled"></mona-tree-view>
    `
})
class TreeViewRippleHostComponent {
    public readonly data = [DOCUMENTS, ARCHIVE];
    public readonly disabled = [ARCHIVE];
}

const animateDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, "animate");

describe("TreeViewComponent ripple", () => {
    let fixture: ComponentFixture<TreeViewRippleHostComponent>;
    // The node's text is drawn in the element inside mona-tree-node, which is what shows the hover and the selection.
    const node = (text: string): HTMLElement => {
        const found = Array.from(
            fixture.nativeElement.querySelectorAll("mona-tree-node > div") as NodeListOf<HTMLElement>
        ).find(element => element.textContent?.trim() === text);
        if (!found) {
            throw new Error(`No node "${text}"`);
        }
        return found;
    };
    const layer = (element: Element): Element | null => element.querySelector(":scope > span[dir='ltr']");
    const press = (target: Element): void => {
        target.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, clientX: 4, clientY: 4 }));
    };

    beforeEach(async () => {
        Object.defineProperty(Element.prototype, "animate", {
            configurable: true,
            writable: true,
            value: (): Animation => ({ finished: Promise.resolve() }) as unknown as Animation
        });
        TestBed.configureTestingModule({ imports: [TreeViewRippleHostComponent], providers: [provideRipple()] });
        fixture = TestBed.createComponent(TreeViewRippleHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();
    });

    afterEach(() => {
        if (animateDescriptor) {
            Object.defineProperty(Element.prototype, "animate", animateDescriptor);
        } else {
            Reflect.deleteProperty(Element.prototype, "animate");
        }
    });

    it("should ripple a pressed node", () => {
        press(node("Documents").querySelector("span") as Element);
        expect(layer(node("Documents"))).not.toBeNull();
    });

    it("should not ripple the node for a press of its expander", () => {
        const item = node("Documents").closest("li[role='treeitem']") as HTMLElement;
        press(item.querySelector("button") as Element);
        expect(layer(node("Documents"))).toBeNull();
    });

    it("should not ripple a disabled node", () => {
        press(node("Archive"));
        expect(layer(node("Archive"))).toBeNull();
    });
});
