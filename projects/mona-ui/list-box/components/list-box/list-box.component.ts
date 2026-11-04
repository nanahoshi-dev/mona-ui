import { LiveAnnouncer } from "@angular/cdk/a11y";
import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    booleanAttribute,
    Component,
    computed,
    contentChild,
    effect,
    ElementRef,
    inject,
    Injector,
    input,
    output,
    type Signal,
    signal,
    TemplateRef,
    untracked
} from "@angular/core";
import { toObservable } from "@angular/core/rxjs-interop";
import {
    LucideChevronDown,
    LucideChevronLeft,
    LucideChevronRight,
    LucideChevronsLeft,
    LucideChevronsRight,
    LucideChevronUp,
    LucideTrash2,
    LucideX
} from "@lucide/angular";
import { ImmutableList, type Predicate } from "@mirei/ts-collections";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import type { SelectionMode } from "@nanahoshi/mona-ui/common";
import { injectComponentDirection, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import {
    LIST_VIEW_HOST_LIST_SERVICE,
    type ListKeySelector,
    ListService,
    type SelectableOptions
} from "@nanahoshi/mona-ui/internal/list";
import {
    ListViewComponent,
    ListViewFooterTemplateDirective,
    ListViewHeaderTemplateDirective,
    ListViewItemTemplateDirective,
    ListViewNavigableDirective,
    ListViewNoDataTemplateDirective,
    ListViewSelectableDirective
} from "@nanahoshi/mona-ui/list-view";
import { ListBoxFooterTemplateDirective } from "../../directives/list-box-footer-template.directive";
import { ListBoxHeaderTemplateDirective } from "../../directives/list-box-header-template.directive";
import { ListBoxItemTemplateDirective } from "../../directives/list-box-item-template.directive";
import { ListBoxNoDataTemplateDirective } from "../../directives/list-box-no-data-template.directive";
import { LIST_BOX_DEFAULT_MESSAGES } from "../../i18n/list-box.default-messages";
import type { ListBoxActionEvent } from "../../models/ListBoxActionClickEvent";
import { ListBoxClearEvent } from "../../models/ListBoxClearEvent";
import { ListBoxMoveEvent } from "../../models/ListBoxMoveEvent";
import { ListBoxRemoveEvent } from "../../models/ListBoxRemoveEvent";
import type { ListBoxSelectionEvent } from "../../models/ListBoxSelectionEvent";
import { ListBoxTransferEvent } from "../../models/ListBoxTransferEvent";
import type { ToolbarAction, ToolbarOptions } from "../../models/ToolbarOptions";
import {
    listBoxBaseThemeVariants,
    listBoxToolbarThemeVariants,
    type ListBoxVariantInputs,
    type ListBoxVariantProps
} from "../../styles/list-box.styles";

type TransferAction = Extract<ToolbarAction, "transferAllFrom" | "transferAllTo" | "transferFrom" | "transferTo">;

/** A toolbar button as rendered: its action, whether it can run now, and its accessible name. */
interface ToolbarButton {
    readonly action: ToolbarAction;
    readonly enabled: boolean;
    readonly label: string;
}

/** What an action left to do once the consumer's data change has rendered. */
interface ActionOutcome {
    readonly announcement: string | null;
    /** Moves focus to what the action acted on. */
    readonly focus: () => void;
}

const DEFAULT_ACTIONS: readonly ToolbarAction[] = [
    "clear",
    "moveDown",
    "moveUp",
    "remove",
    "transferAllFrom",
    "transferAllTo",
    "transferFrom",
    "transferTo"
];

/** The order the toolbar shows its buttons in, whatever order `actions` lists them in. */
const TOOLBAR_ORDER: readonly ToolbarAction[] = [
    "moveUp",
    "moveDown",
    "transferFrom",
    "transferTo",
    "transferAllFrom",
    "transferAllTo",
    "clear",
    "remove"
];

const TRANSFER_ACTIONS: ReadonlySet<ToolbarAction> = new Set<ToolbarAction>([
    "transferAllFrom",
    "transferAllTo",
    "transferFrom",
    "transferTo"
]);

/** Accepts the bare `toolbar` attribute and `"true"`/`"false"`, as well as a boolean or an options object. */
function toToolbarSetting(
    value: boolean | Partial<ToolbarOptions> | string | null | undefined
): boolean | Partial<ToolbarOptions> {
    if (value == null) {
        return true;
    }
    if (typeof value === "boolean" || typeof value === "object") {
        return value;
    }
    return booleanAttribute(value);
}

@Component({
    selector: "mona-list-box",
    templateUrl: "./list-box.component.html",
    providers: [ListService],
    // Shared with the list view in this template only, which renders and navigates the items this component moves.
    viewProviders: [{ provide: LIST_VIEW_HOST_LIST_SERVICE, useExisting: ListService }],
    imports: [
        ListViewComponent,
        ListViewSelectableDirective,
        ListViewItemTemplateDirective,
        NgTemplateOutlet,
        ButtonDirective,
        ListViewNavigableDirective,
        ListViewNoDataTemplateDirective,
        ListViewFooterTemplateDirective,
        ListViewHeaderTemplateDirective,
        LucideChevronUp,
        LucideChevronDown,
        LucideChevronLeft,
        LucideChevronRight,
        LucideChevronsLeft,
        LucideChevronsRight,
        LucideX,
        LucideTrash2
    ],
    host: {
        // The name belongs to the listbox inside; on the host it would be a name on a generic element.
        "[attr.aria-label]": "null",
        "[class]": "baseClasses()",
        "[style.height]": "listHeight()",
        "[style.width]": "listWidth()",
        "(keydown)": "onHostKeydown($event)"
    }
})
export class ListBoxComponent<T = unknown, K = unknown> implements ListBoxVariantInputs {
    readonly #direction = injectComponentDirection();
    readonly #hostElementRef: ElementRef<HTMLElement> = inject(ElementRef);
    readonly #i18n = inject(MonaI18nService);
    readonly #injector = inject(Injector);
    /** The first index of each item, so positions are looked up once per action instead of with `indexOf`. */
    readonly #itemIndexes = computed(() => {
        const indexes = new Map<T, number>();
        this.listBoxItems().forEach((item, index) => {
            if (!indexes.has(item)) {
                indexes.set(item, index);
            }
        });
        return indexes;
    });
    readonly #listService = inject<ListService<T>>(ListService);
    readonly #liveAnnouncer = inject(LiveAnnouncer);
    /** The list box whose `connectedList` is this one, if any: its toolbar transfers items to and from this one. */
    readonly #owner = signal<ListBoxComponent<T, K> | null>(null);
    /** The toolbar button that last had focus, which keeps the toolbar's Tab stop. */
    readonly #toolbarFocus = signal<ToolbarAction | null>(null);
    /** The selection keys last reported through `selectionChange`, with their items. */
    #reported = new Map<unknown, T | undefined>();
    protected readonly baseClasses = computed(() => {
        const rounded = this.rounded();
        const size = this.size();
        const toolbarOptions = this.toolbarOptions();
        const position = toolbarOptions?.position ?? "right";
        const direction = position === "left" || position === "right" ? "horizontal" : "vertical";
        const reversed = position === "left" || position === "top";
        return listBoxBaseThemeVariants({ direction, reversed, rounded, size });
    });
    /** Whether the selection (in this list box or the connected one) can move down: it doesn't touch the end. */
    protected readonly canMoveDown = computed(() => {
        const source = this.selectionHolder();
        const indices = source?.selectedIndices() ?? [];
        return source != null && indices.length > 0 && indices[indices.length - 1] < source.listBoxItems().length - 1;
    });
    /** Whether the selection (in this list box or the connected one) can move up: it doesn't touch the start. */
    protected readonly canMoveUp = computed(() => {
        const indices = this.selectionHolder()?.selectedIndices() ?? [];
        return indices.length > 0 && indices[0] > 0;
    });
    /** The items that aren't disabled by `disabledBy`, which are the ones the "All" transfers carry. */
    protected readonly enabledItems = computed(() =>
        this.listBoxItems()
            .where(item => !this.#listService.isDataItemDisabled(item))
            .toArray()
    );
    protected readonly footerTemplate = contentChild(ListBoxFooterTemplateDirective, { read: TemplateRef });
    protected readonly headerTemplate = contentChild(ListBoxHeaderTemplateDirective, { read: TemplateRef });
    protected readonly itemTemplate = contentChild(ListBoxItemTemplateDirective, { read: TemplateRef });
    protected readonly listHeight = computed(() => {
        const height = this.height();
        return typeof height === "number" ? `${height}px` : height;
    });
    protected readonly listWidth = computed(() => {
        const width = this.width();
        return typeof width === "number" ? `${width}px` : width;
    });
    protected readonly messages = this.#i18n.componentMessages("listBox", LIST_BOX_DEFAULT_MESSAGES);
    protected readonly noDataTemplate = contentChild(ListBoxNoDataTemplateDirective, { read: TemplateRef });
    /**
     * The selected items in list order (not the order they were selected in), with their indices. Disabled items
     * are left out, so no action carries them.
     */
    protected readonly orderedSelection = computed(() => {
        const indexes = this.#itemIndexes();
        return this.selectedItems()
            .toArray()
            .filter(item => !this.#listService.isDataItemDisabled(item))
            .map(item => ({ index: indexes.get(item) ?? -1, item }))
            .filter(entry => entry.index >= 0)
            .sort((a, b) => a.index - b.index);
    });
    protected readonly selectableOptions = computed<SelectableOptions>(() => {
        const enabled = true;
        const mode = this.selectionMode();
        if (mode === "multiple") {
            return { enabled, mode };
        }
        return { enabled, mode, toggleable: this.singleSelectionToggleable() };
    });
    /** Indices of the selected items, in list order. */
    protected readonly selectedIndices = computed(() => this.orderedSelection().map(entry => entry.index));
    /** The list box that holds the selection: this one, else the connected one, else none. */
    protected readonly selectionHolder: Signal<ListBoxComponent<T, K> | null> = computed(() => {
        if (this.orderedSelection().length > 0) {
            return this;
        }
        const connectedList = this.connectedList();
        return connectedList && connectedList.orderedSelection().length > 0 ? connectedList : null;
    });
    /**
     * The toolbar's buttons, in toolbar order. The transfer actions need a connected list box; the others work on a
     * list box of its own.
     */
    protected readonly toolbarButtons = computed<readonly ToolbarButton[]>(() => {
        const options = this.toolbarOptions();
        if (!options) {
            return [];
        }
        const connectedList = this.connectedList();
        const messages = this.messages();
        const holder = this.selectionHolder();
        const target = connectedList?.ariaLabel().trim() ?? "";
        const enabled: Readonly<Record<ToolbarAction, boolean>> = {
            clear: holder != null,
            moveDown: this.canMoveDown(),
            moveUp: this.canMoveUp(),
            remove: holder != null,
            transferAllFrom: (connectedList?.enabledItems().length ?? 0) > 0,
            transferAllTo: this.enabledItems().length > 0,
            transferFrom: (connectedList?.orderedSelection().length ?? 0) > 0,
            transferTo: this.orderedSelection().length > 0
        };
        const labels: Readonly<Record<ToolbarAction, string>> = {
            clear: messages.clearSelection,
            moveDown: messages.moveDown,
            moveUp: messages.moveUp,
            remove: messages.remove,
            transferAllFrom: target ? messages.transferAllFromList(target) : messages.transferAllFrom,
            transferAllTo: target ? messages.transferAllToList(target) : messages.transferAllTo,
            transferFrom: target ? messages.transferFromList(target) : messages.transferFrom,
            transferTo: target ? messages.transferToList(target) : messages.transferTo
        };
        return TOOLBAR_ORDER.filter(
            action => options.actions.includes(action) && (connectedList != null || !TRANSFER_ACTIONS.has(action))
        ).map(action => ({ action, enabled: enabled[action], label: labels[action] }));
    });
    protected readonly toolbarClasses = computed(() => {
        const direction = this.toolbarOrientation();
        return listBoxToolbarThemeVariants({ direction });
    });
    /** The toolbar's name: `toolbarAriaLabel`, else one built from the list box's name. */
    protected readonly toolbarLabel = computed(() => {
        const label = this.toolbarAriaLabel().trim();
        if (label) {
            return label;
        }
        const list = this.ariaLabel().trim();
        return list ? this.messages().toolbarLabel(list) : null;
    });
    protected readonly toolbarOptions = computed<ToolbarOptions | null>(() => {
        const toolbar = this.toolbar();
        if (typeof toolbar === "boolean") {
            return toolbar ? { actions: [...DEFAULT_ACTIONS], position: "right" } : null;
        }
        return {
            actions: toolbar.actions ? [...toolbar.actions] : [...DEFAULT_ACTIONS],
            position: toolbar.position ?? "right"
        };
    });
    /** A toolbar beside the list stacks its buttons; one above or below lines them up. */
    protected readonly toolbarOrientation = computed(() => {
        const position = this.toolbarOptions()?.position ?? "right";
        return position === "left" || position === "right" ? "vertical" : "horizontal";
    });
    /** The one enabled toolbar button in the Tab order; the arrow keys move between the others. */
    protected readonly toolbarTabStop = computed(() => {
        const enabled = this.toolbarButtons().filter(button => button.enabled);
        const focused = this.#toolbarFocus();
        return (enabled.find(button => button.action === focused) ?? enabled[0])?.action ?? null;
    });

    /**
     * @description Emitted when a toolbar action button is clicked, carrying the action's details.
     */
    public readonly actionClick = output<ListBoxActionEvent<T>>();

    /**
     * @description Accessible name for the list box's `listbox` element. Describe what the list represents,
     * which matters in particular when connecting two list boxes: the toolbar's name and the transfer buttons'
     * labels are built from it.
     * @default ""
     */
    public readonly ariaLabel = input<string>("", { alias: "aria-label" });

    /**
     * @description The other list box to transfer items to and from using the toolbar actions.
     * @default null
     */
    public readonly connectedList = input<ListBoxComponent<T, K> | null>(null);

    /**
     * @description Property name or predicate that marks items as disabled. Disabled items can't be selected, and no
     * action (including the "All" transfers) carries them.
     * @default ""
     */
    public readonly disabledBy = input<string | Predicate<T> | null | undefined>("");

    /**
     * @description Sets the height of the component.
     * @default 100%
     */
    public readonly height = input<string | number>("100%");

    /**
     * @description Collection of items to render.
     * @default []
     */
    public readonly items = input<Iterable<T>>([]);

    /** The items, as rendered. Read-only: change `items` to change them. */
    public readonly listBoxItems = computed(() => ImmutableList.create(this.items()));

    /**
     * @description Border-radius preset applied to the component.
     * @default medium
     */
    public readonly rounded = input<ListBoxVariantProps["rounded"]>("medium");

    /**
     * @description Property name or accessor used to derive the key from a data item, used to identify selected items.
     * @default ""
     */
    public readonly selectBy = input<ListKeySelector<T, K>>("");

    /** The selected items, read-only. */
    public readonly selectedItems = computed(() => {
        const listItems = this.#listService.selectedListItems();
        return listItems.select(item => item.data).toImmutableSet();
    });

    /** @deprecated Use the `selectedItems` signal or the `selectionChange` output. */
    public readonly selectedItems$ = toObservable(this.selectedItems);

    /**
     * @description Keys of the currently selected items.
     * @default []
     */
    public readonly selectedKeys = input<Iterable<K>>([]);

    /**
     * @description Emitted with the updated keys whenever the user changes the selection, including when an
     * action (transfer, clear, remove) or a selection in the connected list box changes it.
     */
    public readonly selectedKeysChange = output<K[]>();

    /**
     * @description Emitted with the selected and deselected items whenever the user changes the selection, including
     * when an action (transfer, clear, remove) or a selection in the connected list box changes it.
     */
    public readonly selectionChange = output<ListBoxSelectionEvent<T>>();

    /**
     * @description Allows multiple items to be selected simultaneously when set to `"multiple"`.
     * @default single
     */
    public readonly selectionMode = input<SelectionMode>("single");

    /**
     * @description Allows an already-selected item to be deselected by clicking it again while `selectionMode`
     * is `"single"`. Has no effect when `selectionMode` is `"multiple"`. Accepts the bare attribute form.
     * @default true
     */
    public readonly singleSelectionToggleable = input(true, { transform: booleanAttribute });

    /**
     * @description Size preset controlling the component's dimensions.
     * @default medium
     */
    public readonly size = input<ListBoxVariantProps["size"]>("medium");

    /**
     * @description Property name or accessor used to derive the display text from a data item.
     * @default ""
     */
    public readonly textField = input<ListKeySelector<T, string>>("");

    /**
     * @description Shows the action toolbar. Pass `false` to hide it entirely, or an options object to customize
     * which actions are shown and where the toolbar is positioned. The transfer actions appear only with a
     * `connectedList`; the move, clear and remove actions work on a list box of its own. Accepts the bare attribute
     * form.
     * @default true
     */
    public readonly toolbar = input<
        boolean | Partial<ToolbarOptions>,
        boolean | Partial<ToolbarOptions> | string | null | undefined
    >(true, { transform: toToolbarSetting });

    /**
     * @description Accessible name for the toolbar. By default it is built from the list box's `aria-label`
     * ("Available foods actions").
     * @default ""
     */
    public readonly toolbarAriaLabel = input<string>("");

    /**
     * @description Sets the width of the component.
     * @default 100%
     */
    public readonly width = input<string | number>("100%");

    public constructor() {
        effect(() => {
            const selectBy = this.selectBy();
            const keys = this.selectedKeys();
            untracked(() => {
                // Keys set from code are the new baseline; they aren't reported back as a user change.
                this.#listService.setValueField(selectBy ?? "");
                this.#listService.setSelectedKeys(keys ?? []);
                this.#reported = new Map(Array.from(keys ?? [], key => [key, undefined]));
            });
        });
        effect(onCleanup => {
            const connectedList = this.connectedList();
            if (!connectedList) {
                return;
            }
            // The connected list box learns which list box transfers to it, for the shortcuts used in it.
            untracked(() => connectedList.#owner.set(this));
            onCleanup(() => {
                if (untracked(connectedList.#owner) === this) {
                    connectedList.#owner.set(null);
                }
            });
        });
    }

    /**
     * @description Clears the selection and reports the change through `selectionChange` and `selectedKeysChange`.
     */
    public clearSelections(): void {
        this.#listService.clearSelections();
        this.reportSelection();
    }

    /**
     * @deprecated `clearSelections()` and the actions report selection changes themselves.
     */
    public notifySelectionChange(): void {
        this.reportSelection();
    }

    protected onActionClick(action: ToolbarAction, event: MouseEvent): void {
        const button = event.currentTarget instanceof HTMLButtonElement ? event.currentTarget : null;
        this.runAction(action, event, button);
    }

    /**
     * Keyboard shortcuts on an option: Alt+ArrowUp and Alt+ArrowDown move the selection, Delete removes it, and
     * Alt+ArrowRight and Alt+ArrowLeft (mirrored in RTL) transfer it to and from the connected list box. Each runs
     * only when the toolbar offers that action and the selection is in this list box.
     */
    protected onHostKeydown(event: KeyboardEvent): void {
        if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || !this.isOwnOption(event)) {
            return;
        }
        const shortcut = this.resolveShortcut(event);
        if (!shortcut) {
            return;
        }
        const { action, controller } = shortcut;
        const button = controller.toolbarButtons().find(candidate => candidate.action === action);
        if (!button?.enabled || controller.selectionHolder() !== this) {
            return;
        }
        event.preventDefault();
        controller.runAction(action, event, null);
    }

    protected onSelectedKeysChange(): void {
        this.reportSelection();
    }

    protected onToolbarFocusIn(event: FocusEvent): void {
        const action = this.toolbarActionOf(event.target);
        if (action) {
            this.#toolbarFocus.set(action);
        }
    }

    /** Arrow keys move between the toolbar's enabled buttons (wrapping), Home and End go to the first and last. */
    protected onToolbarKeydown(event: KeyboardEvent): void {
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
            return;
        }
        const buttons = this.toolbarButtons().filter(button => button.enabled);
        if (buttons.length === 0) {
            return;
        }
        const vertical = this.toolbarOrientation() === "vertical";
        const rtl = this.#direction() === "rtl";
        const nextKey = vertical ? "ArrowDown" : rtl ? "ArrowLeft" : "ArrowRight";
        const previousKey = vertical ? "ArrowUp" : rtl ? "ArrowRight" : "ArrowLeft";
        const current = Math.max(
            0,
            buttons.findIndex(button => button.action === this.toolbarTabStop())
        );
        let index: number;
        if (event.key === nextKey) {
            index = (current + 1) % buttons.length;
        } else if (event.key === previousKey) {
            index = (current - 1 + buttons.length) % buttons.length;
        } else if (event.key === "Home") {
            index = 0;
        } else if (event.key === "End") {
            index = buttons.length - 1;
        } else {
            return;
        }
        event.preventDefault();
        this.focusToolbarButton(buttons[index].action);
    }

    /**
     * Runs once the consumer's data change has rendered: announces the result and moves focus to what the action
     * acted on when a shortcut ran it, or when its button is now disabled (focus would otherwise drop to the page).
     */
    private afterActionRender(button: HTMLButtonElement | null, outcome: () => ActionOutcome): void {
        afterNextRender(
            {
                write: () => {
                    const { announcement, focus } = outcome();
                    if (announcement) {
                        void this.#liveAnnouncer.announce(announcement, "polite");
                    }
                    const active = this.#hostElementRef.nativeElement.ownerDocument.activeElement;
                    const focusLost = active == null || active === active.ownerDocument.body;
                    if (button == null || button.disabled || focusLost) {
                        focus();
                    }
                }
            },
            { injector: this.#injector }
        );
    }

    private clear(event: Event, button: HTMLButtonElement | null): void {
        const holder = this.selectionHolder();
        if (!holder) {
            return;
        }
        const selection = holder.orderedSelection();
        const clearEvent = new ListBoxClearEvent(
            selection.map(entry => entry.item),
            event
        );
        holder.actionClick.emit(clearEvent);
        if (clearEvent.isDefaultPrevented()) {
            return;
        }
        this.clearSelections();
        this.connectedList()?.clearSelections();
        this.afterActionRender(button, () => ({
            announcement: this.messages().selectionCleared,
            focus: () => holder.revealItem(selection[0]?.item, true)
        }));
    }

    private findItemByKey(key: unknown): T | undefined {
        return (
            this.listBoxItems().firstOrDefault(item => this.#listService.getDataItemValue(item) === key) ?? undefined
        );
    }

    private focusToolbarButton(action: ToolbarAction): void {
        this.#toolbarFocus.set(action);
        const button = this.#hostElementRef.nativeElement.querySelector<HTMLButtonElement>(
            `[role='toolbar'] button[data-action='${action}']`
        );
        button?.focus();
    }

    /** Whether a key event comes from one of this list box's own options (not a control in a template). */
    private isOwnOption(event: KeyboardEvent): boolean {
        const target = event.target;
        return (
            target instanceof HTMLElement &&
            target.hasAttribute("data-uid") &&
            target.closest("mona-list-box") === this.#hostElementRef.nativeElement
        );
    }

    private move(
        direction: Extract<ToolbarAction, "moveDown" | "moveUp">,
        event: Event,
        button: HTMLButtonElement | null
    ): void {
        const holder = this.selectionHolder();
        if (!holder || (direction === "moveUp" ? !this.canMoveUp() : !this.canMoveDown())) {
            return;
        }
        const selection = holder.orderedSelection();
        const indices = selection.map(entry => entry.index);
        const startIndex = indices[0];
        const newIndex = direction === "moveDown" ? indices[indices.length - 1] + 1 : startIndex - 1;
        const items = selection.map(entry => entry.item);
        // A shortcut keeps focus on the option it was pressed on; a button moves it to the first moved item.
        const highlighted = holder.#listService.highlightedItem()?.data;
        const focusItem = highlighted !== undefined && items.includes(highlighted) ? highlighted : items[0];
        const moveEvent = new ListBoxMoveEvent(direction, items, indices, startIndex, newIndex, event);
        holder.actionClick.emit(moveEvent);
        if (moveEvent.isDefaultPrevented()) {
            return;
        }
        this.afterActionRender(button, () => {
            const first = holder.selectedIndices()[0];
            holder.revealItem(holder.orderedSelection()[0]?.item, false);
            return {
                announcement:
                    first !== undefined && first !== startIndex
                        ? this.messages().itemsMoved(first + 1, holder.listBoxItems().size())
                        : null,
                focus: () => holder.revealItem(focusItem, true)
            };
        });
    }

    private remove(event: Event, button: HTMLButtonElement | null): void {
        const holder = this.selectionHolder();
        if (!holder) {
            return;
        }
        const selection = holder.orderedSelection();
        const removeEvent = new ListBoxRemoveEvent(
            selection.map(entry => entry.item),
            event
        );
        holder.actionClick.emit(removeEvent);
        if (removeEvent.isDefaultPrevented()) {
            return;
        }
        const keys = selection.map(entry => holder.#listService.getDataItemValue(entry.item));
        const firstIndex = selection[0].index;
        holder.clearSelections();
        this.afterActionRender(button, () => {
            const remaining = new Set(holder.listBoxItems().select(item => holder.#listService.getDataItemValue(item)));
            const removed = keys.filter(key => !remaining.has(key)).length;
            const enabledItems = holder.enabledItems();
            // The item now at the first removed one's position, or the last one.
            const neighbour = enabledItems.find(item => (holder.#itemIndexes().get(item) ?? -1) >= firstIndex);
            return {
                announcement: removed > 0 ? this.messages().itemsRemoved(removed) : null,
                focus: () => holder.revealItem(neighbour ?? enabledItems[enabledItems.length - 1], true)
            };
        });
    }

    /**
     * Emits `selectionChange` and `selectedKeysChange` when the selected keys differ from the ones last reported. A
     * new selection clears the connected list box's, as only one side holds a selection.
     */
    private reportSelection(): void {
        const keys = this.#listService.selectedKeys().toArray();
        const current = new Map<unknown, T | undefined>();
        for (const listItem of this.#listService.selectedListItems()) {
            current.set(this.#listService.getDataItemValue(listItem.data), listItem.data);
        }
        for (const key of keys) {
            if (!current.has(key)) {
                current.set(key, undefined);
            }
        }
        const previous = this.#reported;
        const selectedItems = [...current]
            .filter(([key]) => !previous.has(key))
            .map(([, item]) => item)
            .filter((item): item is T => item !== undefined);
        const deselectedItems = [...previous]
            .filter(([key]) => !current.has(key))
            .map(([key, item]) => item ?? this.findItemByKey(key))
            .filter((item): item is T => item !== undefined);
        const changed = keys.length !== previous.size || keys.some(key => !previous.has(key));
        this.#reported = current;
        if (!changed) {
            return;
        }
        this.selectionChange.emit({ deselectedItems, selectedItems });
        this.selectedKeysChange.emit(keys as K[]);
        if (selectedItems.length > 0) {
            this.connectedList()?.clearSelections();
            this.#owner()?.clearSelections();
        }
    }

    /**
     * The action a shortcut runs and the list box whose toolbar runs it. Transfers go towards the connected list
     * box, which follows this one in reading order: Alt+ArrowRight (Alt+ArrowLeft in RTL) from this list box,
     * Alt+ArrowLeft (Alt+ArrowRight in RTL) back from the connected one.
     */
    private resolveShortcut(
        event: KeyboardEvent
    ): { readonly action: ToolbarAction; readonly controller: ListBoxComponent<T, K> } | null {
        const toolbarHolder = this.toolbarOptions() ? this : this.#owner();
        if (event.key === "Delete" && !event.altKey) {
            return toolbarHolder ? { action: "remove", controller: toolbarHolder } : null;
        }
        if (!event.altKey) {
            return null;
        }
        if (event.key === "ArrowUp" || event.key === "ArrowDown") {
            const action = event.key === "ArrowUp" ? "moveUp" : "moveDown";
            return toolbarHolder ? { action, controller: toolbarHolder } : null;
        }
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
            return null;
        }
        const forward = (event.key === "ArrowRight") !== (this.#direction() === "rtl");
        if (forward) {
            return this.connectedList() ? { action: "transferTo", controller: this } : null;
        }
        const owner = this.#owner();
        return owner ? { action: "transferFrom", controller: owner } : null;
    }

    /** Scrolls an item into view, and focuses it, or the list when the item isn't there. */
    private revealItem(dataItem: T | undefined, focus: boolean): void {
        const key = dataItem === undefined ? undefined : this.#listService.getDataItemValue(dataItem);
        const listItem =
            dataItem === undefined
                ? null
                : this.#listService
                      .viewItems()
                      .firstOrDefault(item => !item.isHeader && this.#listService.getDataItemValue(item.data) === key);
        if (listItem) {
            if (focus) {
                this.#listService.highlightedItem.set(listItem);
            }
            this.#listService.scrollToItem(listItem, focus);
        } else if (focus) {
            this.#listService.focus$.next();
        }
    }

    private runAction(action: ToolbarAction, event: Event, button: HTMLButtonElement | null): void {
        switch (action) {
            case "clear":
                this.clear(event, button);
                break;
            case "moveDown":
            case "moveUp":
                this.move(action, event, button);
                break;
            case "remove":
                this.remove(event, button);
                break;
            default:
                this.transfer(action, event, button);
        }
    }

    /** Selects the items a transfer brought into this list box: all of them, or the first in single mode. */
    private selectTransferredItems(items: readonly T[]): void {
        const selected = this.selectionMode() === "multiple" ? items : items.slice(0, 1);
        this.#listService.setSelectedKeys(selected.map(item => this.#listService.getDataItemValue(item)));
        this.reportSelection();
    }

    private toolbarActionOf(target: EventTarget | null): ToolbarAction | null {
        if (!(target instanceof HTMLElement)) {
            return null;
        }
        const action = target.closest("button[data-action]")?.getAttribute("data-action");
        return TOOLBAR_ORDER.find(candidate => candidate === action) ?? null;
    }

    /**
     * "To" actions move items from this list box to the connected one, "From" actions from the connected one to
     * this one. The event fires on the source list box and carries the items to move: the selection, or every enabled
     * item for the "All" actions. Once the consumer has moved them, they are selected in the target.
     */
    private transfer(action: TransferAction, event: Event, button: HTMLButtonElement | null): void {
        const connectedList = this.connectedList();
        if (!connectedList) {
            return;
        }
        const toConnected = action === "transferTo" || action === "transferAllTo";
        const source = toConnected ? this : connectedList;
        const target = toConnected ? connectedList : this;
        const all = action === "transferAllTo" || action === "transferAllFrom";
        const items = all ? source.enabledItems() : source.orderedSelection().map(entry => entry.item);
        if (items.length === 0) {
            return;
        }
        const transferEvent = new ListBoxTransferEvent(action, items, event);
        source.actionClick.emit(transferEvent);
        if (transferEvent.isDefaultPrevented()) {
            return;
        }
        source.clearSelections();
        target.clearSelections();
        const keys = new Set(items.map(item => target.#listService.getDataItemValue(item)));
        this.afterActionRender(button, () => {
            const arrived = target
                .listBoxItems()
                .where(item => keys.has(target.#listService.getDataItemValue(item)))
                .toArray();
            if (arrived.length > 0) {
                target.selectTransferredItems(arrived);
                target.revealItem(arrived[0], false);
            }
            const name = target.ariaLabel().trim();
            const messages = this.messages();
            let announcement: string | null = null;
            if (arrived.length > 0) {
                announcement = name
                    ? messages.itemsTransferred(arrived.length, name)
                    : messages.itemsTransferredToOtherList(arrived.length);
            }
            return { announcement, focus: () => target.revealItem(arrived[0], true) };
        });
    }
}
