import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    booleanAttribute,
    Component,
    computed,
    contentChild,
    DestroyRef,
    effect,
    ElementRef,
    forwardRef,
    inject,
    input,
    linkedSignal,
    model,
    output,
    TemplateRef,
    untracked,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { FormValueControl } from "@angular/forms/signals";
import type { PreventableEvent } from "@nanahoshi/mona-ui/common";
import {
    DropdownDataHandlerDirective,
    type DropdownDataInput,
    DROPDOWN_DATA_INPUT_TOKEN,
    type DropdownFieldPredicateType,
    type DropdownFieldSelectorType,
    DropdownFooterTemplateDirective,
    DropdownGroupHeaderTemplateDirective,
    DropdownHeaderTemplateDirective,
    DropdownItemTemplateDirective,
    DropdownListPopupHandlerDirective,
    DropdownListService,
    DropdownLiveRegionDirective,
    DropdownNoDataTemplateDirective,
    type DropdownPopupInput,
    DROPDOWN_POPUP_INPUT_TOKEN,
    dropdownPopupThemeVariants,
    DropdownPrefixTemplateDirective,
    DropdownService
} from "@nanahoshi/mona-ui/dropdowns";
import {
    createElementControlId,
    isTypeaheadKey,
    setupTypeahead,
    TYPEAHEAD_RESET_DELAY
} from "@nanahoshi/mona-ui/internal";
import { IndicatorIconComponent } from "@nanahoshi/mona-ui/internal/indicator-icon";
import {
    ListComponent,
    ListFooterTemplateDirective,
    ListGroupHeaderTemplateDirective,
    ListHeaderTemplateDirective,
    ListItemTemplateDirective,
    ListNoDataTemplateDirective,
    ListService,
    type ListSizeInputType,
    type SelectableOptions,
    type SelectionChangeEvent
} from "@nanahoshi/mona-ui/internal/list";
import { type PopupCloseEvent, PopupCloseSource } from "@nanahoshi/mona-ui/popup";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { filter, Subject } from "rxjs";
import { twMerge } from "tailwind-merge";
import { DropdownListValueTemplateDirective } from "../../directives/dropdown-list-value-template.directive";
import { DROPDOWN_LIST_DEFAULT_MESSAGES } from "../../i18n/dropdown-list.default-messages";
import {
    dropdownListAffixContainerThemeVariants,
    dropdownListInputThemeVariants,
    dropdownListValueContainerThemeVariants,
    type DropDownListVariantInput,
    type DropDownListVariantProps
} from "../../styles/dropdown-list.styles";

const cancellingCloseSources: ReadonlySet<PopupCloseSource | undefined> = new Set([
    PopupCloseSource.BackdropClick,
    PopupCloseSource.Escape,
    PopupCloseSource.OutsideClick,
    PopupCloseSource.Scroll
]);

