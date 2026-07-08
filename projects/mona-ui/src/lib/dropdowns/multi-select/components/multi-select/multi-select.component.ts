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
    model,
    output,
    TemplateRef,
    untracked,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { FormValueControl } from "@angular/forms/signals";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { none } from "@mirei/ts-collections";
import { filter, tap } from "rxjs";
import { twMerge } from "tailwind-merge";
import { ChipComponent } from "../../../../buttons/chip/component/chip.component";
import { ListComponent } from "@mirei/mona-ui/list";
import { ListFooterTemplateDirective } from "@mirei/mona-ui/list";
import { ListGroupHeaderTemplateDirective } from "@mirei/mona-ui/list";
import { ListHeaderTemplateDirective } from "@mirei/mona-ui/list";
import { ListItemTemplateDirective } from "@mirei/mona-ui/list";
import { ListNoDataTemplateDirective } from "@mirei/mona-ui/list";
import { ListItem } from "@mirei/mona-ui/list";
import { ListSizeInputType } from "@mirei/mona-ui/list";
import { ListService } from "@mirei/mona-ui/list";
import { dropdownPopupThemeVariants, DropdownPopupVariantInput } from "../../../styles/dropdown-popup.styles";
import { restoreOverlayScroll } from "@mirei/mona-ui/common";
import { rxFromResize } from "@mirei/mona-ui/common";
import { PopupCloseEvent } from "@mirei/mona-ui/popup";
import { ThemeService } from "@mirei/mona-ui/theme";
import { createElementControlId } from "@mirei/mona-ui/common";
import { PreventableEvent } from "@mirei/mona-ui/common";
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
import { IndicatorIconComponent } from "@mirei/mona-ui/indicator-icon";
import { DropdownService } from "../../../services/dropdown.service";
import { MultiSelectTagTemplateDirective } from "../../directives/multi-select-tag-template.directive";
import { MultiSelectService } from "../../services/multi-select.service";
import {
    multiSelectAffixContainerThemeVariants,
    multiSelectBaseThemeVariants,
    multiSelectIndicatorContainerThemeVariants,
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
        MultiSelectService,
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
        DropdownLiveRegionDirective,
        IndicatorIconComponent
    ],
    hostDirectives: [DropdownDataHandlerDirective, DropdownListPopupHandlerDirective],
    host: {
        "[attr.aria-activedescendant]": "activeDescendant()",
        "[attr.aria-busy]": "loading() ? 'true' : undefined",
        "[attr.aria-controls]": "listId",
        "[attr.aria-disabled]": "disabled() ? true : undefined",
        "[attr.aria-expanded]": "expanded()",
        "[attr.aria-haspopup]": "'listbox'",
        "[attr.aria-invalid]": "invalidState() ? true : undefined",
        "[attr.aria-label]": "ariaLabel()",
        "[attr.aria-labelledby]": "ariaLabelledBy()",
        "[attr.aria-readonly]": "readonly() ? true : undefined",
        "[attr.aria-required]": "required() ? true : undefined",
        "[attr.role]": "'combobox'",
        "[attr.tabindex]": "disabled() ? null : 0",
        "[attr.data-invalid]": "invalidState() || null",
        "[class]": "baseClass()",
        "(blur)": "onBlur()"
    }
})
export class MultiSelectComponent<TData = unknown>
    implements
        FormValueControl<Iterable<TData>>,
        MultiSelectVariantInput,
        DropdownDataInput<TData>,
        DropdownPopupInput,
        DropdownPopupVariantInput
{
    readonly #destroyRef = inject(DestroyRef);
    readonly #dropdownService = inject(DropdownService);
    readonly #hostElementRef: ElementRef<HTMLElement> = inject(ElementRef);
    readonly #listService = inject(ListService<TData>);
    readonly #multiSelectService = inject(MultiSelectService);
    readonly #popupRef = this.#dropdownService.popupRef;
    readonly #themeService = inject(ThemeService);

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
        const invalid = this.invalidState();
        const rounded = this.rounded();
        const size = this.size();
        const variantClass = multiSelectBaseThemeVariants(theme)({ disabled, focused, invalid, rounded, size });
        const userClass = this.userClass();
        return twMerge(variantClass, userClass);
    });
    protected readonly expanded = computed(() => this.#dropdownService.popupRef() !== null);
    protected readonly footerTemplate = contentChild(DropDownFooterTemplateDirective, { read: TemplateRef });
    protected readonly groupHeaderTemplate = contentChild(DropDownGroupHeaderTemplateDirective, {
        read: TemplateRef
    });
    protected readonly headerTemplate = contentChild(DropDownHeaderTemplateDirective, { read: TemplateRef });
    protected readonly invalidState = computed(
        () => this.invalid() || (this.required() && this.touched() && none(this.value()))
    );
    protected readonly indicatorClass = computed(() => {
        const theme = this.#themeService.theme();
        const size = this.size();
        return multiSelectIndicatorContainerThemeVariants(theme)({ size });
    });
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
        return this.selectedListItems()
            .take(tagCount)
            .toImmutableDictionary(
                i => i,
                i => this.#listService.getItemText(i)
            );
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
    public readonly ariaLabel = input("", { alias: "aria-label" });

    /**
     * @description Sets the aria-labelledby attribute of the multi select component.
     * @default ""
     */
    public readonly ariaLabelledBy = input("", { alias: "aria-labelledby" });

    /**
     * @description Closes the popup automatically after an item is selected or deselected.
     * @default false
     */
    public readonly autoClose = input(false);

    /**
     * @description Renders a checkbox next to each item in the popup list to indicate its selected state.
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
     * @description Collection of items rendered in the popup list.
     * @default []
     */
    public readonly data = input<Iterable<TData>>([]);

    /**
     * @description Disables the component, preventing the popup from opening and blocking tag removal.
     * @default false
     */
    public readonly disabled = model(false);

    /**
     * @description A predicate function or the name of the field that determines whether an item is disabled.
     */
    public readonly itemDisabled = input<DropdownFieldPredicateType<TData>>();

    /**
     * @description Marks the multi select as invalid. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly invalid = input(false);

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
     * @default null
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
     * @description Renders a button that clears all selected items when at least one item is selected.
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

    /**
     * @description Emitted when the multi select is interacted with on blur, selection, remove, or clear.
     * The `FormField` directive listens to this to mark the field as touched.
     */
    public readonly touch = output<void>();

    /**
     * @description Sets the touched state of the multi select. When bound to a signal form field via `[formField]`,
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
     * @description Sets the value field of the multi select component.
     * It can be null, string, or a function that takes an item and returns a string.
     * If null, the item itself will be used as the value representation.
     * @default null
     */
    public readonly valueField = input<DropdownFieldSelectorType<TData>>();

    /**
     * @description Two-way bindable current selected values. Implements `FormValueControl<Iterable<TData>>`,
     * enabling signal forms `[formField]` binding. When `valueField` is set, primitive field values can be
     * written into this model to restore matching selected items.
     * @default []
     */
    public readonly value = model<Iterable<TData>>([]);

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
            const value = this.value();
            untracked(() => {
                this.#listService.setValueField(valueField ?? "");
                this.#listService.setSelectedDataItems(value);
            });
        });
        effect(() => {
            const checkboxVisible = this.checkboxes();
            untracked(() => this.#listService.setSelectableOptions({ checkboxes: checkboxVisible }));
        });
    }

    public focus(): void {
        this.#hostElementRef.nativeElement.focus();
    }

    protected onBlur(): void {
        this.touch.emit();
    }

    protected onItemSelect(): void {
        this.updateValue(this.selectedDataItems().toArray());
        if (this.autoClose()) {
            this.#popupRef()?.close();
        }
    }

    protected onSelectedItemRemove(event: Event, listItem: ListItem<TData>): void {
        event.stopImmediatePropagation();
        if (this.readonly() || this.disabled()) {
            return;
        }
        this.#listService.deselectItems([listItem]);
        this.updateValue(this.selectedDataItems().toArray());
        this.focus();
    }

    protected onSelectedItemGroupRemove(event: Event): void {
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

    private handleEnterKey(): void {
        if (!this.#popupRef()) {
            this.#dropdownService.triggerPopupOpen$.next({});
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

    private updateValue(value: Iterable<TData>, notify: boolean = true): void {
        this.value.set(value);
        if (notify) {
            this.touch.emit();
        }
    }
}
