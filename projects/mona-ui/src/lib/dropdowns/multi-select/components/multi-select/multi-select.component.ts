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
import {
    dropdownPopupVariants,
    DropdownSelectorVariantProps,
    MultiSelectSelectorVariantInput,
    multiSelectSelectorVariants
} from "../../../styles/dropdown.style";
import { fromEvent, take } from "rxjs";
import { twMerge } from "tailwind-merge";
import { ButtonDirective } from "../../../../buttons/button/directives/button.directive";
import { ChipComponent } from "../../../../buttons/chip/component/chip.component";
import { ListComponent } from "../../../../common/list/components/list/list.component";
import { ListFooterTemplateDirective } from "../../../../common/list/directives/list-footer-template.directive";
import { ListGroupHeaderTemplateDirective } from "../../../../common/list/directives/list-group-header-template.directive";
import { ListHeaderTemplateDirective } from "../../../../common/list/directives/list-header-template.directive";
import { ListItemTemplateDirective } from "../../../../common/list/directives/list-item-template.directive";
import { ListNoDataTemplateDirective } from "../../../../common/list/directives/list-no-data-template.directive";
import { ListItem } from "../../../../common/list/models/ListItem";
import { SelectionChangeEvent } from "../../../../common/list/models/SelectionChangeEvent";
import { ListService } from "../../../../common/list/services/list.service";
import { PopupRef } from "../../../../popup/models/PopupRef";
import { PopupService } from "../../../../popup/services/popup.service";
import { Action } from "../../../../utils/Action";
import { dropdownPopupHideAnimation, dropdownPopupShowAnimation } from "../../../animations/dropdown.animation";
import { DropDownFooterTemplateDirective } from "../../../directives/drop-down-footer-template.directive";
import { DropDownGroupHeaderTemplateDirective } from "../../../directives/drop-down-group-header-template.directive";
import { DropDownHeaderTemplateDirective } from "../../../directives/drop-down-header-template.directive";
import { DropDownItemTemplateDirective } from "../../../directives/drop-down-item-template.directive";
import { DropDownNoDataTemplateDirective } from "../../../directives/drop-down-no-data-template.directive";
import { MultiSelectTagTemplateDirective } from "../../directives/multi-select-tag-template.directive";

@Component({
    selector: "mona-multi-select",
    templateUrl: "./multi-select.component.html",
    providers: [
        ListService,
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MultiSelectComponent),
            multi: true
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
    host: {
        "[attr.aria-disabled]": "disabled() ? true : undefined",
        "[attr.aria-haspopup]": "true",
        "[attr.data-disabled]": "disabled()",
        "[attr.tabindex]": "disabled() ? null : 0",
        "[class]": "classes()"
    }
})
export class MultiSelectComponent<TData>
    implements OnInit, OnDestroy, ControlValueAccessor, MultiSelectSelectorVariantInput
{
    readonly #destroyRef = inject(DestroyRef);
    readonly #hostElementRef: ElementRef<HTMLElement> = inject(ElementRef);
    readonly #listService: ListService<TData> = inject(ListService);
    readonly #popupService = inject(PopupService);
    #popupRef: PopupRef | null = null;
    #propagateChange: Action<TData[]> | null = null;
    #resizeObserver: ResizeObserver | null = null;
    #value: TData[] = [];

    protected readonly classes = computed(() => {
        const size = this.size();
        const classes = multiSelectSelectorVariants({ size });
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

    public readonly size = input<DropdownSelectorVariantProps["size"]>("default");
    public readonly summaryTagTemplate = signal<TemplateRef<any> | null>(null);
    public readonly tagCount = signal(-1);
    public readonly userClass = input<string>("", { alias: "class" });

    public data = input<Iterable<TData>>([]);
    public disabled = model(false);
    public itemDisabled = input<string | Predicate<TData> | null | undefined>("");
    public showClearButton = input(true);
    public textField = input<string | null | undefined>("");
    public valueField = input<string | null | undefined>("");

    public constructor() {
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

    public close(): void {
        this.#popupRef?.close();
        this.#popupRef = null;
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

    public open(): void {
        if (this.#popupRef) {
            return;
        }
        this.focus();
        this.#popupRef = this.#popupService.create({
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
            width: this.#hostElementRef.nativeElement.getBoundingClientRect().width,
            withPush: false
        });
        this.#popupRef.closed.pipe(take(1)).subscribe(() => {
            this.#popupRef = null;
            this.#listService.highlightedItem.set(null);
            this.#listService.clearFilter();
        });
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
        if (!this.#popupRef) {
            this.open();
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
        this.#listService.selectedKeysChange = this.selectedKeysChange;
    }

    private notifyValueChange(): void {
        this.#propagateChange?.(this.#value);
    }

    private setEventListeners(): void {
        this.#resizeObserver = new ResizeObserver(() => {
            window.setTimeout(() => {
                this.#popupRef?.overlayRef.updatePosition();
                this.#popupRef?.overlayRef.updateSize({
                    width: this.#hostElementRef.nativeElement.getBoundingClientRect().width
                });
            });
        });
        this.#resizeObserver.observe(this.#hostElementRef.nativeElement);

        fromEvent<MouseEvent>(this.#hostElementRef.nativeElement, "click")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(() => {
                if (this.disabled()) {
                    return;
                }
                if (this.#popupRef) {
                    this.close();
                    return;
                }
                this.open();
            });

        fromEvent<KeyboardEvent>(this.#hostElementRef.nativeElement, "keydown")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe((event: KeyboardEvent) => {
                if (event.key === "Enter") {
                    event.preventDefault();
                    this.handleEnterKey();
                } else if (event.key === "Escape") {
                    this.close();
                } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                    event.preventDefault();
                    this.handleArrowKeys(event);
                }
            });
        fromEvent<FocusEvent>(this.#hostElementRef.nativeElement, "focusout")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(event => {
                const target = event.relatedTarget as HTMLElement;
                if (
                    !(
                        target &&
                        (this.#hostElementRef.nativeElement.contains(target) ||
                            this.#popupRef?.overlayRef.overlayElement.contains(target))
                    )
                ) {
                    this.close();
                }
            });
    }

    private updateValue(value: TData[]): void {
        this.#value = value;
    }
}
