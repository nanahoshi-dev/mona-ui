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
    InputSignal,
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
import { Predicate, Selector } from "@mirei/ts-collections";
import { ChevronDown, LucideAngularModule, X } from "lucide-angular";
import {
    debounceTime,
    distinctUntilChanged,
    filter,
    fromEvent,
    map,
    Observable,
    of,
    Subject,
    take,
    takeUntil,
    tap,
    withLatestFrom
} from "rxjs";
import { twMerge } from "tailwind-merge";
import { FilterChangeEvent } from "../../../../common/filter-input/models/FilterChangeEvent";
import { ListComponent } from "../../../../common/list/components/list/list.component";
import { ListFooterTemplateDirective } from "../../../../common/list/directives/list-footer-template.directive";
import { ListGroupHeaderTemplateDirective } from "../../../../common/list/directives/list-group-header-template.directive";
import { ListHeaderTemplateDirective } from "../../../../common/list/directives/list-header-template.directive";
import { ListItemTemplateDirective } from "../../../../common/list/directives/list-item-template.directive";
import { ListNoDataTemplateDirective } from "../../../../common/list/directives/list-no-data-template.directive";
import { SelectableOptions } from "../../../../common/list/models/SelectableOptions";
import { SelectionChangeEvent } from "../../../../common/list/models/SelectionChangeEvent";
import { ListService } from "../../../../common/list/services/list.service";
import { LoadingIndicatorComponent } from "../../../../common/loading-indicator/components/loading-indicator/loading-indicator.component";
import { TextBoxDirective } from "../../../../inputs/text-box/directives/text-box.directive";
import { PopupCloseEvent } from "../../../../popup/models/PopupCloseEvent";
import { PopupRef } from "../../../../popup/models/PopupRef";
import { PopupService } from "../../../../popup/services/popup.service";
import { ThemeService } from "../../../../theme/services/theme.service";
import { Action } from "../../../../utils/Action";
import { createElementControlId } from "../../../../utils/createElementControlId";
import { dropdownPopupHideAnimation, dropdownPopupShowAnimation } from "../../../animations/dropdown.animation";
import { DropDownFooterTemplateDirective } from "../../../directives/drop-down-footer-template.directive";
import { DropDownGroupHeaderTemplateDirective } from "../../../directives/drop-down-group-header-template.directive";
import { DropDownHeaderTemplateDirective } from "../../../directives/drop-down-header-template.directive";
import { DropDownItemTemplateDirective } from "../../../directives/drop-down-item-template.directive";
import { DropDownNoDataTemplateDirective } from "../../../directives/drop-down-no-data-template.directive";
import { DropdownPrefixTemplateDirective } from "../../../directives/dropdown-prefix-template.directive";
import { DropDownService } from "../../../services/drop-down.service";
import { dropdownPopupVariants } from "../../../styles/dropdown.style";
import {
    comboBoxAffixContainerThemeVariants,
    comboBoxBaseThemeVariants,
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
    host: {
        "[attr.aria-disabled]": "disabled() ? true : undefined",
        "[attr.aria-haspopup]": "true",
        "[attr.aria-readonly]": "readonly() ? true : undefined",
        "[attr.aria-required]": "required() ? true : undefined",
        "[attr.data-disabled]": "disabled()",
        "[attr.tabindex]": "disabled() ? -1 : 0",
        "[class]": "baseClass()"
    }
})
export class ComboBoxComponent<TData = unknown> implements ControlValueAccessor, ComboBoxVariantInput {
    readonly #destroyRef = inject(DestroyRef);
    readonly #hostElementRef = inject(ElementRef);
    readonly #listService = inject(ListService);
    readonly #navigatedValue = linkedSignal(() => this.#value());
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
    protected readonly comboBoxValue = signal("");
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
    protected readonly listId = createElementControlId();
    protected readonly noDataTemplate = contentChild(DropDownNoDataTemplateDirective, { read: TemplateRef });
    protected readonly popupClasses = computed(() => {
        return twMerge(dropdownPopupVariants());
    });
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

    public readonly data = input<Iterable<TData>>([]);
    public readonly disabled = model(false);
    public readonly itemDisabled = input<string | Predicate<TData> | null | undefined>("");

    /**
     * @description Sets the loading state of the autocomplete component.
     * @default false
     */
    public readonly loading = input(false);

    public readonly placeholder = input("");

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
    public readonly textField = input<string | Selector<TData, string> | null | undefined>("");
    public readonly userClass = input<string>("", { alias: "class" });
    public readonly valueField = input<string | Selector<TData, any> | null | undefined>("");
    public readonly valueNormalizer: InputSignal<Action<Observable<string>, Observable<any>>> = input(
        (text$: Observable<string>) => text$.pipe(map(value => value))
    );

