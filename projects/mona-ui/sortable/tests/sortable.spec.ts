import { LiveAnnouncer } from "@angular/cdk/a11y";
import { type CdkDragDrop, CdkDrag, CdkDropList } from "@angular/cdk/drag-drop";
import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import axe from "axe-core";
import { SortableGroupDirective } from "../directives/sortable-group.directive";
import { SortableHandleDirective } from "../directives/sortable-handle.directive";
import { SortableItemDirective } from "../directives/sortable-item.directive";
import { SortableDirective } from "../directives/sortable.directive";
import type { SortableMoveEvent } from "../models/SortableMoveEvent";
import type { SortableOrientation } from "../models/SortableOrientation";
import { moveItem } from "../utils/moveItem";

@Component({
    imports: [SortableDirective, SortableItemDirective],
    template: `
        <ul
            aria-label="Fruits"
            [(monaSortable)]="fruits"
            [sortableDisabled]="disabled()"
            [sortableOrientation]="orientation()"
            [dir]="direction()"
            (sortableMove)="onMove($event)">
            @for (fruit of fruits(); track fruit) {
                <li tabindex="0" [monaSortableItem]="fruit" [sortableDisabled]="fruit === locked()">
                    {{ fruit }}
                    <input [attr.aria-label]="'Note on ' + fruit" />
                </li>
            }
        </ul>
    `
})
class ListHostComponent {
    public readonly direction = signal<"ltr" | "rtl">("ltr");
    public readonly disabled = signal(false);
    public readonly fruits = signal(["Apple", "Banana", "Cherry", "Damson"]);
    public readonly locked = signal<string | null>(null);
    public readonly moves: SortableMoveEvent<string>[] = [];
    public readonly orientation = signal<SortableOrientation>("vertical");
    public refuse = false;

    public onMove(event: SortableMoveEvent<string>): void {
        this.moves.push(event);
        if (this.refuse) {
            event.preventDefault();
        }
    }
}

@Component({
    imports: [SortableDirective, SortableGroupDirective, SortableItemDirective],
    template: `
        <div monaSortableGroup>
            @for (list of lists; track list.name; let listIndex = $index) {
                <section>
                    <h2 [id]="'title-' + listIndex">{{ list.name }}</h2>
                    <ul
                        [attr.aria-labelledby]="'title-' + listIndex"
                        [(monaSortable)]="list.items"
                        [sortableCanEnter]="list.canEnter">
                        @for (task of list.items(); track task) {
                            <li tabindex="0" [monaSortableItem]="task">{{ task }}</li>
                        }
                    </ul>
                </section>
            }
        </div>
    `
})
class GroupHostComponent {
    public readonly lists = [
        { canEnter: null, items: signal(["Write", "Review"]), name: "To do" },
        { canEnter: () => !this.full, items: signal(["Design"]), name: "Doing" },
        { canEnter: null, items: signal<string[]>([]), name: "Done" }
    ];
    public full = false;
}

@Component({
    imports: [SortableDirective, SortableHandleDirective, SortableItemDirective],
    template: `
        <div role="tablist" aria-label="Views" [monaSortable]="views" sortableOrientation="horizontal">
            @for (view of views; track view) {
                <div role="presentation" [monaSortableItem]="view">
                    <span monaSortableHandle aria-hidden="true">⠿</span>
                    <button type="button" role="tab" aria-selected="false">{{ view }}</button>
                </div>
            }
        </div>
    `
})
class PresentationalHostComponent {
    public readonly views = ["Board", "List"];
}

