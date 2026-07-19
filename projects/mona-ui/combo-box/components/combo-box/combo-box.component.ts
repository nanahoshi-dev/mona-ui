import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
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
    signal,
    TemplateRef,
    untracked,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import type { FormValueControl } from "@angular/forms/signals";
import { FilterChangeEvent, PreventableEvent } from "@nanahoshi/mona-ui/common";
import {
    DropdownDataHandlerDirective,
    DropdownDataInput,
    DropdownDataInputToken,
    DropdownFieldPredicateType,
    DropdownFieldSelectorType,
    DropdownFooterTemplateDirective,
    DropdownGroupHeaderTemplateDirective,
    DropdownHeaderTemplateDirective,
    DropdownItemTemplateDirective,
    DropdownListPopupHandlerDirective,
    DropdownListService,
    DropdownLiveRegionDirective,
    DropdownNoDataTemplateDirective,
    DropdownPopupInput,
    DropdownPopupInputToken,
    dropdownPopupThemeVariants,
    DropdownPopupVariantInput,
    DropdownPrefixTemplateDirective,
    DropdownService
} from "@nanahoshi/mona-ui/dropdowns";
import { createElementControlId, rxTimeout } from "@nanahoshi/mona-ui/internal";
import { IndicatorIconComponent } from "@nanahoshi/mona-ui/internal/indicator-icon";
import {
    ListComponent,
    ListFooterTemplateDirective,
    ListGroupHeaderTemplateDirective,
    ListHeaderTemplateDirective,
    ListItem,
    ListItemTemplateDirective,
    ListNoDataTemplateDirective,
    ListService,
    ListSizeInputType,
    SelectableOptions,
    SelectionChangeEvent
} from "@nanahoshi/mona-ui/internal/list";
import { PopupCloseEvent } from "@nanahoshi/mona-ui/popup";
import { TextBoxDirective } from "@nanahoshi/mona-ui/text-box";
import { debounceTime, filter, fromEvent, Subject, take, tap } from "rxjs";
import { twMerge } from "tailwind-merge";

import {
    comboBoxAffixContainerThemeVariants,
    comboBoxBaseThemeVariants,
    comboBoxTextInputThemeVariants,
    ComboBoxVariantInput,
    ComboBoxVariantProps
} from "../../styles/combo-box.styles";

