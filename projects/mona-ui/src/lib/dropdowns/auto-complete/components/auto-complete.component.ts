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
import { FormsModule } from "@angular/forms";
import type { FormValueControl } from "@angular/forms/signals";
import { debounceTime, filter, identity, Subject, take, tap } from "rxjs";
import { twMerge } from "tailwind-merge";
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
import { dropdownPopupThemeVariants, DropdownPopupVariantInput } from "../../../common/styles/dropdown-popup.styles";
import { rxTimeout } from "../../../common/utils/rxTimeout";
import { TextBoxDirective } from "../../../inputs/text-box/directives/text-box.directive";
import { PopupCloseEvent } from "../../../popup/models/PopupCloseEvent";
import { ThemeService } from "../../../theme/services/theme.service";
import { createElementControlId } from "../../../utils/createElementControlId";
import { PreventableEvent } from "../../../utils/PreventableEvent";
import { DropDownFooterTemplateDirective } from "../../directives/drop-down-footer-template.directive";
import { DropDownGroupHeaderTemplateDirective } from "../../directives/drop-down-group-header-template.directive";
import { DropDownHeaderTemplateDirective } from "../../directives/drop-down-header-template.directive";
import { DropDownItemTemplateDirective } from "../../directives/drop-down-item-template.directive";
import { DropDownNoDataTemplateDirective } from "../../directives/drop-down-no-data-template.directive";
import { DropdownDataHandlerDirective } from "../../directives/dropdown-data-handler.directive";
import { DropdownLiveRegionDirective } from "../../directives/dropdown-live-region.directive";
import { DropdownListPopupHandlerDirective } from "../../directives/dropdown-list-popup-handler.directive";
import { DropdownPrefixTemplateDirective } from "../../directives/dropdown-prefix-template.directive";
import { DropdownSuffixTemplateDirective } from "../../directives/dropdown-suffix-template.directive";
import { DropdownDataInput, DropdownDataInputToken } from "../../models/DropdownDataInput";
import { DropdownFieldPredicateType, DropdownFieldSelectorType } from "../../models/DropdownFieldTypes";
import { DropdownPopupInput, DropdownPopupInputToken } from "../../models/DropdownPopupInput";
import { IndicatorIconComponent } from "../../../common/indicator-icon/components/indicator-icon/indicator-icon.component";
import { DropdownService } from "../../../common/dropdown/services/dropdown.service";
import {
    autoCompleteAffixContainerThemeVariants,
    autoCompleteBaseThemeVariants,
    autoCompleteTextInputThemeVariants,
    AutoCompleteVariantInput,
    AutoCompleteVariantProps
} from "../styles/auto-complete.styles";

