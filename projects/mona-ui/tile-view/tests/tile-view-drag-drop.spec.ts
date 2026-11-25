import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import {
    type DragEndEvent,
    type DragInfo,
    DragPreviewTemplateDirective,
    type DragStartEvent,
    type DropEffect,
    DropTargetDirective,
    type DropTargetEvent
} from "@nanahoshi/mona-ui/drag-drop";
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from "vitest";
import { TileViewComponent } from "../components/tile-view/tile-view.component";

interface Entry {
    readonly folder: boolean;
    readonly id: number;
    readonly name: string;
}

const ENTRIES: Entry[] = [
    { folder: true, id: 1, name: "Documents" },
    { folder: true, id: 2, name: "Music" },
    { folder: false, id: 3, name: "notes.txt" },
    { folder: false, id: 4, name: "photo.jpg" }
];

// jsdom has no layout: the viewport is as tall as four rows of tiles (112 + 4).
const VIEWPORT_HEIGHT = 464;

@Component({
    imports: [DragPreviewTemplateDirective, DropTargetDirective, TileViewComponent],
    template: `
        <main monaDropTarget="Background" dropEffect="copy" (dropTargetDrop)="drops.push($event)">
            <mona-tile-view
                aria-label="Files"
                itemKey="id"
                textField="name"
                [columns]="4"
                [items]="entries"
                [tileDraggable]="draggable()"
                [tileDropEffect]="effectFor"
                [(selectedKeys)]="selected"
                (tileDragEnd)="ends.push($event)"
                (tileDragStart)="starts.push($event)"
                (tileDrop)="drops.push($event)"
                (tileDropEnter)="enters.push($event)">
                <ng-template monaDragPreview let-entries let-effect="effect" let-target="target">
                    <span id="preview-text">{{ effect }} {{ entries.length }} to {{ target?.name }}</span>
                </ng-template>
            </mona-tile-view>
        </main>
    `
})
class HostComponent {
    public readonly draggable = signal(true);
    public readonly drops: DropTargetEvent[] = [];
    public readonly ends: DragEndEvent<Entry[]>[] = [];
    public readonly enters: DropTargetEvent<Entry>[] = [];
    public readonly entries = ENTRIES;
    public readonly selected = signal<readonly unknown[]>([]);
    public readonly starts: DragStartEvent<Entry[]>[] = [];

    /** Folders take drops, as in a file explorer; files aren't targets. */
    public readonly effectFor = (drag: DragInfo, entry: Entry): DropEffect | null => {
        if (!entry.folder) {
            return null;
        }
        return (drag.data as Entry[]).includes(entry) ? "none" : drag.ctrlKey ? "copy" : "move";
    };
}

function pointer(type: string, x: number, init: PointerEventInit = {}): PointerEvent {
    return new PointerEvent(type, {
        bubbles: true,
        button: type === "pointerdown" ? 0 : -1,
        buttons: type === "pointerup" ? 0 : 1,
        cancelable: true,
        clientX: x,
        clientY: 10,
        isPrimary: true,
        pointerId: 1,
        pointerType: "mouse",
        ...init
    });
}

describe("TileViewComponent drag and drop", () => {
    let fixture: ComponentFixture<HostComponent>;
    let host: HostComponent;
    let clientHeight: MockInstance<() => number>;

    const tiles = (): HTMLElement[] =>
        Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>("[data-mona-tile]"));
    const tile = (name: string): HTMLElement => tiles().find(element => element.textContent?.includes(name))!;
    const settle = async (): Promise<void> => {
        for (let pass = 0; pass < 3; pass++) {
            fixture.detectChanges();
            await fixture.whenStable();
            // The viewport renders its range on the next animation frame.
            await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)));
        }
        TestBed.tick();
    };
    const press = (name: string): void => {
        tile(name).dispatchEvent(pointer("pointerdown", 0));
    };
    /** Each tile is 100 pixels wide, from the left; past them, the page. */
    const over = async (x: number, init: PointerEventInit = {}): Promise<void> => {
        window.dispatchEvent(pointer("pointermove", x, init));
        await settle();
    };
    const release = async (x: number, init: PointerEventInit = {}): Promise<void> => {
        window.dispatchEvent(pointer("pointerup", x, init));
        await settle();
    };

    beforeEach(async () => {
        clientHeight = vi.spyOn(Element.prototype, "clientHeight", "get").mockImplementation(function (this: Element) {
            return this.tagName === "CDK-VIRTUAL-SCROLL-VIEWPORT" ? VIEWPORT_HEIGHT : 0;
        });
        Object.assign(document, {
            elementFromPoint: (x: number): Element | null => {
                const index = Math.floor(x / 100);
                return index < ENTRIES.length
                    ? tile(ENTRIES[index].name)
                    : (fixture.nativeElement as HTMLElement).querySelector("main");
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
        clientHeight.mockRestore();
    });

    it("drags the selected tiles in order, and keeps the selection when one of them is pressed", async () => {
        host.selected.set([4, 2]);
        await settle();
        press("photo.jpg");
        await over(380);

        expect(host.starts.map(start => start.data.map(entry => entry.name))).toEqual([["Music", "photo.jpg"]]);
        expect(host.selected()).toEqual([4, 2]);
    });

    it("selects a tile that isn't selected before dragging it alone", async () => {
        host.selected.set([2]);
        await settle();
        press("notes.txt");
        await over(380);

        expect(host.selected()).toEqual([3]);
        expect(host.starts.map(start => start.data.map(entry => entry.name))).toEqual([["notes.txt"]]);
    });

    it("drops on a folder's tile, which shows it, with what the drop does", async () => {
        press("notes.txt");
        await over(150);

        expect(tile("Music").hasAttribute("data-drop-target")).toBe(true);
        expect(host.enters).toEqual([expect.objectContaining({ effect: "move", target: ENTRIES[1] })]);
        expect(document.querySelector("#preview-text")?.textContent?.trim()).toBe("move 1 to Music");

        await release(150, { ctrlKey: true });

        expect(host.drops).toEqual([expect.objectContaining({ effect: "copy", target: ENTRIES[1] })]);
        expect(host.ends.map(end => end.effect)).toEqual(["copy"]);
        expect(tile("Music").hasAttribute("data-drop-target")).toBe(false);
    });

    it("refuses a drop on a folder that is dragged", async () => {
        press("Music");
        await over(150);

        expect(tile("Music").hasAttribute("data-drop-target")).toBe(false);

        await release(150);

        expect(host.drops).toEqual([]);
        expect(host.ends.map(end => end.effect)).toEqual(["none"]);
    });

    it("passes a drag over a file's tile to the target around the tile view", async () => {
        press("Music");
        await over(350);
        await release(350);

        expect(host.drops).toEqual([expect.objectContaining({ effect: "copy", target: "Background" })]);
    });

    it("doesn't change the selection with the click that ends a drag", async () => {
        host.selected.set([1, 2]);
        await settle();
        press("Documents");
        await over(250);
        // The click comes in the same task as the release.
        window.dispatchEvent(pointer("pointerup", 250));
        tile("Documents").click();
        await settle();

        expect(host.selected()).toEqual([1, 2]);
    });

    it("drags nothing unless tiles can be dragged", async () => {
        host.draggable.set(false);
        await settle();
        press("notes.txt");
        await over(150);

        expect(host.starts).toEqual([]);
        expect(document.querySelector("mona-drag-preview")).toBeNull();
    });
});
