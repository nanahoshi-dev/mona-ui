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
    signal,
    TemplateRef,
    untracked,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from "@angular/forms";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { LucideAngularModule, X } from "lucide-angular";
import { debounceTime, Subject, take, tap } from "rxjs";
import { twMerge } from "tailwind-merge";
import { ButtonDirective } from "../../../buttons/button/directives/button.directive";
import { FilterChangeEvent } from "../../../common/filter-input/models/FilterChangeEvent";
import { ListComponent } from "../../../common/list/components/list/list.component";
import { ListFooterTemplateDirective } from "../../../common/list/directives/list-footer-template.directive";
import { ListGroupHeaderTemplateDirective } from "../../../common/list/directives/list-group-header-template.directive";
import { ListHeaderTemplateDirective } from "../../../common/list/directives/list-header-template.directive";
import { ListItemTemplateDirective } from "../../../common/list/directives/list-item-template.directive";
import { ListNoDataTemplateDirective } from "../../../common/list/directives/list-no-data-template.directive";
import { ListItem } from "../../../common/list/models/ListItem";
import { ListSizeInputType } from "../../../common/list/models/ListSizeType";
import { SelectableOptions } from "../../../common/list/models/SelectableOptions";
import { SelectionChangeEvent } from "../../../common/list/models/SelectionChangeEvent";
import { ListService } from "../../../common/list/services/list.service";
import { LoadingIndicatorComponent } from "../../../common/loading-indicator/components/loading-indicator/loading-indicator.component";
import { TextBoxDirective } from "../../../inputs/text-box/directives/text-box.directive";
import { PopupRef } from "../../../popup/models/PopupRef";
import { PopupService } from "../../../popup/services/popup.service";
import { ThemeService } from "../../../theme/services/theme.service";
import { Action } from "../../../utils/Action";
import { createElementControlId } from "../../../utils/createElementControlId";
import { dropdownPopupHideAnimation, dropdownPopupShowAnimation } from "../../animations/dropdown.animation";
import { DropDownFooterTemplateDirective } from "../../directives/drop-down-footer-template.directive";
import { DropDownGroupHeaderTemplateDirective } from "../../directives/drop-down-group-header-template.directive";
import { DropDownHeaderTemplateDirective } from "../../directives/drop-down-header-template.directive";
import { DropDownItemTemplateDirective } from "../../directives/drop-down-item-template.directive";
import { DropDownNoDataTemplateDirective } from "../../directives/drop-down-no-data-template.directive";
import { DropdownPrefixTemplateDirective } from "../../directives/dropdown-prefix-template.directive";
import { DropdownSuffixTemplateDirective } from "../../directives/dropdown-suffix-template.directive";
import { DropdownFieldPredicateType, DropdownFieldSelectionType } from "../../models/DropdownFieldTypes";
import {
    autoCompleteAffixContainerThemeVariants,
    autoCompleteBaseThemeVariants,
    autoCompletePopupThemeVariants,
    autoCompleteTextInputThemeVariants,
    AutoCompleteVariantInput,
    AutoCompleteVariantProps
} from "../styles/auto-complete.styles";

@Component({
    selector: "mona-auto-complete",
    templateUrl: "./auto-complete.component.html",
    providers: [
        ListService,
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => AutoCompleteComponent),
            multi: true
        }
    ],
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
        ButtonDirective,
        LucideAngularModule,
        LoadingIndicatorComponent
    ],
    host: {
        "[attr.aria-disabled]": "disabled() ? true : undefined",
        "[attr.aria-haspopup]": "true",
        "[attr.data-disabled]": "disabled()",
        "[attr.tabindex]": "-1",
        "[class]": "baseClass()"
    }
})
export class AutoCompleteComponent<TData = unknown> implements ControlValueAccessor, AutoCompleteVariantInput {
    readonly #destroyRef = inject(DestroyRef);
    readonly #hostElementRef = inject(ElementRef<HTMLElement>);
    readonly #listService = inject(ListService);
    readonly #popupRef = signal<PopupRef | null>(null);
    readonly #popupService = inject(PopupService);
    readonly #themeService = inject(ThemeService);
    readonly #value = signal("");
    #propagateChange: Action<string | null> | null = null;
    #propagateTouch: Action | null = null;