@Component({
    selector: "mona-dropdown-list",
    templateUrl: "./dropdown-list.component.html",
    hostDirectives: [DropdownDataHandlerDirective, DropdownListPopupHandlerDirective, DropdownLiveRegionDirective],
    providers: [
        ListService,
        DropdownService,
        DropdownListService,
        {
            provide: DROPDOWN_DATA_INPUT_TOKEN,
            useExisting: forwardRef(() => DropdownListComponent),
            multi: false
        },
        {
            provide: DROPDOWN_POPUP_INPUT_TOKEN,
            useExisting: forwardRef(() => DropdownListComponent),
            multi: false
        }
    ],
    imports: [
        NgTemplateOutlet,
        ListComponent,
        ListItemTemplateDirective,
        ListGroupHeaderTemplateDirective,
        ListFooterTemplateDirective,
        ListHeaderTemplateDirective,
        ListNoDataTemplateDirective,
        IndicatorIconComponent
    ],
    host: {
        "[attr.aria-activedescendant]": "activeDescendant()",
        "[attr.aria-busy]": "loading() ? 'true' : undefined",
        "[attr.aria-controls]": "listId",
        "[attr.aria-describedby]": "ariaDescribedBy() || null",
        "[attr.aria-disabled]": "disabled() ? true : undefined",
        "[attr.aria-expanded]": "expanded()",
        "[attr.aria-haspopup]": "'listbox'",
        "[attr.aria-invalid]": "invalidState() ? true : undefined",
        "[attr.aria-label]": "effectiveAriaLabel() || null",
        "[attr.aria-labelledby]": "ariaLabelledBy() || null",
        "[attr.aria-readonly]": "readonly() ? true : undefined",
        "[attr.aria-required]": "required() ? true : undefined",
        "[attr.data-disabled]": "disabled() || null",
        "[attr.data-invalid]": "invalidState() || null",
        "[attr.data-readonly]": "readonly() || null",
        "[attr.role]": "'combobox'",
        "[attr.tabindex]": "disabled() ? null : 0",
        "[class]": "baseClass()",
        "(focusout)": "onFocusOut($event)"
    }
})
export class DropdownListComponent<TData = unknown, TValue = TData>
    implements FormValueControl<TValue | null>, DropDownListVariantInput, DropdownDataInput<TData>, DropdownPopupInput
{
    readonly #destroyRef = inject(DestroyRef);
    readonly #dropdownListService = inject<DropdownListService<TData>>(DropdownListService);
    readonly #dropdownService = inject(DropdownService);
    readonly #hostElementRef = inject(ElementRef<HTMLElement>);
    readonly #i18n = inject(MonaI18nService);
    readonly #listService = inject<ListService<TData>>(ListService);
    readonly #navigatedItem = linkedSignal<TData | null>(() => this.selectedDataItem());
    readonly #typeaheadKey = new Subject<string>();
    #lastTypeaheadKeyTime = Number.NEGATIVE_INFINITY;

    protected readonly activeDescendant = computed(() => {
        const highlightedItem = this.#listService.highlightedItem();
        return highlightedItem ? highlightedItem.uid : null;
    });
    protected readonly affixClass = computed(() => {
        return dropdownListAffixContainerThemeVariants();
    });
    protected readonly baseClass = computed(() => {
        const disabled = this.disabled();
        const expanded = this.expanded();
        const hasPrefix = this.prefixTemplate() != null;
        const invalid = this.invalidState();
        const rounded = this.rounded();
        const size = this.size();
        const classes = dropdownListInputThemeVariants({
            disabled,
            expanded,
            hasPrefix,
            invalid,
            rounded,
            size
        });
        const userClass = this.userClass();
        return twMerge(classes, userClass);
    });
    protected readonly clearButtonVisible = computed(
        () =>
            this.showClearButton() &&
            this.selectedListItem() != null &&
            !this.loading() &&
            !this.disabled() &&
            !this.readonly()
    );
    protected readonly effectiveAriaLabel = computed(
        () => this.ariaLabel() || (this.ariaLabelledBy() ? "" : this.placeholder())
    );
    protected readonly expanded = computed(() => this.#dropdownService.popupRef() !== null);
    protected readonly footerTemplate = contentChild(DropdownFooterTemplateDirective, { read: TemplateRef });
    protected readonly groupHeaderTemplate = contentChild(DropdownGroupHeaderTemplateDirective, {
        read: TemplateRef
    });
    protected readonly headerTemplate = contentChild(DropdownHeaderTemplateDirective, { read: TemplateRef });
    protected readonly invalidState = computed(
        () => this.touched() && (this.invalid() || (this.required() && this.value() == null))
    );
    protected readonly isEmpty = computed(() => !this.#listService.viewItems().any());
    protected readonly itemTemplate = contentChild(DropdownItemTemplateDirective, { read: TemplateRef });
    protected readonly listId = createElementControlId();
    protected readonly listPopupClass = computed(() => {
        const rounded = this.rounded();
        const size = this.size();
        const userClass = this.popupClass();
        const variantClass = dropdownPopupThemeVariants({ rounded, size });
        // With a popupHeight, the overlay sets the limit; the default max-h-64 would cut a taller popup short.
        const heightClass = this.popupHeight() ? "max-h-none" : "";
        return twMerge(variantClass, heightClass, userClass);
    });
    protected readonly messages = this.#i18n.componentMessages("dropdownList", DROPDOWN_LIST_DEFAULT_MESSAGES);
    protected readonly noDataTemplate = contentChild(DropdownNoDataTemplateDirective, { read: TemplateRef });
    protected readonly popupTemplate = viewChild.required<TemplateRef<unknown>>("popupTemplate");
    protected readonly prefixTemplate = contentChild(DropdownPrefixTemplateDirective, { read: TemplateRef });
    protected readonly selectableOptions: SelectableOptions = {
        enabled: true,
        mode: "single",
        toggleable: false
    };
    protected readonly selectedDataItem = computed(() => {
        return this.selectedListItem()?.data ?? null;
    });
    protected readonly selectedListItem = computed(() => {
        return this.#listService.selectedListItems().firstOrDefault();
    });
    protected readonly valueContainerClass = computed(() => {
        const hasTemplate = this.valueTemplate() != null;
        return dropdownListValueContainerThemeVariants({ hasTemplate });
    });
    protected readonly valueTemplate = contentChild(DropdownListValueTemplateDirective, { read: TemplateRef });
    protected readonly valueText = computed(() => {
        const listItem = this.selectedListItem();
        if (!listItem) {
            return "";
        }
        return this.#listService.getItemText(listItem);
    });

    /**
     * @description ID of an element that describes the dropdown list, such as help text or an error message.
     * @default ""
     */
    public readonly ariaDescribedBy = input("", { alias: "aria-describedby" });

    /**
     * @description Accessible name for the host element. Describe what the component represents.
     * When empty, falls back to the placeholder text.
     * @default ""
     */
    public readonly ariaLabel = input("", { alias: "aria-label" });

    /**
     * @description ID of an external element that provides the accessible name for the host element.
     * @default ""
     */
    public readonly ariaLabelledBy = input("", { alias: "aria-labelledby" });

    /**
     * @description Emitted when the popup is about to close. This event is preventable.
     */
    // eslint-disable-next-line @angular-eslint/no-output-native -- renaming the output would break existing (close) bindings
    public readonly close = output<PopupCloseEvent>();

    /**
     * @description Emitted after the popup closes.
     */
    public readonly closed = output();

    /**
     * @description Collection of items to render.
     * @default []
     */
    public readonly data = input<Iterable<TData>>([]);

    /**
     * @description Renders the component with reduced visual emphasis and removes pointer interaction.
     * @default false
     */
    public readonly disabled = input(false, { transform: booleanAttribute });

    /**
     * @description Marks the field as invalid. Set automatically by the `FormField` directive when bound via `[formField]`.
     * @default false
     */
    public readonly invalid = input(false, { transform: booleanAttribute });

    /**
     * @description Predicate or field name used to determine whether an individual item is disabled.
     * @default undefined
     */
    public readonly itemDisabled = input<DropdownFieldPredicateType<TData>>();

    /**
     * @description Shows a loading indicator, in place of the clear button, and marks the field busy. It doesn't
     * block interaction: the field stays usable while data loads.
     * @default false
     */
    public readonly loading = input(false, { transform: booleanAttribute });

    /**
     * @description Emitted when the popup is about to open. This event is preventable.
     */
    public readonly open = output<PreventableEvent>();

    /**
     * @description Emitted after the popup opens.
     */
    public readonly opened = output();

    /**
     * @description Placeholder text shown when no value is selected or entered.
     * @default ""
     */
    public readonly placeholder = input("");

    /**
     * @description Additional CSS classes applied to the popup element.
     * @default ""
     */
    public readonly popupClass = input("");

    /**
     * @description Maximum height of the popup, in pixels or as a CSS length. Shorter lists shrink to fit. When
     * unset, the popup is at most 200 pixels tall.
     * @default null
     */
    public readonly popupHeight = input<ListSizeInputType>(null);

    /**
     * @description Width of the popup element.
     * @default null
     */
    public readonly popupWidth = input<ListSizeInputType>(null);

    /**
     * @description Prevents value changes while preserving the component's visual state.
     * @default false
     */
    public readonly readonly = input(false, { transform: booleanAttribute });

    /**
     * @description Marks the field as required for form validation.
     * @default false
     */
    public readonly required = input(false, { transform: booleanAttribute });

    /**
     * @description Border-radius preset applied to the component.
     * @default "medium"
     */
    public readonly rounded = input<DropDownListVariantProps["rounded"]>("medium");

    /**
     * @description Shows a clear button that resets the selected value when clicked.
     * @default false
     */
    public readonly showClearButton = input(false, { transform: booleanAttribute });

    /**
     * @description Size preset controlling the component's dimensions.
     * @default "medium"
     */
    public readonly size = input<DropDownListVariantProps["size"]>("medium");

    /**
     * @description Property name or accessor used to derive the display text from a data item.
     * If omitted, the item itself is used as the display text.
     * @default undefined
     */
    public readonly textField = input<DropdownFieldSelectorType<TData, string>>();

    /**
     * @description Emitted when focus leaves the dropdown list. Moving between it, its clear button and its popup
     * doesn't count. The `FormField` directive listens to this to mark the field as touched.
     */
    public readonly touch = output<void>();

    /**
     * @description Marks the control as touched. Set automatically by the `FormField` directive when bound via `[formField]`.
     * @default false
     */
    public readonly touched = input(false, { transform: booleanAttribute });

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string>("", { alias: "class" });

    /**
     * @description Currently selected value, two-way bindable and compatible with Signal Forms via `[formField]`.
     * Object mode returns the selected data item; primitive mode (see {@link valuePrimitive}) returns the value
     * resolved through {@link valueField}. `null` represents no selection.
     * @default null
     */
    public readonly value = model<TValue | null>(null);

    /**
     * @description Property name or accessor used to derive the value from a data item.
     * It is used for stable item identity, matching externally supplied values, and primitive
     * value projection when {@link valuePrimitive} is enabled.
     * When omitted, the item itself is used as the value.
     * Should resolve to a stable, unique scalar.
     * @default undefined
     */
    public readonly valueField = input<DropdownFieldSelectorType<TData, unknown>>();

    /**
     * @description Determines whether the bound value contains complete data items
     * or values extracted through {@link valueField}.
     *
     * When `false`, selecting an item writes the complete data item.
     * When `true`, selecting an item writes the value resolved through `valueField`.
     *
     * @default false
     */
    public readonly valuePrimitive = input(false, { transform: booleanAttribute });

    public constructor() {
        effect(() => {
            const value = this.value();
            const valueField = this.valueField();
            this.valuePrimitive();
            untracked(() => {
                this.#listService.setValueField(valueField ?? "");
                this.synchronizeSelection(value);
            });
        });
        effect(() => {
            const popupTemplate = this.popupTemplate();
            untracked(() => this.#dropdownService.popupTemplate.set(popupTemplate));
        });
        afterNextRender({
            read: () => {
                this.initialize();
                this.setSubscriptions();
            }
        });
        effect(() => {
            const filterableOptions = this.#listService.filterableOptions();
            untracked(() => {
                if (filterableOptions.enabled) {
                    this.#listService.setNavigableOptions({ mode: "highlight" });
                } else {
                    this.#listService.setNavigableOptions({ mode: "select" });
                }
            });
        });
    }

    /**
     * @description Moves focus to the dropdown list.
     * @param options Passed to `HTMLElement.focus()`, for example `{ preventScroll: true }`.
     */
    public focus(options?: FocusOptions): void {
        this.#hostElementRef.nativeElement?.focus(options);
    }

    public setValue(value: TValue): void {
        this.updateValue(value);
    }

    protected onFocusOut(event: FocusEvent): void {
        // Removing a focused dropdown from the page fires focusout after it is destroyed.
        if (this.#destroyRef.destroyed) {
            return;
        }
        const nextTarget = event.relatedTarget;
        if (nextTarget instanceof Node) {
            const popupElement = this.#dropdownService.popupRef()?.overlayRef.overlayElement;
            if (this.#hostElementRef.nativeElement.contains(nextTarget) || popupElement?.contains(nextTarget)) {
                return;
            }
        }
        this.touch.emit();
    }

    protected onItemSelect(event: SelectionChangeEvent<TData>): void {
        if (
            this.#listService.filterableOptions().enabled &&
            event.source.via === "keyboard" &&
            event.source.key !== "Enter"
        ) {
            this.#navigatedItem.set(event.item.data);
            return;
        }
        this.updateValue(this.getControlValue(event.item.data));
        if (event.source.via === "mouse" || event.source.key === "Enter" || event.source.key === "NumpadEnter") {
            this.closePopup();
        }
    }

    protected onPopupPointerDown(event: PointerEvent): void {
        const target = event.target as HTMLElement | null;
        if (target?.tagName !== "INPUT") {
            event.preventDefault();
        }
    }

    protected onValueClear(event: MouseEvent | KeyboardEvent): void {
        if (
            this.disabled() ||
            this.readonly() ||
            (event instanceof KeyboardEvent && event.key !== "Enter" && event.key !== " ")
        ) {
            return;
        }
        event.stopImmediatePropagation();
        event.preventDefault();
        this.updateValue(null);
        this.#listService.clearSelections();
        this.focus();
    }

    private closePopup(): void {
        this.#dropdownService.popupRef()?.close();
    }

    private cycleThroughMatchedItems(buffer: string): void {
        const nextItem = this.#listService.cycleThroughMatchedItems(buffer);
        if (!nextItem) {
            return;
        }
        const selectedItems = this.#listService.selectedListItems();
        if (selectedItems.contains(nextItem)) {
            return;
        }
        this.#listService.selectItem(nextItem);
        const expanded = this.expanded();
        if (!expanded) {
            this.updateValue(this.getControlValue(nextItem.data));
        } else {
            this.scrollToSelectedItem();
            this.#navigatedItem.set(nextItem.data);
        }
    }

    private getControlValue(dataItem: TData): TValue {
        const value = this.valuePrimitive() ? this.#listService.getDataItemValue(dataItem) : dataItem;
        return value as TValue;
    }

    private handleEnterKey(): void {
        if (!this.expanded()) {
            this.#dropdownService.triggerPopupOpen$.next({});
            return;
        }
        const navigatedItem = this.#navigatedItem();
        if (navigatedItem && this.value() !== this.getControlValue(navigatedItem)) {
            this.updateValue(this.getControlValue(navigatedItem));
        }
        this.closePopup();
    }

    private handleHomeEndKeys(event: KeyboardEvent): void {
        const itemToSelect =
            event.key === "Home"
                ? this.#listService.viewItems().firstOrDefault()
                : this.#listService.viewItems().lastOrDefault();
        if (!itemToSelect) {
            return;
        }
        this.#listService.selectItem(itemToSelect, true, false);
        if (!this.expanded()) {
            this.updateValue(this.getControlValue(itemToSelect.data));
        } else {
            this.#navigatedItem.set(itemToSelect.data);
        }
    }

    private initialize(): void {
        this.#listService.setNavigableOptions({ enabled: true, mode: "select" });
        this.#listService.setSelectableOptions(this.selectableOptions);
    }

    private pushTypeaheadKey(key: string): void {
        this.#lastTypeaheadKeyTime = Date.now();
        this.#typeaheadKey.next(key);
    }

    private scrollToSelectedItem(): void {
        const item = this.selectedListItem();
        if (!item) {
            return;
        }
        window.setTimeout(() => this.#listService.scrollToItem(item, false));
    }

    private setArrowKeyNavigationSubscription(): void {
        this.#dropdownListService.navigate$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(({ item }) => {
            if (!this.expanded()) {
                this.updateValue(this.getControlValue(item.data));
            } else {
                this.#navigatedItem.set(item.data);
            }
        });
    }

    private setFilterChangeSubscription(): void {
        this.#listService.filterChange$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(event => {
            if (event.filter) {
                const item = this.#listService.getMatchingFilteredItem(event.filter);
                if (item) {
                    this.#listService.highlightedItem.set(item);
                }
            }
        });
    }

    private setKeydownSubscription(): void {
        this.#dropdownService.keydown$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(event => {
            if (event.key === "Enter") {
                event.preventDefault();
                this.handleEnterKey();
            } else if (event.key === "Home" || event.key === "End") {
                event.preventDefault();
                this.handleHomeEndKeys(event);
            } else if (isTypeaheadKey(event.key, event)) {
                this.pushTypeaheadKey(event.key);
            }
        });
    }

    private setPopupCloseSubscriptions(): void {
        this.#dropdownService.popupCloseComplete$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(event => {
            if (cancellingCloseSources.has(event.via)) {
                // Escape, an outside click or a scroll cancels: drop the option the arrow keys reached.
                this.synchronizeSelection(this.value());
                this.#navigatedItem.set(this.selectedDataItem());
            } else {
                const navigatedItem = this.#navigatedItem();
                this.updateValue(navigatedItem ? this.getControlValue(navigatedItem) : null);
            }
            if (this.#dropdownService.focusCanReturn()) {
                window.setTimeout(() => this.focus());
            } else if (!this.#destroyRef.destroyed) {
                // Focus left from inside the popup (its filter box), so the host never saw a focusout.
                this.touch.emit();
            }
        });
    }

    private setSubscriptions(): void {
        this.setArrowKeyNavigationSubscription();
        this.setKeydownSubscription();
        this.setFilterChangeSubscription();
        this.setPopupCloseSubscriptions();
        this.setTypeaheadSpaceSubscription();
        this.setTypeaheadSubscription();
    }

    private setTypeaheadSpaceSubscription(): void {
        // While a typeahead search is under way, Space is part of it ("New York"), not the popup toggle.
        this.#dropdownService.beforeKeydown$
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                filter(
                    e => e.originalEvent?.key === " " && Date.now() - this.#lastTypeaheadKeyTime < TYPEAHEAD_RESET_DELAY
                )
            )
            .subscribe(event => {
                event.preventDefault();
                event.originalEvent?.preventDefault();
                this.pushTypeaheadKey(" ");
            });
    }

    private setTypeaheadSubscription(): void {
        setupTypeahead(this.#typeaheadKey)
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(buffer => this.cycleThroughMatchedItems(buffer));
    }

    private synchronizeSelection(value: TValue | null): void {
        if (value == null) {
            this.#listService.clearSelections();
            return;
        }
        if (this.valuePrimitive()) {
            this.#listService.setSelectedKeys([value]);
        } else {
            this.#listService.setSelectedDataItems([value as unknown as TData]);
        }
    }

    private updateValue(value: TValue | null): void {
        if (this.value() !== value) {
            this.value.set(value);
        }
    }
}
