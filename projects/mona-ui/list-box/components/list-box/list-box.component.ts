import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
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
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { ContainsPipe, SelectionMode } from "@nanahoshi/mona-ui/common";
import {
    LIST_VIEW_HOST_LIST_SERVICE,
    ListKeySelector,
    ListService,
    SelectableOptions
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
import { ImmutableList } from "@mirei/ts-collections";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { ListBoxFooterTemplateDirective } from "../../directives/list-box-footer-template.directive";
import { ListBoxHeaderTemplateDirective } from "../../directives/list-box-header-template.directive";
import { ListBoxItemTemplateDirective } from "../../directives/list-box-item-template.directive";
import { ListBoxNoDataTemplateDirective } from "../../directives/list-box-no-data-template.directive";
import { LIST_BOX_DEFAULT_MESSAGES } from "../../i18n/list-box.default-messages";
import { ListBoxActionEvent } from "../../models/ListBoxActionClickEvent";
import { ListBoxClearEvent } from "../../models/ListBoxClearEvent";
import { ListBoxMoveEvent } from "../../models/ListBoxMoveEvent";
import { ListBoxRemoveEvent } from "../../models/ListBoxRemoveEvent";
import { ListBoxSelectionEvent } from "../../models/ListBoxSelectionEvent";
import { ListBoxTransferEvent } from "../../models/ListBoxTransferEvent";
import { ToolbarAction, ToolbarOptions } from "../../models/ToolbarOptions";

type TransferAction = Extract<ToolbarAction, "transferAllFrom" | "transferAllTo" | "transferFrom" | "transferTo">;

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
import {
    listBoxBaseThemeVariants,
    listBoxToolbarThemeVariants,
    ListBoxVariantInputs,
    ListBoxVariantProps
} from "../../styles/list-box.styles";

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
        ContainsPipe,
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
        "[class]": "baseClasses()",
        "[style.height]": "listHeight()",
        "[style.width]": "listWidth()"
    }
})
export class ListBoxComponent<T = unknown, K = unknown> implements ListBoxVariantInputs {
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
    /** The selected items in list order (not the order they were selected in), with their indices. */
    protected readonly orderedSelection = computed(() => {
        const indexes = this.#itemIndexes();
        return this.selectedItems()
            .toArray()
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
        if (this.selectedItems().any()) {
            return this;
        }
        const connectedList = this.connectedList();
        return connectedList?.selectedItems().any() ? connectedList : null;
    });
    protected readonly toolbarClasses = computed(() => {
        const toolbarOptions = this.toolbarOptions();
        const position = toolbarOptions?.position ?? "right";
        const direction = position === "left" || position === "right" ? "vertical" : "horizontal";
        return listBoxToolbarThemeVariants({ direction });
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

    /**
     * @description Emitted when a toolbar action button is clicked, carrying the action's details.
     */
    public readonly actionClick = output<ListBoxActionEvent<T>>();

    /**
     * @description Accessible name for the list box's `listbox` element. Describe what the list represents,
     * which matters in particular when connecting two list boxes.
     * @default ""
     */
    public readonly ariaLabel = input<string>("", { alias: "aria-label" });

    /**
     * @description The other list box to transfer items to and from using the toolbar actions.
     * @default null
     */
    public readonly connectedList = input<ListBoxComponent<T, K> | null>(null);

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
     * action (transfer, clear, remove) or a selection in the connected list box clears it.
     */
    public readonly selectedKeysChange = output<K[]>();

    /**
     * @description Emitted with the selected and deselected items whenever the user changes the selection, including
     * when an action (transfer, clear, remove) or a selection in the connected list box clears it.
     */
    public readonly selectionChange = output<ListBoxSelectionEvent<T>>();

    /**
     * @description Allows multiple items to be selected simultaneously when set to `"multiple"`.
     * @default single
     */
    public readonly selectionMode = input<SelectionMode>("single");

    /**
     * @description Allows an already-selected item to be deselected by clicking it again while `selectionMode`
     * is `"single"`. Has no effect when `selectionMode` is `"multiple"`.
     * @default true
     */
    public readonly singleSelectionToggleable = input(true);

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
     * which actions are shown and where the toolbar is positioned.
     * @default true
     */
    public readonly toolbar = input<boolean | Partial<ToolbarOptions>>(true);

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
            // Selecting in the connected list box clears this one, as only one side holds a selection.
            const subscription = connectedList.selectionChange.subscribe(event => {
                if (event.selectedItems.length > 0) {
                    untracked(() => this.clearSelections());
                }
            });
            onCleanup(() => subscription.unsubscribe());
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

    protected onClearClick(event: MouseEvent): void {
        const holder = this.selectionHolder();
        if (!holder) {
            return;
        }
        const clearEvent = new ListBoxClearEvent(
            holder.orderedSelection().map(entry => entry.item),
            event
        );
        holder.actionClick.emit(clearEvent);
        if (!clearEvent.isDefaultPrevented()) {
            this.clearSelections();
            this.connectedList()?.clearSelections();
        }
    }

    protected onMoveClick(direction: Extract<ToolbarAction, "moveDown" | "moveUp">, event: MouseEvent): void {
        const holder = this.selectionHolder();
        if (!holder || (direction === "moveUp" ? !this.canMoveUp() : !this.canMoveDown())) {
            return;
        }
        const selection = holder.orderedSelection();
        const indices = selection.map(entry => entry.index);
        const startIndex = indices[0];
        const newIndex = direction === "moveDown" ? indices[indices.length - 1] + 1 : startIndex - 1;
        const moveEvent = new ListBoxMoveEvent(
            direction,
            selection.map(entry => entry.item),
            indices,
            startIndex,
            newIndex,
            event
        );
        holder.actionClick.emit(moveEvent);
        if (!moveEvent.isDefaultPrevented()) {
            holder.scrollToSelectedItemAfterRender();
        }
    }

    protected onRemoveClick(event: MouseEvent): void {
        const holder = this.selectionHolder();
        if (!holder) {
            return;
        }
        const removeEvent = new ListBoxRemoveEvent(
            holder.orderedSelection().map(entry => entry.item),
            event
        );
        holder.actionClick.emit(removeEvent);
        if (!removeEvent.isDefaultPrevented()) {
            holder.clearSelections();
        }
    }

    protected onSelectedKeysChange(): void {
        this.reportSelection();
    }

    /**
     * "To" actions move items from this list box to the connected one, "From" actions from the connected one to
     * this one. The event fires on the source list box and carries the items to move: the selection, or every item
     * for the "All" actions.
     */
    protected onTransferClick(action: TransferAction, event: MouseEvent): void {
        const connectedList = this.connectedList();
        if (!connectedList) {
            return;
        }
        const toConnected = action === "transferTo" || action === "transferAllTo";
        const source = toConnected ? this : connectedList;
        const target = toConnected ? connectedList : this;
        const all = action === "transferAllTo" || action === "transferAllFrom";
        const items = all ? source.listBoxItems().toArray() : source.orderedSelection().map(entry => entry.item);
        if (items.length === 0) {
            return;
        }
        const transferEvent = new ListBoxTransferEvent(action, items, event);
        source.actionClick.emit(transferEvent);
        if (!transferEvent.isDefaultPrevented()) {
            source.clearSelections();
            target.clearSelections();
            target.scrollToSelectedItemAfterRender();
        }
    }

    private findItemByKey(key: unknown): T | undefined {
        return (
            this.listBoxItems().firstOrDefault(item => this.#listService.getDataItemValue(item) === key) ?? undefined
        );
    }

    /**
     * Emits `selectionChange` and `selectedKeysChange` when the selected keys differ from the ones last reported.
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
    }

    /** Scrolls the selection into view once the consumer's data change has rendered. */
    private scrollToSelectedItemAfterRender(): void {
        afterNextRender(
            {
                read: () => {
                    const selected = this.#hostElementRef.nativeElement.querySelector("[data-selected='true']");
                    selected?.scrollIntoView({ behavior: "auto", block: "nearest" });
                }
            },
            { injector: this.#injector }
        );
    }
}
