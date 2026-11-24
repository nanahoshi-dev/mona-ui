import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    booleanAttribute,
    Component,
    computed,
    contentChild,
    DestroyRef,
    DOCUMENT,
    effect,
    ElementRef,
    forwardRef,
    inject,
    Injector,
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
import type { PreventableEvent } from "@nanahoshi/mona-ui/common";
import {
    createElementControlId,
    FIELD_ASSOCIATION_BOUNDARY,
    injectEffectiveDisabled,
    injectLabelAssociation,
    rxTimeout
} from "@nanahoshi/mona-ui/internal";
import { FilterChangeEvent } from "@nanahoshi/mona-ui/common";
import { IndicatorIconComponent } from "@nanahoshi/mona-ui/internal/indicator-icon";
import {
    ListComponent,
    ListFooterTemplateDirective,
    ListGroupHeaderTemplateDirective,
    ListHeaderTemplateDirective,
    ListItemTemplateDirective,
    ListNoDataTemplateDirective,
    ListService,
    type ListSizeInputType,
    type SelectableOptions,
    type SelectionChangeEvent
} from "@nanahoshi/mona-ui/internal/list";
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
    dropdownSheetInputClasses,
    dropdownSheetInputContainerClasses,
    dropdownSheetSurfaceClasses,
    DropdownSuffixTemplateDirective,
    injectSmallScreen,
    matchesSmallScreen
} from "@nanahoshi/mona-ui/dropdowns";
import type { PopupCloseEvent } from "@nanahoshi/mona-ui/popup";
import { TextBoxDirective } from "@nanahoshi/mona-ui/text-box";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { debounceTime, filter, identity, Subject, take, tap } from "rxjs";
import { twMerge } from "tailwind-merge";
import { AUTO_COMPLETE_DEFAULT_MESSAGES } from "../i18n/auto-complete.default-messages";

import {
    autoCompleteAffixContainerThemeVariants,
    autoCompleteBaseThemeVariants,
    autoCompleteTextInputThemeVariants,
    type AutoCompleteVariantInput,
    type AutoCompleteVariantProps
} from "../styles/auto-complete.styles";

