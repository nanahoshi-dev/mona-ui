import { CommonModule } from "@angular/common";
import {
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
    model,
    OnInit,
    Signal,
    signal,
    TemplateRef,
    untracked,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { Selector } from "@mirei/ts-collections";
import { ChevronDown, LucideAngularModule } from "lucide-angular";
import { distinctUntilChanged, fromEvent, Observable, take } from "rxjs";
import { twMerge } from "tailwind-merge";
import { v4 } from "uuid";
import { FilterInputComponent } from "../../../../common/filter-input/components/filter-input/filter-input.component";
import { FilterChangeEvent } from "../../../../common/filter-input/models/FilterChangeEvent";
import { TreeComponent } from "../../../../common/tree/components/tree/tree.component";
import { TreeNodeTemplateDirective } from "../../../../common/tree/directives/tree-node-template.directive";
import { SelectableOptions } from "../../../../common/tree/models/SelectableOptions";
import { TreeNode } from "../../../../common/tree/models/TreeNode";
import { TreeService } from "../../../../common/tree/services/tree.service";
import { PlaceholderComponent } from "../../../../layout/placeholder/components/placeholder/placeholder.component";
import { PopupRef } from "../../../../popup/models/PopupRef";
import { PopupService } from "../../../../popup/services/popup.service";
import { Action } from "../../../../utils/Action";
import { dropdownPopupHideAnimation, dropdownPopupShowAnimation } from "../../../animations/dropdown.animation";
import { DropDownFooterTemplateDirective } from "../../../directives/drop-down-footer-template.directive";
import { DropDownHeaderTemplateDirective } from "../../../directives/drop-down-header-template.directive";
import { DropDownNoDataTemplateDirective } from "../../../directives/drop-down-no-data-template.directive";
import {
    dropdownPopupVariants,
    DropdownSelectorVariantInput,
    DropdownSelectorVariantProps,
    dropdownSelectorVariants
} from "../../../styles/dropdown.style";
import { DropDownTreeNodeTemplateDirective } from "../../directives/drop-down-tree-node-template.directive";

@Component({
    selector: "mona-drop-down-tree",
    imports: [
        CommonModule,
        TreeComponent,
        FilterInputComponent,
        TreeNodeTemplateDirective,
        PlaceholderComponent,
        LucideAngularModule
    ],
    templateUrl: "./drop-down-tree.component.html",
    providers: [
        TreeService,
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DropDownTreeComponent),
            multi: true
        }
    ],
    host: {
        "[attr.aria-disabled]": "disabled() ? true : undefined",
        "[attr.aria-haspopup]": "true",
        "[attr.data-disabled]": "disabled()",
        "[attr.tabindex]": "disabled() ? null : 0",
        "[class]": "classes()"
    }
})
export class DropDownTreeComponent<T> implements ControlValueAccessor, OnInit, DropdownSelectorVariantInput {
    readonly #destroyRef: DestroyRef = inject(DestroyRef);
    readonly #document = inject(DOCUMENT);
    readonly #hostElementRef: ElementRef<HTMLElement> = inject(ElementRef);
    readonly #injector: Injector = inject(Injector);
    readonly #popupService: PopupService = inject(PopupService);
    readonly #popupUidClass: string = `mona-dropdown-popup-${v4()}`;
    readonly #selectedNode: Signal<TreeNode<T> | null> = computed(() => {
        return this.treeService.selectedNodes().firstOrDefault();
    });
    #popupRef: PopupRef | null = null;
    #propagateChange: Action<any> | null = null;
    #value = signal<any | null>(null);
    protected readonly classes = computed(() => {
        const size = this.size();
        const classes = dropdownSelectorVariants({ size });
        const userClass = this.userClass();
        return twMerge(classes, userClass);
    });
    protected readonly dropdownIcon = ChevronDown;
    protected readonly footerTemplate = contentChild(DropDownFooterTemplateDirective, { read: TemplateRef });
    protected readonly headerTemplate = contentChild(DropDownHeaderTemplateDirective, { read: TemplateRef });
    protected readonly noDataTemplate = contentChild(DropDownNoDataTemplateDirective, { read: TemplateRef });
    protected readonly nodeTemplate = contentChild(DropDownTreeNodeTemplateDirective, { read: TemplateRef });
    protected readonly popupClasses = computed(() => {
        return twMerge(dropdownPopupVariants());
    });
    protected readonly popupTemplate: Signal<TemplateRef<any>> = viewChild.required("popupTemplate");
    protected readonly selectableOptions: SelectableOptions = {
        enabled: true,
        mode: "single",
        toggleable: false,
        childrenOnly: false
    };
    protected readonly text: Signal<string> = computed(() => {
        const node = this.#selectedNode();
        if (!node) {
            return "";
        }
        return this.treeService.getNodeText(node);
    });
    protected readonly treeService: TreeService<T> = inject(TreeService);
    public readonly size = input<DropdownSelectorVariantProps["size"]>("default");
    public readonly userClass = input<string>("", { alias: "class" });

    public children = input<string | Selector<T, Iterable<T> | Observable<Iterable<T>>>>("");
    public data = input<Iterable<T>>([]);
    public disabled = model(false);
    public textField = input<string | null | undefined>("");
    public valueField = input<string | null | undefined>(null);

    public constructor() {
        effect(() => {
            const textField = this.textField() ?? "";
            untracked(() => this.treeService.setTextField(textField));
        });
        effect(() => {
            const valueField = this.valueField() ?? null;
            untracked(() => this.treeService.setSelectBy(valueField));
        });
        effect(() => {
            const children = this.children() ?? "";
            untracked(() => this.treeService.setChildrenSelector(children));
        });
        effect(() => {
            const data = this.data() ?? [];
            untracked(() => this.treeService.setData(data));
        });
    }

    public close(): void {
        this.#popupRef?.close();
    }

    public ngOnInit(): void {
        this.treeService.setSelectableOptions(this.selectableOptions);
        this.setEffects();
        this.setSubscriptions();
        this.setEventListeners();
    }

    public onFilterChange(event: FilterChangeEvent): void {
        if (this.treeService.filterChange) {
            this.treeService.filterChange.emit(event);
        }
        if (!event.isDefaultPrevented()) {
            this.treeService.filter$.next(event.filter);
        }
    }

    public open(): void {
        this.#hostElementRef.nativeElement.focus();
        if (this.#popupRef) {
            return;
        }
        this.treeService.setAnimationEnabled(false);
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
        this.treeService.setAnimationEnabled(true);
        this.focusSelectedNode();
        this.#popupRef.closed.pipe(take(1)).subscribe(() => {
            this.#popupRef = null;
            this.treeService.clearFilter();
        });
    }

    public registerOnChange(fn: any): void {
        this.#propagateChange = fn;
    }

    public registerOnTouched(fn: any): void {}

    public setDisabledState(isDisabled: boolean): void {
        this.disabled.set(isDisabled);
    }

    public writeValue(obj: any | null) {
        this.#value.set(obj);
        if (obj != null) {
            this.treeService.setSelectedDataItems([obj]);
        }
    }

    private focus(): void {
        this.#hostElementRef.nativeElement?.focus();
    }

    private focusSelectedNode(): void {
        window.setTimeout(() => {
            const popupElement = this.#document.querySelector(`.${this.#popupUidClass}`);
            if (!popupElement) {
                return;
            }
            const firstElement = popupElement.querySelector(
                ".mona-dropdown-popup-content ul:first-child li:first-child"
            ) as HTMLElement;
            const uid = this.#selectedNode()?.uid;
            if (uid) {
                const selectedElement = popupElement.querySelector(
                    ".mona-dropdown-popup-content ul li[data-uid='" + uid + "']"
                ) as HTMLElement;
                if (selectedElement) {
                    selectedElement?.scrollIntoView({
                        behavior: "auto",
                        block: "center"
                    });
                    selectedElement.focus();
                    return;
                } else {
                    if (firstElement) {
                        firstElement.focus();
                    }
                }
            }
            if (firstElement) {
                firstElement.focus();
            }
        }, 200);
    }

    private handleEnterKey(): void {
        if (this.#popupRef) {
            this.close();
            return;
        }
        this.open();
    }

    private handleKeyDown(event: KeyboardEvent): void {
        if (event.key === "Enter") {
            this.handleEnterKey();
        }
    }

    private notifyValueChange(): void {
        this.#propagateChange?.(this.#value());
    }

    private setEffects(): void {
        effect(
            () => {
                const highlightedNode = this.treeService.navigatedNode();
                window.setTimeout(() => {
                    if (!highlightedNode) {
                        return;
                    }
                    const popupElement = this.#document.querySelector(`.${this.#popupUidClass}`);
                    if (!popupElement) {
                        return;
                    }
                    const nodeElement = popupElement.querySelector(
                        `[data-uid="${highlightedNode.uid}"]`
                    ) as HTMLElement;
                    if (nodeElement) {
                        nodeElement.scrollIntoView({
                            behavior: "smooth",
                            block: "nearest",
                            inline: "center"
                        });
                    }
                });
            },
            { injector: this.#injector }
        );
    }

    private setEventListeners(): void {
        fromEvent<KeyboardEvent>(this.#hostElementRef.nativeElement, "keydown")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe((event: KeyboardEvent) => {
                this.handleKeyDown(event);
            });
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
    }

    private setSubscriptions(): void {
        this.treeService.selectedKeys$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => this.close());
        this.treeService.selectionChange$
            .pipe(
                distinctUntilChanged((n1, n2) => n1.data === n2.data),
                takeUntilDestroyed(this.#destroyRef)
            )
            .subscribe(node => {
                this.#value.set(node.data);
                this.notifyValueChange();
            });
    }
}
