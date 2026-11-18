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
    isDevMode,
    model,
    output,
    TemplateRef,
    untracked,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { FormValueControl } from "@angular/forms/signals";
import { none } from "@mirei/ts-collections";
import { CHIP_DEFAULT_MESSAGES, ChipComponent } from "@nanahoshi/mona-ui/chip";
import type { PreventableEvent } from "@nanahoshi/mona-ui/common";
import {
    type AdaptiveMode,
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
    DropdownLiveRegionDirective,
    DropdownNoDataTemplateDirective,
    type DropdownPopupInput,
    DROPDOWN_POPUP_INPUT_TOKEN,
    dropdownPopupThemeVariants,
    type DropdownPopupVariantInput,
    DropdownPrefixTemplateDirective,
    DropdownService,
    dropdownSheetSurfaceClasses
} from "@nanahoshi/mona-ui/dropdowns";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import {
    createElementControlId,
    FIELD_ASSOCIATION_BOUNDARY,
    injectEffectiveDisabled,
    injectLabelAssociation,
    restoreOverlayScroll,
    rxFromResize
} from "@nanahoshi/mona-ui/internal";
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
    type ListSizeInputType
} from "@nanahoshi/mona-ui/internal/list";
import type { PopupCloseEvent } from "@nanahoshi/mona-ui/popup";
import { filter, tap } from "rxjs";
import { twMerge } from "tailwind-merge";
import { MultiSelectTagTemplateDirective } from "../../directives/multi-select-tag-template.directive";
import { MULTI_SELECT_DEFAULT_MESSAGES } from "../../i18n/multi-select.default-messages";
import { MultiSelectService } from "../../services/multi-select.service";
import {
    multiSelectAffixContainerThemeVariants,
    multiSelectBaseThemeVariants,
    multiSelectIndicatorContainerThemeVariants,
    multiSelectItemContainerThemeVariants,
    type MultiSelectVariantInput,
    type MultiSelectVariantProps
} from "../../styles/multi-select.styles";

