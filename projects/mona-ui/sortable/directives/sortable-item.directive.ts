import { CdkDrag } from "@angular/cdk/drag-drop";
import {
    booleanAttribute,
    computed,
    Directive,
    effect,
    ElementRef,
    HostAttributeToken,
    inject,
    input
} from "@angular/core";
import { SORTABLE_ITEM_CLASSES, SORTABLE_TOUCH_DELAY } from "../styles/sortable.styles";
import { isTextEntryTarget, readElementLabel } from "../utils/sortable-dom";
import { type SortableMoveKey, SortableDirective } from "./sortable.directive";

const MOVE_KEYS: ReadonlySet<string> = new Set<SortableMoveKey>([
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "End",
    "Home"
]);

/**
 * @description
 * An item of a `monaSortable` list, given the array element it shows. Drag it, or focus it, or a control in it, and
 * press Control+Shift with an arrow key, Home or End (Command+Shift on macOS) to move it. On a touch screen, press and
 * hold it first, so a swipe still scrolls.
 */
@Directive({
    selector: "[monaSortableItem]",
    exportAs: "monaSortableItem",
    hostDirectives: [CdkDrag],
    host: {
        class: SORTABLE_ITEM_CLASSES,
        "[attr.aria-keyshortcuts]": "hostKeyShortcuts()",
        "(keydown)": "onKeydown($event)"
    }
})
export class SortableItemDirective<T = unknown> {
    readonly #drag = inject<CdkDrag<SortableItemDirective<T>>>(CdkDrag);
    /** `aria-keyshortcuts` on a presentational element would expose it again, and conflict with its role. */
    readonly #presentational = ["none", "presentation"].includes(
        inject(new HostAttributeToken("role"), { optional: true }) ?? ""
    );
    protected readonly hostKeyShortcuts = computed(() => (this.#presentational ? null : this.keyShortcuts()));

    /**
     * @description Stops this item from moving. Other items still move past it.
     * @default false
     */
    public readonly disabled = input(false, { alias: "sortableDisabled", transform: booleanAttribute });

    /** @internal */
    public readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

    /**
     * @description The element of the list's array that this item shows.
     */
    public readonly item = input.required<T>({ alias: "monaSortableItem" });

    /**
     * @description The shortcuts that move this item, in `aria-keyshortcuts` form, or `null` when it can't move. The
     * item sets them on itself, unless it has `role="presentation"` or `role="none"`: then bind them on the element in
     * it that takes focus.
     */
    public readonly keyShortcuts = computed(() => (this.disabled() ? null : this.list.keyShortcuts()));

    /**
     * @description The item's name in announcements of its moves. Without it, the item's `aria-label`,
     * `aria-labelledby` text or own text.
     * @default ""
     */
    public readonly label = input("", { alias: "sortableLabel" });

    /**
     * @internal
     * The list the item belongs to.
     */
    public readonly list = inject<SortableDirective<T>>(SortableDirective);

    public constructor() {
        const drag = this.#drag;
        drag.data = this;
        drag.dragStartDelay = { mouse: 0, touch: SORTABLE_TOUCH_DELAY };
        effect(() => {
            drag.disabled = this.disabled();
            drag.lockAxis = this.list.dragAxis();
        });
    }

    /**
     * @internal
     * The element in the item that has focus, if any.
     */
    public focusedElement(): HTMLElement | null {
        const root = this.element.getRootNode() as Document | ShadowRoot;
        const active = root.activeElement;
        return active instanceof HTMLElement && this.element.contains(active) ? active : null;
    }

    /**
     * @internal
     * The item's name in announcements.
     */
    public labelText(): string {
        return this.label() || readElementLabel(this.element, true);
    }

    protected onKeydown(event: KeyboardEvent): void {
        if (
            event.defaultPrevented ||
            !(event.ctrlKey || event.metaKey) ||
            !event.shiftKey ||
            event.altKey ||
            !MOVE_KEYS.has(event.key) ||
            isTextEntryTarget(event.target)
        ) {
            return;
        }
        // Handled even when the item can't go further, so a sortable item around this one doesn't move instead.
        event.preventDefault();
        this.list.keyboardMove(this, event.key as SortableMoveKey, event);
    }
}
