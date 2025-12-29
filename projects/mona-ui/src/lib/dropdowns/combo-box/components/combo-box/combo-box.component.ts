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
import { ChevronDown, LucideAngularModule, X } from "lucide-angular";
import { debounceTime, distinctUntilChanged, filter, fromEvent, map, Observable, of, Subject, take, tap } from "rxjs";
import { twMerge } from "tailwind-merge";
import { FormFieldValidationDirective } from "../../../../common/directives/form-field-validation.directive";
import { FilterChangeEvent } from "../../../../common/filter-input/models/FilterChangeEvent";
import { ListComponent } from "../../../../common/list/components/list/list.component";
import { ListFooterTemplateDirective } from "../../../../common/list/directives/list-footer-template.directive";
import { ListGroupHeaderTemplateDirective } from "../../../../common/list/directives/list-group-header-template.directive";
import { ListHeaderTemplateDirective } from "../../../../common/list/directives/list-header-template.directive";
import { ListItemTemplateDirective } from "../../../../common/list/directives/list-item-template.directive";
import { ListNoDataTemplateDirective } from "../../../../common/list/directives/list-no-data-template.directive";
import { ListSizeInputType } from "../../../../common/list/models/ListSizeType";
import { SelectableOptions } from "../../../../common/list/models/SelectableOptions";
import { SelectionChangeEvent } from "../../../../common/list/models/SelectionChangeEvent";
import { ListService } from "../../../../common/list/services/list.service";
import { LoadingIndicatorComponent } from "../../../../common/loading-indicator/components/loading-indicator/loading-indicator.component";
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
import { DropdownPopupHandlerDirective } from "../../../directives/dropdown-popup-handler.directive";
import { DropdownPrefixTemplateDirective } from "../../../directives/dropdown-prefix-template.directive";
import { DropdownDataInput, DropdownDataInputToken } from "../../../models/DropdownDataInput";
import { DropdownFieldPredicateType, DropdownFieldSelectorType } from "../../../models/DropdownFieldTypes";
import { DropdownPopupInputToken } from "../../../models/DropdownPopupInput";
import { DropDownService } from "../../../services/drop-down.service";
import {
    comboBoxAffixContainerThemeVariants,
    comboBoxBaseThemeVariants,
    comboBoxPopupThemeVariants,
    comboBoxTextInputThemeVariants,
    ComboBoxVariantInput,
    ComboBoxVariantProps
} from "../../styles/combo-box.styles";

