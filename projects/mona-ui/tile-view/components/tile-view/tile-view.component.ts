import type { ListRange } from "@angular/cdk/collections";
import { CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport } from "@angular/cdk/scrolling";
import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    booleanAttribute,
    Component,
    computed,
    contentChild,
    DestroyRef,
    effect,
    inject,
    input,
    model,
    output,
    signal,
    TemplateRef,
    untracked,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ImmutableSet } from "@mirei/ts-collections";
import { injectComponentDirection, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import {
    createElementControlId,
    isTypeaheadKey,
    setupTypeahead,
    TYPEAHEAD_RESET_DELAY
} from "@nanahoshi/mona-ui/internal";
import { LIST_DEFAULT_MESSAGES } from "@nanahoshi/mona-ui/internal/list";
import { PlaceholderComponent } from "@nanahoshi/mona-ui/placeholder";
import { Subject } from "rxjs";
import { twMerge } from "tailwind-merge";
import { TileViewItemTemplateDirective } from "../../directives/tile-view-item-template.directive";
import { TileViewNoDataTemplateDirective } from "../../directives/tile-view-no-data-template.directive";
import type { TileViewItemActivateEvent } from "../../models/TileViewItemActivateEvent";
import type { TileViewItemTemplateContext } from "../../models/TileViewItemTemplateContext";
import type { TileViewSelectionMode } from "../../models/TileViewSelectionMode";
import {
    tileViewBaseThemeVariants,
    tileViewTileThemeVariants,
    tileViewViewportThemeVariants,
    type TileViewVariantInputs,
    type TileViewVariantProps
} from "../../styles/tile-view.styles";
import { isTileNavigationKey, navigateTiles, tileColumns } from "../../utils/tile-navigation";

/** No tile, for the active tile and the anchor: keys may be anything, `null` and `undefined` included. */
const NONE: unique symbol = Symbol("none");

/** A tile of a row, as the template renders it. */
interface TileCell<T> {
    readonly index: number;
    readonly item: T;
    readonly key: unknown;
}

/** Which modifier keys a click or a key press was made with. */
interface Modifiers {
    readonly ctrlKey: boolean;
    readonly metaKey: boolean;
    readonly shiftKey: boolean;
}

const NO_MODIFIERS: Modifiers = { ctrlKey: false, metaKey: false, shiftKey: false };

/**
 * A collection shown as tiles of one size, in rows that fill the width, like the icons of a file explorer. Only the
 * rows in view are rendered, so it stays fast with tens of thousands of items. It is one Tab stop: the arrow keys
 * move in two dimensions, and selection works as in a file explorer, with Ctrl and Shift.
 */
@Component({
    selector: "mona-tile-view",
    templateUrl: "./tile-view.component.html",
    imports: [
        CdkFixedSizeVirtualScroll,
        CdkVirtualForOf,
        CdkVirtualScrollViewport,
        NgTemplateOutlet,
        PlaceholderComponent
    ],
    host: {
        "[class]": "baseClasses()",
        // The name belongs to the listbox inside; the host has no role to carry it.
        "[attr.aria-label]": "null",
        "[attr.aria-labelledby]": "null"
    }
})
export class TileViewComponent<T = unknown> implements TileViewVariantInputs {
    readonly #activeKey = signal<unknown>(NONE);
    readonly #destroyRef = inject(DestroyRef);
    readonly #direction = injectComponentDirection();
    readonly #focused = signal(false);
    readonly #id = createElementControlId();
    /** Each key's index. The first of equal keys wins; keys should be unique. */
    readonly #indexOf = computed(() => {
        const indexOf = new Map<unknown, number>();
        this.#keys().forEach((key, index) => {
            if (!indexOf.has(key)) {
                indexOf.set(key, index);
            }
        });
        return indexOf;
    });
    readonly #items = computed(() => Array.from(this.items()));
    /** Whether the keyboard brought or moved the focus, so the active tile shows a ring. A click doesn't. */
    readonly #keyboard = signal(false);
    readonly #keys = computed(() => {
        const key = this.itemKey();
        const keyOf =
            typeof key === "function"
                ? key
                : key === ""
                  ? (item: T): unknown => item
                  : (item: T): unknown => (item as Record<string, unknown> | null)?.[key];
        return this.#items().map(item => keyOf(item));
    });
    readonly #renderedRange = signal<ListRange>({ start: 0, end: 0 });
    readonly #selected = computed(() => ImmutableSet.create(this.selectedKeys()));
    readonly #typeaheadKey$ = new Subject<string>();
    readonly #viewportHeight = signal(0);
    readonly #viewportWidth = signal(0);
    /** The tile Shift extends the selection from, by key. */
    #anchorKey: unknown = NONE;
    /** Where the active tile was, for when its item goes. */
    #lastActiveIndex = -1;
    /** The selection this view last reported, to tell it from one the app sets. */
    #ownSelection: readonly unknown[] | null = null;
    /** Until when a space continues a typeahead search rather than selecting. */
    #typeaheadUntil = 0;

    /** The active tile's id, while the view has the focus and the tile is rendered. */
    protected readonly activeDescendant = computed(() => {
        const index = this.activeIndex();
        const { start, end } = this.#renderedRange();
        const columns = this.columnCount();
        const row = Math.floor(index / columns);
        return this.#focused() && index >= 0 && row >= start && row < end ? this.tileId(index) : null;
    });
    /** The active tile's index: the keyboard moves from it, and Enter activates it. -1 when there is none. */
    protected readonly activeIndex = computed(() => {
        const key = this.#activeKey();
        const count = this.count();
        if (key === NONE || count === 0) {
            return -1;
        }
        // An active item that's gone leaves its place to the item now there.
        return this.#indexOf().get(key) ?? Math.min(this.#lastActiveIndex, count - 1);
    });
    protected readonly baseClasses = computed(() =>
        twMerge(tileViewBaseThemeVariants({ rounded: this.rounded(), size: this.size() }), this.userClass())
    );
    protected readonly columnCount = computed(() => {
        const columns = this.columns();
        return columns === "auto"
            ? tileColumns(this.#viewportWidth(), this.tileWidth(), this.gap())
            : Math.max(1, Math.floor(columns));
    });
    protected readonly count = computed(() => this.#items().length);
    protected readonly itemTemplate = contentChild(TileViewItemTemplateDirective, { read: TemplateRef });
    /** How far past the edges rows are rendered: at least a row, refilled to two. */
    protected readonly maxBufferPx = computed(() => this.rowHeight() * 2);
    protected readonly messages = inject(MonaI18nService).componentMessages("list", LIST_DEFAULT_MESSAGES);
    protected readonly minBufferPx = computed(() => this.rowHeight());
    protected readonly noDataId = `${this.#id}-no-data`;
    protected readonly noDataTemplate = contentChild(TileViewNoDataTemplateDirective, { read: TemplateRef });
    protected readonly role = computed(() => (this.selectionMode() === "none" ? "list" : "listbox"));
    protected readonly rowHeight = computed(() => this.tileHeight() + this.gap());
    /** The items in rows of as many tiles as fit. */
    protected readonly rows = computed(() => {
        const items = this.#items();
        const keys = this.#keys();
        const columns = this.columnCount();
        const rows: TileCell<T>[][] = [];
        for (let start = 0; start < items.length; start += columns) {
            const end = Math.min(start + columns, items.length);
            const row: TileCell<T>[] = [];
            for (let index = start; index < end; index++) {
                row.push({ index, item: items[index], key: keys[index] });
            }
            rows.push(row);
        }
        return rows;
    });
    /**
     * How many tiles can be rendered at once: the rows in view and the buffers on both sides, as the fixed-size
     * strategy fills them, with a row to spare at each end for a partly visible one. Rendered tiles are consecutive,
     * so their indices modulo this are all different.
     */
    protected readonly slotCount = computed(() => {
        const rowHeight = Math.max(1, this.rowHeight());
        const rows = Math.ceil((this.#viewportHeight() + this.minBufferPx() + this.maxBufferPx()) / rowHeight) + 3;
        return rows * this.columnCount();
    });
    /** Polite status text: loading, or the empty state, unless a no-data template says it in its own words. */
    protected readonly statusText = computed(() => {
        if (this.loading()) {
            return this.messages().loading;
        }
        return this.count() === 0 && !this.noDataTemplate() ? this.messages().noData : "";
    });
    protected readonly tileRole = computed(() => (this.selectionMode() === "none" ? "listitem" : "option"));
    protected readonly viewport = viewChild.required(CdkVirtualScrollViewport);
    protected readonly viewportClasses = computed(() => tileViewViewportThemeVariants({ empty: this.count() === 0 }));

    /**
     * @description Accessible name of the tiles' listbox. Describe what the tiles show.
     * @default ""
     */
    public readonly ariaLabel = input<string>("", { alias: "aria-label" });

    /**
     * @description Id of the element that names the tiles' listbox, as an alternative to `aria-label`.
     * @default ""
     */
    public readonly ariaLabelledBy = input<string>("", { alias: "aria-labelledby" });

    /**
     * @description How many tiles a row holds: as many as fit the width, or a fixed number.
     * @default auto
     */
    public readonly columns = input<number | "auto">("auto");

    /**
     * @description Space between tiles, and around them, in pixels.
     * @default 4
     */
    public readonly gap = input<number>(4);

    /**
     * @description Emitted when a tile is double-clicked, or Enter is pressed on the active tile, with the item and
     * the event, so modifier keys can change what activating does.
     */
    public readonly itemActivate = output<TileViewItemActivateEvent<T>>();

    /**
     * @description Property name or function that gives each item's key, which `selectedKeys` holds and tiles are
     * tracked by. Keys must be unique. Without it, the item itself is its key.
     * @default ""
     */
    public readonly itemKey = input<string | ((item: T) => unknown)>("");

    /**
     * @description Collection of items to show as tiles.
     * @default []
     */
    public readonly items = input<Iterable<T>>([]);

    /**
     * @description Marks the tiles as loading: the listbox gets `aria-busy` and a polite "Loading" status.
     * @default false
     */
    public readonly loading = input(false, { transform: booleanAttribute });

    /**
     * @description Border-radius preset applied to the component.
     * @default medium
     */
    public readonly rounded = input<TileViewVariantProps["rounded"]>("medium");

    /**
     * @description Keys of the selected items. Changes the user makes are emitted through `selectedKeysChange`, so
     * `[(selectedKeys)]` works; keys set here aren't emitted back. When they leave the active tile unselected, the
     * first selected tile becomes active and is scrolled into view.
     * @default []
     */
    public readonly selectedKeys = model<readonly unknown[]>([]);

    /**
     * @description How tiles are selected. `"multiple"` works as in a file explorer: a click selects one tile,
     * Ctrl+click toggles one, Shift+click selects a range, and Ctrl+A selects all. `"none"` makes the tiles a plain
     * list.
     * @default single
     */
    public readonly selectionMode = input<TileViewSelectionMode>("single");

    /**
     * @description Size preset controlling the component's text size.
     * @default medium
     */
    public readonly size = input<TileViewVariantProps["size"]>("medium");

    /**
     * @description Property name or function that gives an item's text, which typeahead matches and a tile shows
     * without an item template. Without it, the item itself is converted to text.
     * @default ""
     */
    public readonly textField = input<string | ((item: T) => string)>("");

    /**
     * @description Height of every tile, in pixels. Tiles must all be this tall for scrolling to stay accurate.
     * @default 112
     */
    public readonly tileHeight = input<number>(112);

    /**
     * @description Width of every tile, in pixels.
     * @default 112
     */
    public readonly tileWidth = input<number>(112);

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string>("", { alias: "class" });

    public constructor() {
        afterNextRender(() => this.observeViewport());
        setupTypeahead(this.#typeaheadKey$)
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(buffer => this.findByText(buffer));
        // A selection the app sets, such as a new item's, takes the active tile with it unless the active tile is
        // in it already.
        effect(() => {
            const selected = this.selectedKeys();
            untracked(() => {
                if (selected === this.#ownSelection) {
                    return;
                }
                const set = this.#selected();
                if (set.size() === 0 || set.contains(this.#activeKey())) {
                    return;
                }
                const indexOf = this.#indexOf();
                const first = Math.min(...selected.map(key => indexOf.get(key) ?? Infinity));
                if (Number.isFinite(first)) {
                    this.setActive(first);
                    this.#anchorKey = this.#keys()[first];
                    this.scrollToIndex(first);
                }
            });
        });
    }

    /**
     * Scrolls the tile of the item with this key into view, if it isn't in view already.
     * @param key The item's key, as `itemKey` gives it.
     */
    public scrollToItem(key: unknown): void {
        const index = this.#indexOf().get(key);
        if (index !== undefined) {
            this.scrollToIndex(index);
        }
    }

    protected contextOf(cell: TileCell<T>): TileViewItemTemplateContext<T> {
        return {
            $implicit: cell.item,
            active: cell.index === this.activeIndex(),
            index: cell.index,
            selected: this.isSelected(cell),
            slot: cell.index % this.slotCount()
        };
    }

    protected isSelected(cell: TileCell<T>): boolean {
        return this.#selected().contains(cell.key);
    }

    protected onBlur(): void {
        this.#focused.set(false);
    }

    protected onFocus(): void {
        this.#focused.set(true);
        this.#keyboard.set(this.matchesFocusVisible());
        // Tabbing in lands on the active tile, or the first selected one, or the first; it selects nothing.
        if (this.activeIndex() < 0 && this.count() > 0) {
            const indexOf = this.#indexOf();
            const first = Math.min(...this.selectedKeys().map(key => indexOf.get(key) ?? Infinity));
            this.setActive(Number.isFinite(first) ? first : 0);
        }
    }

    protected onKeydown(event: KeyboardEvent): void {
        this.#keyboard.set(true);
        if (isTileNavigationKey(event.key)) {
            if (event.altKey) {
                return;
            }
            event.preventDefault();
            const target = navigateTiles(this.activeIndex(), event.key, {
                columns: this.columnCount(),
                count: this.count(),
                pageRows: Math.max(1, Math.floor(this.#viewportHeight() / this.rowHeight())),
                rtl: this.#direction() === "rtl"
            });
            if (target >= 0) {
                this.moveTo(target, event);
            }
            return;
        }
        const index = this.activeIndex();
        if (event.key === "Enter") {
            if (index >= 0) {
                event.preventDefault();
                this.itemActivate.emit({ item: this.#items()[index], originalEvent: event });
            }
            return;
        }
        if (event.key === " " && Date.now() >= this.#typeaheadUntil && !event.altKey) {
            event.preventDefault();
            if (index >= 0) {
                this.selectWithSpace(index, event.ctrlKey || event.metaKey);
            }
            return;
        }
        if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === "a") {
            if (this.selectionMode() === "multiple") {
                event.preventDefault();
                this.report([...this.#keys()]);
            }
            return;
        }
        if (isTypeaheadKey(event.key, event)) {
            event.preventDefault();
            this.#typeaheadUntil = Date.now() + TYPEAHEAD_RESET_DELAY;
            this.#typeaheadKey$.next(event.key);
        }
    }

    protected onPointerDown(): void {
        this.#keyboard.set(false);
    }

    protected onTileClick(event: MouseEvent, index: number): void {
        this.setActive(index);
        this.select(index, event, "click");
        this.focusViewport();
    }

    /**
     * A right-click selects as in a file explorer, so a context menu acts on what was right-clicked: a tile that isn't
     * selected becomes the selection, and a selected one keeps it.
     */
    protected onTileContextMenu(index: number): void {
        this.setActive(index);
        const key = this.#keys()[index];
        if (this.selectionMode() !== "none" && !this.#selected().contains(key)) {
            this.#anchorKey = key;
            this.report([key]);
        }
        this.focusViewport();
    }

    protected onTileDoubleClick(event: MouseEvent, index: number): void {
        this.itemActivate.emit({ item: this.#items()[index], originalEvent: event });
    }

    /** A click or right-click on no tile clears the selection, as in a file explorer, unless Ctrl or Shift is held. */
    protected onViewportClick(event: MouseEvent): void {
        const target = event.target as Element | null;
        if (target?.closest("[data-mona-tile]") || event.ctrlKey || event.metaKey || event.shiftKey) {
            return;
        }
        if (this.selectionMode() !== "none" && this.selectedKeys().length > 0) {
            this.report([]);
        }
        this.focusViewport();
    }

    protected textOf(item: T): string {
        const field = this.textField();
        if (typeof field === "function") {
            return field(item);
        }
        const value = field === "" ? item : (item as Record<string, unknown> | null)?.[field];
        return value == null ? "" : String(value);
    }

    protected tileClasses(cell: TileCell<T>): string {
        return tileViewTileThemeVariants({
            focused: cell.index === this.activeIndex() && this.#focused() && this.#keyboard(),
            selectable: this.selectionMode() !== "none",
            selected: this.isSelected(cell)
        });
    }

    protected tileId(index: number): string {
        return `${this.#id}-${index}`;
    }

    protected trackRow(index: number): number {
        return index;
    }

    /** Typeahead: the next tile whose text starts with what was typed, from the active one on. */
    private findByText(buffer: string): void {
        const count = this.count();
        if (count === 0) {
            return;
        }
        const items = this.#items();
        // A first letter moves on from the active tile; more letters may keep matching it.
        const start = this.activeIndex() + (buffer.length === 1 ? 1 : 0);
        for (let step = 0; step < count; step++) {
            const index = (Math.max(start, 0) + step) % count;
            if (this.textOf(items[index]).toLowerCase().startsWith(buffer)) {
                this.moveTo(index, NO_MODIFIERS);
                return;
            }
        }
    }

    private focusViewport(): void {
        const element = this.viewport().elementRef.nativeElement;
        if (element.ownerDocument.activeElement !== element) {
            element.focus({ preventScroll: true });
        }
    }

    private matchesFocusVisible(): boolean {
        try {
            return this.viewport().elementRef.nativeElement.matches(":focus-visible");
        } catch {
            return false;
        }
    }

    /** The keyboard moved the active tile: it scrolls into view and, unless Ctrl is held, is selected. */
    private moveTo(index: number, modifiers: Modifiers): void {
        this.setActive(index);
        this.scrollToIndex(index);
        if (!(modifiers.ctrlKey || modifiers.metaKey) || modifiers.shiftKey) {
            this.select(index, modifiers, "keyboard");
        }
    }

    private observeViewport(): void {
        const viewport = this.viewport();
        this.#renderedRange.set(viewport.getRenderedRange());
        viewport.renderedRangeStream
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(range => this.#renderedRange.set(range));
        const element = viewport.elementRef.nativeElement;
        const measure = (): void => {
            this.#viewportWidth.set(element.clientWidth);
            this.#viewportHeight.set(element.clientHeight);
        };
        measure();
        // Measured once where there is no ResizeObserver, such as in a test environment.
        if (typeof ResizeObserver === "undefined") {
            return;
        }
        const observer = new ResizeObserver(measure);
        observer.observe(element);
        this.#destroyRef.onDestroy(() => observer.disconnect());
    }

    /** Reports a selection the user made, unless it is the one there already. */
    private report(keys: readonly unknown[]): void {
        const current = this.#selected();
        if (keys.length === current.size() && keys.every(key => current.contains(key))) {
            return;
        }
        this.#ownSelection = keys;
        this.selectedKeys.set(keys);
    }

    private scrollToIndex(index: number): void {
        const viewport = this.viewport();
        const rowHeight = this.rowHeight();
        const top = Math.floor(index / this.columnCount()) * rowHeight;
        const bottom = top + rowHeight + this.gap();
        const scrollTop = viewport.measureScrollOffset("top");
        const height = viewport.getViewportSize();
        if (top < scrollTop) {
            viewport.scrollToOffset(top);
        } else if (height > 0 && bottom > scrollTop + height) {
            viewport.scrollToOffset(bottom - height);
        }
    }

    /**
     * Selects as a file explorer does. A click or a key alone selects the one tile; Shift selects from the anchor to
     * it, and Ctrl with Shift adds that range. Ctrl+click toggles a tile.
     */
    private select(index: number, modifiers: Modifiers, source: "click" | "keyboard"): void {
        const mode = this.selectionMode();
        if (mode === "none") {
            return;
        }
        const keys = this.#keys();
        const key = keys[index];
        const ctrl = modifiers.ctrlKey || modifiers.metaKey;
        if (mode === "single") {
            this.report(ctrl && source === "click" && this.#selected().contains(key) ? [] : [key]);
            return;
        }
        if (modifiers.shiftKey) {
            const anchor = this.#indexOf().get(this.#anchorKey) ?? index;
            const range = keys.slice(Math.min(anchor, index), Math.max(anchor, index) + 1);
            this.report(ctrl ? [...this.#selected().union(range)] : range);
            return;
        }
        this.#anchorKey = key;
        if (ctrl) {
            const selected = this.#selected();
            this.report(selected.contains(key) ? [...selected.where(k => k !== key)] : [...selected, key]);
            return;
        }
        this.report([key]);
    }

    /** Space selects the active tile, adding it to the selection; Ctrl+Space toggles it. */
    private selectWithSpace(index: number, ctrl: boolean): void {
        const mode = this.selectionMode();
        if (mode === "none") {
            return;
        }
        const key = this.#keys()[index];
        const selected = this.#selected();
        this.#anchorKey = key;
        if (ctrl && selected.contains(key)) {
            this.report([...selected.where(k => k !== key)]);
        } else if (!selected.contains(key)) {
            this.report(mode === "single" ? [key] : [...selected, key]);
        }
    }

    private setActive(index: number): void {
        this.#lastActiveIndex = index;
        this.#activeKey.set(this.#keys()[index]);
    }
}
