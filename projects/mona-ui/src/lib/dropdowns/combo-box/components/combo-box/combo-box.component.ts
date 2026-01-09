import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    ChangeDetectionStrategy,
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
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from "@angular/forms";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { ChevronDown, LucideAngularModule } from "lucide-angular";
import { asyncScheduler, combineLatest, debounceTime, delay, filter, fromEvent, Subject, take, tap } from "rxjs";
import { twMerge } from "tailwind-merge";
import { ClearButtonComponent } from "../../../../common/clear-button/components/clear-button/clear-button.component";
import { FormFieldValidationDirective } from "../../../../common/directives/form-field-validation.directive";
import { FilterChangeEvent } from "../../../../common/filter-input/models/FilterChangeEvent";
import { ListComponent } from "../../../../common/list/components/list/list.component";
import { ListFooterTemplateDirective } from "../../../../common/list/directives/list-footer-template.directive";
import { ListGroupHeaderTemplateDirective } from "../../../../common/list/directives/list-group-header-template.directive";
import { ListHeaderTemplateDirective } from "../../../../common/list/directives/list-header-template.directive";
import { ListItemTemplateDirective } from "../../../../common/list/directives/list-item-template.directive";
import { ListNoDataTemplateDirective } from "../../../../common/list/directives/list-no-data-template.directive";
import { ListItem } from "../../../../common/list/models/ListItem";
import { ListSizeInputType } from "../../../../common/list/models/ListSizeType";
import { SelectableOptions } from "../../../../common/list/models/SelectableOptions";
import { SelectionChangeEvent } from "../../../../common/list/models/SelectionChangeEvent";
import { ListService } from "../../../../common/list/services/list.service";
import { LoadingIndicatorComponent } from "../../../../common/loading-indicator/components/loading-indicator/loading-indicator.component";
import { FormFieldValidationService } from "../../../../common/services/form-field-validation.service";
import { dropdownPopupThemeVariants, DropdownPopupVariantInput } from "../../../../common/styles/dropdown-popup.styles";
import { rxTimeout } from "../../../../common/utils/rxTimeout";
import { TextBoxDirective } from "../../../../inputs/text-box/directives/text-box.directive";
import { PopupCloseEvent } from "../../../../popup/models/PopupCloseEvent";
import { ThemeService } from "../../../../theme/services/theme.service";
import { Action } from "../../../../utils/Action";
import { createElementControlId } from "../../../../utils/createElementControlId";
import { PreventableEvent } from "../../../../utils/PreventableEvent";
import { DropDownFooterTemplateDirective } from "../../../directives/drop-down-footer-template.directive";
import { DropDownGroupHeaderTemplateDirective } from "../../../directives/drop-down-group-header-template.directive";
import { DropDownHeaderTemplateDirective } from "../../../directives/drop-down-header-template.directive";
import { DropDownItemTemplateDirective } from "../../../directives/drop-down-item-template.directive";
import { DropDownNoDataTemplateDirective } from "../../../directives/drop-down-no-data-template.directive";
import { DropdownDataHandlerDirective } from "../../../directives/dropdown-data-handler.directive";
import { DropdownLiveRegionDirective } from "../../../directives/dropdown-live-region.directive";
import { DropdownPopupHandlerDirective } from "../../../directives/dropdown-popup-handler.directive";
import { DropdownPrefixTemplateDirective } from "../../../directives/dropdown-prefix-template.directive";
import { DropdownDataInput, DropdownDataInputToken } from "../../../models/DropdownDataInput";
import { DropdownFieldPredicateType, DropdownFieldSelectorType } from "../../../models/DropdownFieldTypes";
import { DropdownPopupInput, DropdownPopupInputToken } from "../../../models/DropdownPopupInput";
import { DropdownService } from "../../../services/dropdown.service";
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
        FormFieldValidationService,
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ComboBoxComponent),
            multi: true
        },
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
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        TextBoxDirective,
        FormsModule,
        FontAwesomeModule,
        NgTemplateOutlet,
        ListComponent,
        ListGroupHeaderTemplateDirective,
        ListFooterTemplateDirective,
        ListHeaderTemplateDirective,
        ListNoDataTemplateDirective,
        ListItemTemplateDirective,
        LucideAngularModule,
        LoadingIndicatorComponent,
        DropdownLiveRegionDirective,
        ClearButtonComponent
    ],
    hostDirectives: [FormFieldValidationDirective, DropdownDataHandlerDirective, DropdownPopupHandlerDirective],
    host: {
        "[attr.aria-disabled]": "disabled() ? true : undefined",
        "[attr.aria-readonly]": "readonly() ? true : undefined",
        "[attr.aria-required]": "required() ? true : undefined",
        "[attr.data-disabled]": "disabled()",
        "[attr.role]": "'combobox'",
        "[attr.tabindex]": "disabled() ? -1 : 0",
        "[class]": "baseClass()"
    }
})
export class ComboBoxComponent<TData = unknown>
    implements
        ControlValueAccessor,
        ComboBoxVariantInput,
        DropdownDataInput<TData>,
        DropdownPopupInput,
        DropdownPopupVariantInput
{
    readonly #destroyRef = inject(DestroyRef);
    readonly #dropdownService = inject(DropdownService);
    readonly #formFieldValidationService = inject(FormFieldValidationService);
    readonly #hostElementRef = inject(ElementRef);
    readonly #listService = inject(ListService);
    readonly #navigatedValue = linkedSignal(() => this.#value());
    readonly #popupRef = this.#dropdownService.popupRef;
    readonly #themeService = inject(ThemeService);
    readonly #userNavigatedViaArrows = signal(false);
    readonly #value = signal<TData | null>(null);
    #propagateChange: Action<TData | null> | null = null;
    #propagateTouch: Action | null = null;

    protected readonly activeDescendant = computed(() => {
        const highlightedItem = this.#listService.highlightedItem();
        return highlightedItem ? highlightedItem.uid : null;
    });
    protected readonly affixClass = computed(() => {
        const theme = this.#themeService.theme();
        return comboBoxAffixContainerThemeVariants(theme)();
    });
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const disabled = this.disabled();
        const focused = this.#popupRef() != null;
        const rounded = this.rounded();
        const size = this.size();
        const variantClass = comboBoxBaseThemeVariants(theme)({ disabled, focused, rounded, size });
        const userClass = this.userClass();
        return twMerge(variantClass, userClass);
    });
    protected readonly dropdownIcon = ChevronDown;
    protected readonly comboBoxValue$ = new Subject<string | null>();
    protected readonly comboBoxValue = signal("");
    protected readonly expanded = computed(() => this.#popupRef() !== null);
    protected readonly footerTemplate = contentChild(DropDownFooterTemplateDirective, { read: TemplateRef });
    protected readonly groupHeaderTemplate = contentChild(DropDownGroupHeaderTemplateDirective, { read: TemplateRef });
    protected readonly headerTemplate = contentChild(DropDownHeaderTemplateDirective, { read: TemplateRef });
    protected readonly inputClass = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        return comboBoxTextInputThemeVariants(theme)({ rounded });
    });
    protected readonly isInvalid = computed(() => this.#formFieldValidationService?.invalid() || false);
    protected readonly itemTemplate = contentChild(DropDownItemTemplateDirective, { read: TemplateRef });
    protected readonly listId = createElementControlId();
    protected readonly listPopupClass = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        const size = this.size();
        const userClass = this.popupClass();
        const variantClass = dropdownPopupThemeVariants(theme)({ rounded, size });
        return twMerge(variantClass, userClass);
    });
    protected readonly noDataTemplate = contentChild(DropDownNoDataTemplateDirective, { read: TemplateRef });
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
     * @description Whether to allow custom values to be entered in the combo box.
     * @default false
     */
    public readonly allowCustomValue = input(false);

    /**
     * @description Sets the aria-describedby attribute of the combo box input.
     * Use this to associate error messages or help text with the input.
     * @default ""
     */
    public readonly ariaDescribedBy = input("");

    /**
     * @description Sets the aria-label attribute of the autocomplete component.
     * @default ""
     */
    public readonly ariaLabel = input("");

    /**
     * @description Sets the aria-labelledby attribute of the autocomplete component.
     * @default ""
     */
    public readonly ariaLabelledBy = input("");

    /**
     * @description Emits when the popup is about to close. This event is preventable.
     */
    public readonly close = output<PopupCloseEvent>();

    /**
     * @description Emits after the popup is closed.
     */
    public readonly closed = output();

    /**
     * @description The data items of the dropdown list component.
     */
    public readonly data = input<Iterable<TData>>([]);

    /**
     * @description Sets the disabled state of the dropdown list component.
     */
    public readonly disabled = model(false);

    /**
     * @description A predicate function or the name of the field that determines whether an item is disabled.
     */
    public readonly itemDisabled = input<DropdownFieldPredicateType<TData>>();

    /**
     * @description Sets the loading state of the autocomplete component.
     * @default false
     */
    public readonly loading = input(false);

    /**
     * @description Emits when the popup is about to open. This event is preventable.
     */
    public readonly open = output<PreventableEvent>();

    /**
     * @description Emits after the popup is opened.
     */
    public readonly opened = output();

    /**
     * @description Sets the placeholder text to be shown when there is no value selected.
     */
    public readonly placeholder = input("");

    /**
     * @description Sets the class of the popup element.
     * @default ""
     */
    public readonly popupClass = input("");

    /**
     * @description Sets the height of the popup element.
     * @default 200
     */
    public readonly popupHeight = input<ListSizeInputType>(null);

    /**
     * @description Sets the width of the popup element.
     * @default null
     */
    public readonly popupWidth = input<ListSizeInputType>(null);

    /**
     * @description Sets the readonly state of the combo box component.
     * @default false
     */
    public readonly readonly = input(false);

    /**
     * @description Sets the required state of the combo box component.
     * @default false
     */
    public readonly required = input(false);

    /**
     * @description Sets the border radius of the combo box component.
     * @default "medium"
     */
    public readonly rounded = input<ComboBoxVariantProps["rounded"]>("medium");

    /**
     * @description Whether to show the clear button when an item is selected.
     * @default false
     */
    public readonly showClearButton = input(false);

    /**
     * @description The size of the combo box component.
     * @default "medium"
     */
    public readonly size = input<ComboBoxVariantProps["size"]>("medium");

    /**
     * @description Sets the text field of the combo box component.
     * It can be null, string, or a function that takes an item and returns a string.
     * If null, the item itself will be used as the text representation.
     * @default null
     */
    public readonly textField = input<DropdownFieldSelectorType<TData>>();
    public readonly userClass = input<string>("", { alias: "class" });

    /**
     * @description Emits when user presses enter after typing in the combo box input.
     * Only emitted when {@link allowCustomValue} is true.
     */
    public readonly valueAdd = output<string>();

    /**
     * @description Sets the value field of the combo box component.
     * It can be null, string, or a function that takes an item and returns a string.
     * If null, the item itself will be used as the value representation.
     * @default null
     */
    public readonly valueField = input<DropdownFieldSelectorType<TData>>();

    public constructor() {
        effect(() => {
            const popupTemplate = this.popupTemplate();
            untracked(() => this.#dropdownService.popupTemplate.set(popupTemplate));
        });

        combineLatest([toObservable(this.valueField), toObservable(this.#value)])
            .pipe(delay(0, asyncScheduler), takeUntilDestroyed())
            .subscribe(([, value]) => {
                if (value != null) {
                    this.#listService.setSelectedDataItems([value]);
                    this.comboBoxValue.set(this.valueText());
                }
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

    public registerOnChange(fn: any): void {
        this.#propagateChange = fn;
    }

    public registerOnTouched(fn: any): void {
        this.#propagateTouch = fn;
    }

    public setDisabledState(isDisabled: boolean): void {
        this.disabled.set(isDisabled);
    }

    public writeValue(obj: TData): void {
        this.updateValue(obj, false);
        if (obj != null) {
            this.#listService.setSelectedDataItems([obj]);
            this.comboBoxValue.set(this.valueText());
        }
    }

    protected onInputBlur(): void {
        this.#propagateTouch?.();
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

    private focus(): void {
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
        this.#dropdownService.navigate$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(({ item }) => {
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
                    this.#dropdownService.triggerPopupOpen$.next();
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
        const oldValue = this.#value();
        this.#value.set(value);
        this.comboBoxValue.set(this.valueText());
        if (notify && oldValue !== value) {
            this.#propagateChange?.(value);
        }
    }
}
