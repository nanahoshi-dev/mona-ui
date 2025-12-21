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
    OnInit,
    output,
    signal,
    TemplateRef,
    untracked,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from "@angular/forms";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { Predicate } from "@mirei/ts-collections";
import { ChevronDown, LucideAngularModule, X } from "lucide-angular";
import { distinctUntilChanged, fromEvent, take, withLatestFrom } from "rxjs";
import { twMerge } from "tailwind-merge";
import { ButtonDirective } from "../../../../buttons/button/directives/button.directive";
import { ListComponent } from "../../../../common/list/components/list/list.component";
import { ListFooterTemplateDirective } from "../../../../common/list/directives/list-footer-template.directive";
import { ListGroupHeaderTemplateDirective } from "../../../../common/list/directives/list-group-header-template.directive";
import { ListHeaderTemplateDirective } from "../../../../common/list/directives/list-header-template.directive";
import { ListItemTemplateDirective } from "../../../../common/list/directives/list-item-template.directive";
import { ListNoDataTemplateDirective } from "../../../../common/list/directives/list-no-data-template.directive";
import { SelectableOptions } from "../../../../common/list/models/SelectableOptions";
import { SelectionChangeEvent } from "../../../../common/list/models/SelectionChangeEvent";
import { ListService } from "../../../../common/list/services/list.service";
import { PopupRef } from "../../../../popup/models/PopupRef";
import { PopupService } from "../../../../popup/services/popup.service";
import { ThemeService } from "../../../../theme/services/theme.service";
import { Action } from "../../../../utils/Action";
import { dropdownPopupHideAnimation, dropdownPopupShowAnimation } from "../../../animations/dropdown.animation";
import { DropDownFooterTemplateDirective } from "../../../directives/drop-down-footer-template.directive";
import { DropDownGroupHeaderTemplateDirective } from "../../../directives/drop-down-group-header-template.directive";
import { DropDownHeaderTemplateDirective } from "../../../directives/drop-down-header-template.directive";
import { DropDownItemTemplateDirective } from "../../../directives/drop-down-item-template.directive";
import { DropDownNoDataTemplateDirective } from "../../../directives/drop-down-no-data-template.directive";
import { DropDownListValueTemplateDirective } from "../../directives/drop-down-list-value-template.directive";
import {
    dropdownListInputThemeVariants,
    dropdownListPopupThemeVariants,
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
        ButtonDirective,
        ListComponent,
        ListItemTemplateDirective,
        ListGroupHeaderTemplateDirective,
        ListFooterTemplateDirective,
        ListHeaderTemplateDirective,
        ListNoDataTemplateDirective,
        LucideAngularModule
    ],
    host: {
        "[attr.aria-disabled]": "disabled() ? true : undefined",
        "[attr.aria-expanded]": "popupOpen() ? 'true' : 'false'",
        "[attr.aria-haspopup]": "true",
        "[attr.data-disabled]": "disabled()",
        "[attr.data-expanded]": "popupOpen()",
        "[attr.tabindex]": "disabled() ? null : 0",
        "[class]": "baseClasses()",
        "[attr.role]": "'combobox'"
    }
})
export class DropdownListComponent<TData = unknown> implements OnInit, ControlValueAccessor, DropDownListVariantInput {
    readonly #destroyRef = inject(DestroyRef);
    readonly #hostElementRef = inject(ElementRef<HTMLElement>);
    readonly #listService = inject(ListService<TData>);
    readonly #popupService = inject(PopupService);
    readonly #themeService = inject(ThemeService);
    #popupRef: PopupRef | null = null;
    #propagateChange: Action<TData | null> | null = null;
    #value: TData | null = null;