@Component({
    selector: "mona-auto-complete",
    templateUrl: "./auto-complete.component.html",
    hostDirectives: [DropdownDataHandlerDirective, DropdownListPopupHandlerDirective],
    providers: [
        ListService,
        DropdownService,
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
    host: {
        "[attr.aria-disabled]": "disabled() ? true : undefined",
        "[attr.aria-haspopup]": "'listbox'",
        "[attr.aria-invalid]": "invalidState() ? true : undefined",
        "[attr.aria-readonly]": "readonly() ? true : undefined",
        "[attr.aria-required]": "required() ? true : undefined",
        "[attr.data-disabled]": "disabled()",
        "[attr.data-invalid]": "invalidState() || null",
        "[attr.tabindex]": "-1",
        "[class]": "baseClass()"
    }
})
export class AutoCompleteComponent<TData = unknown>
    implements
        FormValueControl<string | null>,
        AutoCompleteVariantInput,
        DropdownDataInput<TData>,
        DropdownPopupInput,
        DropdownPopupVariantInput
{
    readonly #destroyRef = inject(DestroyRef);
    readonly #dropdownService = inject(DropdownService);
    readonly #hostElementRef = inject(ElementRef<HTMLElement>);
    readonly #listService = inject(ListService);
    readonly #popupRef = this.#dropdownService.popupRef;
    readonly #themeService = inject(ThemeService);

    protected readonly activeDescendant = computed(() => {
        const highlightedItem = this.#listService.highlightedItem();
        return highlightedItem ? highlightedItem.uid : null;
    });
    protected readonly affixClass = computed(() => {
        const theme = this.#themeService.theme();
        return autoCompleteAffixContainerThemeVariants(theme)();
    });
    protected readonly autoCompleteValue = linkedSignal(() => this.value() ?? "");
    protected readonly autoCompleteValue$ = new Subject<string | null>();
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const disabled = this.disabled();
        const expanded = this.expanded();
        const focused = this.#popupRef() !== null;
        const invalid = this.invalidState();
        const rounded = this.rounded();
        const size = this.size();
        const variantClass = autoCompleteBaseThemeVariants(theme)({
            disabled,
            expanded,
            focused,
            invalid,
            rounded,
            size
        });
        const userClass = this.userClass();
        return twMerge(variantClass, userClass);
    });
    protected readonly effectiveAriaLabel = computed(
        () => this.ariaLabel() || (this.ariaLabelledBy() ? "" : this.placeholder())
    );
    protected readonly expanded = computed(() => this.#popupRef() !== null);
    protected readonly footerTemplate = contentChild(DropDownFooterTemplateDirective, { read: TemplateRef });
    protected readonly groupHeaderTemplate = contentChild(DropDownGroupHeaderTemplateDirective, {
        read: TemplateRef
    });
    protected readonly headerTemplate = contentChild(DropDownHeaderTemplateDirective, { read: TemplateRef });
    protected readonly id = createElementControlId();
    protected readonly inputClass = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        return autoCompleteTextInputThemeVariants(theme)({ rounded });
    });
    protected readonly itemTemplate = contentChild(DropDownItemTemplateDirective, { read: TemplateRef });
    protected readonly invalidState = computed(
        () => this.invalid() || (this.required() && this.touched() && !this.value())
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
    protected readonly suffixTemplate = contentChild(DropdownSuffixTemplateDirective, { read: TemplateRef });

    /**
     * @description Sets the aria-describedby attribute of the autocomplete input.
     * Use this to associate error messages or help text with the input.
     * @default ""
     */
    public readonly ariaDescribedBy = input("", { alias: "aria-describedby" });

    /**
     * @description Sets the aria-label attribute of the autocomplete component.
     * @default ""
     */
    public readonly ariaLabel = input("", { alias: "aria-label" });

    /**
     * @description Sets the aria-labelledby attribute of the autocomplete component.
     * @default ""
     */
    public readonly ariaLabelledBy = input("", { alias: "aria-labelledby" });

    /**
     * @description Emits when the popup is about to close. This event is preventable.
     */
    public readonly close = output<PopupCloseEvent>();

    /**
     * @description Emits after the popup is closed.
     */
    public readonly closed = output();

    /**
     * @description Collection of items to render.
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
     * @default undefined
     */
    public readonly itemDisabled = input<DropdownFieldPredicateType<TData>>();

    /**
     * @description Marks the autocomplete as invalid. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly invalid = input(false);

    /**
     * @description Defines whether the first matching item should be highlighted while typing.
     * @default true
     */
    public readonly highlightFirst = input(true);

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

    /**
     * @description Emitted when the autocomplete is interacted with on blur, selection, clear, or committed input.
     * The `FormField` directive listens to this to mark the field as touched.
     */
    public readonly touch = output<void>();

    /**
     * @description Sets the touched state of the autocomplete. When bound to a signal form field via `[formField]`,
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
     * @description Sets the value field of the autocomplete component.
     * It can be null, string, or a function that takes an item and returns a string.
     * If null, the item itself will be used as the value representation.
     * @default null
     */
    public readonly valueField = input<DropdownFieldSelectorType<TData>>(null);

    /**
     * @description Two-way bindable current autocomplete value. Implements `FormValueControl<string | null>`,
     * enabling signal forms `[formField]` binding.
     * @default null
     */
    public readonly value = model<string | null>(null);

    public constructor() {
        afterNextRender({
            read: () => {
                this.initialize();
                this.setSubscriptions();
            }
        });
        effect(() => {
            const popupTemplate = this.popupTemplate();
            untracked(() => this.#dropdownService.popupTemplate.set(popupTemplate));
        });
    }

    protected onInputBlur(): void {
        this.touch.emit();
        if (this.value() !== this.autoCompleteValue() && !this.#popupRef()) {
            this.updateValue(this.autoCompleteValue());
        }
    }

    protected onItemSelect(event: SelectionChangeEvent<TData>): void {
        const itemText = this.#listService.getItemText(event.item);
        this.updateValue(itemText);
        this.autoCompleteValue.set(itemText);
        this.closePopup();
        rxTimeout(this.#destroyRef, () => this.focus());
    }

    protected onValueClear(event: MouseEvent | KeyboardEvent): void {
        if (this.readonly() || (event instanceof KeyboardEvent && event.key !== "Enter" && event.key !== " ")) {
            return;
        }
        event.stopImmediatePropagation();
        this.clear(true);
        this.closePopup();
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

    public focus(): void {
        const input = this.#hostElementRef.nativeElement.querySelector("input");
        if (input) {
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);
        }
    }

    private initialize(): void {
        this.#listService.setNavigableOptions({ enabled: true, mode: "highlight" });
        this.#listService.setSelectableOptions(this.selectableOptions);
        this.#listService.filterInputVisible.set(false);
        this.#dropdownService.restoreFocus.set(false);
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
        const debounceDuration = this.#listService.getFilterDebounceDuration();
        this.autoCompleteValue$
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                filter(value => value !== null),
                debounceDuration > 0 ? debounceTime(debounceDuration) : identity
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
                    this.#popupRef()
                        ?.closed.pipe(take(1))
                        .subscribe(() => this.clear(false));
                    this.closePopup();
                    return;
                }

                if (!this.#popupRef()) {
                    this.#dropdownService.triggerPopupOpen$.next({});
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
                const autoCompleteValue = this.autoCompleteValue();
                if (highlightedItem) {
                    const highlightedItemText = this.#listService.getItemText(highlightedItem);
                    this.autoCompleteValue.set(highlightedItemText);
                    this.updateValue(highlightedItemText);
                    this.closePopup();
                    return;
                }
                if (this.value() !== autoCompleteValue) {
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
                tap(e => {
                    e.preventDefault();
                    e.originalEvent?.stopImmediatePropagation();
                })
            )
            .subscribe(() => {
                if (this.#popupRef()) {
                    this.closePopup();
                    return;
                }
                if (this.autoCompleteValue()) {
                    this.clear(false);
                }
            });
    }

    private setSpaceKeySubscription(): void {
        this.#dropdownService.beforeKeydown$
            .pipe(
                filter(e => e.originalEvent?.key === " "),
                takeUntilDestroyed(this.#destroyRef),
                tap(e => e.preventDefault())
            )
            .subscribe();
    }

    private setPopupCloseSubscriptions(): void {
        this.#dropdownService.popupCloseComplete$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => {
            this.autoCompleteValue$.next(null);
        });
    }

    private setSubscriptions(): void {
        this.setAutoCompleteValueChangeSubscription();
        this.setArrowKeyNavigationSubscription();
        this.setEnterKeySubscription();
        this.setEscapeKeySubscription();
        this.setPopupCloseSubscriptions();
        this.setSpaceKeySubscription();
    }

    private updateValue(value: string | null, notify: boolean = true): void {
        const oldValue = this.value();
        if (notify && oldValue !== value) {
            const notifyValue = value === "" || value == null ? null : value;
            this.value.set(notifyValue);
            this.touch.emit();
            return;
        }
        this.value.set(value);
    }
}
