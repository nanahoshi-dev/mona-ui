import { Component } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import {
    type DragInfo,
    DraggableDirective,
    type DropEffect,
    DropTargetDirective,
    type DropTargetEvent
} from "@nanahoshi/mona-ui/drag-drop";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BreadcrumbItemComponent } from "../components/breadcrumb-item/breadcrumb-item.component";
import { BreadcrumbComponent } from "../components/breadcrumb/breadcrumb.component";

@Component({
    imports: [BreadcrumbComponent, BreadcrumbItemComponent, DraggableDirective, DropTargetDirective],
    template: `
        <main>
            <div id="file" monaDraggable="report.pdf">report.pdf</div>
            <mona-breadcrumb aria-label="Location">
                @for (folder of folders; track folder) {
                    <mona-breadcrumb-item
                        [monaDropTarget]="folder"
                        [dropEffect]="effectFor"
                        (dropTargetDrop)="drops.push($event)">
                        {{ folder }}
                    </mona-breadcrumb-item>
                }
            </mona-breadcrumb>
        </main>
    `
})
class HostComponent {
    public readonly drops: DropTargetEvent<string>[] = [];
    public readonly folders = ["C:", "Users", "Documents"];

    /** The current folder, last, has the file already: a move there would do nothing. */
    public readonly effectFor = (drag: DragInfo, folder: string): DropEffect =>
        folder === "Documents" && !drag.ctrlKey ? "none" : "move";
}

function pointer(type: string, x: number): PointerEvent {
    return new PointerEvent(type, {
        bubbles: true,
        button: type === "pointerdown" ? 0 : -1,
        buttons: type === "pointerup" ? 0 : 1,
        cancelable: true,
        clientX: x,
        clientY: 10,
        isPrimary: true,
        pointerId: 1,
        pointerType: "mouse"
    });
}

describe("BreadcrumbItemComponent as a drop target", () => {
    let fixture: ComponentFixture<HostComponent>;
    let host: HostComponent;

    const root = (): HTMLElement => fixture.nativeElement as HTMLElement;
    const item = (text: string): HTMLElement =>
        Array.from(root().querySelectorAll<HTMLElement>("li[data-item-index]")).find(
            element => element.textContent?.trim() === text
        )!;
    const settle = async (): Promise<void> => {
        fixture.detectChanges();
        await fixture.whenStable();
        TestBed.tick();
    };
    /** The crumbs are 100 pixels apart, as far as the drag can tell. */
    const over = async (x: number): Promise<void> => {
        window.dispatchEvent(pointer("pointermove", x));
        await settle();
    };

    beforeEach(async () => {
        Object.assign(document, {
            elementFromPoint: (x: number): Element | null => {
                const text = host.folders[Math.floor(x / 100)];
                // The crumb's own button or text, inside the list item.
                return text === undefined ? root().querySelector("main") : item(text).firstElementChild;
            }
        });
        TestBed.configureTestingModule({ imports: [HostComponent] });
        fixture = TestBed.createComponent(HostComponent);
        host = fixture.componentInstance;
        await settle();
    });

    afterEach(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        delete (document as Partial<Document>).elementFromPoint;
    });

    it("marks the crumb a drag is over, and gives it the drop", async () => {
        root().querySelector("#file")!.dispatchEvent(pointer("pointerdown", 0));
        await over(150);

        expect(item("Users").hasAttribute("data-drop-target")).toBe(true);
        expect(item("C:").hasAttribute("data-drop-target")).toBe(false);

        window.dispatchEvent(pointer("pointerup", 150));
        await settle();

        expect(host.drops).toEqual([expect.objectContaining({ effect: "move", target: "Users" })]);
        expect(item("Users").hasAttribute("data-drop-target")).toBe(false);
    });

    it("doesn't mark the current page's crumb where it refuses the drop", async () => {
        root().querySelector("#file")!.dispatchEvent(pointer("pointerdown", 0));
        await over(250);

        expect(item("Documents").hasAttribute("data-drop-target")).toBe(false);

        window.dispatchEvent(pointer("pointerup", 250));
        await settle();

        expect(host.drops).toEqual([]);
    });
});
