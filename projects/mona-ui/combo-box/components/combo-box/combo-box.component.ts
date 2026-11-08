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
    model,
    output,
    signal,
    TemplateRef,
    untracked,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { FormValueControl } from "@angular/forms/signals";
import { FilterChangeEvent, type PreventableEvent } from "@nanahoshi/mona-ui/common";
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
    type DropdownPopupVariantInput,
    DropdownPrefixTemplateDirective,
    DropdownService
} from "@nanahoshi/mona-ui/dropdowns";
import { createElementControlId, injectEffectiveDisabled } from "@nanahoshi/mona-ui/internal";
import { IndicatorIconComponent } from "@nanahoshi/mona-ui/internal/indicator-icon";
import {
    ListComponent,
    ListFooterTemplateDirective,
    ListGroupHeaderTemplateDirective,
    ListHeaderTemplateDirective,
    type ListItem,
    ListItemTemplateDirective,
    ListNoDataTemplateDirective,
    ListService,
    type ListSizeInputType,
    type SelectableOptions,
    type SelectionChangeEvent
} from "@nanahoshi/mona-ui/internal/list";
import type { PopupCloseEvent } from "@nanahoshi/mona-ui/popup";
import { TextBoxDirective } from "@nanahoshi/mona-ui/text-box";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { debounceTime, filter, Subject, take, tap } from "rxjs";
import { twMerge } from "tailwind-merge";
import { COMBO_BOX_DEFAULT_MESSAGES } from "../../i18n/combo-box.default-messages";

import {
    comboBoxAffixContainerThemeVariants,
    comboBoxBaseThemeVariants,
    comboBoxTextInputThemeVariants,
    type ComboBoxVariantInput,
    type ComboBoxVariantProps
} from "../../styles/combo-box.styles";

