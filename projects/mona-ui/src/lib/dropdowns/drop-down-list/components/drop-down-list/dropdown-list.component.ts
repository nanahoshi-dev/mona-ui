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
import { ChevronDown, LucideAngularModule, X } from "lucide-angular";
import { asyncScheduler, combineLatest, delay, Subject } from "rxjs";
import { twMerge } from "tailwind-merge";
import { FormFieldValidationDirective } from "../../../../common/directives/form-field-validation.directive";
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
import { dropdownPopupThemeVariants } from "../../../../common/styles/dropdown-popup.styles";
import { isTypeaheadKey, setupTypeahead } from "../../../../common/utils/typeahead.util";
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
import { DropDownListValueTemplateDirective } from "../../directives/drop-down-list-value-template.directive";
import {
    dropdownListAffixContainerThemeVariants,
    dropdownListInputThemeVariants,
    dropdownListValueContainerThemeVariants,
    DropDownListVariantInput,
    DropDownListVariantProps
} from "../../styles/dropdown-list.styles";

@Component({
    selector: "mona-drop-down-list",
    templateUrl: "./dropdown-list.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    hostDirectives: [FormFieldValidationDirective, DropdownDataHandlerDirective, DropdownPopupHandlerDirective],
    providers: [
        ListService,
        DropdownService,
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DropdownListComponent),
            multi: true
        },
        {
            provide: DropdownDataInputToken,
            useExisting: forwardRef(() => DropdownListComponent),
            multi: false
        },
        {
            provide: DropdownPopupInputToken,
            useExisting: forwardRef(() => DropdownListComponent),
            multi: false
        }
    ],
    imports: [
        NgTemplateOutlet,
        FormsModule,
        FontAwesomeModule,
        ListComponent,
        ListItemTemplateDirective,
        ListGroupHeaderTemplateDirective,
        ListFooterTemplateDirective,
        ListHeaderTemplateDirective,
        ListNoDataTemplateDirective,
        LucideAngularModule,
        LoadingIndicatorComponent,
        DropdownLiveRegionDirective
    ],
    host: {
        "[attr.aria-activedescendant]": "activeDescendant()",
        "[attr.aria-busy]": "loading() ? 'true' : undefined",
        "[attr.aria-controls]": "listId",
        "[attr.aria-disabled]": "disabled() ? true : undefined",
        "[attr.aria-expanded]": "expanded()",
        "[attr.aria-haspopup]": "'listbox'",
        "[attr.aria-label]": "ariaLabel()",
        "[attr.aria-labelledby]": "ariaLabelledBy()",
        "[attr.aria-readonly]": "readonly() ? true : undefined",
        "[attr.aria-required]": "required() ? true : undefined",
        "[attr.data-disabled]": "disabled()",
        "[attr.data-expanded]": "expanded()",
        "[attr.tabindex]": "disabled() ? null : 0",
        "[class]": "baseClass()",
        "[attr.role]": "'combobox'",
        "(blur)": "onBlur()"
    }
})
export class DropdownListComponent<TData = unknown>
    implements ControlValueAccessor, DropDownListVariantInput, DropdownDataInput<TData>, DropdownPopupInput
{
    readonly #destroyRef = inject(DestroyRef);
    readonly #dropdownService = inject(DropdownService);
    readonly #hostElementRef = inject(ElementRef<HTMLElement>);
    readonly #navigatedValue = linkedSignal(() => this.#value());
    readonly #listService = inject<ListService<TData>>(ListService);
    readonly #themeService = inject(ThemeService);
    readonly #typeaheadKey = new Subject<string>();
    readonly #value = signal<TData | null>(null);
    #propagateChange: Action<TData | null> | null = null;
    #propagateTouch: Action | null = null;

    protected readonly activeDescendant = computed(() => {
        const highlightedItem = this.#listService.highlightedItem();
        return highlightedItem ? highlightedItem.uid : null;
    });
    protected readonly affixClass = computed(() => {
        const theme = this.#themeService.theme();
        return dropdownListAffixContainerThemeVariants(theme)();
    });
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const disabled = this.disabled();
        const expanded = this.expanded();
        const hasPrefix = this.prefixTemplate() != null;
        const rounded = this.rounded();
        const size = this.size();
        const classes = dropdownListInputThemeVariants(theme)({ disabled, expanded, hasPrefix, rounded, size });
        const userClass = this.userClass();
        return twMerge(classes, userClass);
    });
    protected readonly clearIcon = X;
    protected readonly dropdownIcon = ChevronDown;
    protected readonly expanded = computed(() => this.#dropdownService.popupRef() !== null);
    protected readonly footerTemplate = contentChild(DropDownFooterTemplateDirective, { read: TemplateRef });
    protected readonly groupHeaderTemplate = contentChild(DropDownGroupHeaderTemplateDirective, {
        read: TemplateRef
    });
    protected readonly headerTemplate = contentChild(DropDownHeaderTemplateDirective, { read: TemplateRef });
    protected readonly itemTemplate = contentChild(DropDownItemTemplateDirective, { read: TemplateRef });
    protected readonly isEmpty = computed(() => !this.#listService.viewItems().any());
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
    protected readonly selectedListItem = computed(() => {
        return this.#listService.selectedListItems().firstOrDefault();
    });
    protected readonly valueContainerClass = computed(() => {
        const theme = this.#themeService.theme();
        const hasTemplate = this.valueTemplate() != null;
        return dropdownListValueContainerThemeVariants(theme)({ hasTemplate });
    });
    protected readonly valueTemplate = contentChild(DropDownListValueTemplateDirective, { read: TemplateRef });
    protected readonly valueText = computed(() => {
        const listItem = this.selectedListItem();
        if (!listItem) {
            return "";
        }
        return this.#listService.getItemText(listItem);
    });

    /**
     * @description Sets the aria-label attribute of the dropdown list component.
     * @default ""
     */
    public readonly ariaLabel = input("");

    /**
     * @description Sets the aria-labelledby attribute of the dropdown list component.
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
     * @description Sets the loading state of the dropdown list component.
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
     * @description Placeholder text for the dropdown list when no item is selected.
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
     * @description Sets the readonly state of the dropdown list component.
     * @default false
     */
    public readonly readonly = input(false);

    /**
     * @description Sets the required state of the dropdown list component.
     * @default false
     */
    public readonly required = input(false);

    /**
     * @description Sets the border radius of the dropdown list component.
     * @default "medium"
     */
    public readonly rounded = input<DropDownListVariantProps["rounded"]>("medium");

    /**
     * @description Whether to show the clear button when an item is selected.
     * @default false
     */
    public readonly showClearButton = input(false);

    /**
     * @description The size of the dropdown list component.
     * @default "medium"
     */
    public readonly size = input<DropDownListVariantProps["size"]>("medium");

    /**
     * @description Sets the text field of the dropdown list component.
     * It can be null, string, or a function that takes an item and returns a string.
     * If null, the item itself will be used as the text representation.
     * @default null
     */
    public readonly textField = input<DropdownFieldSelectorType<TData>>();
    public readonly userClass = input<string>("", { alias: "class" });

    /**
     * @description Sets the value field of the dropdown list component.
     * It can be null, string, or a function that takes an item and returns a string.
     * If null, the item itself will be used as the value representation.
     * @default null
     */
    public readonly valueField = input<DropdownFieldSelectorType<TData>>();

    public constructor() {
        combineLatest([toObservable(this.valueField), toObservable(this.#value)])
            .pipe(delay(0, asyncScheduler), takeUntilDestroyed())
            .subscribe(([, value]) => {
                if (value != null) {
                    this.#listService.setSelectedDataItems([value]);
                }
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

    public registerOnChange(fn: Action<TData | null>): void {
        this.#propagateChange = fn;
    }

    public registerOnTouched(fn: Action): void {
        this.#propagateTouch = fn;
    }

    public setDisabledState(isDisabled: boolean): void {
        this.disabled.set(isDisabled);
    }

    public setValue(value: TData): void {
        this.updateValue(value);
    }

    public writeValue(obj: TData): void {
        this.updateValue(obj, false);
        if (obj != null) {
            this.#listService.setSelectedDataItems([obj]);
        }
    }

    protected onBlur(): void {
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
        if (event.source.via === "mouse" || event.source.key === "Enter" || event.source.key === "NumpadEnter") {
            this.closePopup();
        }
    }

    protected onValueClear(event: MouseEvent | KeyboardEvent): void {
        if (event instanceof KeyboardEvent && event.key !== "Enter" && event.key !== " ") {
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
            this.updateValue(nextItem.data, true);
        } else {
            this.scrollToSelectedItem();
            this.#navigatedValue.set(nextItem.data);
        }
    }

    private focus(): void {
        this.#hostElementRef.nativeElement?.focus();
    }

    private handleEnterKey(): void {
        if (!this.expanded()) {
            this.#dropdownService.triggerPopupOpen$.next();
            return;
        }
        if (this.expanded() && this.#value() !== this.#navigatedValue()) {
            this.updateValue(this.#navigatedValue(), true);
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
            this.updateValue(itemToSelect.data, true);
        } else {
            this.#navigatedValue.set(itemToSelect.data);
        }
    }

    private initialize(): void {
        this.#listService.setNavigableOptions({ enabled: true, mode: "select" });
        this.#listService.setSelectableOptions(this.selectableOptions);
    }

    private scrollToSelectedItem(): void {
        const item = this.selectedListItem();
        if (!item) {
            return;
        }
        window.setTimeout(() => this.#listService.scrollToItem(item, false));
    }

    private setArrowKeyNavigationSubscription(): void {
        this.#dropdownService.navigate$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(({ item }) => {
            if (!this.expanded()) {
                this.updateValue(item.data, true);
            } else {
                this.#navigatedValue.set(item.data);
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
            } else if (isTypeaheadKey(event.key)) {
                this.#typeaheadKey.next(event.key);
            }
        });
    }

    private setPopupCloseSubscriptions(): void {
        this.#dropdownService.popupCloseComplete$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => {
            this.updateValue(this.#navigatedValue(), true);
            window.setTimeout(() => this.focus());
        });
    }

    private setSubscriptions(): void {
        this.setArrowKeyNavigationSubscription();
        this.setKeydownSubscription();
        this.setFilterChangeSubscription();
        this.setPopupCloseSubscriptions();
        this.setTypeaheadSubscription();
    }

    private setTypeaheadSubscription(): void {
        setupTypeahead(this.#typeaheadKey)
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(buffer => this.cycleThroughMatchedItems(buffer));
    }

    private updateValue(value: TData | null, notify: boolean = true): void {
        const oldValue = this.#value();
        this.#value.set(value);
        if (notify && oldValue !== value) {
            this.#propagateChange?.(value);
        }
    }
}
