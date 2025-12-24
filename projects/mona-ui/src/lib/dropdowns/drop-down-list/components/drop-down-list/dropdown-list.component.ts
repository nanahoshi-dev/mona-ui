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
import { distinctUntilChanged, filter, fromEvent, take, takeUntil, tap, withLatestFrom } from "rxjs";
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
import { LoadingIndicatorComponent } from "../../../../common/loading-indicator/components/loading-indicator/loading-indicator.component";
import { PopupCloseEvent } from "../../../../popup/models/PopupCloseEvent";
import { PopupRef } from "../../../../popup/models/PopupRef";
import { PopupService } from "../../../../popup/services/popup.service";
import { ThemeService } from "../../../../theme/services/theme.service";
import { Action } from "../../../../utils/Action";
import { createElementControlId } from "../../../../utils/createElementControlId";
import { PreventableEvent } from "../../../../utils/PreventableEvent";
import { dropdownPopupHideAnimation, dropdownPopupShowAnimation } from "../../../animations/dropdown.animation";
import { DropDownFooterTemplateDirective } from "../../../directives/drop-down-footer-template.directive";
import { DropDownGroupHeaderTemplateDirective } from "../../../directives/drop-down-group-header-template.directive";
import { DropDownHeaderTemplateDirective } from "../../../directives/drop-down-header-template.directive";
import { DropDownItemTemplateDirective } from "../../../directives/drop-down-item-template.directive";
import { DropDownNoDataTemplateDirective } from "../../../directives/drop-down-no-data-template.directive";
import { DropdownPrefixTemplateDirective } from "../../../directives/dropdown-prefix-template.directive";
import { DropdownFieldPredicateType, DropdownFieldSelectionType } from "../../../models/DropdownFieldTypes";
import { DropDownListValueTemplateDirective } from "../../directives/drop-down-list-value-template.directive";
import {
    dropdownListAffixContainerThemeVariants,
    dropdownListInputThemeVariants,
    dropdownListPopupThemeVariants,
    dropdownListValueContainerThemeVariants,
    DropDownListVariantInput,
    DropDownListVariantProps
} from "../../styles/dropdown-list.styles";