@Component({
    selector: "mona-combo-box",
    templateUrl: "./combo-box.component.html",
    providers: [
        ListService,
        DropdownService,
        DropdownListService,
        {
            provide: DROPDOWN_DATA_INPUT_TOKEN,
            useExisting: forwardRef(() => ComboBoxComponent),
            multi: false
        },
        {
            provide: DROPDOWN_POPUP_INPUT_TOKEN,
            useExisting: forwardRef(() => ComboBoxComponent),
            multi: false
        }
    ],
    imports: [
        TextBoxDirective,
        NgTemplateOutlet,
        ListComponent,
        ListGroupHeaderTemplateDirective,
        ListFooterTemplateDirective,
        ListHeaderTemplateDirective,
        ListNoDataTemplateDirective,
        ListItemTemplateDirective,
        IndicatorIconComponent
    ],
    hostDirectives: [DropdownDataHandlerDirective, DropdownListPopupHandlerDirective, DropdownLiveRegionDirective],
    host: {
        // The host has no role: the inner input is the combobox and carries the name, description and state. A static
        // aria-* attribute written on <mona-combo-box> would otherwise stay on the host as well.
        "[attr.aria-describedby]": "null",
        "[attr.aria-label]": "null",
        "[attr.aria-labelledby]": "null",
        "[attr.data-disabled]": "effectiveDisabled() || null",
        "[attr.data-invalid]": "invalidState() || null",
        "[attr.data-readonly]": "readonly() || null",
        "[attr.tabindex]": "-1",
        "[class]": "baseClass()",
        "(focusout)": "onFocusOut($event)",
        "(pointerdown)": "onHostPointerDown($event)"
    }
})
export class ComboBoxComponent<TData = unknown, TValue = TData>
    implements
        FormValueControl<TValue | null>,
        ComboBoxVariantInput,
        DropdownDataInput<TData>,
        DropdownPopupInput,
        DropdownPopupVariantInput
{
    readonly #destroyRef = inject(DestroyRef);
    readonly #dropdownListService = inject<DropdownListService<TData>>(DropdownListService);
    readonly #dropdownService = inject(DropdownService);
    readonly #hostElementRef = inject(ElementRef);
    readonly #i18n = inject(MonaI18nService);
    readonly #listService = inject(ListService);
    readonly #popupRef = this.#dropdownService.popupRef;
    readonly #userNavigatedViaArrows = signal(false);

    protected readonly activeDescendant = computed(() => {
        const highlightedItem = this.#listService.highlightedItem();
        return highlightedItem ? highlightedItem.uid : null;
    });
    protected readonly affixClass = computed(() => {
        return comboBoxAffixContainerThemeVariants();
    });
    protected readonly baseClass = computed(() => {
        const disabled = this.effectiveDisabled();
        const focused = this.#popupRef() != null;
        const invalid = this.invalidState();
        const rounded = this.rounded();
        const size = this.size();
        const variantClass = comboBoxBaseThemeVariants({ disabled, focused, invalid, rounded, size });
        const userClass = this.userClass();
        return twMerge(variantClass, userClass);
    });
    protected readonly clearButtonVisible = computed(
        () =>
            this.showClearButton() &&
            this.selectedListItem() != null &&
            !this.loading() &&
            !this.effectiveDisabled() &&
            !this.readonly()
    );
    protected readonly comboBoxValue = signal("");
    protected readonly comboBoxValue$ = new Subject<string | null>();
    protected readonly effectiveDisabled = injectEffectiveDisabled(() => this.disabled());
    protected readonly expanded = computed(() => this.#popupRef() !== null);
    protected readonly footerTemplate = contentChild(DropdownFooterTemplateDirective, { read: TemplateRef });
    protected readonly groupHeaderTemplate = contentChild(DropdownGroupHeaderTemplateDirective, { read: TemplateRef });
    protected readonly headerTemplate = contentChild(DropdownHeaderTemplateDirective, { read: TemplateRef });
    protected readonly inputClass = computed(() => {
        const rounded = this.rounded();
        return comboBoxTextInputThemeVariants({ rounded });
    });
    protected readonly invalidState = computed(
        () => this.touched() && (this.invalid() || (this.required() && this.value() == null))
    );
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
    protected readonly messages = this.#i18n.componentMessages("comboBox", COMBO_BOX_DEFAULT_MESSAGES);
    protected readonly noDataTemplate = contentChild(DropdownNoDataTemplateDirective, { read: TemplateRef });
    protected readonly popupTemplate = viewChild.required<TemplateRef<unknown>>("popupTemplate");
    protected readonly prefixTemplate = contentChild(DropdownPrefixTemplateDirective, { read: TemplateRef });
    protected readonly selectableOptions: SelectableOptions = {
        enabled: true,
        mode: "single",
        toggleable: false
    };
    protected readonly selectedListItem = computed(() => {
        return this.#listService.selectedListItems().firstOrDefault();
    });
    protected readonly valueText = computed(() => {
        const listItem = this.selectedListItem();
        if (!listItem) {
            return "";
        }
        return this.#listService.getItemText(listItem);
    });

    /**
     * @description Allows a custom value to be committed when it doesn't match any item in {@link data}.
     * @default false
     */
    public readonly allowCustomValue = input(false, { transform: booleanAttribute });

    /**
     * @description ID of an element that provides an extended description for the input.
     * @default ""
     */
    public readonly ariaDescribedBy = input("", { alias: "aria-describedby" });

    /**
     * @description Accessible name for the input. Describe what the combo box represents. Prefer a visible label,
     * linked through {@link inputId} or `aria-labelledby`; without any of them, browsers fall back to the
     * {@link placeholder}.
     * @default ""
     */
    public readonly ariaLabel = input("", { alias: "aria-label" });

    /**
     * @description ID of an external element that provides the accessible name for the input.
     * @default ""
     */
    public readonly ariaLabelledBy = input("", { alias: "aria-labelledby" });

    /**
     * @description Emitted when the popup is about to close. This event is preventable.
     */
    // eslint-disable-next-line @angular-eslint/no-output-native -- renaming the output would break existing (close) bindings
    public readonly close = output<PopupCloseEvent>();

    /**
     * @description Emitted after the popup is closed.
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
     * @description Id of the inner `<input>` element. Point a `<label for>` or `<mona-label for>` at it to label the
     * combo box. A unique id is generated when it isn't set.
     * @default generated
     */
    public readonly inputId = input(createElementControlId());

    /**
     * @description Marks the combo box as invalid. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly invalid = input(false, { transform: booleanAttribute });

    /**
     * @description A predicate function or the name of the field that determines whether an item is disabled.
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
     * @description Emitted after the popup is opened.
     */
    public readonly opened = output();

    /**
     * @description Placeholder text shown when no value is selected or entered.
     * @default ""
     */
    public readonly placeholder = input("");

    /**
     * @description Sets the class of the popup element.
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
     * @description Sets the width of the popup element.
     * @default null
     */
    public readonly popupWidth = input<ListSizeInputType>(null);

    /**
     * @description Prevents value changes while preserving the component's visual state.
     * @default false
     */
    public readonly readonly = input(false, { transform: booleanAttribute });

    /**
     * @description Sets the required state of the combo box component.
     * @default false
     */
    public readonly required = input(false, { transform: booleanAttribute });

    /**
     * @description Border-radius preset applied to the component.
     * @default "medium"
     */
    public readonly rounded = input<ComboBoxVariantProps["rounded"]>("medium");

    /**
     * @description Displays a button that resets the value to empty when an item is selected.
     * @default false
     */
    public readonly showClearButton = input(false, { transform: booleanAttribute });

    /**
     * @description Size preset controlling the component's dimensions.
     * @default "medium"
     */
    public readonly size = input<ComboBoxVariantProps["size"]>("medium");

    /**
     * @description Property name or accessor used to derive the display text from a data item.
     * If not set, the item itself is used as the text representation.
     * @default undefined
     */
    public readonly textField = input<DropdownFieldSelectorType<TData, string>>();

    /**
     * @description Emitted when focus leaves the combo box. Moving between its input, clear button and popup doesn't
     * count. The `FormField` directive listens to this to mark the field as touched.
     */
    public readonly touch = output<void>();

    /**
     * @description Sets the touched state of the combo box. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly touched = input(false, { transform: booleanAttribute });

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string>("", { alias: "class" });

    /**
     * @description Two-way bindable current selected value. Implements `FormValueControl<TValue | null>`,
     * enabling signal forms `[formField]` binding.
     * Object mode returns the selected data item; primitive mode (see {@link valuePrimitive}) returns the value
     * resolved through {@link valueField}. `null` represents no selection.
     * @default null
     */
    public readonly value = model<TValue | null>(null);

    /**
     * @description Emitted with the entered text when the user presses Enter on text that matches no item, or leaves
     * the field with it. Only emitted when {@link allowCustomValue} is true.
     */
    public readonly valueAdd = output<string>();

    /**
     * @description Property name or accessor used to derive the value from a data item.
     * It is used for stable item identity, matching externally supplied values, and primitive
     * value projection when {@link valuePrimitive} is enabled.
     * When omitted, the item itself is used as the value representation.
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
            const popupTemplate = this.popupTemplate();
            untracked(() => this.#dropdownService.popupTemplate.set(popupTemplate));
        });

        effect(() => {
            const value = this.value();
            const valueField = this.valueField();
            this.valuePrimitive();
            this.selectedListItem();
            untracked(() => {
                this.#listService.setValueField(valueField ?? "");
                this.synchronizeSelection(value);
                this.comboBoxValue.set(this.valueText());
            });
        });
        afterNextRender({
            read: () => {
                this.initialize();
                this.setSubscriptions();
            }
        });
    }

    /**
     * @description Moves focus to the inner input. The caret goes to the end of the text.
     * @param options Passed to `HTMLElement.focus()`, for example `{ preventScroll: true }`.
     */
    public focus(options?: FocusOptions): void {
        const input = (this.#hostElementRef.nativeElement as HTMLElement).querySelector("input");
        if (input) {
            input.focus(options);
            input.setSelectionRange(input.value.length, input.value.length);
        }
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
        this.resolveText();
        this.touch.emit();
    }

    protected onHostPointerDown(event: PointerEvent): void {
        // A press on the padding, the affixes or the arrow focuses the input instead of the host. Controls of
        // their own (the input, the clear button, links or buttons in a prefix) keep the press.
        const host = this.#hostElementRef.nativeElement as HTMLElement;
        const target = event.target as HTMLElement | null;
        const control = target?.closest("a, button, input, select, textarea, [tabindex]");
        if (this.effectiveDisabled() || (control != null && control !== host)) {
            return;
        }
        event.preventDefault();
        host.querySelector("input")?.focus();
    }

    protected onInput(text: string): void {
        // Keep the signal in step with the input on every keystroke, so that writing the same text back (a revert to
        // the selected item's text, say) still reaches the DOM through the [value] binding.
        this.comboBoxValue.set(text);
        this.comboBoxValue$.next(text);
    }

    protected onItemSelect(event: SelectionChangeEvent<TData>): void {
        if (
            this.#listService.filterableOptions().enabled &&
            event.source.via === "keyboard" &&
            event.source.key !== "Enter"
        ) {
            return;
        }
        this.updateValue(this.getControlValue(event.item.data));
        this.closePopup();
    }

    protected onPopupPointerDown(event: PointerEvent): void {
        const target = event.target as HTMLElement | null;
        if (target?.tagName !== "INPUT") {
            event.preventDefault();
        }
    }

    protected onValueClear(event: Event): void {
        if (
            this.effectiveDisabled() ||
            this.readonly() ||
            (event instanceof KeyboardEvent && event.key !== "Enter" && event.key !== " ")
        ) {
            return;
        }
        event.preventDefault();
        event.stopImmediatePropagation();
        this.updateValue(null);
        this.#listService.clearSelections();
        this.comboBoxValue.set("");
        this.focus();
    }

    private clear(): void {
        this.updateValue(null);
        this.comboBoxValue.set("");
        this.#listService.clearSelections();
        this.#listService.clearFilter();
    }

    private closePopup(): void {
        this.#popupRef()?.close();
    }

    private getControlValue(dataItem: TData): TValue {
        const value = this.valuePrimitive() ? this.#listService.getDataItemValue(dataItem) : dataItem;
        return value as TValue;
    }

    private handleEnterKey(): void {
        const comboBoxText = this.comboBoxValue();
        const highlightedItem = this.#listService.highlightedItem();

        if (this.#userNavigatedViaArrows() && highlightedItem) {
            this.selectItem(highlightedItem);
            return;
        }

        if (!this.allowCustomValue()) {
            if (highlightedItem) {
                const highlightedText = this.#listService.getItemText(highlightedItem);
                if (highlightedText.toLowerCase() === comboBoxText.toLowerCase()) {
                    this.selectItem(highlightedItem);
                } else {
                    const matchingItem = this.#listService.getMatchingFilteredItem(comboBoxText);
                    if (matchingItem) {
                        this.selectItem(matchingItem);
                    } else {
                        this.clear();
                    }
                }
            } else {
                const matchingItem = this.#listService.getMatchingFilteredItem(comboBoxText);
                if (matchingItem) {
                    this.selectItem(matchingItem);
                } else {
                    this.clear();
                }
            }
        } else {
            if (highlightedItem) {
                const highlightedText = this.#listService.getItemText(highlightedItem);
                if (highlightedText.toLowerCase() === comboBoxText.toLowerCase()) {
                    this.selectItem(highlightedItem);
                } else if (comboBoxText) {
                    this.valueAdd.emit(comboBoxText);
                }
            } else if (comboBoxText) {
                this.valueAdd.emit(comboBoxText);
            }
        }
    }

    private initialize(): void {
        this.#listService.setNavigableOptions({ enabled: true, mode: "highlight" });
        this.#listService.setSelectableOptions(this.selectableOptions);
        this.#listService.filterInputVisible.set(false);
        this.comboBoxValue.set(this.valueText());
    }

    private notifyFilterChange(filter: string): FilterChangeEvent {
        const event = new FilterChangeEvent(filter);
        this.#listService.filterChange$.next(event);
        return event;
    }

    /**
     * Settles typed text when focus leaves the combo box, so the field never shows text that isn't its value:
     * an item whose text matches is selected, empty text clears the value, other text is offered through
     * `valueAdd` when custom values are allowed, and otherwise the selected item's text comes back.
     */
    private resolveText(): void {
        // Read the input itself: with a filter debounce, the last keystrokes may not have reached comboBoxValue yet.
        const input = (this.#hostElementRef.nativeElement as HTMLElement).querySelector("input");
        const text = input?.value ?? this.comboBoxValue();
        this.comboBoxValue.set(text);
        const selectedItem = this.selectedListItem();
        const selectedText = selectedItem ? this.#listService.getItemText(selectedItem) : "";
        if (text === selectedText) {
            return;
        }
        if (!text) {
            this.clear();
            return;
        }
        const matchingItem = this.#listService.getMatchingFilteredItem(text);
        if (matchingItem && this.#listService.getItemText(matchingItem).toLowerCase() === text.toLowerCase()) {
            this.selectItem(matchingItem);
            return;
        }
        if (this.allowCustomValue()) {
            this.valueAdd.emit(text);
            return;
        }
        this.comboBoxValue.set(selectedText);
    }

    private selectItem(item: ListItem<TData>): void {
        this.#listService.selectItem(item);
        this.updateValue(this.getControlValue(item.data));
    }

    private setArrowNavigationSubscription(): void {
        this.#dropdownListService.navigate$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(({ item }) => {
            if (!this.expanded()) {
                this.#listService.selectItem(item);
                this.updateValue(this.getControlValue(item.data));
            } else {
                this.#userNavigatedViaArrows.set(true);
            }
        });
    }

    private setComboboxValueSubscription(): void {
        this.comboBoxValue$
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                debounceTime(this.#listService.getFilterDebounceDuration()),
                filter(value => value !== null)
            )
            .subscribe(value => {
                this.#userNavigatedViaArrows.set(false);
                if (this.#listService.isFilteringEnabled()) {
                    const event = this.notifyFilterChange(value);
                    if (event.isDefaultPrevented()) {
                        return;
                    }
                    if (value) {
                        this.#listService.setFilter(value);
                    } else {
                        this.#listService.clearFilter();
                    }
                }

                if (!this.#popupRef()) {
                    this.#dropdownService.triggerPopupOpen$.next({});
                }

                this.comboBoxValue.set(value ?? "");
                const item = this.#listService.getMatchingFilteredItem(value);
                if (item) {
                    this.#listService.highlightedItem.set(item);

                    if (this.#popupRef()) {
                        this.#listService.scrollToItem$.next({ item, focus: false });
                    } else {
                        this.#dropdownService.popupOpenComplete$.pipe(take(1)).subscribe(() => {
                            this.#listService.scrollToItem$.next({ item, focus: false });
                        });
                    }
                }
            });
    }

    private setEscapeKeySubscription(): void {
        this.#dropdownService.beforeKeydown$
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                filter(e => e.originalEvent?.key === "Escape"),
                tap(e => e.preventDefault())
            )
            .subscribe(event => {
                if (this.#popupRef()) {
                    const selectedItem = this.selectedListItem();
                    if (selectedItem) {
                        this.comboBoxValue.set(this.#listService.getItemText(selectedItem));
                    } else {
                        this.clear();
                    }
                    this.closePopup();
                } else if (this.comboBoxValue() || this.value() != null) {
                    // This Escape was used to clear the field; a dialog or window around it waits for the next.
                    event.originalEvent?.stopPropagation();
                    this.clear();
                    this.focus();
                }
            });
    }

    private setKeydownSubscription(): void {
        this.#dropdownService.keydown$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(event => {
            if (event.key === "Enter") {
                event.preventDefault();
                this.handleEnterKey();
                this.closePopup();
            } else if (event.key === "Tab") {
                this.closePopup();
            }
        });
    }

    private setPopupCloseSubscriptions(): void {
        this.#dropdownService.popupCloseComplete$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => {
            this.#userNavigatedViaArrows.set(false);
            if (this.#dropdownService.focusCanReturn()) {
                this.focus();
            }
            window.setTimeout(() => {
                this.comboBoxValue$.next(null);
            });
        });
    }

    private setSpaceKeySubscription(): void {
        this.#dropdownService.beforeKeydown$
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                filter(e => e.originalEvent?.key === " "),
                tap(e => e.preventDefault())
            )
            .subscribe();
    }

    private setSubscriptions(): void {
        this.setArrowNavigationSubscription();
        this.setComboboxValueSubscription();
        this.setEscapeKeySubscription();
        this.setKeydownSubscription();
        this.setPopupCloseSubscriptions();
        this.setSpaceKeySubscription();
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
        this.comboBoxValue.set(this.valueText());
    }
}
