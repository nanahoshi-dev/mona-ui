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
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from "@angular/forms";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { LucideAngularModule, X } from "lucide-angular";
import { debounceTime, filter, Subject, tap } from "rxjs";
import { twMerge } from "tailwind-merge";
import { FormFieldValidationDirective } from "../../../common/directives/form-field-validation.directive";
import { FilterChangeEvent } from "../../../common/filter-input/models/FilterChangeEvent";
import { ListComponent } from "../../../common/list/components/list/list.component";
import { ListFooterTemplateDirective } from "../../../common/list/directives/list-footer-template.directive";
import { ListGroupHeaderTemplateDirective } from "../../../common/list/directives/list-group-header-template.directive";
import { ListHeaderTemplateDirective } from "../../../common/list/directives/list-header-template.directive";
import { ListItemTemplateDirective } from "../../../common/list/directives/list-item-template.directive";
import { ListNoDataTemplateDirective } from "../../../common/list/directives/list-no-data-template.directive";
import { ListSizeInputType } from "../../../common/list/models/ListSizeType";
import { SelectableOptions } from "../../../common/list/models/SelectableOptions";
import { SelectionChangeEvent } from "../../../common/list/models/SelectionChangeEvent";
import { ListService } from "../../../common/list/services/list.service";
import { LoadingIndicatorComponent } from "../../../common/loading-indicator/components/loading-indicator/loading-indicator.component";
import { TextBoxDirective } from "../../../inputs/text-box/directives/text-box.directive";
import { PopupCloseEvent } from "../../../popup/models/PopupCloseEvent";
import { ThemeService } from "../../../theme/services/theme.service";
import { Action } from "../../../utils/Action";
import { createElementControlId } from "../../../utils/createElementControlId";
import { PreventableEvent } from "../../../utils/PreventableEvent";
import { DropDownFooterTemplateDirective } from "../../directives/drop-down-footer-template.directive";
import { DropDownGroupHeaderTemplateDirective } from "../../directives/drop-down-group-header-template.directive";
import { DropDownHeaderTemplateDirective } from "../../directives/drop-down-header-template.directive";
import { DropDownItemTemplateDirective } from "../../directives/drop-down-item-template.directive";
import { DropDownNoDataTemplateDirective } from "../../directives/drop-down-no-data-template.directive";
import { DropdownDataHandlerDirective } from "../../directives/dropdown-data-handler.directive";
import { DropdownPopupHandlerDirective } from "../../directives/dropdown-popup-handler.directive";
import { DropdownPrefixTemplateDirective } from "../../directives/dropdown-prefix-template.directive";
import { DropdownSuffixTemplateDirective } from "../../directives/dropdown-suffix-template.directive";
import { DropdownDataInput, DropdownDataInputToken } from "../../models/DropdownDataInput";
import { DropdownFieldPredicateType, DropdownFieldSelectorType } from "../../models/DropdownFieldTypes";
import { DropdownPopupInput, DropdownPopupInputToken } from "../../models/DropdownPopupInput";
import { DropDownService } from "../../services/drop-down.service";
import {
    autoCompleteAffixContainerThemeVariants,
    autoCompleteBaseThemeVariants,
    autoCompletePopupThemeVariants,
    autoCompleteTextInputThemeVariants,
    AutoCompleteVariantInput,
    AutoCompleteVariantProps
} from "../styles/auto-complete.styles";