@Component({
    selector: "mona-combo-box",
    templateUrl: "./combo-box.component.html",
    providers: [
        ListService,
        DropdownService,
        DropdownListService,
        {
            provide: DropdownDataInputToken,
            useExisting: forwardRef(() => ComboBoxComponent),
            multi: false
        },
        {
            provide: DropdownPopupInputToken,
            useExisting: forwardRef(() => ComboBoxComponent),
            multi: false
        }
    ],
    imports: [
        TextBoxDirective,
        FormsModule,
        NgTemplateOutlet,
        ListComponent,
        ListGroupHeaderTemplateDirective,
        ListFooterTemplateDirective,
        ListHeaderTemplateDirective,
        ListNoDataTemplateDirective,
        ListItemTemplateDirective,
        DropdownLiveRegionDirective,
        IndicatorIconComponent
    ],
    hostDirectives: [DropdownDataHandlerDirective, DropdownListPopupHandlerDirective],
    host: {
        "[attr.aria-disabled]": "disabled() ? true : undefined",
        "[attr.aria-invalid]": "invalidState() ? true : undefined",
        "[attr.aria-readonly]": "readonly() ? true : undefined",
        "[attr.aria-required]": "required() ? true : undefined",
        "[attr.data-disabled]": "disabled() || null",
        "[attr.data-invalid]": "invalidState() || null",
        "[attr.data-readonly]": "readonly() || null",
        "[attr.tabindex]": "-1",
        "[class]": "baseClass()"
    }
})
export class ComboBoxComponent<TData = unknown>
    implements
        FormValueControl<TData | null>,
        ComboBoxVariantInput,
        DropdownDataInput<TData>,
        DropdownPopupInput,
        DropdownPopupVariantInput
{
    readonly #destroyRef = inject(DestroyRef);
    readonly #dropdownListService = inject(DropdownListService);
    readonly #dropdownService = inject(DropdownService);
    readonly #hostElementRef = inject(ElementRef);
    readonly #listService = inject(ListService);
    readonly #navigatedValue = linkedSignal(() => this.value());
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
        const disabled = this.disabled();
        const focused = this.#popupRef() != null;
        const invalid = this.invalidState();
        const rounded = this.rounded();
        const size = this.size();
        const variantClass = comboBoxBaseThemeVariants({ disabled, focused, invalid, rounded, size });
        const userClass = this.userClass();
        return twMerge(variantClass, userClass);
    });
    protected readonly comboBoxValue$ = new Subject<string | null>();
    protected readonly comboBoxValue = signal("");
    protected readonly effectiveAriaLabel = computed(
        () => this.ariaLabel() || (this.ariaLabelledBy() ? "" : this.placeholder())
    );
    protected readonly expanded = computed(() => this.#popupRef() !== null);
    protected readonly footerTemplate = contentChild(DropdownFooterTemplateDirective, { read: TemplateRef });
    protected readonly groupHeaderTemplate = contentChild(DropdownGroupHeaderTemplateDirective, { read: TemplateRef });
    protected readonly headerTemplate = contentChild(DropdownHeaderTemplateDirective, { read: TemplateRef });
    protected readonly id = createElementControlId();
    protected readonly inputClass = computed(() => {
        const rounded = this.rounded();
        return comboBoxTextInputThemeVariants({ rounded });
    });
    protected readonly invalidState = computed(
        () => this.invalid() || (this.required() && this.touched() && this.value() == null)
    );
    protected readonly itemTemplate = contentChild(DropdownItemTemplateDirective, { read: TemplateRef });
    protected readonly listId = createElementControlId();
    protected readonly listPopupClass = computed(() => {
        const rounded = this.rounded();
        const size = this.size();
        const userClass = this.popupClass();
        const variantClass = dropdownPopupThemeVariants({ rounded, size });
        return twMerge(variantClass, userClass);
    });
    protected readonly noDataTemplate = contentChild(DropdownNoDataTemplateDirective, { read: TemplateRef });
    protected readonly popupTemplate = viewChild.required<TemplateRef<any>>("popupTemplate");
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
    public readonly allowCustomValue = input(false);

    /**
     * @description ID of an element that provides an extended description for the input.
     * @default ""
     */
    public readonly ariaDescribedBy = input("", { alias: "aria-describedby" });

    /**
     * @description Accessible name for the input. Describe what the combo box represents.
     * Falls back to {@link placeholder} when neither this nor {@link ariaLabelledBy} is set.
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
    public readonly disabled = model(false);

    /**
     * @description A predicate function or the name of the field that determines whether an item is disabled.
     * @default undefined
     */
    public readonly itemDisabled = input<DropdownFieldPredicateType<TData>>();

    /**
     * @description Marks the combo box as invalid. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly invalid = input(false);

    /**
     * @description Displays a loading indicator and prevents interaction while an operation is in progress.
     * @default false
     */
    public readonly loading = input(false);

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
     * @description Sets the height of the popup element.
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
    public readonly readonly = input(false);

    /**
     * @description Sets the required state of the combo box component.
     * @default false
     */
    public readonly required = input(false);

    /**
     * @description Border-radius preset applied to the component.
     * @default "medium"
     */
    public readonly rounded = input<ComboBoxVariantProps["rounded"]>("medium");

    /**
     * @description Displays a button that resets the value to empty when an item is selected.
     * @default false
     */
    public readonly showClearButton = input(false);

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
    public readonly textField = input<DropdownFieldSelectorType<TData>>();

    /**
     * @description Emitted when the combo box is interacted with on blur, selection, clear, or committed input.
     * The `FormField` directive listens to this to mark the field as touched.
     */
    public readonly touch = output<void>();

    /**
     * @description Sets the touched state of the combo box. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly touched = input(false);

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string>("", { alias: "class" });

    /**
     * @description Emitted with the entered text when the user presses Enter on unmatched input.
     * Only emitted when {@link allowCustomValue} is true.
     */
    public readonly valueAdd = output<string>();

    /**
     * @description Property name or accessor used to derive the value from a data item.
     * If not set, the item itself is used as the value representation.
     * @default undefined
     */
    public readonly valueField = input<DropdownFieldSelectorType<TData>>();

    /**
     * @description Two-way bindable current selected value. Implements `FormValueControl<TData | null>`,
     * enabling signal forms `[formField]` binding. When `valueField` is set, primitive field values can be
     * written into this model to restore a matching selected item.
     * @default null
     */
    public readonly value = model<TData | null>(null);

    public constructor() {
        effect(() => {
            const popupTemplate = this.popupTemplate();
            untracked(() => this.#dropdownService.popupTemplate.set(popupTemplate));
        });

        effect(() => {
            const value = this.value();
            const valueField = this.valueField();
            untracked(() => {
                this.#listService.setValueField(valueField ?? "");
                if (value != null) {
                    this.#listService.setSelectedDataItems([value]);
                } else {
                    this.#listService.clearSelections();
                }
                this.comboBoxValue.set(this.valueText());
            });
        });
        afterNextRender({
            read: () => {
                this.initialize();
                this.setSubscriptions();
            }
        });
        fromEvent(this.#hostElementRef.nativeElement, "focusin")
            .pipe(
                takeUntilDestroyed(),
                filter(() => !this.readonly())
            )
            .subscribe(() => this.focus());
    }

    protected onInputBlur(): void {
        this.touch.emit();
    }

    protected onItemSelect(event: SelectionChangeEvent<TData>): void {
        if (
            this.#listService.filterableOptions().enabled &&
            event.source.via === "keyboard" &&
            event.source.key !== "Enter"
        ) {
            this.#navigatedValue.set(event.item.data);
            return;
        }
        this.updateValue(event.item.data, true);
        this.closePopup();
    }

    protected onValueClear(event: Event): void {
        if (this.readonly() || (event instanceof KeyboardEvent && event.key !== "Enter" && event.key !== " ")) {
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
        this.#navigatedValue.set(null);
        this.updateValue(null);
        this.comboBoxValue.set("");
        this.#listService.clearSelections();
        this.#listService.clearFilter();
    }

    private closePopup(): void {
        this.#popupRef()?.close();
    }

    public focus(): void {
        rxTimeout(this.#destroyRef, () => {
            const input = this.#hostElementRef.nativeElement.querySelector("input");
            if (input && !this.readonly()) {
                input.focus();
                input.setSelectionRange(input.value.length, input.value.length);
            }
        });
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

    private setArrowNavigationSubscription(): void {
        this.#dropdownListService.navigate$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(({ item }) => {
            if (!this.expanded()) {
                this.#listService.selectItem(item);
                this.updateValue(item.data, true);
            } else {
                this.#navigatedValue.set(item.data);
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
                    this.#navigatedValue.set(item.data);
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

    private selectItem(item: ListItem<TData>): void {
        this.#listService.selectItem(item);
        this.updateValue(item.data);
    }

    private setEscapeKeySubscription(): void {
        this.#dropdownService.beforeKeydown$
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                filter(e => e.originalEvent?.key === "Escape"),
                tap(e => e.preventDefault())
            )
            .subscribe(() => {
                if (this.#popupRef()) {
                    const selectedItem = this.selectedListItem();
                    if (selectedItem) {
                        this.comboBoxValue.set(this.#listService.getItemText(selectedItem));
                        this.#navigatedValue.set(selectedItem.data);
                    } else {
                        this.clear();
                    }
                    this.closePopup();
                } else {
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

    private setNavigatedItemSubscription(): void {
        this.#listService.navigatedItem$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(e => {
            this.#navigatedValue.set(e?.data ?? null);
        });
    }

    private setPopupCloseSubscriptions(): void {
        this.#dropdownService.popupCloseComplete$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => {
            this.#userNavigatedViaArrows.set(false);
            this.focus();
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
        this.setNavigatedItemSubscription();
        this.setPopupCloseSubscriptions();
        this.setSpaceKeySubscription();
    }

    private updateValue(value: TData | null, notify: boolean = true) {
        const oldValue = this.value();
        if (oldValue !== value) {
            this.value.set(value);
        }
        this.comboBoxValue.set(this.valueText());
        if (notify && oldValue !== value) {
            this.touch.emit();
        }
    }
}
