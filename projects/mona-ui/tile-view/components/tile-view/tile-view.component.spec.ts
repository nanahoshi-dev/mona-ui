import { Component, signal, viewChild } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import type { MockInstance } from "vitest";
import { TileViewItemTemplateDirective } from "../../directives/tile-view-item-template.directive";
import { TileViewNoDataTemplateDirective } from "../../directives/tile-view-no-data-template.directive";
import type { TileViewItemActivateEvent } from "../../models/TileViewItemActivateEvent";
import type { TileViewSelectionMode } from "../../models/TileViewSelectionMode";
import { TileViewComponent } from "./tile-view.component";

interface Photo {
    readonly id: number;
    readonly name: string;
}

const NAMES = ["Apple", "Banana", "Cherry", "Date", "Elder", "Fig", "Grape", "Kiwi", "Lemon", "Mango"];

function createPhotos(count: number): Photo[] {
    return Array.from({ length: count }, (_, i) => ({ id: i + 1, name: NAMES[i] ?? `Photo ${i + 1}` }));
}

// jsdom has no layout: the viewport is as tall as four rows of tiles (112 + 4).
const VIEWPORT_HEIGHT = 464;

@Component({
    imports: [TileViewComponent, TileViewItemTemplateDirective, TileViewNoDataTemplateDirective],
    template: `
        <div [attr.dir]="dir()">
            <mona-tile-view
                aria-label="Photos"
                itemKey="id"
                textField="name"
                [columns]="3"
                [items]="items()"
                [selectionMode]="mode()"
                [(selectedKeys)]="selected"
                (itemActivate)="activated.push($event)">
                @if (templated()) {
                    <ng-template monaTileViewItemTemplate let-photo let-selected="selected" let-slot="slot">
                        <span class="name" [attr.data-selected]="selected" [attr.data-slot]="slot">{{
                            photo.name
                        }}</span>
                    </ng-template>
                }
                @if (customNoData()) {
                    <ng-template monaTileViewNoDataTemplate><p class="empty">Nothing here</p></ng-template>
                }
            </mona-tile-view>
        </div>
    `
})
class TileViewHostComponent {
    public readonly activated: TileViewItemActivateEvent<Photo>[] = [];
    public readonly customNoData = signal(false);
    public readonly dir = signal<"ltr" | "rtl">("ltr");
    public readonly items = signal(createPhotos(10));
    public readonly mode = signal<TileViewSelectionMode>("multiple");
    public readonly selected = signal<readonly unknown[]>([]);
    public readonly templated = signal(false);
    public readonly tileView = viewChild.required(TileViewComponent);
}

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
    for (let pass = 0; pass < 3; pass++) {
        fixture.detectChanges();
        await fixture.whenStable();
        // The viewport renders its range on the next animation frame.
        await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)));
    }
    fixture.detectChanges();
}

