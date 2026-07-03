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
    TemplateRef,
    untracked,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { FormValueControl } from "@angular/forms/signals";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { Subject } from "rxjs";
import { twMerge } from "tailwind-merge";
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
import { dropdownPopupThemeVariants } from "../../../../common/styles/dropdown-popup.styles";
import { isTypeaheadKey, setupTypeahead } from "../../../../common/utils/typeahead.util";
import { PopupCloseEvent } from "../../../../popup/models/PopupCloseEvent";
import { ThemeService } from "../../../../theme/services/theme.service";
import { createElementControlId } from "../../../../utils/createElementControlId";
import { PreventableEvent } from "../../../../utils/PreventableEvent";
import { DropDownFooterTemplateDirective } from "../../../directives/drop-down-footer-template.directive";
import { DropDownGroupHeaderTemplateDirective } from "../../../directives/drop-down-group-header-template.directive";
import { DropDownHeaderTemplateDirective } from "../../../directives/drop-down-header-template.directive";
import { DropDownItemTemplateDirective } from "../../../directives/drop-down-item-template.directive";
import { DropDownNoDataTemplateDirective } from "../../../directives/drop-down-no-data-template.directive";
import { DropdownDataHandlerDirective } from "../../../directives/dropdown-data-handler.directive";
import { DropdownLiveRegionDirective } from "../../../directives/dropdown-live-region.directive";
import { DropdownListPopupHandlerDirective } from "../../../directives/dropdown-list-popup-handler.directive";
import { DropdownPrefixTemplateDirective } from "../../../directives/dropdown-prefix-template.directive";
import { DropdownDataInput, DropdownDataInputToken } from "../../../models/DropdownDataInput";
import { DropdownFieldPredicateType, DropdownFieldSelectorType } from "../../../models/DropdownFieldTypes";
import { DropdownPopupInput, DropdownPopupInputToken } from "../../../models/DropdownPopupInput";
import { IndicatorIconComponent } from "../../../../common/indicator-icon/components/indicator-icon/indicator-icon.component";
import { DropdownService } from "../../../../common/dropdown/services/dropdown.service";
import { DropdownListService } from "../../../services/dropdown-list.service";
import { DropDownListValueTemplateDirective } from "../../directives/drop-down-list-value-template.directive";
import {
    dropdownListAffixContainerThemeVariants,
    dropdownListInputThemeVariants,
    dropdownListValueContainerThemeVariants,
    DropDownListVariantInput,
    DropDownListVariantProps
} from "../../styles/dropdown-list.styles";

