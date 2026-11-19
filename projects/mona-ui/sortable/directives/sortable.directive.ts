import { type CdkDragDrop, CdkDropList } from "@angular/cdk/drag-drop";
import {
    afterNextRender,
    booleanAttribute,
    computed,
    DestroyRef,
    Directive,
    effect,
    ElementRef,
    inject,
    Injector,
    input,
    output
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { injectComponentDirection, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { injectLiveAnnouncer } from "@nanahoshi/mona-ui/internal/live-announcer";
import { SORTABLE_DEFAULT_MESSAGES } from "../i18n/sortable.default-messages";
import { SortableMoveEvent } from "../models/SortableMoveEvent";
import type { SortableOrientation } from "../models/SortableOrientation";
import { declareCdkResetsLayerFirst } from "../utils/cdk-resets-layer";
import { moveItem } from "../utils/moveItem";
import { findFocusTarget, findRowNeighbor, readElementLabel } from "../utils/sortable-dom";
import { SortableGroupDirective } from "./sortable-group.directive";
import type { SortableItemDirective } from "./sortable-item.directive";

/** The keys that move an item, held with Control and Shift (Command and Shift on macOS). */
export type SortableMoveKey = "ArrowDown" | "ArrowLeft" | "ArrowRight" | "ArrowUp" | "End" | "Home";

/** Where a keyboard move takes an item. */
interface MoveTarget<T> {
    readonly index: number;
    readonly list: SortableDirective<T>;
}

/**
 * @description
 * Lets the user reorder a list's items by dragging them, or with Control+Shift and the arrow keys (Command+Shift on
 * macOS), and announces each move. Mark each item with `monaSortableItem`, render every item of the array in order,
 * and bind the array two-way, `[(monaSortable)]`, or handle `sortableMove`. The list doesn't reorder its elements
 * itself. Lists inside one `monaSortableGroup` exchange items.
 */
@Directive({
    selector: "[monaSortable]",
    exportAs: "monaSortable",
    hostDirectives: [CdkDropList]
})
export class SortableDirective<T = unknown> {
    readonly #announcer = injectLiveAnnouncer();
    readonly #direction = injectComponentDirection();
    readonly #dropList = inject<CdkDropList<SortableDirective<T>>>(CdkDropList);
    readonly #group = inject(SortableGroupDirective, { optional: true });
    readonly #injector = inject(Injector);
    readonly #messages = inject(MonaI18nService).componentMessages("sortable", SORTABLE_DEFAULT_MESSAGES);

    /**
     * @description Whether an item from another list of the group may come into this one, such as to keep a list
     * under a limit. The list's own items can always move within it. Without it, every item may come in.
     * @default null
     */
    public readonly canEnter = input<((item: T) => boolean) | null>(null, { alias: "sortableCanEnter" });

    /**
     * @description Stops items from moving within the list, out of it or into it.
     * @default false
     */
    public readonly disabled = input(false, { alias: "sortableDisabled", transform: booleanAttribute });

    /**
     * @internal
     * The axis a dragged item keeps to, when `sortableLockAxis` is on.
     */
    public readonly dragAxis = computed(() => {
        if (!this.lockAxis()) {
            return null;
        }
        switch (this.orientation()) {
            case "horizontal":
                return "x";
            case "vertical":
                return "y";
            default:
                return null;
        }
    });

    /** @internal */
    public readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

    /**
     * @description The list's items, in the order they're shown. Bind it two-way, `[(monaSortable)]`, to take each
     * new order.
     */
    public readonly items = input.required<readonly T[]>({ alias: "monaSortable" });

    /**
     * @description The shortcuts that move an item, in `aria-keyshortcuts` form, or `null` while the list is
     * disabled. Items put it on themselves; an item that's presentational can bind it on the element in it that takes
     * focus.
     */
    public readonly keyShortcuts = computed(() => {
        if (this.disabled()) {
            return null;
        }
        const crossesLists = (this.#group?.listCount() ?? 0) > 1;
        const vertical: readonly SortableMoveKey[] = ["ArrowUp", "ArrowDown"];
        const horizontal: readonly SortableMoveKey[] = ["ArrowLeft", "ArrowRight"];
        let keys: readonly SortableMoveKey[];
        switch (this.orientation()) {
            case "horizontal":
                keys = [...horizontal, "Home", "End", ...(crossesLists ? vertical : [])];
                break;
            case "mixed":
                keys = [...vertical, ...horizontal, "Home", "End"];
                break;
            default:
                keys = [...vertical, "Home", "End", ...(crossesLists ? horizontal : [])];
        }
        return keys.map(key => `Control+Shift+${key}`).join(" ");
    });

    /**
     * @description The list's name in the announcement of a move into it from another list. Without it, the list's
     * `aria-label` or `aria-labelledby` text.
     * @default ""
     */
    public readonly label = input("", { alias: "sortableLabel" });

    /**
     * @description Keeps a dragged item on the list's axis: across for a horizontal list, up and down for a vertical
     * one. A list whose rows wrap doesn't lock.
     * @default false
     */
    public readonly lockAxis = input(false, { alias: "sortableLockAxis", transform: booleanAttribute });

    /**
     * @description Emitted with the list's new items after an item moves within it, out of it or into it, unless the
     * move was refused.
     */
    public readonly monaSortableChange = output<T[]>();

    /**
     * @description How the items are laid out, which sets the keys that move them: Up and Down in a column, Left and
     * Right in a row, and all four in rows that wrap.
     * @default "vertical"
     */
    public readonly orientation = input<SortableOrientation>("vertical", { alias: "sortableOrientation" });

    /**
     * @description Emitted with a {@link SortableMoveEvent} when an item moves within this list or into it from
     * another list, before the lists emit their new items. This event is preventable.
     */
    public readonly sortableMove = output<SortableMoveEvent<T>>();

    public constructor() {
        declareCdkResetsLayerFirst();
        const dropList = this.#dropList;
        dropList.data = this;
        dropList.enterPredicate = drag => this.accepts(drag.data as SortableItemDirective<T>);
        effect(() => {
            dropList.disabled = this.disabled();
            dropList.orientation = this.orientation();
            dropList.lockAxis = this.dragAxis();
        });
        dropList.dropped
            .pipe(takeUntilDestroyed())
            .subscribe((drop: CdkDragDrop<SortableDirective<T>, SortableDirective<T>, SortableItemDirective<T>>) => {
                if (drop.previousContainer !== drop.container || drop.previousIndex !== drop.currentIndex) {
                    this.applyMove(drop.item.data, drop.currentIndex, drop.event, false);
                }
            });
        const group = this.#group;
        if (group) {
            // After the first render, so a list that joins doesn't change what its group's lists have just shown.
            afterNextRender(() => group.register(this as SortableDirective<unknown>));
            inject(DestroyRef).onDestroy(() => group.unregister(this as SortableDirective<unknown>));
        }
    }

    /**
     * @internal
     * Whether an item may land in this list: its own items always can, and another list's when the list isn't
     * disabled and `sortableCanEnter` allows it.
     */
    public accepts(item: SortableItemDirective<T>): boolean {
        if (item.list === this) {
            return true;
        }
        if (this.disabled()) {
            return false;
        }
        const canEnter = this.canEnter();
        return canEnter == null || canEnter(item.item());
    }

    /**
     * @internal
     * Moves an item to an index of this list, from this list or another: emits `sortableMove`, then, unless it's
     * prevented, the lists' new items, announces the move, and after a keyboard move, keeps focus on the item.
     */
    public applyMove(
        item: SortableItemDirective<T>,
        targetIndex: number,
        originalEvent: Event | undefined,
        fromKeyboard: boolean
    ): boolean {
        const source = item.list;
        const value = item.item();
        const sourceItems = source.items();
        const previousIndex = sourceItems.indexOf(value);
        if (previousIndex < 0) {
            return false;
        }
        const sameList = source === this;
        let currentItems: T[];
        let previousItems: T[];
        let currentIndex: number;
        if (sameList) {
            currentIndex = Math.min(Math.max(targetIndex, 0), sourceItems.length - 1);
            currentItems = moveItem(sourceItems, previousIndex, currentIndex);
            previousItems = currentItems;
        } else {
            currentItems = [...this.items()];
            currentIndex = Math.min(Math.max(targetIndex, 0), currentItems.length);
            currentItems.splice(currentIndex, 0, value);
            previousItems = sourceItems.filter((_, index) => index !== previousIndex);
        }
        // Read before the moved item's element can go, as it does when the item lands in another list.
        const itemLabel = item.labelText();
        const listLabel = sameList ? "" : this.labelText();
        const focused = fromKeyboard ? item.focusedElement() : null;
        const event = new SortableMoveEvent<T>(
            {
                currentIndex,
                currentItems,
                currentList: this,
                item: value,
                previousIndex,
                previousItems,
                previousList: source
            },
            originalEvent
        );
        this.sortableMove.emit(event);
        if (event.isDefaultPrevented()) {
            return false;
        }
        if (!sameList) {
            source.monaSortableChange.emit(previousItems);
        }
        this.monaSortableChange.emit(currentItems);
        const messages = this.#messages();
        const position = currentIndex + 1;
        void this.#announcer.announce(
            listLabel
                ? messages.itemMovedToList(itemLabel, listLabel, position, currentItems.length)
                : messages.itemMoved(itemLabel, position, currentItems.length)
        );
        if (fromKeyboard) {
            this.restoreFocus(value, currentIndex, focused);
        }
        return true;
    }

    /**
     * @internal
     * Moves an item a step, to an end of the list, or into the next list of the group, for Control+Shift and an arrow
     * key, Home or End.
     */
    public keyboardMove(item: SortableItemDirective<T>, key: SortableMoveKey, event: KeyboardEvent): void {
        if (this.disabled() || item.disabled()) {
            return;
        }
        const items = this.sortedItems();
        const from = items.indexOf(item);
        if (from < 0) {
            return;
        }
        const target = this.findMoveTarget(items, from, key);
        if (target != null && (target.list !== this || target.index !== from)) {
            target.list.applyMove(item, target.index, event, true);
        }
    }

    /**
     * @internal
     * The list's name in announcements: `sortableLabel`, else its `aria-label` or `aria-labelledby` text.
     */
    public labelText(): string {
        return this.label() || readElementLabel(this.element, false);
    }

    /**
     * @internal
     * The list's items in the order they're shown.
     */
    public sortedItems(): SortableItemDirective<T>[] {
        return this.#dropList.getSortedItems().map(drag => drag.data as SortableItemDirective<T>);
    }

    /** The first list after (`step` 1) or before (`step` -1) this one in the group that the item may move into. */
    private findAdjacentList(item: SortableItemDirective<T>, from: number, step: number): MoveTarget<T> | null {
        if (step === 0 || this.#group == null) {
            return null;
        }
        const lists = this.#group.orderedLists() as SortableDirective<T>[];
        for (let index = lists.indexOf(this) + step; index >= 0 && index < lists.length; index += step) {
            const list = lists[index];
            if (list.accepts(item)) {
                return { index: Math.min(from, list.items().length), list };
            }
        }
        return null;
    }

    private findMoveTarget(
        items: readonly SortableItemDirective<T>[],
        from: number,
        key: SortableMoveKey
    ): MoveTarget<T> | null {
        const last = items.length - 1;
        if (key === "Home" || key === "End") {
            return { index: key === "Home" ? 0 : last, list: this };
        }
        const rightToLeft = this.#direction() === "rtl";
        const across = (key === "ArrowRight" ? 1 : key === "ArrowLeft" ? -1 : 0) * (rightToLeft ? -1 : 1);
        const down = key === "ArrowDown" ? 1 : key === "ArrowUp" ? -1 : 0;
        const within = (step: number): MoveTarget<T> => ({
            index: Math.min(Math.max(from + step, 0), last),
            list: this
        });
        switch (this.orientation()) {
            case "horizontal":
                return across !== 0 ? within(across) : this.findAdjacentList(items[from], from, down);
            case "mixed":
                if (across !== 0) {
                    return within(across);
                }
                return {
                    index: findRowNeighbor(
                        items.map(candidate => candidate.element),
                        from,
                        down as -1 | 1
                    ),
                    list: this
                };
            default:
                return down !== 0 ? within(down) : this.findAdjacentList(items[from], from, across);
        }
    }

    /**
     * Puts focus back on the moved item once the new order has rendered: on the element that had it, when that's
     * still in the item, else on the item or the first control in it, as when the item was rendered anew elsewhere.
     */
    private restoreFocus(value: T, index: number, focused: HTMLElement | null): void {
        afterNextRender(
            {
                write: () => {
                    const items = this.sortedItems();
                    const item = items.find(candidate => candidate.item() === value) ?? items[index];
                    if (item == null) {
                        return;
                    }
                    const target =
                        focused != null && focused.isConnected && item.element.contains(focused)
                            ? focused
                            : findFocusTarget(item.element);
                    if (target != null && target.ownerDocument.activeElement !== target) {
                        target.focus();
                    }
                }
            },
            { injector: this.#injector }
        );
    }
}
