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
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GridColumnComponent } from "../components/grid-column/grid-column.component";
import { GridComponent } from "../components/grid/grid.component";
import { GridRowDragDropDirective } from "../directives/grid-row-drag-drop.directive";
import { GridSelectableDirective } from "../directives/grid-selectable.directive";

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

@Component({
    imports: [
        DragPreviewTemplateDirective,
        DropTargetDirective,
        GridColumnComponent,
        GridComponent,
        GridRowDragDropDirective,
        GridSelectableDirective
    ],
    template: `
        <main monaDropTarget="Background" dropEffect="copy" (dropTargetDrop)="drops.push($event)">
            <mona-grid
                [data]="entries"
                [monaGridRowDragDrop]="draggable()"
                [monaGridSelectable]="{ mode: 'multiple', selectOnRowClick: true }"
                [rowDropEffect]="effectFor"
                [selectedKeys]="selected()"
                selectBy="id"
                (rowDragEnd)="ends.push($event)"
                (rowDragStart)="starts.push($event)"
                (rowDrop)="drops.push($event)"
                (rowDropEnter)="enters.push($event)"
                (selectedKeysChange)="onSelect($event)">
                <mona-grid-column field="name" title="Name"></mona-grid-column>
                <ng-template monaDragPreview let-entries let-effect="effect" let-target="target">
                    <span id="preview-text">{{ effect }} {{ entries.length }} to {{ target?.name }}</span>
                </ng-template>
            </mona-grid>
        </main>
    `
})
class HostComponent {
    public readonly draggable = signal(true);
    public readonly drops: DropTargetEvent[] = [];
    public readonly ends: DragEndEvent<Entry[]>[] = [];
    public readonly enters: DropTargetEvent<Entry>[] = [];
    public readonly entries = ENTRIES;
    public readonly selected = signal<unknown[]>([]);
    public readonly selections: unknown[][] = [];
    public readonly starts: DragStartEvent<Entry[]>[] = [];

    /** Folders take drops, as in a file list; files aren't targets. */
    public readonly effectFor = (drag: DragInfo, entry: Entry): DropEffect | null => {
        if (!entry.folder) {
            return null;
        }
        return (drag.data as Entry[]).includes(entry) ? "none" : drag.ctrlKey ? "copy" : "move";
    };

    public onSelect(keys: unknown[]): void {
        this.selections.push(keys);
        this.selected.set(keys);
    }
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

describe("GridRowDragDropDirective", () => {
    let fixture: ComponentFixture<HostComponent>;
    let host: HostComponent;

    const root = (): HTMLElement => fixture.nativeElement as HTMLElement;
    const row = (name: string): HTMLElement =>
        Array.from(root().querySelectorAll<HTMLElement>("tr[data-ruid]")).find(element =>
            element.textContent?.includes(name)
        )!;
    const cell = (name: string): HTMLElement => row(name).querySelector("td")!;
    const settle = async (): Promise<void> => {
        fixture.detectChanges();
        await fixture.whenStable();
        TestBed.tick();
    };
    const press = (name: string): void => {
        cell(name).dispatchEvent(pointer("pointerdown", 0));
    };
    /** Each row is 100 pixels along, as far as the drag can tell; past them, the page. */
    const over = async (x: number, init: PointerEventInit = {}): Promise<void> => {
        window.dispatchEvent(pointer("pointermove", x, init));
        await settle();
    };
    const release = async (x: number, init: PointerEventInit = {}): Promise<void> => {
        window.dispatchEvent(pointer("pointerup", x, init));
        await settle();
    };

    beforeEach(async () => {
        Object.assign(document, {
            elementFromPoint: (x: number): Element | null => {
                const index = Math.floor(x / 100);
                return index < ENTRIES.length ? cell(ENTRIES[index].name) : root().querySelector("main");
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

    it("drags the selected rows in the order shown, and keeps the selection when one of them is pressed", async () => {
        host.selected.set([4, 2]);
        await settle();
        press("photo.jpg");
        await over(380);

        expect(host.starts.map(start => start.data.map(entry => entry.name))).toEqual([["Music", "photo.jpg"]]);
        expect(host.selections).toEqual([]);
    });

    it("selects a row that isn't selected before dragging it alone", async () => {
        host.selected.set([2]);
        await settle();
        press("notes.txt");
        await over(380);

        expect(host.selections).toEqual([[3]]);
        expect(host.starts.map(start => start.data.map(entry => entry.name))).toEqual([["notes.txt"]]);
    });

    it("drops on a folder's row, which shows it, with what the drop does", async () => {
        press("notes.txt");
        await over(150);

        expect(row("Music").hasAttribute("data-drop-target")).toBe(true);
        expect(host.enters).toEqual([expect.objectContaining({ effect: "move", target: ENTRIES[1] })]);
        expect(document.querySelector("#preview-text")?.textContent?.trim()).toBe("move 1 to Music");

        await release(150, { ctrlKey: true });

        expect(host.drops).toEqual([expect.objectContaining({ effect: "copy", target: ENTRIES[1] })]);
        expect(host.ends.map(end => end.effect)).toEqual(["copy"]);
        expect(row("Music").hasAttribute("data-drop-target")).toBe(false);
    });

    it("refuses a drop on a folder that is dragged", async () => {
        press("Music");
        await over(150);

        expect(row("Music").hasAttribute("data-drop-target")).toBe(false);

        await release(150);

        expect(host.drops).toEqual([]);
        expect(host.ends.map(end => end.effect)).toEqual(["none"]);
    });

    it("passes a drag over a file's row to the target around the grid", async () => {
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
        cell("Documents").click();
        await settle();

        expect(host.selections).toEqual([]);
    });

    it("leaves rows as drop targets only when they can't be dragged", async () => {
        host.draggable.set(false);
        await settle();
        press("notes.txt");
        await over(150);

        expect(host.starts).toEqual([]);
        expect(document.querySelector("mona-drag-preview")).toBeNull();
    });
});