@Component({
    selector: "mona-drop-down-list",
    templateUrl: "./dropdown-list.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        ListService,
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DropdownListComponent),
            multi: true
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
        LoadingIndicatorComponent
    ],
    host: {
        "[attr.aria-activedescendant]": "activeDescendant()",
        "[attr.aria-busy]": "loading() ? 'true' : undefined",
        "[attr.aria-controls]": "listId",
        "[attr.aria-disabled]": "disabled() ? true : undefined",
        "[attr.aria-expanded]": "expanded()",
        "[attr.aria-haspopup]": "'listbox'",
        "[attr.data-disabled]": "disabled()",
        "[attr.data-expanded]": "expanded()",
        "[attr.tabindex]": "disabled() ? null : 0",
        "[class]": "baseClass()",
        "[attr.role]": "'combobox'",
        "(blur)": "onBlur()"
    }
})
export class DropdownListComponent<TData = unknown> implements ControlValueAccessor, DropDownListVariantInput {
    readonly #destroyRef = inject(DestroyRef);
    readonly #hostElementRef = inject(ElementRef<HTMLElement>);
    readonly #navigatedValue = linkedSignal(() => this.#value());
    readonly #listService = inject(ListService<TData>);
    readonly #popupRef = signal<PopupRef | null>(null);
    readonly #popupService = inject(PopupService);
    readonly #themeService = inject(ThemeService);
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
    protected readonly expanded = computed(() => this.#popupRef() !== null);
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
        const variantClass = dropdownListPopupThemeVariants(theme)({ rounded, size });
        return twMerge(variantClass, userClass);
    });
    protected readonly listPopupHeight = computed(() => {
        const empty = this.isEmpty();
        const popupHeight = this.popupHeight();
        if (popupHeight != null) {
            return popupHeight;
        }
        return empty ? 200 : undefined;
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
    protected readonly selectedKeysChange = output<any[]>();
    protected readonly selectedListItem = computed(() => {
        return this.#listService.selectedListItems().firstOrDefault();
    });
    protected readonly valueContainerClass = computed(() => {
        const theme = this.#themeService.theme();
        return dropdownListValueContainerThemeVariants(theme)();
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
     * @description Emits when the popup is about to close. This event is preventable.
     */
    public readonly close = output<PopupCloseEvent>();

    /**
     * @description The data items of the dropdown list.
     */
    public readonly data = input<Iterable<TData>>([]);

    /**
     * @description Sets the disabled state of the dropdown list.
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
     * @default null
     */
    public readonly popupHeight = input<ListSizeInputType>(null);

    /**
     * @description Sets the width of the popup element.
     * @default null
     */
    public readonly popupWidth = input<ListSizeInputType>(null);

    /**
     * @description Sets the rounded appearance of the dropdown list.
     */
    public readonly rounded = input<DropDownListVariantProps["rounded"]>("medium");

    /**
     * @description Whether to show the clear button when an item is selected.
     */
    public readonly showClearButton = input(false);

    /**
     * @description The size of the dropdown list.
     */
    public readonly size = input<DropDownListVariantProps["size"]>("medium");

    /**
     * @description The text field name of the data item.
     */
    public readonly textField = input<DropdownFieldSelectionType<TData>>();
    public readonly userClass = input<string>("", { alias: "class" });

    /**
     * @description The value field name of the data item.
     */
    public readonly valueField = input<DropdownFieldSelectionType<TData>>();

    public constructor() {
        effect(() => {
            const textField = this.textField() ?? "";
            untracked(() => this.#listService.setTextField(textField));
        });
        effect(() => {
            const valueField = this.valueField() ?? "";
            untracked(() => {
                this.#listService.setValueField(valueField);
                const value = this.#value();
                if (value != null) {
                    this.#listService.setSelectedDataItems([value]);
                }
            });
        });
        effect(() => {
            const itemDisabled = this.itemDisabled() ?? "";
            untracked(() => this.#listService.setDisabledBy(itemDisabled));
        });
        effect(() => {
            const data = this.data();
            untracked(() => this.#listService.setData(data));
        });
        afterNextRender({
            read: () => {
                this.initialize();
                this.setEventListeners();
                this.setSubscriptions();
            }
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
        this.updateValue(event.item.data, true);
        if (event.source.via === "mouse" || event.source.key === "Enter" || event.source.key === "NumpadEnter") {
            this.closePopup();
        }
    }

    protected onValueClear(event: MouseEvent): void {
        event.stopImmediatePropagation();
        this.updateValue(null);
        this.#listService.clearSelections();
    }

    protected openPopup(): void {
        this.focus();
        if (this.#popupRef()) {
            return;
        }
        const event = this.notifyPopupOpen();
        if (event.isDefaultPrevented()) {
            return;
        }
        const width = this.popupWidth() ?? this.#hostElementRef.nativeElement.getBoundingClientRect().width;
        const popupRef = this.#popupService.create({
            anchor: this.#hostElementRef.nativeElement,
            anchorConnectionPoint: "bottomleft",
            animation: {
                hide: dropdownPopupHideAnimation,
                show: dropdownPopupShowAnimation
            },
            closeOnOutsideClick: true,
            withScrollTracking: true,
            closeOnScroll: false,
            content: this.popupTemplate(),
            hasBackdrop: false,
            offset: { horizontal: 0, vertical: 4 },
            popupConnectionPoint: "topleft",
            width,
            withPush: false
        });
        this.#popupRef.set(popupRef);
        this.notifyValueChangeOnPopupClose();
        this.scrollToSelectedItem();
        popupRef.beforeClose.pipe(takeUntil(popupRef.closed)).subscribe(event => {
            this.close.emit(event);
        });
        popupRef.closed.pipe(take(1)).subscribe(() => {
            this.#popupRef.set(null);
            this.#listService.clearFilter();
        });
    }

    private closePopup(): void {
        this.#popupRef()?.close();
    }

    private focus(): void {
        this.#hostElementRef.nativeElement?.focus();
    }

    private handleArrowKeys(event: KeyboardEvent): void {
        const previousItem = this.selectedListItem();
        const direction = event.key === "ArrowDown" ? "next" : "previous";
        const item = this.#listService.navigate(direction, "select", false);
        if (!item || previousItem === item) {
            return;
        }
        if (!this.expanded()) {
            this.updateValue(item.data, true);
        } else {
            this.#navigatedValue.set(item.data);
        }
    }

    private handleEnterKey(): void {
        if (this.expanded() && this.#value() !== this.#navigatedValue()) {
            this.updateValue(this.#navigatedValue(), true);
        }
        this.togglePopup();
    }

    private handleKeyDown(event: KeyboardEvent): void {
        if (event.key === "Enter") {
            event.preventDefault();
            this.handleEnterKey();
        } else if (
            event.key === "ArrowDown" ||
            event.key === "ArrowUp" ||
            event.key === "Home" ||
            event.key === "End"
        ) {
            event.preventDefault();
            this.handleArrowKeys(event);
        } else if (event.key === "Escape" || event.key === "Tab") {
            this.closePopup();
        }
    }

    private initialize(): void {
        this.#listService.setNavigableOptions({ enabled: true, mode: "select" });
        this.#listService.setSelectableOptions(this.selectableOptions);
        this.#listService.selectedKeysChange = this.selectedKeysChange;
    }

    private notifyPopupOpen(): PreventableEvent {
        const event = new PreventableEvent("dropdownListPopupOpen");
        this.open.emit(event);
        return event;
    }

    private notifyValueChangeOnPopupClose(): void {
        const popupRef = this.#popupRef();
        if (!popupRef) {
            return;
        }
        const selectionChange$ = this.#listService.selectionChange$.pipe(
            distinctUntilChanged((s1, s2) => s1.data === s2.data)
        );
        popupRef.closed
            .pipe(
                take(1),
                withLatestFrom(selectionChange$),
                filter(() => this.#value() !== this.#navigatedValue()),
                tap(() => this.updateValue(this.#navigatedValue(), true))
            )
            .subscribe();
    }

    private scrollToSelectedItem(): void {
        const item = this.selectedListItem();
        if (!item) {
            return;
        }
        window.setTimeout(() => this.#listService.scrollToItem(item, false));
    }

    private setEventListeners(): void {
        fromEvent<KeyboardEvent>(this.#hostElementRef.nativeElement, "keydown")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(e => this.handleKeyDown(e));
        fromEvent<MouseEvent>(this.#hostElementRef.nativeElement, "click")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(() => this.togglePopup());
    }

    private setSubscriptions(): void {
        this.#listService.selectedKeysChange.subscribe(() => {
            const item = this.selectedDataItem();
            this.updateValue(item);
        });
    }

    private togglePopup(): void {
        if (this.#popupRef()) {
            this.closePopup();
            return;
        }
        this.openPopup();
    }

    private updateValue(value: TData | null, notify: boolean = true): void {
        const oldValue = this.#value();
        this.#value.set(value);
        if (notify && oldValue !== value) {
            this.#propagateChange?.(value);
        }
    }
}