    public constructor() {
        effect(() => {
            const itemDisabled = this.itemDisabled();
            untracked(() => this.#listService.setDisabledBy(itemDisabled ?? ""));
        });
        effect(() => {
            const textField = this.textField();
            untracked(() => this.#listService.setTextField(textField ?? ""));
        });
        effect(() => {
            const valueField = this.valueField();
            untracked(() => {
                this.#listService.setValueField(valueField ?? "");
                if (this.#value != null) {
                    this.#listService.setSelectedDataItems([this.#value]);
                }
            });
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
        fromEvent(this.#hostElementRef.nativeElement, "focusin")
            .pipe(
                takeUntilDestroyed(),
                filter(() => !this.readonly())
            )
            .subscribe(() => this.focus());
    }

    public onItemSelect(event: SelectionChangeEvent<TData>): void {
        this.closePopup();
    }

    public onKeydown(event: KeyboardEvent): void {
        if (event.key === "Enter") {
            this.handleEnterKey();
        } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            this.handleArrowKeys(event);
        } else if (event.key === "Tab") {
            this.closePopup();
        } else if (event.key === "Escape") {
            this.handleEscapeKey();
        }
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
        this.updateValue(obj);
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
        event.stopImmediatePropagation();
        this.updateValue(null);
        this.#listService.clearSelections();
        this.comboBoxValue.set("");
        this.#propagateChange?.(null);
        this.focus();
    }

    protected openPopup(): void {
        this.focus();
        if (this.#popupRef()) {
            return;
        }
        const popupRef = this.#popupService.create({
            anchor: this.#hostElementRef.nativeElement,
            anchorConnectionPoint: "bottomleft",
            animation: {
                hide: dropdownPopupHideAnimation,
                show: dropdownPopupShowAnimation
            },
            closeOnOutsideClick: true,
            content: this.popupTemplate(),
            hasBackdrop: false,
            offset: { horizontal: 0, vertical: 4 },
            popupConnectionPoint: "topleft",
            width: this.#hostElementRef.nativeElement.getBoundingClientRect().width
        });
        this.#popupRef.set(popupRef);
        this.notifyValueChangeOnPopupClose();
        window.setTimeout(() => {
            const input = this.#hostElementRef.nativeElement.querySelector("input");
            if (input) {
                input.focus();
                input.setSelectionRange(-1, -1);
            }
        });
        this.setPopupCloseSubscriptions(popupRef);
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

    private handleArrowKeys(event: KeyboardEvent): void {
        if (event.altKey) {
            if (event.key === "ArrowDown") {
                this.openPopup();
            } else {
                this.closePopup();
            }
            return;
        }
        const previousItem = this.selectedListItem();
        const direction = event.key === "ArrowDown" ? "next" : "previous";
        const listItem = this.#listService.navigate(direction, "select", false);
        if (!listItem || previousItem === listItem) {
            return;
        }
        if (!this.expanded()) {
            this.updateValue(listItem.data);
        } else {
            this.#navigatedValue.set(listItem.data);
        }
    }

    private handleCustomValue(): void {
        this.valueNormalizer()(of(this.comboBoxValue()))
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

    private handleEnterKey(): void {
        if (this.#navigatedValue() && this.expanded() && this.#navigatedValue() !== this.#value()) {
            this.updateValue(this.#navigatedValue());
            this.closePopup();
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
                this.handleCustomValue();
            } else {
                this.comboBoxValue.set("");
            }
        } else if (this.allowCustomValue()) {
            this.handleCustomValue();
        } else {
            this.comboBoxValue.set("");
        }
        this.closePopup();
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

    private notifyValueChange(): void {
        this.#propagateChange?.(this.#value());
    }

    private notifyValueChangeOnPopupClose(): void {
        const popupRef = this.#popupRef();
        if (!popupRef) {
            return;
        }
        popupRef.closed
            .pipe(
                take(1),
                withLatestFrom(
                    this.#listService.selectionChange$.pipe(distinctUntilChanged((s1, s2) => s1.data === s2.data))
                )
            )
            .subscribe(() => {
                this.notifyValueChange();
            });
    }

    private setEventListeners(): void {
        fromEvent<MouseEvent>(this.#hostElementRef.nativeElement, "click")
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                filter(event => !this.readonly() && !(event.target instanceof HTMLInputElement))
            )
            .subscribe(() => this.togglePopup());
    }

    private setPopupCloseSubscriptions(popupRef: PopupRef): void {
        popupRef.beforeClose.pipe(takeUntil(popupRef.closed)).subscribe(event => {
            this.close.emit(event);
        });
        popupRef.closed.pipe(take(1)).subscribe(() => {
            this.#popupRef.set(null);
            this.#navigatedValue.set(null);
            this.#listService.clearFilter();
            window.setTimeout(() => this.focus());
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
                        this.openPopup();
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
                    .firstOrDefault(i => {
                        return this.#listService.getItemText(i).toLowerCase().includes(value.toLowerCase());
                    });
                if (item) {
                    this.#listService.clearSelections();
                    this.#listService.highlightedItem.set(item);
                    this.#listService.scrollToItem$.next({ item, focus: false });
                }
                this.comboBoxValue.set(value);
            });
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

    private updateValue(value: TData | null, notify: boolean = true) {
        const oldValue = this.#value;
        this.#value.set(value);
        this.comboBoxValue.set(this.valueText());
        if (notify && oldValue !== value) {
            this.#propagateChange?.(value);
        }
    }
}