describe("SortableDirective", () => {
    let announce: ReturnType<typeof vi.fn>;

    async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    async function press(
        fixture: ComponentFixture<unknown>,
        target: HTMLElement,
        key: string,
        init: KeyboardEventInit = { ctrlKey: true, shiftKey: true }
    ): Promise<KeyboardEvent> {
        const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key, ...init });
        target.dispatchEvent(event);
        await settle(fixture);
        return event;
    }

    function items(root: HTMLElement, selector = "li"): HTMLElement[] {
        return Array.from(root.querySelectorAll<HTMLElement>(selector));
    }

    beforeEach(() => {
        announce = vi.fn().mockResolvedValue(undefined);
        TestBed.configureTestingModule({ providers: [{ provide: LiveAnnouncer, useValue: { announce } }] });
    });

    it("declares the CDK's reset layer ahead of the style sheets, once per document", async () => {
        document.head.querySelector("style[data-mona-cdk-resets]")?.remove();
        const sheet = document.createElement("style");
        sheet.textContent = "@layer utilities { li { padding: 1px; } }";
        document.head.append(sheet);
        const first = TestBed.createComponent(ListHostComponent);
        const second = TestBed.createComponent(ListHostComponent);
        await settle(first);
        await settle(second);

        const layers = document.head.querySelectorAll("style[data-mona-cdk-resets]");
        expect(layers).toHaveLength(1);
        expect(layers[0].textContent).toBe("@layer cdk-resets;");
        expect(layers[0].compareDocumentPosition(sheet) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

        first.destroy();
        second.destroy();
        sheet.remove();
    });

    describe("in one list", () => {
        let fixture: ComponentFixture<ListHostComponent>;
        let host: ListHostComponent;
        let root: HTMLElement;

        function item(text: string): HTMLElement {
            return items(root).find(element => element.textContent?.trim() === text)!;
        }

        beforeEach(async () => {
            fixture = TestBed.createComponent(ListHostComponent);
            host = fixture.componentInstance;
            root = fixture.nativeElement as HTMLElement;
            document.body.append(root);
            await settle(fixture);
        });

        afterEach(() => {
            fixture.destroy();
            root.remove();
        });

        it("moves the focused item down with Control+Shift+ArrowDown, keeps focus on it and announces it", async () => {
            item("Apple").focus();

            const event = await press(fixture, item("Apple"), "ArrowDown");

            expect(event.defaultPrevented).toBe(true);
            expect(host.fruits()).toEqual(["Banana", "Apple", "Cherry", "Damson"]);
            expect(items(root).map(element => element.textContent?.trim())).toEqual([
                "Banana",
                "Apple",
                "Cherry",
                "Damson"
            ]);
            expect(document.activeElement).toBe(item("Apple"));
            expect(announce).toHaveBeenCalledWith("Apple moved to position 2 of 4");
            expect(host.moves[0].previousIndex).toBe(0);
            expect(host.moves[0].currentIndex).toBe(1);
            expect(host.moves[0].previousList).toBe(host.moves[0].currentList);
        });

        it("moves with Command+Shift on macOS, and up to the start or end with Home and End", async () => {
            item("Cherry").focus();
            await press(fixture, item("Cherry"), "ArrowUp", { metaKey: true, shiftKey: true });
            expect(host.fruits()).toEqual(["Apple", "Cherry", "Banana", "Damson"]);

            await press(fixture, item("Cherry"), "End");
            expect(host.fruits()).toEqual(["Apple", "Banana", "Damson", "Cherry"]);

            await press(fixture, item("Cherry"), "Home");
            expect(host.fruits()).toEqual(["Cherry", "Apple", "Banana", "Damson"]);
            expect(document.activeElement).toBe(item("Cherry"));
        });

        it("handles the keys at an end of the list without moving anything", async () => {
            item("Apple").focus();

            const event = await press(fixture, item("Apple"), "ArrowUp");

            expect(event.defaultPrevented).toBe(true);
            expect(host.fruits()).toEqual(["Apple", "Banana", "Cherry", "Damson"]);
            expect(host.moves).toEqual([]);
            expect(announce).not.toHaveBeenCalled();
        });

        it("ignores the keys without both modifiers, with Alt, and in a text field", async () => {
            const input = item("Banana").querySelector("input")!;
            input.focus();

            await press(fixture, input, "ArrowDown");
            await press(fixture, item("Banana"), "ArrowDown", { shiftKey: true });
            await press(fixture, item("Banana"), "ArrowDown", { ctrlKey: true });
            await press(fixture, item("Banana"), "ArrowDown", { altKey: true, ctrlKey: true, shiftKey: true });

            expect(host.fruits()).toEqual(["Apple", "Banana", "Cherry", "Damson"]);
        });

        it("keeps the order when the move is refused", async () => {
            host.refuse = true;
            item("Apple").focus();

            await press(fixture, item("Apple"), "ArrowDown");

            expect(host.moves).toHaveLength(1);
            expect(host.fruits()).toEqual(["Apple", "Banana", "Cherry", "Damson"]);
            expect(announce).not.toHaveBeenCalled();
        });

        it("doesn't move a disabled item or anything in a disabled list", async () => {
            host.locked.set("Apple");
            await settle(fixture);
            await press(fixture, item("Apple"), "ArrowDown");
            expect(host.fruits()).toEqual(["Apple", "Banana", "Cherry", "Damson"]);

            host.locked.set(null);
            host.disabled.set(true);
            await settle(fixture);
            await press(fixture, item("Banana"), "ArrowDown");
            expect(host.fruits()).toEqual(["Apple", "Banana", "Cherry", "Damson"]);
        });

        it("names the shortcuts on each item, and none while it can't move", async () => {
            expect(item("Apple").getAttribute("aria-keyshortcuts")).toBe(
                "Control+Shift+ArrowUp Control+Shift+ArrowDown Control+Shift+Home Control+Shift+End"
            );

            host.locked.set("Apple");
            await settle(fixture);
            expect(item("Apple").hasAttribute("aria-keyshortcuts")).toBe(false);
            expect(item("Banana").hasAttribute("aria-keyshortcuts")).toBe(true);

            host.disabled.set(true);
            await settle(fixture);
            expect(item("Banana").hasAttribute("aria-keyshortcuts")).toBe(false);
        });

        it("moves along a row with ArrowLeft and ArrowRight, mirrored from right to left", async () => {
            host.orientation.set("horizontal");
            await settle(fixture);
            expect(item("Apple").getAttribute("aria-keyshortcuts")).toBe(
                "Control+Shift+ArrowLeft Control+Shift+ArrowRight Control+Shift+Home Control+Shift+End"
            );

            item("Apple").focus();
            await press(fixture, item("Apple"), "ArrowRight");
            expect(host.fruits()).toEqual(["Banana", "Apple", "Cherry", "Damson"]);
            await press(fixture, item("Apple"), "ArrowDown");
            expect(host.fruits()).toEqual(["Banana", "Apple", "Cherry", "Damson"]);

            host.direction.set("rtl");
            await settle(fixture);
            await press(fixture, item("Apple"), "ArrowRight");
            expect(host.fruits()).toEqual(["Apple", "Banana", "Cherry", "Damson"]);
        });

        it("moves to the item above or below in rows that wrap", async () => {
            host.orientation.set("mixed");
            await settle(fixture);
            // Two rows of two: Apple Banana / Cherry Damson.
            const boxes = new Map([
                ["Apple", { left: 0, top: 0 }],
                ["Banana", { left: 100, top: 0 }],
                ["Cherry", { left: 0, top: 50 }],
                ["Damson", { left: 100, top: 50 }]
            ]);
            for (const element of items(root)) {
                const box = boxes.get(element.textContent!.trim())!;
                element.getBoundingClientRect = () =>
                    ({ ...box, bottom: box.top + 40, height: 40, right: box.left + 90, width: 90 }) as DOMRect;
            }

            item("Banana").focus();
            await press(fixture, item("Banana"), "ArrowDown");

            expect(host.fruits()).toEqual(["Apple", "Cherry", "Damson", "Banana"]);
        });

        it("applies a drop from the pointer, mapping the drag's indexes to the array", async () => {
            const dropList = fixture.debugElement.query(By.directive(CdkDropList)).injector.get(CdkDropList);
            const drag = fixture.debugElement.queryAll(By.directive(CdkDrag))[3].injector.get(CdkDrag);

            dropList.dropped.emit({
                container: dropList,
                currentIndex: 1,
                event: new MouseEvent("mouseup"),
                item: drag,
                previousContainer: dropList,
                previousIndex: 3
            } as unknown as CdkDragDrop<unknown>);
            await settle(fixture);

            expect(host.fruits()).toEqual(["Apple", "Damson", "Banana", "Cherry"]);
            expect(announce).toHaveBeenCalledWith("Damson moved to position 2 of 4");
            expect(host.moves[0].originalEvent).toBeInstanceOf(MouseEvent);
        });

        it("passes axe", async () => {
            const results = await axe.run(root, {
                rules: { "color-contrast": { enabled: false }, region: { enabled: false } }
            });

            expect(results.violations.map(violation => violation.id)).toEqual([]);
        });
    });

    describe("in a group", () => {
        let fixture: ComponentFixture<GroupHostComponent>;
        let host: GroupHostComponent;
        let root: HTMLElement;

        function item(text: string): HTMLElement {
            return items(root).find(element => element.textContent?.trim() === text)!;
        }

        beforeEach(async () => {
            fixture = TestBed.createComponent(GroupHostComponent);
            host = fixture.componentInstance;
            root = fixture.nativeElement as HTMLElement;
            document.body.append(root);
            await settle(fixture);
        });

        afterEach(() => {
            fixture.destroy();
            root.remove();
        });

        it("moves an item into the next list with Control+Shift+ArrowRight, at the same position", async () => {
            item("Review").focus();

            await press(fixture, item("Review"), "ArrowRight");

            expect(host.lists.map(list => list.items())).toEqual([["Write"], ["Design", "Review"], []]);
            expect(document.activeElement).toBe(item("Review"));
            expect(announce).toHaveBeenCalledWith("Review moved to Doing, position 2 of 2");
        });

        it("moves back with ArrowLeft, and passes over a list that refuses the item", async () => {
            host.full = true;
            item("Write").focus();

            await press(fixture, item("Write"), "ArrowRight");

            expect(host.lists.map(list => list.items())).toEqual([["Review"], ["Design"], ["Write"]]);
            expect(announce).toHaveBeenCalledWith("Write moved to Done, position 1 of 1");

            await press(fixture, item("Write"), "ArrowLeft");
            expect(host.lists.map(list => list.items())).toEqual([["Write", "Review"], ["Design"], []]);
        });

        it("names the keys that cross the lists", async () => {
            expect(item("Write").getAttribute("aria-keyshortcuts")).toBe(
                "Control+Shift+ArrowUp Control+Shift+ArrowDown Control+Shift+Home Control+Shift+End " +
                    "Control+Shift+ArrowLeft Control+Shift+ArrowRight"
            );
        });

        it("applies a pointer drop into another list", async () => {
            const [, doing] = fixture.debugElement.queryAll(By.directive(CdkDropList));
            const source = fixture.debugElement.queryAll(By.directive(CdkDropList))[0].injector.get(CdkDropList);
            const target = doing.injector.get(CdkDropList);
            const drag = fixture.debugElement.queryAll(By.directive(CdkDrag))[0].injector.get(CdkDrag);

            target.dropped.emit({
                container: target,
                currentIndex: 0,
                event: new MouseEvent("mouseup"),
                item: drag,
                previousContainer: source,
                previousIndex: 0
            } as unknown as CdkDragDrop<unknown>);
            await settle(fixture);

            expect(host.lists.map(list => list.items())).toEqual([["Review"], ["Write", "Design"], []]);
        });

        it("refuses a drop from another list when sortableCanEnter says no", () => {
            host.full = true;
            const target = fixture.debugElement.queryAll(By.directive(CdkDropList))[1].injector.get(CdkDropList);
            const own = fixture.debugElement.queryAll(By.directive(CdkDrag))[2].injector.get(CdkDrag);
            const other = fixture.debugElement.queryAll(By.directive(CdkDrag))[0].injector.get(CdkDrag);

            expect(target.enterPredicate(other, target)).toBe(false);
            expect(target.enterPredicate(own, target)).toBe(true);
        });
    });

    describe("on a presentational item", () => {
        it("leaves aria-keyshortcuts for the element that takes focus, and reads the name without hidden text", async () => {
            const fixture = TestBed.createComponent(PresentationalHostComponent);
            const root = fixture.nativeElement as HTMLElement;
            document.body.append(root);
            await settle(fixture);

            const wrappers = items(root, "[role='presentation']");
            expect(wrappers.every(wrapper => !wrapper.hasAttribute("aria-keyshortcuts"))).toBe(true);
            const item = fixture.debugElement
                .query(By.directive(SortableItemDirective))
                .injector.get(SortableItemDirective);
            expect(item.keyShortcuts()).toContain("Control+Shift+ArrowRight");

            const results = await axe.run(root, {
                rules: { "color-contrast": { enabled: false }, region: { enabled: false } }
            });
            expect(results.violations.map(violation => violation.id)).toEqual([]);

            const tab = root.querySelector<HTMLElement>("[role='tab']")!;
            tab.focus();
            await press(fixture, tab, "ArrowRight");
            expect(announce).toHaveBeenCalledWith("Board moved to position 2 of 2");

            fixture.destroy();
            root.remove();
        });
    });
});

describe("moveItem", () => {
    it("moves an item to an index, without changing the array", () => {
        const items = ["a", "b", "c", "d"] as const;

        expect(moveItem(items, 0, 2)).toEqual(["b", "c", "a", "d"]);
        expect(moveItem(items, 3, 0)).toEqual(["d", "a", "b", "c"]);
        expect(items).toEqual(["a", "b", "c", "d"]);
    });

    it("clamps indexes out of range, and copies an empty array", () => {
        expect(moveItem(["a", "b", "c"], -4, 9)).toEqual(["b", "c", "a"]);
        expect(moveItem([], 0, 1)).toEqual([]);
    });
});
