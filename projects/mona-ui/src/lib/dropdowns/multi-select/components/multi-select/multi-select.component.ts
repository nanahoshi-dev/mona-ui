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
    model,
    output,
    signal,
    TemplateRef,
    untracked,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { ChevronDown, LucideAngularModule, X } from "lucide-angular";
import { filter, tap } from "rxjs";
import { twMerge } from "tailwind-merge";
import { ChipComponent } from "../../../../buttons/chip/component/chip.component";
import { ClearButtonComponent } from "../../../../common/clear-button/components/clear-button/clear-button.component";
import { FormFieldValidationDirective } from "../../../../common/directives/form-field-validation.directive";
import { ListComponent } from "../../../../common/list/components/list/list.component";
import { ListFooterTemplateDirective } from "../../../../common/list/directives/list-footer-template.directive";
import { ListGroupHeaderTemplateDirective } from "../../../../common/list/directives/list-group-header-template.directive";
import { ListHeaderTemplateDirective } from "../../../../common/list/directives/list-header-template.directive";
import { ListItemTemplateDirective } from "../../../../common/list/directives/list-item-template.directive";
import { ListNoDataTemplateDirective } from "../../../../common/list/directives/list-no-data-template.directive";
import { ListItem } from "../../../../common/list/models/ListItem";
import { ListSizeInputType } from "../../../../common/list/models/ListSizeType";
import { ListService } from "../../../../common/list/services/list.service";
import { LoadingIndicatorComponent } from "../../../../common/loading-indicator/components/loading-indicator/loading-indicator.component";
import { FormFieldValidationService } from "../../../../common/services/form-field-validation.service";
import { dropdownPopupThemeVariants, DropdownPopupVariantInput } from "../../../../common/styles/dropdown-popup.styles";
import { restoreOverlayScroll } from "../../../../common/utils/restoreOverlayScroll";
import { rxFromResize } from "../../../../common/utils/rxFromResize";
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
import { MultiSelectTagTemplateDirective } from "../../directives/multi-select-tag-template.directive";
import { MultiSelectService } from "../../services/multi-select.service";
import {
    multiSelectAffixContainerThemeVariants,
    multiSelectBaseThemeVariants,
    multiSelectItemContainerThemeVariants,
    MultiSelectVariantInput,
    MultiSelectVariantProps
} from "../../styles/multi-select.styles";