@Component({
    selector: "mona-dropdown-list",
    templateUrl: "./dropdown-list.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    hostDirectives: [DropdownDataHandlerDirective, DropdownListPopupHandlerDirective],
    providers: [
        ListService,
        DropdownService,
        DropdownListService,
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
        FontAwesomeModule,
        ListComponent,
        ListItemTemplateDirective,
        ListGroupHeaderTemplateDirective,
        ListFooterTemplateDirective,
        ListHeaderTemplateDirective,
        ListNoDataTemplateDirective,
        DropdownLiveRegionDirective,
        IndicatorIconComponent
    ],
    host: {
        "[attr.aria-activedescendant]": "activeDescendant()",
        "[attr.aria-busy]": "loading() ? 'true' : undefined",
        "[attr.aria-controls]": "listId",
        "[attr.aria-disabled]": "disabled() ? true : undefined",
        "[attr.aria-expanded]": "expanded()",
        "[attr.aria-haspopup]": "'listbox'",
        "[attr.aria-invalid]": "invalidState() ? true : undefined",
        "[attr.aria-label]": "effectiveAriaLabel() || null",
        "[attr.aria-labelledby]": "ariaLabelledBy()",
        "[attr.aria-readonly]": "readonly() ? true : undefined",
        "[attr.aria-required]": "required() ? true : undefined",
        "[attr.data-invalid]": "invalidState() || null",
        "[attr.role]": "'combobox'",
        "[attr.tabindex]": "disabled() ? null : 0",
        "[class]": "baseClass()",
        "(blur)": "onBlur()"
    }
})
export class DropdownListComponent<TData = unknown>
    implements FormValueControl<TData | null>, DropDownListVariantInput, DropdownDataInput<TData>, DropdownPopupInput
{
    readonly #destroyRef = inject(DestroyRef);
    readonly #dropdownListService = inject(DropdownListService);
    readonly #dropdownService = inject(DropdownService);
    readonly #hostElementRef = inject(ElementRef<HTMLElement>);
    readonly #navigatedValue = linkedSignal(() => this.value());
    readonly #listService = inject<ListService<TData>>(ListService);
    readonly #themeService = inject(ThemeService);
    readonly #typeaheadKey = new Subject<string>();

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
        const invalid = this.invalidState();
        const rounded = this.rounded();
        const size = this.size();
        const classes = dropdownListInputThemeVariants(theme)({
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
    protected readonly effectiveAriaLabel = computed(
        () => this.ariaLabel() || (this.ariaLabelledBy() ? "" : this.placeholder())
    );
    protected readonly expanded = computed(() => this.#dropdownService.popupRef() !== null);
    protected readonly footerTemplate = contentChild(DropDownFooterTemplateDirective, { read: TemplateRef });
    protected readonly groupHeaderTemplate = contentChild(DropDownGroupHeaderTemplateDirective, {
        read: TemplateRef
    });
    protected readonly headerTemplate = contentChild(DropDownHeaderTemplateDirective, { read: TemplateRef });
    protected readonly itemTemplate = contentChild(DropDownItemTemplateDirective, { read: TemplateRef });
    protected readonly invalidState = computed(
        () => this.invalid() || (this.required() && this.touched() && this.value() == null)
    );
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
    public readonly disabled = model(false);

    /**
     * @description Predicate or field name used to determine whether an individual item is disabled.
     * @default undefined
     */
    public readonly itemDisabled = input<DropdownFieldPredicateType<TData>>();

    /**
     * @description Marks the field as invalid. Set automatically by the `FormField` directive when bound via `[formField]`.
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
     * @description Height of the popup element.
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
    public readonly readonly = input(false);

    /**
     * @description Marks the field as required for form validation.
     * @default false
     */
    public readonly required = input(false);

    /**
     * @description Border-radius preset applied to the component.
     * @default "medium"
     */
    public readonly rounded = input<DropDownListVariantProps["rounded"]>("medium");

    /**
     * @description Shows a clear button that resets the selected value when clicked.
     * @default false
     */
    public readonly showClearButton = input(false);

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
    public readonly textField = input<DropdownFieldSelectorType<TData>>();

    /**
     * @description Emitted when the control is interacted with via blur, selection, or clear.
     * The `FormField` directive listens to this to mark the field as touched.
     */
    public readonly touch = output<void>();

    /**
     * @description Marks the control as touched. Set automatically by the `FormField` directive when bound via `[formField]`.
     * @default false
     */
    public readonly touched = input(false);

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string>("", { alias: "class" });

    /**
     * @description Property name or accessor used to derive the value from a data item.
     * If omitted, the item itself is used as the value.
     * @default undefined
     */
    public readonly valueField = input<DropdownFieldSelectorType<TData>>();

    /**
     * @description Currently selected value, two-way bindable and compatible with Signal Forms via `[formField]`.
     * When `valueField` is set, this may hold the primitive field value instead of the full data item.
     * @default null
     */
    public readonly value = model<TData | null>(null);

    public constructor() {
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

    public setValue(value: TData): void {
        this.updateValue(value);
    }

    protected onBlur(): void {
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
        if (event.source.via === "mouse" || event.source.key === "Enter" || event.source.key === "NumpadEnter") {
            this.closePopup();
        }
    }

    protected onValueClear(event: MouseEvent | KeyboardEvent): void {
        if (this.readonly() || (event instanceof KeyboardEvent && event.key !== "Enter" && event.key !== " ")) {
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

    public focus(): void {
        this.#hostElementRef.nativeElement?.focus();
    }

    private handleEnterKey(): void {
        if (!this.expanded()) {
            this.#dropdownService.triggerPopupOpen$.next({});
            return;
        }
        if (this.expanded() && this.value() !== this.#navigatedValue()) {
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
        this.#dropdownListService.navigate$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(({ item }) => {
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
        const oldValue = this.value();
        if (oldValue !== value) {
            this.value.set(value);
        }
        if (notify && oldValue !== value) {
            this.touch.emit();
        }
    }
}