@Component({
    selector: "mona-auto-complete",
    templateUrl: "./auto-complete.component.html",
    hostDirectives: [DropdownDataHandlerDirective, DropdownListPopupHandlerDirective, DropdownLiveRegionDirective],
    providers: [
        ListService,
        DropdownService,
        {
            provide: DROPDOWN_DATA_INPUT_TOKEN,
            useExisting: forwardRef(() => AutoCompleteComponent),
            multi: false
        },
        {
            provide: DROPDOWN_POPUP_INPUT_TOKEN,
            useExisting: forwardRef(() => AutoCompleteComponent),
            multi: false
        }
    ],
    imports: [
        TextBoxDirective,
        NgTemplateOutlet,
        ListComponent,
        ListGroupHeaderTemplateDirective,
        ListFooterTemplateDirective,
        ListHeaderTemplateDirective,
        ListNoDataTemplateDirective,
        ListItemTemplateDirective,
        IndicatorIconComponent
    ],
    viewProviders: [...FIELD_ASSOCIATION_BOUNDARY],
    host: {
        // The host has no role: the inner input is the combobox and carries the name, description and state. A static
        // aria-* attribute written on <mona-auto-complete> would otherwise stay on the host as well.
        "[attr.aria-describedby]": "null",
        "[attr.aria-label]": "null",
        "[attr.aria-labelledby]": "null",
        "[attr.data-disabled]": "effectiveDisabled() || null",
        "[attr.data-invalid]": "invalidState() || null",
        "[attr.data-readonly]": "readonly() || null",
        "[attr.tabindex]": "-1",
        "[class]": "baseClass()",
        "(focusout)": "onFocusOut($event)"
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
    readonly #document = inject(DOCUMENT);
    readonly #dropdownService = inject(DropdownService);
    readonly #hostElementRef = inject(ElementRef<HTMLElement>);
    readonly #i18n = inject(MonaI18nService);
    readonly #injector = inject(Injector);
    readonly #label = injectLabelAssociation({
        ariaDescribedBy: () => this.ariaDescribedBy(),
        ariaLabel: () => this.ariaLabel(),
        ariaLabelledBy: () => this.ariaLabelledBy(),
        focus: () => this.focus()
    });
    readonly #listService = inject(ListService);
    readonly #popupRef = this.#dropdownService.popupRef;
    readonly #smallScreen = injectSmallScreen();
    /** Whether the popup is closing only because there are no options to show, which keeps the typed text coming. */
    #closingEmpty = false;
    /** Whether the popup that's closing is a bottom sheet, which took focus into its text box. */
    #closingSheet = false;
    /**
     * Whether text has been typed since the popup last closed for good, by Enter, Escape, a pick or leaving the field.
     * Without "No data", options that arrive while it is set open the popup.
     */
    #typing = false;

    protected readonly activeDescendant = computed(() => {
        const highlightedItem = this.#listService.highlightedItem();
        return highlightedItem ? highlightedItem.uid : null;
    });
    protected readonly affixClass = computed(() => {
        return autoCompleteAffixContainerThemeVariants();
    });
    protected readonly autoCompleteValue = linkedSignal(() => this.value() ?? "");
    protected readonly autoCompleteValue$ = new Subject<string | null>();
    protected readonly baseClass = computed(() => {
        const disabled = this.effectiveDisabled();
        const expanded = this.expanded();
        const focused = this.#popupRef() !== null;
        const invalid = this.invalidState();
        const rounded = this.rounded();
        const size = this.size();
        const variantClass = autoCompleteBaseThemeVariants({
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
    protected readonly clearButtonVisible = computed(
        () =>
            this.showClearButton() &&
            !!this.autoCompleteValue() &&
            !this.loading() &&
            !this.effectiveDisabled() &&
            !this.readonly()
    );
    protected readonly describedBy = this.#label.describedBy;
    protected readonly effectiveDisabled = injectEffectiveDisabled(() => this.disabled());
    protected readonly expanded = computed(() => this.#popupRef() !== null);
    protected readonly footerTemplate = contentChild(DropdownFooterTemplateDirective, { read: TemplateRef });
    protected readonly groupHeaderTemplate = contentChild(DropdownGroupHeaderTemplateDirective, {
        read: TemplateRef
    });
    protected readonly headerTemplate = contentChild(DropdownHeaderTemplateDirective, { read: TemplateRef });
    protected readonly inputClass = computed(() => {
        const rounded = this.rounded();
        return autoCompleteTextInputThemeVariants({ rounded });
    });
    /**
     * Where the popup opens as a bottom sheet, the field's input raises no on-screen keyboard: a press opens the sheet,
     * whose own text box takes the typing.
     */
    protected readonly inputMode = computed(() =>
        this.adaptiveMode() === "auto" && this.#smallScreen() ? "none" : null
    );
    protected readonly invalidState = computed(
        () => this.touched() && (this.invalid() || (this.required() && !this.value()))
    );
    protected readonly isEmpty = computed(() => !this.#listService.viewItems().any());
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
    protected readonly messages = this.#i18n.componentMessages("autoComplete", AUTO_COMPLETE_DEFAULT_MESSAGES);
    protected readonly noDataTemplate = contentChild(DropdownNoDataTemplateDirective, { read: TemplateRef });
    protected readonly popupTemplate = viewChild.required<TemplateRef<unknown>>("popupTemplate");
    protected readonly prefixTemplate = contentChild(DropdownPrefixTemplateDirective, { read: TemplateRef });
    protected readonly selectableOptions: SelectableOptions = {
        enabled: true,
        mode: "single",
        toggleable: false
    };
    protected readonly sheet = this.#dropdownService.sheet.asReadonly();
    protected readonly sheetInputClass = dropdownSheetInputClasses;
    protected readonly sheetInputContainerClass = dropdownSheetInputContainerClasses;
    protected readonly sheetTitleId = this.#dropdownService.sheetTitleId.asReadonly();
    protected readonly suffixTemplate = contentChild(DropdownSuffixTemplateDirective, { read: TemplateRef });

    /**
     * @description Opens the popup as a sheet along the bottom of the screen on a small screen (narrower than 640
     * pixels), with a text box of its own at the top, where the typing happens. A press on the field opens the sheet,
     * and the field raises no on-screen keyboard. `"none"` always opens the popup under the field.
     * @default "none"
     */
    public readonly adaptiveMode = input<AdaptiveMode>("none");

    /**
     * @description Title of the bottom sheet the popup opens as with `adaptiveMode="auto"`, which also names the
     * sheet's text box. When empty, the sheet shows the autocomplete's name, from its label or `aria-label`.
     * @default ""
     */
    public readonly adaptiveTitle = input("");

    /**
     * @description ID of an element that provides an extended description for the input.
     * Use this to associate error messages or help text with the input.
     * @default ""
     */
    public readonly ariaDescribedBy = input("", { alias: "aria-describedby" });

    /**
     * @description Accessible name for the input. Describe what the autocomplete represents. Prefer a visible label,
     * linked through {@link inputId} or `aria-labelledby`; without any of them, browsers fall back to the
     * {@link placeholder}.
     * @default ""
     */
    public readonly ariaLabel = input("", { alias: "aria-label" });

    /**
     * @description ID of an external element that provides the accessible name for the input.
     * @default ""
     */
    public readonly ariaLabelledBy = input("", { alias: "aria-labelledby" });

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
     * @description Collection of items to render.
     * @default []
     */
    public readonly data = input<Iterable<TData>>([]);

    /**
     * @description Renders the component with reduced visual emphasis and removes pointer interaction.
     * @default false
     */
    public readonly disabled = input(false, { transform: booleanAttribute });

    /**
     * @description Defines whether the first matching item should be highlighted while typing.
     * @default true
     */
    public readonly highlightFirst = input(true, { transform: booleanAttribute });

    /**
     * @description Id of the inner `<input>` element. Point a `<label for>` or `<mona-label for>` at it to label the
     * autocomplete. A unique id is generated when it isn't set.
     * @default generated
     */
    public readonly inputId = input(createElementControlId());

    /**
     * @description Marks the autocomplete as invalid. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly invalid = input(false, { transform: booleanAttribute });

    /**
     * @description Predicate or field name used to determine whether an individual item is disabled.
     * @default undefined
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
     * @description Maximum height of the popup, in pixels or as a CSS length. Shorter lists shrink to fit. When
     * unset, the popup is at most 200 pixels tall.
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
    public readonly readonly = input(false, { transform: booleanAttribute });

    /**
     * @description Marks the field as required for form validation.
     * @default false
     */
    public readonly required = input(false, { transform: booleanAttribute });

    /**
     * @description Border-radius preset applied to the component.
     * @default "medium"
     */
    public readonly rounded = input<AutoCompleteVariantProps["rounded"]>("medium");

    /**
     * @description Displays a button that clears the current value when clicked. Unlike the other dropdowns, this
     * defaults to `true`.
     * @default true
     */
    public readonly showClearButton = input(true, { transform: booleanAttribute });

    /**
     * @description Whether the popup opens to say there's no data when no option matches. When false, the popup stays
     * closed while there are no options: it opens as options arrive while text is typed, and closes when they run out,
     * as an address bar's suggestions do.
     * @default true
     */
    public readonly showNoData = input(true, { transform: booleanAttribute });

    /**
     * @description Size preset controlling the component's dimensions.
     * @default "medium"
     */
    public readonly size = input<AutoCompleteVariantProps["size"]>("medium");

    /**
     * @description Property name or accessor used to derive the display text from a data item.
     * If null, the item itself is used as the display text.
     * @default null
     */
    public readonly textField = input<DropdownFieldSelectorType<TData, string>>(null);

    /**
     * @description Emitted when focus leaves the autocomplete. Moving between its input, clear button and popup
     * doesn't count. The `FormField` directive listens to this to mark the field as touched.
     */
    public readonly touch = output<void>();

    /**
     * @description Sets the touched state of the autocomplete. When bound to a signal form field via `[formField]`,
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
     * @description Two-way bindable current autocomplete value. Implements `FormValueControl<string | null>`,
     * enabling signal forms `[formField]` binding.
     * @default null
     */
    public readonly value = model<string | null>(null);

    /**
     * @description Property name or accessor used to derive the value from a data item.
     * If null, the item itself is used as the value.
     * @default null
     */
    public readonly valueField = input<DropdownFieldSelectorType<TData, unknown>>(null);

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
        effect(() => {
            const empty = this.isEmpty();
            if (!this.showNoData()) {
                untracked(() => this.followOptions(empty));
            }
        });
    }

    /**
     * @description Moves focus to the inner input. The caret goes to the end of the text.
     * @param options Passed to `HTMLElement.focus()`, for example `{ preventScroll: true }`.
     */
    public focus(options?: FocusOptions): void {
        const input = this.#hostElementRef.nativeElement.querySelector("input");
        if (input) {
            input.focus(options);
            input.setSelectionRange(input.value.length, input.value.length);
        }
    }

    /**
     * @description Moves focus to the inner input and selects its text, so what is typed next replaces it.
     * @param options Passed to `HTMLElement.focus()`, for example `{ preventScroll: true }`.
     */
    public select(options?: FocusOptions): void {
        const input = this.#hostElementRef.nativeElement.querySelector("input");
        if (input) {
            input.focus(options);
            input.select();
        }
    }

    protected onFocusOut(event: FocusEvent): void {
        // Removing a focused dropdown from the page fires focusout after it is destroyed.
        if (this.#destroyRef.destroyed) {
            return;
        }
        const nextTarget = event.relatedTarget;
        if (nextTarget instanceof Node) {
            const popupElement = this.#popupRef()?.overlayRef.overlayElement;
            if (this.#hostElementRef.nativeElement.contains(nextTarget) || popupElement?.contains(nextTarget)) {
                return;
            }
        }
        this.#typing = false;
        if (this.value() !== this.autoCompleteValue() && !this.#popupRef()) {
            this.updateValue(this.autoCompleteValue());
        }
        this.touch.emit();
    }

    protected onInput(text: string): void {
        // Keep the signal in step with the input on every keystroke, so that writing the same text back still
        // reaches the DOM through the [value] binding.
        this.autoCompleteValue.set(text);
        this.autoCompleteValue$.next(text);
    }

    protected onInputClick(): void {
        // A press opens the bottom sheet, with its own text box, where the field raises no keyboard. The sheet opens with
        // the field's text, and with no text, the whole list.
        if (this.adaptiveMode() !== "auto" || this.#popupRef() || !matchesSmallScreen(this.#document)) {
            return;
        }
        const text = this.autoCompleteValue();
        if (text) {
            this.applyText(text);
        }
        if (!this.#popupRef()) {
            this.#dropdownService.triggerPopupOpen$.next({});
        }
    }

    protected onItemSelect(event: SelectionChangeEvent<TData>): void {
        this.#typing = false;
        const itemText = this.#listService.getItemText(event.item);
        this.updateValue(itemText);
        this.autoCompleteValue.set(itemText);
        this.closePopup();
        rxTimeout(this.#destroyRef, () => this.focus());
    }

    protected onPopupPointerDown(event: PointerEvent): void {
        const target = event.target as HTMLElement | null;
        if (target?.tagName !== "INPUT") {
            event.preventDefault();
        }
    }

    protected onSheetKeydown(event: KeyboardEvent): void {
        // Looked up now: the handler injects this component, so it can't be injected while this component is created.
        this.#injector.get(DropdownListPopupHandlerDirective).handleKeyDown(event);
    }

    protected onValueClear(event: MouseEvent | KeyboardEvent): void {
        if (
            this.effectiveDisabled() ||
            this.readonly() ||
            (event instanceof KeyboardEvent && event.key !== "Enter" && event.key !== " ")
        ) {
            return;
        }
        event.stopImmediatePropagation();
        this.clear(true);
        this.closePopup();
    }

    /**
     * Filters the list by the text and opens the popup, highlighting the first match. A prevented filter change leaves
     * the filtering to the app, whose options come as `data`. Without text, the popup closes, unless it's a bottom
     * sheet, whose text box is where the next text comes from: the sheet shows the whole list.
     */
    private applyText(value: string): void {
        if (this.#listService.isFilteringEnabled()) {
            const event = this.notifyFilterChange(value);
            if (value && !event.isDefaultPrevented()) {
                this.#listService.setFilter(value);
            }
        }

        if (!value) {
            this.#typing = false;
            const popupRef = this.#popupRef();
            if (popupRef && this.#dropdownService.sheet()) {
                this.clear(false);
            } else if (popupRef) {
                popupRef.closed.pipe(take(1)).subscribe(() => this.clear(false));
                this.closePopup();
            } else {
                // Deleting the text with the popup closed still has to reach the value on blur.
                this.clear(false);
            }
            return;
        }

        this.#typing = true;
        if (!this.#popupRef() && (this.showNoData() || !this.isEmpty())) {
            this.#dropdownService.triggerPopupOpen$.next({});
        }

        this.autoCompleteValue.set(value);
        this.highlightMatch(value);
    }

    private clear(notify: boolean): void {
        this.#typing = false;
        this.autoCompleteValue.set("");
        this.#listService.clearSelections();
        this.#listService.clearFilter();
        if (notify) {
            this.updateValue(null);
        }
    }

    private closePopup(): void {
        // Drops typed text still waiting for the filter's debounce, which would otherwise come back after the close.
        this.autoCompleteValue$.next(null);
        this.#popupRef()?.close();
    }

    /**
     * Without "No data", the popup follows the options while text is typed: it opens as they arrive, with the typed
     * text's match highlighted, and closes when they run out. A bottom sheet stays, since its text box has the typing.
     */
    private followOptions(empty: boolean): void {
        const popupRef = this.#popupRef();
        if (this.#dropdownService.sheet()) {
            return;
        }
        if (empty) {
            if (popupRef) {
                this.#closingEmpty = true;
                popupRef.close();
            }
            return;
        }
        if (!popupRef && this.#typing && this.#hostElementRef.nativeElement.contains(this.#document.activeElement)) {
            this.#dropdownService.triggerPopupOpen$.next({});
            this.highlightMatch(this.autoCompleteValue());
        }
    }

    /** Highlights the first option that matches the text, when `highlightFirst` asks for it. */
    private highlightMatch(value: string): void {
        if (!this.highlightFirst()) {
            return;
        }
        const item = this.#listService.getMatchingFilteredItem(value);
        this.#listService.clearSelections();
        this.#listService.highlightedItem.set(item);
        if (item) {
            this.#listService.scrollToItem$.next({ item, focus: false });
        }
    }

    private initialize(): void {
        this.#listService.setNavigableOptions({ enabled: true, mode: "highlight" });
        this.#listService.setSelectableOptions(this.selectableOptions);
        this.#listService.filterInputVisible.set(false);
        this.#dropdownService.restoreFocus.set(false);
        this.#dropdownService.sheetFillsHeight.set(true);
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
                // Debounced before nulls are dropped, so that a null cancels text still waiting for the debounce.
                debounceDuration > 0 ? debounceTime(debounceDuration) : identity,
                filter((value): value is string => value !== null)
            )
            .subscribe((value: string) => this.applyText(value));
    }

    private setEnterKeySubscription(): void {
        this.#dropdownService.beforeKeydown$
            .pipe(
                filter(e => e.originalEvent?.key === "Enter"),
                takeUntilDestroyed(this.#destroyRef),
                tap(e => e.preventDefault())
            )
            .subscribe(() => {
                this.#typing = false;
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
                tap(e => e.preventDefault())
            )
            .subscribe(event => {
                this.#typing = false;
                if (this.#popupRef()) {
                    this.closePopup();
                    return;
                }
                if (this.autoCompleteValue()) {
                    // This Escape was used to clear the text; a dialog or window around the field waits for the next.
                    event.originalEvent?.stopPropagation();
                    this.clear(false);
                }
            });
    }

    private setPopupCloseSubscriptions(): void {
        this.#dropdownService.popupCloseStart$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => {
            this.#closingSheet = this.#dropdownService.sheet();
        });
        this.#dropdownService.popupCloseComplete$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => {
            if (this.#closingEmpty) {
                this.#closingEmpty = false;
            } else {
                this.autoCompleteValue$.next(null);
            }
            // The popup under the field leaves focus on it, but a sheet took it into its text box, so it comes back.
            if (this.#closingSheet && this.#dropdownService.focusCanReturn()) {
                this.focus();
            }
            this.#closingSheet = false;
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

    private setSubscriptions(): void {
        this.setAutoCompleteValueChangeSubscription();
        this.setArrowKeyNavigationSubscription();
        this.setEnterKeySubscription();
        this.setEscapeKeySubscription();
        this.setPopupCloseSubscriptions();
        this.setSpaceKeySubscription();
    }

    private updateValue(value: string | null): void {
        const nextValue = value || null;
        if (this.value() !== nextValue) {
            this.value.set(nextValue);
        }
    }
}