@Component({
    selector: "mona-multi-select",
    templateUrl: "./multi-select.component.html",
    providers: [
        ListService,
        DropdownService,
        FormFieldValidationService,
        MultiSelectService,
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MultiSelectComponent),
            multi: true
        },
        {
            provide: DropdownDataInputToken,
            useExisting: forwardRef(() => MultiSelectComponent),
            multi: false
        },
        {
            provide: DropdownPopupInputToken,
            useExisting: forwardRef(() => MultiSelectComponent),
            multi: false
        }
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ChipComponent,
        NgTemplateOutlet,
        FontAwesomeModule,
        ListComponent,
        ListGroupHeaderTemplateDirective,
        ListItemTemplateDirective,
        ListFooterTemplateDirective,
        ListHeaderTemplateDirective,
        ListNoDataTemplateDirective,
        LucideAngularModule,
        LoadingIndicatorComponent,
        DropdownLiveRegionDirective,
        ClearButtonComponent
    ],
    hostDirectives: [FormFieldValidationDirective, DropdownDataHandlerDirective, DropdownPopupHandlerDirective],
    host: {
        "[attr.aria-activedescendant]": "activeDescendant()",
        "[attr.aria-busy]": "loading() ? 'true' : undefined",
        "[attr.aria-controls]": "listId",
        "[attr.aria-disabled]": "disabled() ? true : undefined",
        "[attr.aria-expanded]": "expanded()",
        "[attr.aria-haspopup]": "'listbox'",
        "[attr.aria-invalid]": "isInvalid() ? true : undefined",
        "[attr.aria-label]": "ariaLabel()",
        "[attr.aria-labelledby]": "ariaLabelledBy()",
        "[attr.aria-readonly]": "readonly() ? true : undefined",
        "[attr.aria-required]": "required() ? true : undefined",
        "[attr.role]": "'combobox'",
        "[attr.tabindex]": "disabled() ? null : 0",
        "[class]": "baseClass()",
        "(blur)": "onBlur()"
    }
})
export class MultiSelectComponent<TData = unknown>
    implements
        ControlValueAccessor,
        MultiSelectVariantInput,
        DropdownDataInput<TData>,
        DropdownPopupInput,
        DropdownPopupVariantInput
{
    readonly #destroyRef = inject(DestroyRef);
    readonly #dropdownService = inject(DropdownService);
    readonly #formFieldValidationService = inject(FormFieldValidationService);
    readonly #hostElementRef: ElementRef<HTMLElement> = inject(ElementRef);
    readonly #listService: ListService<TData> = inject(ListService);
    readonly #multiSelectService = inject(MultiSelectService);
    readonly #popupRef = this.#dropdownService.popupRef;
    readonly #themeService = inject(ThemeService);
    readonly #value = signal<TData[]>([]);
    #propagateChange: Action<TData[]> | null = null;
    #propagateTouch: Action | null = null;
    #resizeObserver: ResizeObserver | null = null;

    protected readonly activeDescendant = computed(() => {
        const highlightedItem = this.#listService.highlightedItem();
        return highlightedItem ? highlightedItem.uid : null;
    });
    protected readonly affixClass = computed(() => {
        const theme = this.#themeService.theme();
        return multiSelectAffixContainerThemeVariants(theme)();
    });
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const disabled = this.disabled();
        const focused = this.#popupRef() != null;
        const rounded = this.rounded();
        const size = this.size();
        const variantClass = multiSelectBaseThemeVariants(theme)({ disabled, focused, rounded, size });
        const userClass = this.userClass();
        return twMerge(variantClass, userClass);
    });
    protected readonly dropdownIcon = ChevronDown;
    protected readonly expanded = computed(() => this.#dropdownService.popupRef() !== null);
    protected readonly footerTemplate = contentChild(DropDownFooterTemplateDirective, { read: TemplateRef });
    protected readonly groupHeaderTemplate = contentChild(DropDownGroupHeaderTemplateDirective, {
        read: TemplateRef
    });
    protected readonly headerTemplate = contentChild(DropDownHeaderTemplateDirective, { read: TemplateRef });
    protected readonly isInvalid = computed(() => this.#formFieldValidationService?.invalid() || false);
    protected readonly itemContainerClass = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        return multiSelectItemContainerThemeVariants(theme)({ rounded });
    });
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
    protected readonly summaryTagTemplate = this.#multiSelectService.summaryTagTemplate.asReadonly();
    protected readonly tagCount = this.#multiSelectService.tagCount.asReadonly();
    protected readonly tagTemplate = contentChild(MultiSelectTagTemplateDirective, { read: TemplateRef });
    protected readonly selectedDataItems = computed(() => {
        return this.selectedListItems()
            .select(i => i.data)
            .toImmutableSet();
    });
    protected readonly selectedListItems = computed(() => {
        return this.#listService.selectedListItems();
    });
    protected readonly valueTextMap = computed(() => {
        const tagCount = this.visibleTagCount();
        const x = this.selectedListItems()
            .take(tagCount)
            .toImmutableDictionary(
                i => i,
                i => this.#listService.getItemText(i)
            );
        console.log("x", x.toArray(), tagCount);
        return x;
    });
    protected readonly visibleTagCount = computed(() => {
        const tagCount = this.tagCount();
        const itemCount = this.selectedListItems().size();
        if (tagCount < 0) {
            return itemCount;
        }
        return tagCount;
    });

    /**
     * @description Sets the aria-label attribute of the multi select component.
     * @default ""
     */
    public readonly ariaLabel = input("");

    /**
     * @description Sets the aria-labelledby attribute of the multi select component.
     * @default ""
     */
    public readonly ariaLabelledBy = input("");

    /**
     * @description Sets whether the popup should close after selecting an item.
     * @default false
     */
    public readonly autoClose = input(false);

    /**
     * @description Sets whether the checkbox should be visible.
     * @default false
     */
    public readonly checkboxes = input(false);

    /**
     * @description Emits when the popup is about to close. This event is preventable.
     */
    public readonly close = output<PopupCloseEvent>();

    /**
     * @description Emits after the popup is closed.
     */
    public readonly closed = output();

    /**
     * @description Sets the data of the multi select component.
     */
    public readonly data = input<Iterable<TData>>([]);

    /**
     * @description Sets the disabled state of the multi select component.
     */
    public readonly disabled = model(false);

    /**
     * @description A predicate function or the name of the field that determines whether an item is disabled.
     */
    public readonly itemDisabled = input<DropdownFieldPredicateType<TData>>();

    /**
     * @description Sets the loading state of the multi select component.
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
     * @description Sets the readonly state of the multi select component.
     * @default false
     */
    public readonly readonly = input(false);

    /**
     * @description Sets the required state of the multi select component.
     * @default false
     */
    public readonly required = input(false);

    /**
     * @description Sets the border radius of the multi select component.
     * @default "medium"
     */
    public readonly rounded = input<MultiSelectVariantProps["rounded"]>("medium");

    /**
     * @description Whether to show the clear button when an item is selected.
     * @default false
     */
    public readonly showClearButton = input(false);

    /**
     * @description The size of the multi select component.
     * @default "medium"
     */
    public readonly size = input<MultiSelectVariantProps["size"]>("medium");

    /**
     * @description Sets the text field of the multi select component.
     * It can be null, string, or a function that takes an item and returns a string.
     * If null, the item itself will be used as the text representation.
     * @default null
     */
    public readonly textField = input<DropdownFieldSelectorType<TData>>();
    public readonly userClass = input<string>("", { alias: "class" });

    /**
     * @description Sets the value field of the multi select component.
     * It can be null, string, or a function that takes an item and returns a string.
     * If null, the item itself will be used as the value representation.
     * @default null
     */
    public readonly valueField = input<DropdownFieldSelectorType<TData>>();

    public constructor() {
        afterNextRender({
            read: () => {
                this.initialize();
                this.setEventListeners();
                this.setSubscriptions();
            }
        });
        effect(() => {
            const popupTemplate = this.popupTemplate();
            untracked(() => this.#dropdownService.popupTemplate.set(popupTemplate));
        });
        effect(() => {
            const valueField = this.valueField();
            untracked(() => {
                this.#listService.setValueField(valueField ?? "");
                this.#listService.setSelectedDataItems(this.#value());
            });
        });
        effect(() => {
            const checkboxVisible = this.checkboxes();
            untracked(() => this.#listService.setSelectableOptions({ checkboxes: checkboxVisible }));
        });
        inject(DestroyRef).onDestroy(() => this.#resizeObserver?.disconnect());
    }

    public onItemSelect(): void {
        this.updateValue(this.selectedDataItems().toArray());
        if (this.autoClose()) {
            this.#popupRef()?.close();
        }
    }

    public onSelectedItemRemove(event: Event, listItem: ListItem<TData>): void {
        event.stopImmediatePropagation();
        if (this.readonly() || this.disabled()) {
            return;
        }
        this.#listService.deselectItems([listItem]);
        this.updateValue(this.selectedDataItems().toArray());
        this.focus();
    }

    public onSelectedItemGroupRemove(event: Event): void {
        event.stopImmediatePropagation();
        if (this.readonly() || this.disabled()) {
            return;
        }
        const selectedItemCount = this.selectedListItems().size();
        const removedItems = this.selectedListItems()
            .takeLast(selectedItemCount - this.visibleTagCount())
            .toArray();
        this.#listService.deselectItems(removedItems);
        this.updateValue(this.selectedDataItems().toArray());
        this.focus();
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

    public writeValue(data: any[]): void {
        this.updateValue(data ?? []);
        if (data != null) {
            this.#listService.setSelectedDataItems(data);
        }
    }

    protected onBlur(): void {
        this.#propagateTouch?.();
    }

    protected onValueClear(event: Event): void {
        if (this.readonly() || (event instanceof KeyboardEvent && event.key !== "Enter" && event.key !== " ")) {
            return;
        }
        event.preventDefault();
        event.stopImmediatePropagation();
        this.updateValue([]);
        this.#listService.clearSelections();
        this.focus();
    }

    private focus(): void {
        this.#hostElementRef.nativeElement.focus();
    }

    private handleEnterKey(): void {
        if (!this.#popupRef()) {
            this.#dropdownService.triggerPopupOpen$.next();
            return;
        }
        const highlightedItem = this.#listService.highlightedItem();
        if (!highlightedItem) {
            return;
        }
        const selected = this.#listService.isSelected(highlightedItem);
        if (selected) {
            this.#listService.deselectItems([highlightedItem]);
        } else {
            this.#listService.selectItem(highlightedItem);
        }
        this.updateValue(this.selectedDataItems().toArray());
        if (this.autoClose()) {
            this.#popupRef()?.close();
        }
    }

    private handlePopupPositionUpdate(): void {
        const popupRef = this.#popupRef();
        if (!popupRef) {
            return;
        }
        restoreOverlayScroll(popupRef.overlayRef, this.#hostElementRef.nativeElement);
    }

    private initialize(): void {
        this.#listService.setNavigableOptions({ enabled: true, mode: "highlight", wrap: true });
        this.#listService.setSelectableOptions({ enabled: true, mode: "multiple" });
    }

    private setBackspaceKeySubscription(): void {
        this.#dropdownService.keydown$
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                filter(e => e.key === "Backspace"),
                tap(e => e.preventDefault())
            )
            .subscribe(() => {
                const selectedItems = this.selectedListItems();
                if (selectedItems.isEmpty()) {
                    return;
                }
                const lastSelectedItem = selectedItems.last();
                this.#listService.deselectItems([lastSelectedItem]);
                this.updateValue(this.selectedDataItems().toArray());
            });
    }

    private setEnterKeySubscription(): void {
        this.#dropdownService.keydown$
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                filter(e => e.key === "Enter"),
                tap(e => e.preventDefault())
            )
            .subscribe(() => this.handleEnterKey());
    }

    private setEventListeners(): void {
        rxFromResize(this.#hostElementRef.nativeElement)
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(() => this.handlePopupPositionUpdate());
    }

    private setSubscriptions(): void {
        this.setBackspaceKeySubscription();
        this.setEnterKeySubscription();
    }

    private updateValue(value: TData[], notify: boolean = true): void {
        const oldValue = this.#value();
        this.#value.set(value);
        if (oldValue !== value && notify) {
            this.#propagateChange?.(this.#value());
        }
    }
}