@Component({
    selector: "mona-combo-box",
    templateUrl: "./combo-box.component.html",
    providers: [
        ListService,
        DropDownService,
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
        LoadingIndicatorComponent
    ],
    hostDirectives: [FormFieldValidationDirective, DropdownDataHandlerDirective, DropdownPopupHandlerDirective],
    host: {
        "[attr.aria-disabled]": "disabled() ? true : undefined",
        "[attr.aria-readonly]": "readonly() ? true : undefined",
        "[attr.aria-required]": "required() ? true : undefined",
        "[attr.data-disabled]": "disabled()",
        "[attr.tabindex]": "disabled() ? -1 : 0",
        "[class]": "baseClass()"
    }
})
export class ComboBoxComponent<TData = unknown>
    implements ControlValueAccessor, ComboBoxVariantInput, DropdownDataInput<TData>
{
    readonly #destroyRef = inject(DestroyRef);
    readonly #dropdownService = inject(DropDownService);
    readonly #hostElementRef = inject(ElementRef);
    readonly #listService = inject(ListService);
    readonly #navigatedValue = linkedSignal(() => this.#value());
    readonly #popupRef = this.#dropdownService.popupRef;
    readonly #themeService = inject(ThemeService);
    readonly #value = signal<TData | null>(null);
    readonly #valueNormalizer = computed(() => {
        const normalizer = this.valueNormalizer();
        return normalizer ? normalizer : (text$: Observable<string>) => text$.pipe(map(v => v));
    });
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
    protected readonly clearIcon = X;
    protected readonly dropdownIcon = ChevronDown;
    protected readonly comboBoxValue$ = new Subject<string>();
    protected readonly comboBoxValue = linkedSignal(() => {
        const navigatedValue = this.#navigatedValue();
        const item = this.#listService.viewItems().firstOrDefault(item => item.data === navigatedValue);
        return item ? this.#listService.getItemText(item) : "";
    });
    protected readonly expanded = computed(() => this.#popupRef() !== null);
    protected readonly footerTemplate = contentChild(DropDownFooterTemplateDirective, { read: TemplateRef });
    protected readonly groupHeaderTemplate = contentChild(DropDownGroupHeaderTemplateDirective, { read: TemplateRef });
    protected readonly headerTemplate = contentChild(DropDownHeaderTemplateDirective, { read: TemplateRef });
    protected readonly inputClass = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        return comboBoxTextInputThemeVariants(theme)({ rounded });
    });
    protected readonly itemTemplate = contentChild(DropDownItemTemplateDirective, { read: TemplateRef });
    protected readonly isEmpty = computed(() => !this.#listService.viewItems().any());
    protected readonly listId = createElementControlId();
    protected readonly listPopupClass = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        const size = this.size();
        const userClass = this.popupClass();
        const variantClass = comboBoxPopupThemeVariants(theme)({ rounded, size });
        return twMerge(variantClass, userClass);
    });
    protected readonly noDataTemplate = contentChild(DropDownNoDataTemplateDirective, { read: TemplateRef });
    protected readonly popupTemplate = viewChild.required<TemplateRef<any>>("popupTemplate");
    protected readonly prefixTemplate = contentChild(DropdownPrefixTemplateDirective, { read: TemplateRef });
    protected readonly resultCountMessage = computed(() => {
        const count = this.#listService.viewItems().size();
        return count === 0 ? "No results found" : `${count} result${count === 1 ? "" : "s"} available`;
    });
    protected readonly selectableOptions: SelectableOptions = {
        enabled: true,
        mode: "single",
        toggleable: false
    };
    protected readonly selectedDataItem = computed(() => {
        return this.selectedListItem()?.data ?? null;
    });
    protected readonly selectedKeysChange = output<any[]>();
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

    public readonly allowCustomValue = input(false);

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
     * @description The data items of the dropdown list component.
     * @default []
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

    public readonly rounded = input<ComboBoxVariantProps["rounded"]>("medium");
    public readonly showClearButton = input(false);
    public readonly size = input<ComboBoxVariantProps["size"]>("medium");
    public readonly textField = input<DropdownFieldSelectorType<TData>>();
    public readonly userClass = input<string>("", { alias: "class" });
    public readonly valueField = input<DropdownFieldSelectorType<TData>>();
    public readonly valueNormalizer = input<Action<Observable<string>, Observable<any>>>();

    public constructor() {
        effect(() => {
            const popupTemplate = this.popupTemplate();
            untracked(() => this.#dropdownService.popupTemplate.set(popupTemplate));
        });

        effect(() => {
            window.setTimeout(() => {
                this.valueField();
                untracked(() => {
                    if (this.#value() != null) {
                        this.#listService.setSelectedDataItems([this.#value()]);
                        this.comboBoxValue.set(this.valueText());
                    }
                });
            });
        });

        effect(() => {
            window.setTimeout(() => {
                if (!this.#listService.isActiveItemVisible()) {
                    this.#listService.highlightFirstItem();
                }
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

    public onItemSelect(event: SelectionChangeEvent<TData>): void {
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

    public handleKeydown(): void {
        this.#dropdownService.keydown$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(event => {
            if (event.key === "Enter") {
                this.handleEnterKey(event);
            } else if (event.key === "Tab") {
                this.closePopup();
            } else if (event.key === "Escape") {
                this.handleEscapeKey();
            }
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

    public writeValue(obj: TData): void {
        this.updateValue(obj, false);
        if (obj != null) {
            this.#listService.setSelectedDataItems([obj]);
            this.comboBoxValue.set(this.valueText());
        }
    }

    protected onInputBlur(event: FocusEvent): void {
        this.#propagateTouch?.();
    }

    protected onValueClear(event: MouseEvent | KeyboardEvent): void {
        if (event instanceof KeyboardEvent && event.key !== "Enter" && event.key !== " ") {
            return;
        }
        if (event instanceof KeyboardEvent && event.key === " ") {
            event.preventDefault();
        }
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

    private focus(): void {
        const input = this.#hostElementRef.nativeElement.querySelector("input");
        if (input && !this.readonly()) {
            input.focus();
            input.setSelectionRange(-1, -1);
        }
    }

    private handleCustomValue(): void {
        this.#valueNormalizer()(of(this.comboBoxValue()))
            .pipe(take(1))
            .subscribe(normalizedValue => {
                this.#listService.addNewDataItems([normalizedValue]);
                const item = this.#listService
                    .viewItems()
                    .where(i => !i.header && !this.#listService.isDisabled(i))
                    .firstOrDefault(
                        i => this.#listService.getItemText(i).toLowerCase() === this.comboBoxValue().toLowerCase()
                    );
                if (item) {
                    this.#listService.selectItem(item);
                    this.updateValue(item.data);
                }
            });
    }

    private handleEnterKey(event: KeyboardEvent): void {
        const navigatedValue = this.#navigatedValue();
        const navigatedItem = this.#listService.viewItems().firstOrDefault(item => item.data === navigatedValue);
        const comboBoxValue = this.comboBoxValue();
        const navigatedItemText = navigatedItem ? this.#listService.getItemText(navigatedItem) : "";
        if (navigatedItemText.toLowerCase() === comboBoxValue.toLowerCase()) {
            this.updateValue(navigatedValue);
            return;
        }
        if (navigatedItemText.toLowerCase() !== comboBoxValue.toLowerCase() && !this.allowCustomValue()) {
            this.#navigatedValue.set(null);
            this.comboBoxValue.set("");
            return;
        }
        if (this.#navigatedValue() && this.expanded() && this.#navigatedValue() !== this.#value()) {
            this.updateValue(this.#navigatedValue());
            return;
        }
        const item = this.selectedDataItem() || this.#listService.highlightedItem();
        if (item && this.comboBoxValue() === this.valueText()) {
            this.updateValue(item);
        } else if (item && this.comboBoxValue() !== this.valueText()) {
            const targetItem = this.#listService
                .viewItems()
                .firstOrDefault(i =>
                    this.#listService.getItemText(i).toLowerCase().startsWith(this.comboBoxValue().toLowerCase())
                );
            if (targetItem) {
                this.#listService.selectItem(targetItem);
                this.updateValue(targetItem.data);
            } else if (this.allowCustomValue()) {
                event.preventDefault();
                this.handleCustomValue();
            } else {
                this.comboBoxValue.set("");
            }
        } else if (this.allowCustomValue()) {
            event.preventDefault();
            this.handleCustomValue();
        } else {
            this.comboBoxValue.set("");
        }
    }

    private handleEscapeKey(): void {
        if (this.#popupRef()) {
            this.closePopup();
        } else {
            this.clear();
            window.setTimeout(() => this.focus());
        }
    }

    private initialize(): void {
        this.#listService.setNavigableOptions({ enabled: true, mode: "select" });
        this.#listService.setSelectableOptions(this.selectableOptions);
        this.#listService.filterInputVisible.set(false);
        this.#listService.selectedKeysChange = this.selectedKeysChange;
        this.comboBoxValue.set(this.valueText());
    }

    private notifyFilterChange(filter: string): FilterChangeEvent {
        const event = new FilterChangeEvent(filter);
        this.#listService.filterChange.emit(event);
        return event;
    }

    private setArrowNavigationSubscription(): void {
        this.#dropdownService.navigate$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(({ item }) => {
            if (!this.expanded()) {
                this.updateValue(item.data, true);
            } else {
                this.#navigatedValue.set(item.data);
            }
        });
    }

    private setPopupCloseSubscriptions(): void {
        this.#dropdownService.popupCloseComplete$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => {
            this.updateValue(this.#navigatedValue(), true);
            window.setTimeout(() => {
                this.focus();
            });
        });
    }

    private setSubscriptions(): void {
        const debounce = this.#listService.filterableOptions().enabled
            ? this.#listService.filterableOptions().debounce
            : 0;
        this.comboBoxValue$
            .pipe(
                tap(() => {
                    if (!this.#popupRef()) {
                        this.#dropdownService.triggerPopupOpen$.next();
                    }
                }),
                debounceTime(debounce),
                takeUntilDestroyed(this.#destroyRef),
                distinctUntilChanged()
            )
            .subscribe(value => {
                if (this.#listService.filterableOptions().enabled) {
                    const event = this.notifyFilterChange(value);
                    if (!event.isDefaultPrevented()) {
                        this.#listService.setFilter(value);
                    }
                }
                const item = this.#listService
                    .viewItems()
                    .where(i => !i.header && !this.#listService.isDisabled(i))
                    .firstOrDefault(i => this.#listService.getItemText(i).toLowerCase().includes(value.toLowerCase()));
                if (item) {
                    this.#listService.clearSelections();
                    this.#listService.highlightedItem.set(item);
                    this.#listService.scrollToItem$.next({ item, focus: false });
                }
                this.comboBoxValue.set(value);
            });
        this.setArrowNavigationSubscription();
        this.handleKeydown();
        this.setPopupCloseSubscriptions();
    }

    private updateValue(value: TData | null, notify: boolean = true) {
        const oldValue = this.#value();
        this.#value.set(value);
        console.log([oldValue, value, notify]);
        this.comboBoxValue.set(this.valueText());
        if (notify && oldValue !== value) {
            this.#propagateChange?.(value);
        }
    }
}
