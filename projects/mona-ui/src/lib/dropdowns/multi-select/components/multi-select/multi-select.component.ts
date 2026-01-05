import { NgTemplateOutlet } from "@angular/common";
import {
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
    OnDestroy,
    OnInit,
    output,
    signal,
    TemplateRef,
    untracked,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { Predicate } from "@mirei/ts-collections";
import { ChevronDown, LucideAngularModule, X } from "lucide-angular";
import { fromEvent } from "rxjs";
import { twMerge } from "tailwind-merge";
import { ButtonDirective } from "../../../../buttons/button/directives/button.directive";
import { ChipComponent } from "../../../../buttons/chip/component/chip.component";
import { FormFieldValidationDirective } from "../../../../common/directives/form-field-validation.directive";
import { ListComponent } from "../../../../common/list/components/list/list.component";
import { ListFooterTemplateDirective } from "../../../../common/list/directives/list-footer-template.directive";
import { ListGroupHeaderTemplateDirective } from "../../../../common/list/directives/list-group-header-template.directive";
import { ListHeaderTemplateDirective } from "../../../../common/list/directives/list-header-template.directive";
import { ListItemTemplateDirective } from "../../../../common/list/directives/list-item-template.directive";
import { ListNoDataTemplateDirective } from "../../../../common/list/directives/list-no-data-template.directive";
import { ListItem } from "../../../../common/list/models/ListItem";
import { ListSizeInputType } from "../../../../common/list/models/ListSizeType";
import { SelectionChangeEvent } from "../../../../common/list/models/SelectionChangeEvent";
import { ListService } from "../../../../common/list/services/list.service";
import { FormFieldValidationService } from "../../../../common/services/form-field-validation.service";
import { PopupCloseEvent } from "../../../../popup/models/PopupCloseEvent";
import { PopupService } from "../../../../popup/services/popup.service";
import { ThemeService } from "../../../../theme/services/theme.service";
import { Action } from "../../../../utils/Action";
import { PreventableEvent } from "../../../../utils/PreventableEvent";
import { DropDownFooterTemplateDirective } from "../../../directives/drop-down-footer-template.directive";
import { DropDownGroupHeaderTemplateDirective } from "../../../directives/drop-down-group-header-template.directive";
import { DropDownHeaderTemplateDirective } from "../../../directives/drop-down-header-template.directive";
import { DropDownItemTemplateDirective } from "../../../directives/drop-down-item-template.directive";
import { DropDownNoDataTemplateDirective } from "../../../directives/drop-down-no-data-template.directive";
import { DropdownDataHandlerDirective } from "../../../directives/dropdown-data-handler.directive";
import { DropdownPopupHandlerDirective } from "../../../directives/dropdown-popup-handler.directive";
import { DropdownDataInput, DropdownDataInputToken } from "../../../models/DropdownDataInput";
import { DropdownFieldSelectorType } from "../../../models/DropdownFieldTypes";
import { DropdownPopupInput, DropdownPopupInputToken } from "../../../models/DropdownPopupInput";
import { DropdownService } from "../../../services/dropdown.service";
import { dropdownPopupVariants } from "../../../styles/dropdown.style";
import { MultiSelectTagTemplateDirective } from "../../directives/multi-select-tag-template.directive";
import {
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
        ButtonDirective,
        ListComponent,
        ListGroupHeaderTemplateDirective,
        ListItemTemplateDirective,
        ListFooterTemplateDirective,
        ListHeaderTemplateDirective,
        ListNoDataTemplateDirective,
        LucideAngularModule
    ],
    hostDirectives: [FormFieldValidationDirective, DropdownDataHandlerDirective, DropdownPopupHandlerDirective],
    host: {
        "[attr.aria-disabled]": "disabled() ? true : undefined",
        "[attr.aria-haspopup]": "true",
        "[attr.data-disabled]": "disabled()",
        "[attr.tabindex]": "disabled() ? null : 0",
        "[class]": "baseClass()"
    }
})
export class MultiSelectComponent<TData = unknown>
    implements
        OnInit,
        OnDestroy,
        ControlValueAccessor,
        MultiSelectVariantInput,
        DropdownDataInput<TData>,
        DropdownPopupInput
{
    readonly #destroyRef = inject(DestroyRef);
    readonly #dropdownService = inject(DropdownService);
    readonly #formFieldValidationService = inject(FormFieldValidationService);
    readonly #hostElementRef: ElementRef<HTMLElement> = inject(ElementRef);
    readonly #listService: ListService<TData> = inject(ListService);
    readonly #popupRef = this.#dropdownService.popupRef;
    readonly #popupService = inject(PopupService);
    readonly #themeService = inject(ThemeService);
    #propagateChange: Action<TData[]> | null = null;
    #resizeObserver: ResizeObserver | null = null;
    #value: TData[] = [];

    protected readonly activeDescendant = computed(() => {
        const highlightedItem = this.#listService.highlightedItem();
        return highlightedItem ? highlightedItem.uid : null;
    });
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const focused = this.#popupRef() != null;
        const rounded = this.rounded();
        const size = this.size();
        const variantClass = multiSelectBaseThemeVariants(theme)({ focused, rounded, size });
        const userClass = this.userClass();
        return twMerge(variantClass, userClass);
    });
    protected readonly clearIcon = X;
    protected readonly dropdownIcon = ChevronDown;
    protected readonly footerTemplate = contentChild(DropDownFooterTemplateDirective, { read: TemplateRef });
    protected readonly groupHeaderTemplate = contentChild(DropDownGroupHeaderTemplateDirective, {
        read: TemplateRef
    });
    protected readonly headerTemplate = contentChild(DropDownHeaderTemplateDirective, { read: TemplateRef });
    protected readonly itemContainerClass = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        return multiSelectItemContainerThemeVariants(theme)({ rounded });
    });
    protected readonly itemTemplate = contentChild(DropDownItemTemplateDirective, { read: TemplateRef });
    protected readonly noDataTemplate = contentChild(DropDownNoDataTemplateDirective, { read: TemplateRef });
    protected readonly popupClasses = computed(() => {
        return twMerge(dropdownPopupVariants());
    });
    protected readonly popupTemplate = viewChild.required<TemplateRef<any>>("popupTemplate");
    protected readonly tagTemplate = contentChild(MultiSelectTagTemplateDirective, { read: TemplateRef });
    protected readonly selectedDataItems = computed(() => {
        return this.selectedListItems()
            .select(i => i.data)
            .toImmutableSet();
    });
    protected readonly selectedKeysChange = output<any[]>();
    protected readonly selectedListItems = computed(() => {
        return this.#listService.selectedListItems();
    });
    protected readonly summaryTagText = computed(() => {
        const tagCount = this.tagCount();
        const itemCount = this.selectedListItems().size();
        if (tagCount < 0) {
            return "";
        } else if (tagCount === 0) {
            return `${itemCount} item${itemCount === 1 ? "" : "s"}`;
        } else {
            return `+${itemCount - tagCount} item${itemCount - tagCount > 1 ? "s" : ""}`;
        }
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

    public readonly size = input<MultiSelectVariantProps["size"]>("medium");
    public readonly summaryTagTemplate = signal<TemplateRef<any> | null>(null);
    public readonly tagCount = signal(-1);
    public readonly userClass = input<string>("", { alias: "class" });

    /**
     * @description Emits when the popup is about to close. This event is preventable.
     */
    public readonly close = output<PopupCloseEvent>();
    public readonly data = input<Iterable<TData>>([]);
    public readonly disabled = model(false);
    public readonly itemDisabled = input<string | Predicate<TData> | null>();
    /**
     * @description Sets the readonly state of the combo box component.
     * @default false
     */
    public readonly readonly = input(false);
    /**
     * @description Emits when the popup is about to open. This event is preventable.
     */
    public readonly open = output<PreventableEvent>();
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
    public readonly rounded = input<MultiSelectVariantProps["rounded"]>("medium");
    public readonly showClearButton = input(true);
    public readonly textField = input<DropdownFieldSelectorType<TData>>();
    public readonly valueField = input<DropdownFieldSelectorType<TData>>();

    public constructor() {
        effect(() => {
            const popupTemplate = this.popupTemplate();
            untracked(() => this.#dropdownService.popupTemplate.set(popupTemplate));
        });
        effect(() => {
            const valueField = this.valueField();
            untracked(() => {
                this.#listService.setValueField(valueField ?? "");
                this.#listService.setSelectedDataItems(this.#value);
            });
        });
        effect(() => {
            const textField = this.textField();
            untracked(() => this.#listService.setTextField(textField ?? ""));
        });
        effect(() => {
            const itemDisabled = this.itemDisabled();
            untracked(() => this.#listService.setDisabledBy(itemDisabled ?? ""));
        });
        effect(() => {
            const data = this.data();
            untracked(() => this.#listService.setData(data));
        });
    }

    public clearValue(event: MouseEvent): void {
        event.stopImmediatePropagation();
        this.updateValue([]);
        this.#listService.clearSelections();
        this.notifyValueChange();
    }

    public closePopup(): void {
        this.#popupRef()?.close();
    }

    public ngOnDestroy(): void {
        this.#resizeObserver?.disconnect();
    }

    public ngOnInit(): void {
        this.initialize();
        this.setEventListeners();
    }

    public onItemSelect(event: SelectionChangeEvent<TData>): void {
        this.updateValue(this.selectedDataItems().toArray());
        this.notifyValueChange();
    }

    public onSelectedItemRemove(event: Event, listItem: ListItem<TData>): void {
        event.stopImmediatePropagation();
        this.#listService.deselectItems([listItem]);
        this.updateValue(this.selectedDataItems().toArray());
        this.notifyValueChange();
    }

    public onSelectedItemGroupRemove(event: Event): void {
        event.stopImmediatePropagation();
        const selectedItemCount = this.selectedListItems().size();
        const removedItems = this.selectedListItems()
            .takeLast(selectedItemCount - this.visibleTagCount())
            .toArray();
        this.#listService.deselectItems(removedItems);
        this.updateValue(this.selectedDataItems().toArray());
        this.notifyValueChange();
    }

    public registerOnChange(fn: any): void {
        this.#propagateChange = fn;
    }

    public registerOnTouched(fn: any): void {}

    public setDisabledState(isDisabled: boolean): void {
        this.disabled.set(isDisabled);
    }

    public writeValue(data: any[]): void {
        this.updateValue(data ?? []);
        if (data != null) {
            this.#listService.setSelectedDataItems(data);
        }
    }

    private focus(): void {
        (this.#hostElementRef.nativeElement.firstElementChild as HTMLElement)?.focus();
    }

    private handleArrowKeys(event: KeyboardEvent): void {
        if (event.key === "ArrowDown") {
            this.#listService.navigate("next", "highlight", false);
        } else if (event.key === "ArrowUp") {
            this.#listService.navigate("previous", "highlight", false);
        }
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
        this.notifyValueChange();
    }

    private initialize(): void {
        this.#listService.setNavigableOptions({ enabled: true, mode: "highlight", wrap: true });
        this.#listService.setSelectableOptions({
            enabled: true,
            mode: "multiple"
        });
    }

    private notifyValueChange(): void {
        this.#propagateChange?.(this.#value);
    }

    private setEventListeners(): void {
        this.#resizeObserver = new ResizeObserver(() => {
            window.setTimeout(() => {
                this.#popupRef()?.overlayRef.updatePosition();
                this.#popupRef()?.overlayRef.updateSize({
                    width: this.#hostElementRef.nativeElement.getBoundingClientRect().width
                });
            });
        });
        this.#resizeObserver.observe(this.#hostElementRef.nativeElement);

        fromEvent<KeyboardEvent>(this.#hostElementRef.nativeElement, "keydown")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe((event: KeyboardEvent) => {
                if (event.key === "Enter") {
                    event.preventDefault();
                    this.handleEnterKey();
                } else if (event.key === "Escape") {
                    this.closePopup();
                } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                    event.preventDefault();
                    this.handleArrowKeys(event);
                }
            });
    }

    private updateValue(value: TData[]): void {
        this.#value = value;
    }
}
