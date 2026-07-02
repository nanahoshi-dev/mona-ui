import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    Component,
    computed,
    contentChild,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    input,
    output,
    Signal,
    signal,
    TemplateRef,
    untracked
} from "@angular/core";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
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
import { ImmutableList, ImmutableSet } from "@mirei/ts-collections";
import { delay, filter, Observable, ReplaySubject, sample, scan, startWith, Subject, switchMap, tap } from "rxjs";
import { ButtonDirective } from "../../../buttons/button/directives/button.directive";
import { ListKeySelector } from "../../../common/list/models/ListSelectors";
import { SelectableOptions } from "../../../common/list/models/SelectableOptions";
import { ListService } from "../../../common/list/services/list.service";
import { ListViewComponent } from "../../../list-view/components/list-view/list-view.component";
import { ListViewFooterTemplateDirective } from "../../../list-view/directives/list-view-footer-template.directive";
import { ListViewHeaderTemplateDirective } from "../../../list-view/directives/list-view-header-template.directive";
import { ListViewItemTemplateDirective } from "../../../list-view/directives/list-view-item-template.directive";
import { ListViewNavigableDirective } from "../../../list-view/directives/list-view-navigable.directive";
import { ListViewNoDataTemplateDirective } from "../../../list-view/directives/list-view-no-data-template.directive";
import { ListViewSelectableDirective } from "../../../list-view/directives/list-view-selectable.directive";
import { SelectionMode } from "../../../models/SelectionMode";
import { ContainsPipe } from "../../../pipes/contains.pipe";
import { ThemeService } from "../../../theme/services/theme.service";
import { ListBoxFooterTemplateDirective } from "../../directives/list-box-footer-template.directive";
import { ListBoxHeaderTemplateDirective } from "../../directives/list-box-header-template.directive";
import { ListBoxItemTemplateDirective } from "../../directives/list-box-item-template.directive";
import { ListBoxNoDataTemplateDirective } from "../../directives/list-box-no-data-template.directive";
import { ListBoxActionEvent } from "../../models/ListBoxActionClickEvent";
import { ListBoxClearEvent } from "../../models/ListBoxClearEvent";
import { ListBoxMoveEvent } from "../../models/ListBoxMoveEvent";
import { ListBoxRemoveEvent } from "../../models/ListBoxRemoveEvent";
import { ListBoxSelectionEvent } from "../../models/ListBoxSelectionEvent";
import { ListBoxTransferEvent } from "../../models/ListBoxTransferEvent";
import { ToolbarAction, ToolbarOptions } from "../../models/ToolbarOptions";
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
    readonly #dataStateChange$ = new Subject<void>();
    readonly #destroyRef = inject(DestroyRef);
    readonly #hostElementRef: ElementRef<HTMLElement> = inject(ElementRef);
    readonly #listService = inject<ListService<T>>(ListService);
    readonly #notifySelectionChange$ = new ReplaySubject<boolean>(1);
    readonly #themeService = inject(ThemeService);
    /**
     * The list box (`this` or the connected list box) that currently holds the selection; falling back to `this`
     * when neither side has a selection. Used by actions that make sense to run on `this` even with no selection
     * (e.g., "transfer all"). For actions that require a real selection to proceed, use {@link getSelectedListBox} instead.
     */
    protected readonly activeListBox: Signal<ListBoxComponent<T, K>> = computed(() => {
        const selectedItems = this.selectedItems();
        if (selectedItems.any()) {
            return this;
        }
        const connectedList = this.connectedList();
        if (connectedList?.selectedItems().any()) {
            return connectedList;
        }
        return this;
    });
    protected readonly baseClasses = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        const size = this.size();
        const toolbarOptions = this.toolbarOptions();
        const position = toolbarOptions?.position ?? "right";
        const direction = position === "left" || position === "right" ? "horizontal" : "vertical";
        const reversed = position === "left" || position === "top";
        return listBoxBaseThemeVariants(theme)({ direction, reversed, rounded, size });
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
    protected readonly noDataTemplate = contentChild(ListBoxNoDataTemplateDirective, { read: TemplateRef });
    protected readonly selectableOptions = computed<SelectableOptions>(() => {
        const enabled = true;
        const mode = this.selectionMode();
        if (mode === "multiple") {
            return { enabled, mode };
        }
        return { enabled, mode, toggleable: this.singleSelectionToggleable() };
    });
    protected readonly toolbarClasses = computed(() => {
        const theme = this.#themeService.theme();
        const toolbarOptions = this.toolbarOptions();
        const position = toolbarOptions?.position ?? "right";
        const direction = position === "left" || position === "right" ? "vertical" : "horizontal";
        return listBoxToolbarThemeVariants(theme)({ direction });
    });
    protected readonly toolbarOptions = computed(() => {
        const toolbar = this.toolbar();
        if (typeof toolbar === "boolean") {
            return toolbar ? this.getDefaultToolbarOptions() : null;
        }
        return this.updateToolbarOptions(toolbar);
    });

    /**
     * @description Emitted when a toolbar action button is clicked, carrying the action's details.
     */
    public readonly actionClick = output<ListBoxActionEvent>();

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
    public readonly listBoxItems = signal(ImmutableList.create<T>());

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

    /**
     * @description Keys of the currently selected items.
     * @default []
     */
    public readonly selectedKeys = input<Iterable<K>>([]);

    /**
     * @description Emitted with the updated keys whenever the selection changes.
     */
    public readonly selectedKeysChange = output<K[]>();

    /**
     * @description Emitted with the selected and deselected items whenever the selection changes.
     */
    public readonly selectionChange = output<ListBoxSelectionEvent>();
    public readonly selectedItems = computed(() => {
        const listItems = this.#listService.selectedListItems();
        return listItems.select(item => item.data).toImmutableSet();
    });
    public readonly selectedItems$ = toObservable(this.selectedItems);

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
            const items = this.items();
            untracked(() => this.listBoxItems.set(ImmutableList.create(items)));
        });
        effect(onCleanup => {
            const connectedList = this.connectedList();
            if (!connectedList) {
                return;
            }
            const subscription = connectedList.selectionChange.subscribe(() => {
                untracked(() => this.clearSelections());
            });
            onCleanup(() => subscription.unsubscribe());
        });
        afterNextRender({
            read: () => this.setSubscriptions()
        });
    }

    /**
     * @description Clears the current selection without emitting `selectionChange`. Call {@link notifySelectionChange}
     * afterward if the resulting selection change should be emitted.
     */
    public clearSelections(): void {
        this.#listService.clearSelections();
    }

    /**
     * @description Emits `selectionChange` for any selection changes made since the last notification
     * (e.g., after programmatically calling {@link clearSelections}).
     */
    public notifySelectionChange(): void {
        this.#notifySelectionChange$.next(true);
    }

    protected onClearClick(event: MouseEvent): void {
        const listBox = this.activeListBox();
        if (!listBox) {
            return;
        }
        const selectedItems = listBox.selectedItems();
        if (selectedItems.none()) {
            return;
        }
        const clearEvent = new ListBoxClearEvent(selectedItems, event);
        listBox.actionClick.emit(clearEvent);
        if (!clearEvent.isDefaultPrevented()) {
            listBox.clearSelections();
            listBox.notifySelectionChange();
            this.connectedList()?.clearSelections();
            this.connectedList()?.notifySelectionChange();
        }
    }

    protected onMoveClick(direction: Extract<ToolbarAction, "moveDown" | "moveUp">, event: MouseEvent): void {
        const activeListBox = this.getSelectedListBox();
        if (!activeListBox) {
            return;
        }

        const selectedItems = activeListBox.selectedItems();
        if (selectedItems.none()) {
            const moveEvent = new ListBoxMoveEvent(direction, [], [], -1, -1, event);
            activeListBox.actionClick.emit(moveEvent);
            return;
        }

        const listBoxItems = activeListBox.listBoxItems();
        const startIndex = listBoxItems.indexOf(selectedItems.elementAt(0));
        const endIndex = listBoxItems.indexOf(selectedItems.elementAt(selectedItems.length - 1));

        let newMoveIndex: number;
        if (direction === "moveDown") {
            if (endIndex >= listBoxItems.length - 1) {
                return;
            }
            newMoveIndex = endIndex + 1;
        } else {
            if (startIndex <= 0) {
                return;
            }
            newMoveIndex = startIndex - 1;
        }

        const selectedIndices = selectedItems.select(item => listBoxItems.indexOf(item)).toArray();
        const moveEvent = new ListBoxMoveEvent(
            direction,
            selectedItems,
            selectedIndices,
            startIndex,
            newMoveIndex,
            event
        );

        activeListBox.actionClick.emit(moveEvent);

        if (!moveEvent.isDefaultPrevented()) {
            activeListBox.scrollToSelectedItem();
        }
    }

    protected onRemoveClick(event: MouseEvent): void {
        const listBox = this.activeListBox();
        if (!listBox) {
            return;
        }
        const selectedItems = listBox.selectedItems();
        if (selectedItems.none()) {
            return;
        }
        const removeEvent = new ListBoxRemoveEvent(selectedItems, event);
        listBox.actionClick.emit(removeEvent);
        if (!removeEvent.isDefaultPrevented()) {
            listBox.scrollToSelectedItem();
            this.#dataStateChange$.next();
        }
    }

    protected onSelectedKeysChange(keys: K[]): void {
        this.selectedKeysChange.emit(keys);
        this.connectedList()?.clearSelections();
        this.#notifySelectionChange$.next(true);
    }

    protected onTransferClick(
        action: Extract<ToolbarAction, "transferAllFrom" | "transferAllTo" | "transferFrom" | "transferTo">,
        event: MouseEvent
    ): void {
        const connectedList = this.connectedList();
        if (!connectedList) {
            return;
        }
        const sourceList = this.activeListBox();
        const targetList = this.activeListBox() === connectedList ? this : connectedList;
        if (!sourceList || !targetList) {
            return;
        }
        const selectedItems = sourceList.selectedItems();
        const transferEvent = new ListBoxTransferEvent(action, selectedItems, event);
        if (action === "transferFrom" || action === "transferAllFrom") {
            connectedList.actionClick.emit(transferEvent);
        } else {
            sourceList.actionClick.emit(transferEvent);
        }
        if (!transferEvent.isDefaultPrevented()) {
            sourceList.clearSelections();
            targetList.clearSelections();
            targetList.scrollToSelectedItem();
            this.#dataStateChange$.next();
        }
    }

    private createSelectedChangeNotifier(): Observable<ImmutableSet<T>> {
        return this.selectedItems$.pipe(
            sample(
                this.#notifySelectionChange$.pipe(
                    delay(0),
                    filter(e => e),
                    tap(() => this.#notifySelectionChange$.next(false))
                )
            ),
            scan((previous, current) => {
                const selectedItems = current.where(i => !previous.contains(i)).toArray();
                const deselectedItems = previous.where(i => !current.contains(i)).toArray();
                if (selectedItems.length > 0 || deselectedItems.length > 0) {
                    this.activeListBox()?.selectionChange.emit({ selectedItems, deselectedItems });
                }
                return current;
            }, this.selectedItems())
        );
    }

    /**
     * The list box (`this` or the connected list box, recursively) that currently has a real selection
     * or `null` if neither side has one. Unlike {@link activeListBox}, this does not fall back to `this`,
     * since move actions need to know an actual selected index to operate on.
     */
    private getSelectedListBox(): ListBoxComponent<T, K> | null {
        if (this.selectedItems().any()) {
            return this;
        }
        if (this.connectedList() != null) {
            return this.connectedList()!.getSelectedListBox();
        }
        return null;
    }

    private getDefaultToolbarOptions(): ToolbarOptions {
        return {
            actions: [
                "clear",
                "moveDown",
                "moveUp",
                "remove",
                "transferAllFrom",
                "transferAllTo",
                "transferFrom",
                "transferTo"
            ],
            position: "right"
        };
    }

    private scrollToSelectedItem(): void {
        const selectedItemElement = this.#hostElementRef.nativeElement.querySelector("[data-selected='true']");
        if (selectedItemElement) {
            selectedItemElement.scrollIntoView({ behavior: "auto", block: "center" });
        }
    }

    private setSubscriptions(): void {
        this.#dataStateChange$
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                startWith(null),
                switchMap(() => this.createSelectedChangeNotifier())
            )
            .subscribe();
    }

    private updateToolbarOptions(options: boolean | Partial<ToolbarOptions>): ToolbarOptions | null {
        if (typeof options === "boolean") {
            return options ? this.getDefaultToolbarOptions() : null;
        }
        const position = options.position ?? "right";
        let actions: ToolbarAction[];
        if (options.actions && options.actions.length > 0) {
            actions = options.actions;
        } else if (options.actions && options.actions.length === 0) {
            actions = [];
        } else {
            actions = [
                "clear",
                "moveDown",
                "moveUp",
                "remove",
                "transferAllFrom",
                "transferAllTo",
                "transferFrom",
                "transferTo"
            ];
        }
        return { actions, position };
    }
}