    protected readonly baseClasses = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        const size = this.size();
        const classes = dropdownListInputThemeVariants(theme)({ rounded, size });
        const userClass = this.userClass();
        return twMerge(classes, userClass);
    });
    protected readonly clearIcon = X;
    protected readonly dropdownIcon = ChevronDown;
    protected readonly footerTemplate = contentChild(DropDownFooterTemplateDirective, { read: TemplateRef });
    protected readonly groupHeaderTemplate = contentChild(DropDownGroupHeaderTemplateDirective, {
        read: TemplateRef
    });
    protected readonly headerTemplate = contentChild(DropDownHeaderTemplateDirective, { read: TemplateRef });
    protected readonly itemTemplate = contentChild(DropDownItemTemplateDirective, { read: TemplateRef });
    protected readonly noDataTemplate = contentChild(DropDownNoDataTemplateDirective, { read: TemplateRef });
    protected readonly popupClasses = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        const size = this.size();
        return dropdownListPopupThemeVariants(theme)({ rounded, size });
    });
    protected readonly popupOpen = signal(false);
    protected readonly popupTemplate = viewChild.required<TemplateRef<any>>("popupTemplate");
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
    protected readonly valueTemplate = contentChild(DropDownListValueTemplateDirective, { read: TemplateRef });
    protected readonly valueText = computed(() => {
        const listItem = this.selectedListItem();
        if (!listItem) {
            return "";
        }
        return this.#listService.getItemText(listItem);
    });

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
    public readonly itemDisabled = input<string | Predicate<TData> | null | undefined>("");

    /**
     * @description Placeholder text for the dropdown list when no item is selected.
     */
    public readonly placeholder = input("");

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
    public readonly textField = input<string | null | undefined>("");
    public readonly userClass = input<string>("", { alias: "class" });

    /**
     * @description The value field name of the data item.
     */
    public readonly valueField = input<string | null | undefined>("");

    public constructor() {
        effect(() => {
            const textField = this.textField() ?? "";
            untracked(() => this.#listService.setTextField(textField));
        });
        effect(() => {
            const valueField = this.valueField() ?? "";
            untracked(() => {
                this.#listService.setValueField(valueField);
                if (this.#value != null) {
                    this.#listService.setSelectedDataItems([this.#value]);
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
    }

    public clearValue(event: MouseEvent): void {
        event.stopImmediatePropagation();
        this.updateValue(null);
        this.#listService.clearSelections();
        this.#propagateChange?.(this.#value);
    }

    public close(): void {
        this.#popupRef?.close();
        this.#popupRef = null;
    }

    public ngOnInit(): void {
        this.initialize();
        this.setEventListeners();
        this.setSubscriptions();
    }

    public onItemSelect(event: SelectionChangeEvent<TData>): void {
        if (event.source.via === "mouse" || event.source.key === "Enter" || event.source.key === "NumpadEnter") {
            this.close();
        }
    }

    public open(): void {
        this.focus();
        if (this.#popupRef) {
            return;
        }
        this.#popupRef = this.#popupService.create({
            anchor: this.#hostElementRef.nativeElement,
            anchorConnectionPoint: "bottomleft",
            animation: {
                hide: dropdownPopupHideAnimation,
                show: dropdownPopupShowAnimation
            },
            closeOnOutsideClick: true,
            closeOnScroll: true,
            content: this.popupTemplate(),
            hasBackdrop: false,
            offset: { horizontal: 0, vertical: 4 },
            popupConnectionPoint: "topleft",
            width: this.#hostElementRef.nativeElement.getBoundingClientRect().width,
            withPush: false
        });
        this.popupOpen.set(true);
        this.notifyValueChangeOnPopupClose();
        this.#listService.focus$.next();
        this.#popupRef.closed.pipe(take(1)).subscribe(() => {
            this.#popupRef = null;
            this.popupOpen.set(false);
            this.#listService.clearFilter();
        });
    }

    public registerOnChange(fn: any): void {
        this.#propagateChange = fn;
    }

    public registerOnTouched(fn: any): void {
        void 0;
    }

    public setDisabledState(isDisabled: boolean): void {
        this.disabled.set(isDisabled);
    }

    public setValue(value: any): void {
        this.updateValue(value);
    }

    public writeValue(obj: TData): void {
        this.updateValue(obj);
        if (obj != null) {
            this.#listService.setSelectedDataItems([obj]);
        }
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
        this.updateValue(item.data);
        if (!this.#popupRef) {
            this.notifyValueChange();
        }
    }

    private handleEnterKey(): void {
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
            this.close();
        }
    }

    private initialize(): void {
        this.#listService.setNavigableOptions({ enabled: true, mode: "select" });
        this.#listService.setSelectableOptions(this.selectableOptions);
        this.#listService.selectedKeysChange = this.selectedKeysChange;
    }

    private notifyValueChange(): void {
        this.#propagateChange?.(this.#value);
    }

    private notifyValueChangeOnPopupClose(): void {
        if (!this.#popupRef) {
            return;
        }

        const selectionChange$ = this.#listService.selectionChange$.pipe(
            distinctUntilChanged((s1, s2) => s1.data === s2.data)
        );
        this.#popupRef.closed.pipe(take(1), withLatestFrom(selectionChange$)).subscribe(() => this.notifyValueChange());
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
        if (this.#popupRef) {
            this.close();
            return;
        }
        this.open();
    }

    private updateValue(value: TData | null): void {
        this.#value = value;
    }
}