@Component({
    selector: "mona-auto-complete",
    templateUrl: "./auto-complete.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    hostDirectives: [FormFieldValidationDirective, DropdownDataHandlerDirective, DropdownPopupHandlerDirective],
    providers: [
        ListService,
        DropDownService,
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => AutoCompleteComponent),
            multi: true
        },
        {
            provide: DropdownDataInputToken,
            useExisting: forwardRef(() => AutoCompleteComponent),
            multi: false
        },
        {
            provide: DropdownPopupInputToken,
            useExisting: forwardRef(() => AutoCompleteComponent),
            multi: false
        }
    ],
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
        LoadingIndicatorComponent
    ],
    host: {
        "[attr.aria-disabled]": "disabled() ? true : undefined",
        "[attr.aria-haspopup]": "true",
        "[attr.aria-readonly]": "readonly() ? true : undefined",
        "[attr.aria-required]": "required() ? true : undefined",
        "[attr.data-disabled]": "disabled()",
        "[attr.tabindex]": "-1",
        "[class]": "baseClass()"
    }
})
export class AutoCompleteComponent<TData = unknown>
    implements ControlValueAccessor, AutoCompleteVariantInput, DropdownDataInput<TData>, DropdownPopupInput
{
    readonly #destroyRef = inject(DestroyRef);
    readonly #dropdownService = inject(DropDownService);
    readonly #hostElementRef = inject(ElementRef<HTMLElement>);
    readonly #listService = inject(ListService);
    readonly #popupRef = this.#dropdownService.popupRef;
    readonly #themeService = inject(ThemeService);
    readonly #value = signal<string | null>(null);
    #propagateChange: Action<string | null> | null = null;
    #propagateTouch: Action | null = null;

    protected readonly activeDescendant = computed(() => {
        const highlightedItem = this.#listService.highlightedItem();
        return highlightedItem ? highlightedItem.uid : null;
    });
    protected readonly affixClass = computed(() => {
        const theme = this.#themeService.theme();
        return autoCompleteAffixContainerThemeVariants(theme)();
    });
    protected readonly autoCompleteValue = linkedSignal(() => this.#value() ?? "");
    protected readonly autoCompleteValue$ = new Subject<string | null>();
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const disabled = this.disabled();
        const focused = this.#popupRef() !== null;
        const rounded = this.rounded();
        const size = this.size();
        const variantClass = autoCompleteBaseThemeVariants(theme)({ disabled, focused, rounded, size });
        const userClass = this.userClass();
        return twMerge(variantClass, userClass);
    });
    protected readonly clearIcon = X;
    protected readonly expanded = computed(() => this.#popupRef() !== null);
    protected readonly footerTemplate = contentChild(DropDownFooterTemplateDirective, { read: TemplateRef });
    protected readonly groupHeaderTemplate = contentChild(DropDownGroupHeaderTemplateDirective, {
        read: TemplateRef
    });
    protected readonly headerTemplate = contentChild(DropDownHeaderTemplateDirective, { read: TemplateRef });
    protected readonly inputClass = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        return autoCompleteTextInputThemeVariants(theme)({ rounded });
    });
    protected readonly itemTemplate = contentChild(DropDownItemTemplateDirective, { read: TemplateRef });
    protected readonly isEmpty = computed(() => !this.#listService.viewItems().any());
    protected readonly listId = createElementControlId();
    protected readonly listPopupClass = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        const size = this.size();
        const userClass = this.popupClass();
        const variantClass = autoCompletePopupThemeVariants(theme)({ rounded, size });
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
    protected readonly resultCountMessage = computed(() => {
        const count = this.#listService.viewItems().size();
        return count === 0 ? "No results found" : `${count} result${count === 1 ? "" : "s"} available`;
    });
    protected readonly selectedKeysChange = output<any[]>();
    protected readonly suffixTemplate = contentChild(DropdownSuffixTemplateDirective, { read: TemplateRef });

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
     * @description Sets the data of the autocomplete component.
     * @default []
     */
    public readonly data = input<Iterable<TData>>([]);

    /**
     * @description Sets the disabled state of the autocomplete component.
     * @default false
     */
    public readonly disabled = model(false);

    /**
     * @description Sets the predicate function that determines whether an item is disabled.
     */
    public readonly itemDisabled = input<DropdownFieldPredicateType<TData>>();

    public readonly highlightFirst = input(false);

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
     * @description Sets the placeholder text to be shown when there is no value selected.
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
     * @description Sets the readonly state of the autocomplete component.
     * @default false
     */
    public readonly readonly = input(false);

    /**
     * @description Sets the required state of the autocomplete component.
     * @default false
     */
    public readonly required = input(false);

    /**
     * @description Sets the border radius of the autocomplete component.
     * @default "medium"
     */
    public readonly rounded = input<AutoCompleteVariantProps["rounded"]>("medium");

    /**
     * @description Shows or hides the clear button.
     * @default true
     */
    public readonly showClearButton = input(true);

    /**
     * @description Sets the size of the autocomplete component.
     * @default "medium"
     */
    public readonly size = input<AutoCompleteVariantProps["size"]>("medium");

    /**
     * @description Sets the text field of the autocomplete component.
     * It can be null, string, or a function that takes an item and returns a string.
     * If null, the item itself will be used as the text representation.
     * @default null
     */
    public readonly textField = input<DropdownFieldSelectorType<TData>>(null);
    public readonly userClass = input<string>("", { alias: "class" });

    /**
     * @description Sets the value field of the autocomplete component.
     * It can be null, string, or a function that takes an item and returns a string.
     * If null, the item itself will be used as the value representation.
     * @default null
     */
    public readonly valueField = input<DropdownFieldSelectorType<TData>>(null);

    public constructor() {
        afterNextRender({
            read: () => {
                this.initialize();
                this.setSubscriptions();
                this.autoCompleteValue.set(this.#value() ?? "");
            }
        });
        effect(() => {
            const popupTemplate = this.popupTemplate();
            untracked(() => this.#dropdownService.popupTemplate.set(popupTemplate));
        });
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

    public writeValue(data: any): void {
        this.updateValue(data, false);
    }

    protected onInputBlur(): void {
        if (this.#propagateTouch) {
            this.#propagateTouch();
        }
        if (this.#value() !== this.autoCompleteValue() && !this.#popupRef()) {
            this.updateValue(this.autoCompleteValue());
        }
    }

    protected onItemSelect(event: SelectionChangeEvent<TData>): void {
        const itemText = this.#listService.getItemText(event.item);
        this.updateValue(itemText);
        this.autoCompleteValue.set(itemText);
        this.closePopup();
    }

    protected onValueClear(event: MouseEvent | KeyboardEvent): void {
        if (event instanceof KeyboardEvent && event.key !== "Enter" && event.key !== " ") {
            return;
        }
        event.stopImmediatePropagation();
        this.clear(true);
        this.closePopup();
        this.focus();
    }

    private clear(notify: boolean): void {
        this.autoCompleteValue.set("");
        this.#listService.clearSelections();
        this.#listService.clearFilter();
        if (notify) {
            this.updateValue(null);
        }
    }

    private closePopup(): void {
        this.#popupRef()?.close();
    }

    private focus(): void {
        window.setTimeout(() => {
            const input = this.#hostElementRef.nativeElement.querySelector("input");
            if (input) {
                input.focus();
                input.setSelectionRange(-1, -1);
            }
        });
    }

    private initialize(): void {
        this.#listService.setNavigableOptions({ enabled: true, mode: "highlight" });
        this.#listService.setSelectableOptions(this.selectableOptions);
        this.#listService.filterInputVisible.set(false);
    }

    private notifyFilterChange(filter: string): FilterChangeEvent {
        const event = new FilterChangeEvent(filter);
        this.#listService.filterChange$.next(event);
        return event;
    }

    private setArrowKeyNavigationSubscription(): void {
        this.#dropdownService.beforeNavigate$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(event => {
            const keyboardEvent = event.originalEvent as KeyboardEvent;
            if (!keyboardEvent.altKey) {
                event.preventDefault();
            }
            if (this.#dropdownService.popupRef() && !keyboardEvent.altKey) {
                const direction = keyboardEvent.key === "ArrowDown" ? "next" : "previous";
                this.#listService.navigate(direction, "highlight", false);
            }
        });
    }

    private setAutoCompleteValueChangeSubscription(): void {
        this.autoCompleteValue$
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                filter(value => value !== null),
                debounceTime(this.#listService.getFilterDebounceDuration())
            )
            .subscribe((value: string) => {
                if (this.#listService.isFilteringEnabled()) {
                    const event = this.notifyFilterChange(value);
                    if (event.isDefaultPrevented()) {
                        return;
                    }
                    if (value) {
                        this.#listService.setFilter(value);
                    }
                }

                if (!value) {
                    this.closePopup();
                    window.setTimeout(() => this.clear(false), 200);
                    return;
                }

                if (!this.#popupRef()) {
                    this.#dropdownService.triggerPopupOpen$.next();
                }

                this.autoCompleteValue.set(value);
                const item = this.#listService.getMatchingFilteredItem(value);
                if (this.highlightFirst()) {
                    this.#listService.clearSelections();
                    this.#listService.highlightedItem.set(item);
                    if (item) {
                        this.#listService.scrollToItem$.next({ item, focus: false });
                    }
                }
            });
    }

    private setEnterKeySubscription(): void {
        this.#dropdownService.beforeKeydown$
            .pipe(
                filter(e => e.originalEvent?.key === "Enter"),
                takeUntilDestroyed(this.#destroyRef),
                tap(e => e.preventDefault())
            )
            .subscribe(() => {
                const highlightedItem = this.#listService.highlightedItem();
                const highlightedItemText = highlightedItem ? this.#listService.getItemText(highlightedItem) : "";
                const autoCompleteValue = this.autoCompleteValue();
                if (highlightedItemText && autoCompleteValue != null) {
                    this.autoCompleteValue.set(highlightedItemText);
                    if (this.#value() !== this.autoCompleteValue()) {
                        this.updateValue(highlightedItemText);
                    }
                } else if (this.#value() !== autoCompleteValue) {
                    this.updateValue(autoCompleteValue);
                }
                this.closePopup();
            });
    }

    private setEscapeKeySubscription(): void {
        this.#dropdownService.beforeKeydown$
            .pipe(
                filter(e => e.originalEvent?.key === "Escape"),
                takeUntilDestroyed(this.#destroyRef),
                tap(e => e.preventDefault())
            )
            .subscribe(() => {
                const autoCompleteValue = this.autoCompleteValue();
                const value = this.#value();
                if (value !== autoCompleteValue) {
                    this.updateValue(autoCompleteValue);
                } else if (value === autoCompleteValue && !this.#popupRef()) {
                    this.clear(true);
                    this.focus();
                }
            });
    }

    private setPopupCloseSubscriptions(): void {
        this.#dropdownService.popupCloseComplete$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => {
            this.focus();
            window.setTimeout(() => {
                this.autoCompleteValue$.next(null);
            });
        });
    }

    private setSubscriptions(): void {
        this.setAutoCompleteValueChangeSubscription();
        this.setArrowKeyNavigationSubscription();
        this.setPopupCloseSubscriptions();
        this.setEscapeKeySubscription();
        this.setEnterKeySubscription();
    }

    private updateValue(value: string | null, notify: boolean = true): void {
        const oldValue = this.#value();
        this.#value.set(value);
        if (notify && oldValue !== value) {
            const notifyValue = value === "" || value == null ? null : value;
            this.#propagateChange?.(notifyValue);
        }
    }
}