describe("TileViewComponent", () => {
    let fixture: ComponentFixture<TileViewHostComponent>;
    let host: TileViewHostComponent;
    let root: HTMLElement;
    let clientHeight: MockInstance<() => number>;

    const listbox = (): HTMLElement => root.querySelector<HTMLElement>("cdk-virtual-scroll-viewport")!;
    const tiles = (): HTMLElement[] => Array.from(root.querySelectorAll<HTMLElement>("[data-mona-tile]"));
    const tile = (index: number): HTMLElement => tiles()[index];
    const tileText = (element: HTMLElement): string => element.textContent?.trim() ?? "";
    const activeText = (): string => {
        const id = listbox().getAttribute("aria-activedescendant");
        return id == null ? "" : tileText(root.querySelector<HTMLElement>(`#${id}`)!);
    };
    const selectedNames = (): string[] =>
        tiles()
            .filter(element => element.getAttribute("aria-selected") === "true")
            .map(tileText);

    async function click(index: number, init: MouseEventInit = {}): Promise<void> {
        tile(index).dispatchEvent(new MouseEvent("click", { bubbles: true, ...init }));
        await settle(fixture);
    }

    async function press(key: string, init: KeyboardEventInit = {}): Promise<KeyboardEvent> {
        const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init });
        listbox().dispatchEvent(event);
        await settle(fixture);
        return event;
    }

    async function focus(): Promise<void> {
        listbox().focus();
        await settle(fixture);
    }

    beforeEach(async () => {
        clientHeight = vi.spyOn(Element.prototype, "clientHeight", "get").mockImplementation(function (this: Element) {
            return this.tagName === "CDK-VIRTUAL-SCROLL-VIEWPORT" ? VIEWPORT_HEIGHT : 0;
        });
        await TestBed.configureTestingModule({ imports: [TileViewHostComponent] }).compileComponents();
        fixture = TestBed.createComponent(TileViewHostComponent);
        host = fixture.componentInstance;
        root = fixture.nativeElement as HTMLElement;
        document.body.appendChild(root);
        await settle(fixture);
    });

    afterEach(() => {
        root.remove();
        clientHeight.mockRestore();
    });

    describe("rendering", () => {
        it("lays the items out as options in rows of the given number of tiles", () => {
            const rows = Array.from(listbox().querySelectorAll("[role='none']"));

            expect(listbox().getAttribute("role")).toBe("listbox");
            expect(listbox().getAttribute("aria-label")).toBe("Photos");
            expect(listbox().getAttribute("aria-multiselectable")).toBe("true");
            expect(rows.map(row => row.querySelectorAll("[role='option']").length)).toEqual([3, 3, 3, 1]);
            expect(tile(4).getAttribute("aria-posinset")).toBe("5");
            expect(tile(4).getAttribute("aria-setsize")).toBe("10");
            expect(tileText(tile(0))).toBe("Apple");
        });

        it("keeps the accessible name off the host", () => {
            const element = root.querySelector("mona-tile-view")!;

            expect(element.hasAttribute("aria-label")).toBe(false);
        });

        it("renders only the rows in view and a buffer, not every row", async () => {
            host.items.set(createPhotos(3_000));
            await settle(fixture);

            // Four rows fit; two more are buffered below.
            expect(tiles().length).toBeLessThanOrEqual(3 * 8);
            expect(tiles().length).toBeGreaterThanOrEqual(3 * 4);
        });

        it("gives every rendered tile a slot no other has", async () => {
            host.items.set(createPhotos(3_000));
            host.templated.set(true);
            await settle(fixture);

            const slots = Array.from(root.querySelectorAll(".name")).map(element => element.getAttribute("data-slot"));
            expect(new Set(slots).size).toBe(slots.length);
        });

        it("makes the tiles a plain list without selection", async () => {
            host.mode.set("none");
            await settle(fixture);

            expect(listbox().getAttribute("role")).toBe("list");
            expect(listbox().hasAttribute("aria-multiselectable")).toBe(false);
            expect(tile(0).getAttribute("role")).toBe("listitem");
            expect(tile(0).hasAttribute("aria-selected")).toBe(false);
        });

        it("shows no data, described on the listbox, when there are no items", async () => {
            host.items.set([]);
            await settle(fixture);

            const noData = root.querySelector(`#${listbox().getAttribute("aria-describedby")}`);
            expect(noData?.textContent?.trim()).toBe("No data");
            expect(listbox().tabIndex).toBe(0);
            expect(root.querySelector("[role='status']")?.textContent?.trim()).toBe("No data");
        });

        it("shows a custom no-data template", async () => {
            host.customNoData.set(true);
            host.items.set([]);
            await settle(fixture);

            expect(root.querySelector(".empty")?.textContent).toBe("Nothing here");
            // The template says it in its own words; the status doesn't say "No data" over it.
            expect(root.querySelector("[role='status']")?.textContent?.trim()).toBe("");
        });

        it("passes the tile's state to the item template", async () => {
            host.templated.set(true);
            host.selected.set([2]);
            await settle(fixture);

            const names = Array.from(root.querySelectorAll(".name"));
            expect(names[1].getAttribute("data-selected")).toBe("true");
            expect(names[0].getAttribute("data-selected")).toBe("false");
        });
    });

    describe("mouse", () => {
        it("selects only the clicked tile", async () => {
            host.selected.set([1, 2]);
            await click(4);

            expect(host.selected()).toEqual([5]);
            expect(selectedNames()).toEqual(["Elder"]);
            expect(document.activeElement).toBe(listbox());
        });

        it("toggles a tile with Ctrl", async () => {
            await click(0);
            await click(2, { ctrlKey: true });
            expect(host.selected()).toEqual([1, 3]);

            await click(0, { ctrlKey: true });
            expect(host.selected()).toEqual([3]);
        });

        it("selects from the anchor to the clicked tile with Shift", async () => {
            await click(1);
            await click(4, { shiftKey: true });
            expect(host.selected()).toEqual([2, 3, 4, 5]);

            // The anchor stays where the last plain click put it.
            await click(0, { shiftKey: true });
            expect(host.selected()).toEqual([1, 2]);
        });

        it("adds a range with Ctrl and Shift", async () => {
            await click(0);
            await click(4, { ctrlKey: true });
            await click(6, { ctrlKey: true, shiftKey: true });

            expect([...host.selected()].sort((a, b) => Number(a) - Number(b))).toEqual([1, 5, 6, 7]);
        });

        it("clears the selection on a click in empty space", async () => {
            await click(0);
            listbox().dispatchEvent(new MouseEvent("click", { bubbles: true }));
            await settle(fixture);

            expect(host.selected()).toEqual([]);
        });

        it("activates a double-clicked tile", async () => {
            tile(3).dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
            await settle(fixture);

            expect(host.activated.map(event => event.item.name)).toEqual(["Date"]);
        });

        it("selects one tile at a time in single mode", async () => {
            host.mode.set("single");
            await click(0);
            await click(2, { shiftKey: true });

            expect(host.selected()).toEqual([3]);
            expect(listbox().hasAttribute("aria-multiselectable")).toBe(false);
        });
    });

    describe("right-click", () => {
        async function rightClick(element: HTMLElement): Promise<void> {
            element.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, button: 2 }));
            await settle(fixture);
        }

        it("selects a tile that isn't selected in place of the selection, and makes it active", async () => {
            await click(0);
            await click(1, { ctrlKey: true });

            await rightClick(tile(4));

            expect(host.selected()).toEqual([5]);
            expect(document.activeElement).toBe(listbox());
            expect(activeText()).toBe("Elder");
        });

        it("keeps the selection when a selected tile is right-clicked", async () => {
            await click(0);
            await click(1, { ctrlKey: true });

            await rightClick(tile(1));

            expect(host.selected()).toEqual([1, 2]);
            expect(activeText()).toBe("Banana");
        });

        it("clears the selection on a right-click in empty space", async () => {
            await click(0);

            await rightClick(listbox());

            expect(host.selected()).toEqual([]);
        });

        it("selects nothing without selection", async () => {
            host.mode.set("none");
            await settle(fixture);

            await rightClick(tile(2));

            expect(host.selected()).toEqual([]);
        });
    });

    describe("keyboard", () => {
        it("lands on the first tile without selecting it", async () => {
            await focus();

            expect(activeText()).toBe("Apple");
            expect(host.selected()).toEqual([]);
        });

        it("lands on the first selected tile", async () => {
            host.selected.set([5]);
            await settle(fixture);
            await focus();

            expect(activeText()).toBe("Elder");
        });

        it("moves in two dimensions and selects the tile it moves to", async () => {
            await focus();
            const event = await press("ArrowRight");
            expect(event.defaultPrevented).toBe(true);
            expect(activeText()).toBe("Banana");

            await press("ArrowDown");
            expect(activeText()).toBe("Elder");
            expect(host.selected()).toEqual([5]);

            await press("End");
            expect(activeText()).toBe("Mango");
            await press("Home");
            expect(activeText()).toBe("Apple");
        });

        it("swaps the left and right arrows from right to left", async () => {
            host.dir.set("rtl");
            await settle(fixture);
            await focus();

            await press("ArrowLeft");

            expect(activeText()).toBe("Banana");
        });

        it("extends the selection from the anchor with Shift", async () => {
            await focus();
            await press("ArrowRight");
            await press("ArrowDown", { shiftKey: true });

            expect(host.selected()).toEqual([2, 3, 4, 5]);
        });

        it("moves without selecting with Ctrl, and toggles with Ctrl+Space", async () => {
            await focus();
            await press("ArrowRight");
            await press("ArrowRight", { ctrlKey: true });
            await press("ArrowDown", { ctrlKey: true });
            expect(activeText()).toBe("Fig");
            expect(host.selected()).toEqual([2]);

            await press(" ", { ctrlKey: true });
            expect(host.selected()).toEqual([2, 6]);
            await press(" ", { ctrlKey: true });
            expect(host.selected()).toEqual([2]);
        });

        it("selects the active tile with Space", async () => {
            await focus();
            await press(" ");

            expect(host.selected()).toEqual([1]);
        });

        it("selects all with Ctrl+A", async () => {
            await focus();
            const event = await press("a", { ctrlKey: true });

            expect(event.defaultPrevented).toBe(true);
            expect(host.selected()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        });

        it("leaves Ctrl+A alone in single mode", async () => {
            host.mode.set("single");
            await focus();
            const event = await press("a", { ctrlKey: true });

            expect(event.defaultPrevented).toBe(false);
            expect(host.selected()).toEqual([]);
        });

        it("activates the active tile with Enter", async () => {
            await focus();
            await press("ArrowRight");
            await press("Enter", { ctrlKey: true });

            expect(host.activated.map(event => event.item.name)).toEqual(["Banana"]);
            expect((host.activated[0].originalEvent as KeyboardEvent).ctrlKey).toBe(true);
        });

        it("finds a tile by typing the start of its text", async () => {
            await focus();
            await press("g");

            expect(activeText()).toBe("Grape");
            expect(host.selected()).toEqual([7]);
        });

        it("takes a space typed quickly after a letter as part of the text", async () => {
            // The clock stands still, so every key comes within the typeahead delay of the last.
            vi.useFakeTimers({ toFake: ["Date"] });
            try {
                host.items.set([...createPhotos(3), { id: 11, name: "Big fig" }, { id: 12, name: "Big apple" }]);
                await settle(fixture);
                await focus();
                for (const key of ["b", "i", "g", " ", "a"]) {
                    await press(key);
                }

                expect(activeText()).toBe("Big apple");
                expect(host.selected()).toEqual([12]);
            } finally {
                vi.useRealTimers();
            }
        });

        it("leaves Alt with the arrows to the browser", async () => {
            await focus();
            const event = await press("ArrowDown", { altKey: true });

            expect(event.defaultPrevented).toBe(false);
            expect(host.selected()).toEqual([]);
        });
    });

    describe("selection set by the app", () => {
        let scrollTo: MockInstance<Element["scrollTo"]>;

        beforeEach(() => {
            // The setup stubs scrolling out; these specs need the viewport to scroll.
            scrollTo = vi.spyOn(Element.prototype, "scrollTo").mockImplementation(function (
                this: Element,
                options?: ScrollToOptions | number
            ) {
                if (typeof options === "object" && options.top != null) {
                    this.scrollTop = options.top;
                    this.dispatchEvent(new Event("scroll"));
                }
            });
        });

        afterEach(() => scrollTo.mockRestore());

        it("moves the active tile to the first selected one and scrolls it into view", async () => {
            host.items.set(createPhotos(3_000));
            await settle(fixture);
            await focus();

            host.selected.set([2_500, 2_400]);
            await settle(fixture);

            expect(listbox().scrollTop).toBeGreaterThan(0);
            const id = listbox().getAttribute("aria-activedescendant");
            expect(root.querySelector(`#${id}`)?.getAttribute("aria-posinset")).toBe("2400");
        });

        it("keeps the active tile when it is still selected", async () => {
            await focus();
            await press("ArrowRight");
            host.selected.set([2, 9]);
            await settle(fixture);

            expect(activeText()).toBe("Banana");
        });

        it("keeps the active place when its item goes", async () => {
            await focus();
            await press("ArrowRight");
            host.items.set(createPhotos(10).filter(photo => photo.id !== 2));
            await settle(fixture);

            expect(activeText()).toBe("Cherry");
        });

        it("scrolls to an item by its key", async () => {
            host.items.set(createPhotos(3_000));
            await settle(fixture);

            host.tileView().scrollToItem(2_000);
            await settle(fixture);

            expect(listbox().scrollTop).toBeGreaterThan(0);
            expect(tiles().some(element => element.getAttribute("aria-posinset") === "2000")).toBe(true);
        });
    });
});