@Component({
    selector: "mona-multi-select",
    templateUrl: "./multi-select.component.html",
    providers: [
        ListService,
        DropdownService,
        MultiSelectService,
        {
            provide: DROPDOWN_DATA_INPUT_TOKEN,
            useExisting: forwardRef(() => MultiSelectComponent),
            multi: false
        },
        {
            provide: DROPDOWN_POPUP_INPUT_TOKEN,
            useExisting: forwardRef(() => MultiSelectComponent),
            multi: false
        }
    ],
    imports: [
        ChipComponent,
        NgTemplateOutlet,
        ListComponent,
        ListGroupHeaderTemplateDirective,
        ListItemTemplateDirective,
        ListFooterTemplateDirective,
        ListHeaderTemplateDirective,
        ListNoDataTemplateDirective,
        IndicatorIconComponent
    ],
    hostDirectives: [DropdownDataHandlerDirective, DropdownListPopupHandlerDirective, DropdownLiveRegionDirective],
    viewProviders: [...FIELD_ASSOCIATION_BOUNDARY],
    host: {
        "[attr.aria-activedescendant]": "activeDescendant()",
        "[attr.aria-busy]": "loading() ? 'true' : undefined",
        "[attr.aria-controls]": "listId",
        "[attr.aria-describedby]": "describedBy()",
        "[attr.aria-disabled]": "effectiveDisabled() ? true : undefined",
        "[attr.aria-expanded]": "expanded()",
        "[attr.aria-haspopup]": "'listbox'",
        "[attr.aria-invalid]": "invalidState() ? true : undefined",
        "[attr.aria-label]": "effectiveAriaLabel() || null",
        "[attr.aria-labelledby]": "labelledBy()",
        "[attr.aria-readonly]": "readonly() ? true : undefined",
        "[attr.aria-required]": "required() ? true : undefined",
        "[attr.data-disabled]": "effectiveDisabled() || null",
        "[attr.data-invalid]": "invalidState() || null",
        "[attr.data-readonly]": "readonly() || null",
        "[attr.role]": "'combobox'",
        "[attr.tabindex]": "effectiveDisabled() ? null : 0",
        "[class]": "baseClass()",
        "(focusout)": "onFocusOut($event)"
    }
})
export class MultiSelectComponent<TData = unknown, TValue = TData>
    implements
        FormValueControl<Iterable<TValue>>,
        MultiSelectVariantInput,
        DropdownDataInput<TData>,
        DropdownPopupInput,
        DropdownPopupVariantInput
{
    readonly #destroyRef = inject(DestroyRef);
    readonly #dropdownService = inject(DropdownService);
    readonly #hostElementRef: ElementRef<HTMLElement> = inject(ElementRef);
    readonly #i18n = inject(MonaI18nService);
    readonly #label = injectLabelAssociation({
        activate: () => this.focus(),
        ariaDescribedBy: () => this.ariaDescribedBy(),
        ariaLabel: () => this.ariaLabel(),
        ariaLabelledBy: () => this.ariaLabelledBy(),
        focus: () => this.focus()
    });
    readonly #listService = inject(ListService<TData>);
    readonly #multiSelectService = inject(MultiSelectService);
    readonly #popupRef = this.#dropdownService.popupRef;
    /** Whether the arrow keys moved the highlight since the filter text last changed. */
    #navigatedByArrows = false;

    protected readonly activeDescendant = computed(() => {
        const highlightedItem = this.#listService.highlightedItem();
        return highlightedItem ? highlightedItem.uid : null;
    });
    protected readonly affixClass = computed(() => {
        return multiSelectAffixContainerThemeVariants();
    });
    protected readonly baseClass = computed(() => {
        const disabled = this.effectiveDisabled();
        const focused = this.#popupRef() != null;
        const invalid = this.invalidState();
        const rounded = this.rounded();
        const size = this.size();
        const variantClass = multiSelectBaseThemeVariants({ disabled, focused, invalid, rounded, size });
        const userClass = this.userClass();
        return twMerge(variantClass, userClass);
    });
    protected readonly chipMessages = this.#i18n.componentMessages("chip", CHIP_DEFAULT_MESSAGES);
    protected readonly clearButtonVisible = computed(
        () =>
            this.showClearButton() &&
            this.selectedListItems().any() &&
            !this.loading() &&
            !this.effectiveDisabled() &&
            !this.readonly()
    );
    protected readonly describedBy = this.#label.describedBy;
    protected readonly effectiveAriaLabel = computed(
        () => this.ariaLabel() || (this.labelledBy() ? "" : this.placeholder())
    );
    protected readonly effectiveDisabled = injectEffectiveDisabled(() => this.disabled());
    protected readonly expanded = computed(() => this.#dropdownService.popupRef() !== null);
    protected readonly footerTemplate = contentChild(DropdownFooterTemplateDirective, { read: TemplateRef });
    protected readonly groupHeaderTemplate = contentChild(DropdownGroupHeaderTemplateDirective, {
        read: TemplateRef
    });
    protected readonly headerTemplate = contentChild(DropdownHeaderTemplateDirective, { read: TemplateRef });
    protected readonly indicatorClass = computed(() => {
        const size = this.size();
        return multiSelectIndicatorContainerThemeVariants({ size });
    });
    protected readonly invalidState = computed(
        () =>
            this.touched() &&
            (this.invalid() || (this.required() && none((this.value() as Iterable<TValue> | null) ?? [])))
    );
    protected readonly itemContainerClass = computed(() => {
        const rounded = this.rounded();
        return multiSelectItemContainerThemeVariants({ rounded });
    });
    protected readonly itemTemplate = contentChild(DropdownItemTemplateDirective, { read: TemplateRef });
    protected readonly labelledBy = this.#label.labelledBy;
    protected readonly listId = createElementControlId();
    protected readonly listPopupClass = computed(() => {
        const rounded = this.rounded();
        const size = this.size();
        const userClass = this.popupClass();
        const variantClass = dropdownPopupThemeVariants({ rounded, size });
        // With a popupHeight, the overlay sets the limit; the default max-h-64 would cut a taller popup short.
        const heightClass = this.popupHeight() ? "max-h-none" : "";
        const sheetClass = this.sheet() ? dropdownSheetSurfaceClasses : "";
        return twMerge(variantClass, heightClass, sheetClass, userClass);
    });
    /** The list's size: large in a bottom sheet, for touch. */
    protected readonly listSize = computed(() => (this.sheet() ? "large" : this.size()));
    protected readonly messages = this.#i18n.componentMessages("multiSelect", MULTI_SELECT_DEFAULT_MESSAGES);
    protected readonly noDataTemplate = contentChild(DropdownNoDataTemplateDirective, { read: TemplateRef });
    protected readonly popupTemplate = viewChild.required<TemplateRef<unknown>>("popupTemplate");
    protected readonly prefixTemplate = contentChild(DropdownPrefixTemplateDirective, { read: TemplateRef });
    protected readonly selectedDataItems = computed(() => {
        return this.selectedListItems()
            .select(i => i.data)
            .toImmutableSet();
    });
    protected readonly selectedListItems = computed(() => {
        return this.#listService.selectedListItems();
    });
    protected readonly sheet = this.#dropdownService.sheet.asReadonly();
    protected readonly summaryTagTemplate = this.#multiSelectService.summaryTagTemplate.asReadonly();
    protected readonly tagCount = this.#multiSelectService.tagCount.asReadonly();
    protected readonly tagTemplate = contentChild(MultiSelectTagTemplateDirective, { read: TemplateRef });
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
     * @description Opens the popup as a sheet along the bottom of the screen on a small screen (narrower than 640
     * pixels) with `"auto"`, so it's easy to reach with a thumb. With `"none"`, it always opens under the field.
     * @default "none"
     */
    public readonly adaptiveMode = input<AdaptiveMode>("none");

    /**
     * @description Title of the bottom sheet the popup opens as with `adaptiveMode="auto"`. When empty, the sheet
     * shows the field's name.
     * @default ""
     */
    public readonly adaptiveTitle = input("");

    /**
     * @description Lets people add values that aren't in {@link data}: Enter in the popup's filter box, on text that
     * matches no item, emits {@link valueAdd} with the text, and an item whose text it matches is selected instead.
     * Needs `monaDropDownFilterable`, whose filter box is where the text is typed.
     * @default false
     */
    public readonly allowCustomValue = input(false, { transform: booleanAttribute });

    /**
     * @description ID of an element that describes the multi select, such as help text or an error message.
     * @default ""
     */
    public readonly ariaDescribedBy = input("", { alias: "aria-describedby" });

    /**
     * @description Accessible name for the multi select. Describe what it represents.
     * Falls back to {@link placeholder} when neither this nor `aria-labelledby` is set.
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
    public readonly autoClose = input(false, { transform: booleanAttribute });

    /**
     * @description Renders a checkbox next to each item in the popup list to indicate its selected state.
     * @default false
     */
    public readonly checkboxes = input(false, { transform: booleanAttribute });

    /**
     * @description Emits when the popup is about to close. This event is preventable.
     */
    // eslint-disable-next-line @angular-eslint/no-output-native -- renaming the output would break existing (close) bindings
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
    public readonly disabled = input(false, { transform: booleanAttribute });

    /**
     * @description Marks the multi select as invalid. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly invalid = input(false, { transform: booleanAttribute });

    /**
     * @description A predicate function or the name of the field that determines whether an item is disabled.
     */
    public readonly itemDisabled = input<DropdownFieldPredicateType<TData>>();

    /**
     * @description Shows a loading indicator, in place of the clear button, and marks the field busy. It doesn't
     * block interaction: the field stays usable while data loads.
     * @default false
     */
    public readonly loading = input(false, { transform: booleanAttribute });

    /**
     * @description Emits when the popup is about to open. This event is preventable.
     */
    public readonly open = output<PreventableEvent>();

    /**
     * @description Emits after the popup is opened.
     */
    public readonly opened = output();

    /**
     * @description Text shown when nothing is selected. It also names the multi select when neither `aria-label`
     * nor `aria-labelledby` is set.
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
     * @description Sets the readonly state of the multi select component.
     * @default false
     */
    public readonly readonly = input(false, { transform: booleanAttribute });

    /**
     * @description Sets the required state of the multi select component.
     * @default false
     */
    public readonly required = input(false, { transform: booleanAttribute });

    /**
     * @description Sets the border radius of the multi select component.
     * @default "medium"
     */
    public readonly rounded = input<MultiSelectVariantProps["rounded"]>("medium");

    /**
     * @description Renders a button that clears all selected items when at least one item is selected.
     * @default false
     */
    public readonly showClearButton = input(false, { transform: booleanAttribute });

    /**
     * @description Starts the list with a "Select all" option, which selects every enabled item the filter leaves, or
     * deselects them when they're all selected. Its checkbox shows when only some are.
     * @default false
     */
    public readonly showSelectAll = input(false, { transform: booleanAttribute });

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
    public readonly textField = input<DropdownFieldSelectorType<TData, string>>();

    /**
     * @description Emitted when focus leaves the multi select. Moving between it, its chips, its clear button and its
     * popup doesn't count. The `FormField` directive listens to this to mark the field as touched.
     */
    public readonly touch = output<void>();

    /**
     * @description Sets the touched state of the multi select. When bound to a signal form field via `[formField]`,
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
     * @description Two-way bindable current selected values. Implements `FormValueControl<Iterable<TValue>>`,
     * enabling signal forms `[formField]` binding.
     * Object mode contains selected data items; primitive mode (see {@link valuePrimitive}) contains values
     * resolved through {@link valueField}. An empty selection is represented by an empty iterable/array.
     * @default []
     */
    public readonly value = model<Iterable<TValue>>([]);

    /**
     * @description Emitted with the trimmed text when Enter is pressed in the filter box on text that matches no item.
     * Only emitted when {@link allowCustomValue} is true. Add an item for it to {@link data} and to {@link value}; the
     * filter box is cleared for the next one.
     */
    public readonly valueAdd = output<string>();

    /**
     * @description Sets the value field of the multi select component.
     * It is used for stable item identity, matching externally supplied values, and primitive
     * value projection when {@link valuePrimitive} is enabled.
     * It can be null, string, or a function that takes an item and returns a value.
     * If null, the item itself will be used as the value representation.
     * Should resolve to a stable, unique scalar.
     * @default null
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
        afterNextRender({
            read: () => {
                this.initialize();
                this.setEventListeners();
                this.setSubscriptions();
                this.warnIfCustomValueHasNoFilter();
            }
        });
        effect(() => {
            const popupTemplate = this.popupTemplate();
            untracked(() => this.#dropdownService.popupTemplate.set(popupTemplate));
        });
        effect(() => {
            const valueField = this.valueField();
            const value = this.value();
            this.valuePrimitive();
            untracked(() => {
                this.#listService.setValueField(valueField ?? "");
                // NgModel writes null before its first value, and so does a reset form control. Both mean nothing
                // is selected.
                this.synchronizeSelection((value as Iterable<TValue> | null) ?? []);
            });
        });
        effect(() => {
            const checkboxVisible = this.checkboxes();
            untracked(() => this.#listService.setSelectableOptions({ checkboxes: checkboxVisible }));
        });
        effect(() => {
            const showSelectAll = this.showSelectAll();
            const label = this.messages().selectAll;
            untracked(() => {
                this.#listService.selectAllEnabled.set(showSelectAll);
                this.#listService.selectAllLabel.set(label);
            });
        });
        // Custom values are typed in the popup's filter box, which the host never sees the keys of.
        effect(onCleanup => {
            const popupElement = this.#popupRef()?.overlayRef.overlayElement;
            if (popupElement == null) {
                return;
            }
            this.#navigatedByArrows = false;
            const onKeydown = (event: KeyboardEvent): void => this.handlePopupKeydown(event);
            const onInput = (): void => {
                this.#navigatedByArrows = false;
            };
            // Capture, so Enter on custom text is handled before the list selects the highlighted item with it.
            popupElement.addEventListener("keydown", onKeydown, true);
            popupElement.addEventListener("input", onInput, true);
            onCleanup(() => {
                popupElement.removeEventListener("keydown", onKeydown, true);
                popupElement.removeEventListener("input", onInput, true);
            });
        });
    }

    /**
     * @description Moves focus to the multi select.
     * @param options Passed to `HTMLElement.focus()`, for example `{ preventScroll: true }`.
     */
    public focus(options?: FocusOptions): void {
        this.#hostElementRef.nativeElement.focus(options);
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
        this.touch.emit();
    }

    protected onItemSelect(): void {
        this.updateValue(this.getSelectedControlValues());
        if (this.autoClose()) {
            this.#popupRef()?.close();
        }
    }

    protected onPopupPointerDown(event: PointerEvent): void {
        const target = event.target as HTMLElement | null;
        if (target?.tagName !== "INPUT") {
            event.preventDefault();
        }
    }

    protected onSelectedItemGroupRemove(event: Event): void {
        event.stopImmediatePropagation();
        if (this.readonly() || this.effectiveDisabled()) {
            return;
        }
        const selectedItemCount = this.selectedListItems().size();
        const removedItems = this.selectedListItems()
            .takeLast(selectedItemCount - this.visibleTagCount())
            .toArray();
        this.#listService.deselectItems(removedItems);
        this.updateValue(this.getSelectedControlValues());
        this.focus();
    }

    protected onSelectedItemRemove(event: Event, listItem: ListItem<TData>): void {
        event.stopImmediatePropagation();
        if (this.readonly() || this.effectiveDisabled()) {
            return;
        }
        this.#listService.deselectItems([listItem]);
        this.updateValue(this.getSelectedControlValues());
        this.focus();
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
        this.updateValue([]);
        this.#listService.clearSelections();
        this.focus();
    }

    private addCustomValue(input: HTMLInputElement, text: string): void {
        const caseSensitive = this.#listService.filterableOptions().caseSensitive;
        const match = this.#listService.getMatchingFilteredItem(text);
        const matchText = match ? this.#listService.getItemText(match) : null;
        const exact =
            matchText != null && (caseSensitive ? matchText === text : matchText.toLowerCase() === text.toLowerCase());
        if (match && exact) {
            if (!this.#listService.isSelected(match)) {
                this.#listService.selectItem(match);
                this.updateValue(this.getSelectedControlValues());
            }
        } else {
            this.valueAdd.emit(text);
        }
        // Clearing it the way typing does tells a filterChange listener too.
        input.value = "";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        if (this.autoClose()) {
            this.#popupRef()?.close();
        }
    }

    private getSelectedControlValues(): TValue[] {
        return this.selectedListItems()
            .select(item => {
                const value = this.valuePrimitive() ? this.#listService.getDataItemValue(item.data) : item.data;

                return value as TValue;
            })
            .toArray();
    }

    private handleEnterKey(): void {
        if (!this.#popupRef()) {
            this.#dropdownService.triggerPopupOpen$.next({});
            return;
        }
        this.toggleHighlightedItem();
    }

    /**
     * Enter in the filter box. With custom values, it adds the typed text: the item it names is selected, or `valueAdd`
     * offers it. An item reached with the arrow keys is left to the list, which toggles it. With nothing highlighted,
     * the list would toggle the first selected item, so Enter does nothing then.
     */
    private handlePopupKeydown(event: KeyboardEvent): void {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            this.#navigatedByArrows = true;
            return;
        }
        const input = event.target;
        if (
            event.key !== "Enter" ||
            event.isComposing ||
            event.keyCode === 229 ||
            !(input instanceof HTMLInputElement)
        ) {
            return;
        }
        const text = input.value.trim();
        const highlightedItem = this.#listService.highlightedItem();
        if (this.allowCustomValue() && text !== "" && !(this.#navigatedByArrows && highlightedItem != null)) {
            event.preventDefault();
            event.stopPropagation();
            this.addCustomValue(input, text);
            return;
        }
        if (highlightedItem == null) {
            event.preventDefault();
            event.stopPropagation();
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
                this.updateValue(this.getSelectedControlValues());
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

    private setPopupCloseSubscription(): void {
        this.#dropdownService.popupCloseComplete$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => {
            if (!this.#dropdownService.focusCanReturn() && !this.#destroyRef.destroyed) {
                // Focus left from inside the popup (its filter box), so the host never saw a focusout.
                this.touch.emit();
            }
        });
    }

    private setSpaceKeySubscription(): void {
        // While the popup is open, Space toggles the highlighted option, as Enter does. While it is closed, the shared
        // handler opens the popup.
        this.#dropdownService.beforeKeydown$
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                filter(e => e.originalEvent?.key === " " && this.#popupRef() != null)
            )
            .subscribe(event => {
                event.preventDefault();
                event.originalEvent?.preventDefault();
                this.toggleHighlightedItem();
            });
    }

    private setSubscriptions(): void {
        this.setBackspaceKeySubscription();
        this.setEnterKeySubscription();
        this.setPopupCloseSubscription();
        this.setSpaceKeySubscription();
    }

    private synchronizeSelection(value: Iterable<TValue>): void {
        if (this.valuePrimitive()) {
            this.#listService.setSelectedKeys(value);
        } else {
            this.#listService.setSelectedDataItems(value as unknown as Iterable<TData>);
        }
    }

    private toggleHighlightedItem(): void {
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
        this.updateValue(this.getSelectedControlValues());
        if (this.autoClose()) {
            this.#popupRef()?.close();
        }
    }

    private updateValue(value: Iterable<TValue>): void {
        this.value.set(value);
    }

    private warnIfCustomValueHasNoFilter(): void {
        if (isDevMode() && this.allowCustomValue() && !this.#listService.filterableOptions().enabled) {
            console.warn(
                "[Mona MultiSelect] allowCustomValue needs monaDropDownFilterable: custom values are typed in its filter box.",
                this.#hostElementRef.nativeElement
            );
        }
    }
}