    protected readonly activeDescendant = computed(() => {
        const highlightedItem = this.#listService.highlightedItem();
        return highlightedItem ? highlightedItem.uid : null;
    });
    protected readonly affixClass = computed(() => {
        const theme = this.#themeService.theme();
        return autoCompleteAffixContainerThemeVariants(theme)();
    });
    protected readonly autoCompleteValue = signal("");
    protected readonly autoCompleteValue$ = new Subject<string>();
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const disabled = this.disabled();
        const focused = this.#popupRef() !== null;
        const rounded = this.rounded();
        const size = this.size();
        const variantClass = autoCompleteBaseThemeVariants(theme)({ disabled, focused, rounded, size });
        const userClass = this.userClass();
        return twMerge(variantClass, userClass);
    });
    protected readonly clearIcon = X;
    protected readonly expanded = computed(() => this.#popupRef() !== null);
    protected readonly footerTemplate = contentChild(DropDownFooterTemplateDirective, { read: TemplateRef });
    protected readonly groupHeaderTemplate = contentChild(DropDownGroupHeaderTemplateDirective, {
        read: TemplateRef
    });
    protected readonly headerTemplate = contentChild(DropDownHeaderTemplateDirective, { read: TemplateRef });
    protected readonly inputClass = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        return autoCompleteTextInputThemeVariants(theme)({ rounded });
    });
    protected readonly itemTemplate = contentChild(DropDownItemTemplateDirective, { read: TemplateRef });
    protected readonly isEmpty = computed(() => !this.#listService.viewItems().any());
    protected readonly listId = createElementControlId();
    protected readonly listPopupClass = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        const size = this.size();
        const userClass = this.popupClass();
        const variantClass = autoCompletePopupThemeVariants(theme)({ rounded, size });
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
    protected readonly selectedKeysChange = output<any[]>();
    protected readonly suffixTemplate = contentChild(DropdownSuffixTemplateDirective, { read: TemplateRef });

    public readonly data = input<Iterable<TData>>([]);
    public readonly disabled = model(false);
    public readonly itemDisabled = input<DropdownFieldPredicateType<TData>>();
    public readonly loading = input(false);
    public readonly placeholder = input("");
    public readonly popupClass = input("");
    public readonly popupHeight = input<ListSizeInputType>(null);
    public readonly popupWidth = input<ListSizeInputType>(null);
    public readonly readonly = input(false);
    public readonly rounded = input<AutoCompleteVariantProps["rounded"]>("medium");
    public readonly showClearButton = input(false);
    public readonly size = input<AutoCompleteVariantProps["size"]>("medium");
    public readonly textField = input<DropdownFieldSelectionType<TData>>(null);
    public readonly userClass = input<string>("", { alias: "class" });
    public readonly valueField = input<DropdownFieldSelectionType<TData>>(null);

    public constructor() {
        effect(() => {
            const textField = this.textField();
            untracked(() => this.#listService.setTextField(textField ?? ""));
        });
        effect(() => {
            const itemDisabled = this.itemDisabled();
            untracked(() => this.#listService.setDisabledBy(itemDisabled ?? ""));
        });
        effect(() => {
            const valueField = this.valueField();
            untracked(() => this.#listService.setValueField(valueField ?? ""));
        });
        effect(() => {
            const data = this.data();
            untracked(() => this.#listService.setData(data));
        });
        afterNextRender({
            read: () => {
                this.initialize();
                this.setSubscriptions();
                this.autoCompleteValue.set(this.#value() ?? "");
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

    public writeValue(data: any): void {
        this.updateValue(data, false);
    }

    protected clearValue(event: MouseEvent): void {
        event.stopImmediatePropagation();
        this.updateValue("");
        this.autoCompleteValue.set("");
        this.close();
        this.focus();
        this.#listService.clearFilter();
        this.#listService.clearSelections();
    }

    protected close(): void {
        this.#popupRef()?.close();
        this.#popupRef.set(null);
    }

    protected onInputBlur(event: FocusEvent): void {
        if (this.#propagateTouch) {
            this.#propagateTouch();
        }
        const popupRef = this.#popupRef();
        if (popupRef && !popupRef.overlayRef.overlayElement.contains(event.relatedTarget as HTMLElement)) {
            // this.close();
        }
    }

    protected onItemSelect(event: SelectionChangeEvent<TData>): void {
        const itemText = this.#listService.getItemText(event.item);
        this.updateValue(itemText);
        this.autoCompleteValue.set(itemText);
        this.close();
    }

    protected onKeydown(event: KeyboardEvent): void {
        if (event.key === "Escape" || event.key === "Tab") {
            this.close();
        } else if (event.key === "Enter") {
            this.handleEnterKey();
        } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.stopPropagation();
            event.preventDefault();
            this.handleArrowKeys(event);
        }
    }

    protected open(): void {
        if (this.#popupRef()) {
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
            content: this.popupTemplate(),
            hasBackdrop: false,
            offset: { horizontal: 0, vertical: 4 },
            popupConnectionPoint: "topleft",
            width,
            withPush: false
        });
        this.#popupRef.set(popupRef);
        popupRef.closed.pipe(take(1)).subscribe(() => {
            this.#popupRef.set(null);
            this.#listService.clearSelections();
            this.#listService.clearFilter();
            if (this.#value() !== this.autoCompleteValue()) {
                this.updateValue(this.autoCompleteValue());
            }
            window.setTimeout(() => this.focus());
        });
    }

    private focus(): void {
        const input = this.#hostElementRef.nativeElement.querySelector("input");
        if (input) {
            input.focus();
            input.setSelectionRange(-1, -1);
        }
    }

    private getItemStartsWith(value: string): ListItem<TData> | null {
        return this.#listService
            .viewItems()
            .where(i => !i.header && !this.#listService.isDisabled(i))
            .firstOrDefault(i => this.#listService.getItemText(i).toLowerCase().startsWith(value.toLowerCase()));
    }

    private handleArrowKeys(event: KeyboardEvent): void {
        const direction = event.key === "ArrowDown" ? "next" : "previous";
        this.#listService.navigate(direction, "highlight", false);
    }

    private handleEnterKey(): void {
        const highlightedItem = this.#listService.highlightedItem();
        const highlightedItemText = highlightedItem ? this.#listService.getItemText(highlightedItem) : "";
        const autoCompleteValue = this.autoCompleteValue();
        if (highlightedItemText && autoCompleteValue) {
            this.autoCompleteValue.set(highlightedItemText);
            if (this.#value() !== this.autoCompleteValue()) {
                this.updateValue(highlightedItemText);
            }
        } else if (this.#value() !== autoCompleteValue) {
            this.updateValue(autoCompleteValue);
        }
        this.close();
    }

    private initialize(): void {
        this.#listService.setNavigableOptions({ enabled: true, mode: "highlight" });
        this.#listService.setSelectableOptions(this.selectableOptions);
        this.#listService.selectedKeysChange = this.selectedKeysChange;
        this.#listService.filterInputVisible.set(false);
    }

    private notifyFilterChange(filter: string): FilterChangeEvent {
        const event = new FilterChangeEvent(filter);
        this.#listService.filterChange.emit(event);
        return event;
    }

    private setSubscriptions(): void {
        const debounce = this.#listService.filterableOptions().enabled
            ? this.#listService.filterableOptions().debounce
            : 0;
        this.autoCompleteValue$
            .pipe(
                tap(() => this.open()),
                debounceTime(debounce),
                takeUntilDestroyed(this.#destroyRef)
            )
            .subscribe((value: string) => {
                if (!value) {
                    this.close();
                    this.autoCompleteValue.set(value);
                    return;
                }
                if (this.#listService.filterableOptions().enabled) {
                    const event = this.notifyFilterChange(value);
                    if (!event.isDefaultPrevented()) {
                        this.#listService.setFilter(value);
                    }
                }
                const item = this.getItemStartsWith(value);
                this.#listService.clearSelections();
                this.#listService.highlightedItem.set(item);
                if (item) {
                    this.#listService.scrollToItem$.next({ item, focus: false });
                }
                this.autoCompleteValue.set(value);
            });
    }

    private updateValue(value: string, notify: boolean = true): void {
        this.#value.set(value);
        if (notify) {
            const notifyValue = value === "" || value == null ? null : value;
            this.#propagateChange?.(notifyValue);
        }
    }
}
