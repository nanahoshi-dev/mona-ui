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
    model,
    output,
    TemplateRef,
    untracked,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { FormValueControl } from "@angular/forms/signals";
import type { Predicate } from "@mirei/ts-collections";
import type { PreventableEvent } from "@nanahoshi/mona-ui/common";
import {
    dropdownListAffixContainerThemeVariants,
    dropdownListInputThemeVariants,
    dropdownListValueContainerThemeVariants,
    type DropDownListVariantInput,
    type DropDownListVariantProps
} from "@nanahoshi/mona-ui/dropdown-list";
import {
    type AdaptiveMode,
    DropdownFooterTemplateDirective,
    type DropdownFieldPredicateType,
    type DropdownFieldSelectorType,
    DropdownHeaderTemplateDirective,
    DropdownItemTemplateDirective,
    DropdownNoDataTemplateDirective,
    type DropdownPopupInput,
    DROPDOWN_POPUP_INPUT_TOKEN,
    dropdownPopupThemeVariants,
    DropdownPrefixTemplateDirective,
    DropdownService,
    dropdownSheetSurfaceClasses,
    DropdownTreePopupComponent,
    DropdownTreePopupHandlerDirective,
    readDropdownField
} from "@nanahoshi/mona-ui/dropdowns";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import {
    createElementControlId,
    FIELD_ASSOCIATION_BOUNDARY,
    injectEffectiveDisabled,
    injectLabelAssociation,
    injectLabelledByText
} from "@nanahoshi/mona-ui/internal";
import { IndicatorIconComponent } from "@nanahoshi/mona-ui/internal/indicator-icon";
import type { ListSizeInputType } from "@nanahoshi/mona-ui/internal/list";
import {
    type ChildrenSelector,
    type DataStructure,
    type TreeNode,
    TreeService
} from "@nanahoshi/mona-ui/internal/tree";
import type { PopupCloseEvent } from "@nanahoshi/mona-ui/popup";
import { filter } from "rxjs";
import { twMerge } from "tailwind-merge";
import { DropdownTreeValueTemplateDirective } from "../../directives/dropdown-tree-value-template.directive";
import { DROPDOWN_TREE_DEFAULT_MESSAGES } from "../../i18n/dropdown-tree.default-messages";

@Component({
    selector: "mona-dropdown-tree",
    templateUrl: "./dropdown-tree.component.html",
    hostDirectives: [DropdownTreePopupHandlerDirective],
    providers: [
        DropdownService,
        TreeService,
        {
            provide: DROPDOWN_POPUP_INPUT_TOKEN,
            useExisting: forwardRef(() => DropdownTreeComponent)
        }
    ],
    imports: [DropdownTreePopupComponent, IndicatorIconComponent, NgTemplateOutlet],
    viewProviders: [...FIELD_ASSOCIATION_BOUNDARY],
    host: {
        "[attr.aria-activedescendant]": "activeDescendant()",
        "[attr.aria-busy]": "loading() ? 'true' : undefined",
        "[attr.aria-controls]": "treeId",
        "[attr.aria-describedby]": "describedBy()",
        "[attr.aria-disabled]": "effectiveDisabled() ? true : undefined",
        "[attr.aria-expanded]": "expanded()",
        "[attr.aria-haspopup]": "'tree'",
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
export class DropdownTreeComponent<TData = unknown, TValue = TData>
    implements FormValueControl<TValue | null>, DropDownListVariantInput, DropdownPopupInput
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
    readonly #labelledByText = injectLabelledByText(() => this.#label.labelledBy() ?? "");
    readonly #treeService = inject<TreeService<TData>>(TreeService);

    /** While the popup is open and the field has focus (no filter box), the active node of the popup's tree. */
    protected readonly activeDescendant = computed(() => {
        const node = this.#treeService.navigatedNode();
        if (!this.expanded() || node === null || this.#treeService.filterableOptions().enabled) {
            return null;
        }
        return this.#treeService.getNodeElementId(node.uid);
    });
    protected readonly affixClass = computed(() => dropdownListAffixContainerThemeVariants());
    protected readonly baseClass = computed(() => {
        const classes = dropdownListInputThemeVariants({
            disabled: this.effectiveDisabled(),
            expanded: this.expanded(),
            hasPrefix: this.prefixTemplate() != null,
            invalid: this.invalidState(),
            rounded: this.rounded(),
            size: this.size()
        });
        return twMerge(classes, this.userClass());
    });
    protected readonly clearButtonVisible = computed(
        () =>
            this.showClearButton() &&
            this.value() != null &&
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
    protected readonly headerTemplate = contentChild(DropdownHeaderTemplateDirective, { read: TemplateRef });
    protected readonly invalidState = computed(
        () => this.touched() && (this.invalid() || (this.required() && this.value() == null))
    );
    protected readonly itemTemplate = contentChild(DropdownItemTemplateDirective, { read: TemplateRef });
    protected readonly labelledBy = this.#label.labelledBy;
    protected readonly messages = this.#i18n.componentMessages("dropdownTree", DROPDOWN_TREE_DEFAULT_MESSAGES);
    protected readonly noDataTemplate = contentChild(DropdownNoDataTemplateDirective, { read: TemplateRef });
    /** The field's name, which names the popup's tree and its filter box. */
    protected readonly popupAriaLabel = computed(
        () => this.ariaLabel() || this.#labelledByText() || this.placeholder()
    );
    /** The popup's size: large in a bottom sheet, for touch. */
    protected readonly popupSize = computed(() => (this.sheet() ? "large" : (this.size() ?? "medium")));
    protected readonly popupSurfaceClass = computed(() => {
        const variantClass = dropdownPopupThemeVariants({ rounded: this.rounded(), size: this.size() });
        // With a popupHeight, the overlay sets the limit; the default max-h-64 would cut a taller popup short.
        const heightClass = this.popupHeight() ? "max-h-none" : "";
        const sheetClass = this.sheet() ? dropdownSheetSurfaceClasses : "";
        return twMerge(variantClass, "flex flex-col overflow-hidden", heightClass, sheetClass, this.popupClass());
    });
    protected readonly popupTemplate = viewChild.required<TemplateRef<unknown>>("popupTemplate");
    protected readonly prefixTemplate = contentChild(DropdownPrefixTemplateDirective, { read: TemplateRef });
    /** The selected item: the selected node's, or the value itself while its node isn't loaded (object values only). */
    protected readonly selectedDataItem = computed<TData | null>(() => {
        const node = this.selectedNode();
        if (node) {
            return node.data;
        }
        const value = this.value();
        return value != null && !this.valuePrimitive() ? (value as unknown as TData) : null;
    });
    protected readonly selectedNode = computed(() => this.#treeService.selectedNodes().firstOrDefault() ?? null);
    protected readonly sheet = this.#dropdownService.sheet.asReadonly();
    protected readonly treeId = createElementControlId();
    protected readonly valueContainerClass = computed(() =>
        dropdownListValueContainerThemeVariants({ hasTemplate: this.valueTemplate() != null })
    );
    protected readonly valueTemplate = contentChild(DropdownTreeValueTemplateDirective, { read: TemplateRef });
    protected readonly valueText = computed(() => {
        const node = this.selectedNode();
        if (node) {
            return this.#treeService.getNodeText(node);
        }
        const item = this.selectedDataItem();
        if (item == null) {
            return "";
        }
        const text = readDropdownField(item, this.textField());
        return text == null ? "" : String(text);
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
     * @description ID of an element that describes the dropdown tree, such as help text or an error message.
     * @default ""
     */
    public readonly ariaDescribedBy = input("", { alias: "aria-describedby" });

    /**
     * @description Accessible name of the dropdown tree. Describe what it represents. When empty, falls back to the
     * placeholder text.
     * @default ""
     */
    public readonly ariaLabel = input("", { alias: "aria-label" });

    /**
     * @description ID of an external element that provides the accessible name of the dropdown tree.
     * @default ""
     */
    public readonly ariaLabelledBy = input("", { alias: "aria-labelledby" });

    /**
     * @description Property name or accessor that gives a node's children, for `mode="hierarchical"`. An accessor
     * may return an observable, which loads the children when the node is first opened; set `hasChildren` with it.
     * @default ""
     */
    public readonly children = input<ChildrenSelector<TData>>("");

    /**
     * @description Emitted when the popup is about to close. This event is preventable.
     */
    // eslint-disable-next-line @angular-eslint/no-output-native -- matches the other dropdowns' (close) output
    public readonly close = output<PopupCloseEvent>();

    /**
     * @description Emitted after the popup closes.
     */
    public readonly closed = output();

    /**
     * @description The items of the tree: its root items for `mode="hierarchical"`, or every item for `mode="flat"`.
     * @default []
     */
    public readonly data = input<Iterable<TData>>([]);

    /**
     * @description Renders the component with reduced visual emphasis and removes pointer interaction.
     * @default false
     */
    public readonly disabled = input(false, { transform: booleanAttribute });

    /**
     * @description Whether an item has children, before they load. Needed when `children` returns an observable.
     * @default null
     */
    public readonly hasChildren = input<Predicate<TData> | null>(null);

    /**
     * @description Property name that holds an item's unique id, for `mode="flat"`.
     * @default ""
     */
    public readonly idField = input("");

    /**
     * @description Marks the field as invalid. Set automatically by the `FormField` directive when bound via `[formField]`.
     * @default false
     */
    public readonly invalid = input(false, { transform: booleanAttribute });

    /**
     * @description Predicate or field name that tells whether an item is disabled. A disabled item can't be selected
     * or opened, and neither can its children.
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
     * @description Shape of `data`: `"hierarchical"` for items that hold their children (see `children`), or
     * `"flat"` for one list linked by `idField` and `parentIdField`.
     * @default "hierarchical"
     */
    public readonly mode = input<DataStructure>("hierarchical");

    /**
     * @description Emitted when the popup is about to open. This event is preventable.
     */
    public readonly open = output<PreventableEvent>();

    /**
     * @description Emitted after the popup opens.
     */
    public readonly opened = output();

    /**
     * @description Property name that holds an item's parent id, for `mode="flat"`. Items without one are roots.
     * @default ""
     */
    public readonly parentIdField = input("");

    /**
     * @description Placeholder text shown when no value is selected. It also names the dropdown tree when neither
     * `aria-label` nor `aria-labelledby` is set.
     * @default ""
     */
    public readonly placeholder = input("");

    /**
     * @description Additional CSS classes applied to the popup element.
     * @default ""
     */
    public readonly popupClass = input("");

    /**
     * @description Maximum height of the popup, in pixels or as a CSS length. Shorter trees shrink to fit. When
     * unset, the popup is at most 200 pixels tall.
     * @default null
     */
    public readonly popupHeight = input<ListSizeInputType>(null);

    /**
     * @description Width of the popup element. When unset, the popup is as wide as the field.
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
    public readonly rounded = input<DropDownListVariantProps["rounded"]>("medium");

    /**
     * @description Shows a clear button that resets the selected value when clicked.
     * @default false
     */
    public readonly showClearButton = input(false, { transform: booleanAttribute });

    /**
     * @description Size preset controlling the component's dimensions.
     * @default "medium"
     */
    public readonly size = input<DropDownListVariantProps["size"]>("medium");

    /**
     * @description Property name or accessor that gives an item's text. When unset, the item itself is the text.
     * @default undefined
     */
    public readonly textField = input<DropdownFieldSelectorType<TData, string>>();

    /**
     * @description Emitted when focus leaves the dropdown tree. Moving between it, its clear button and its popup
     * doesn't count. The `FormField` directive listens to this to mark the field as touched.
     */
    public readonly touch = output<void>();

    /**
     * @description Marks the control as touched. Set automatically by the `FormField` directive when bound via `[formField]`.
     * @default false
     */
    public readonly touched = input(false, { transform: booleanAttribute });

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string>("", { alias: "class" });

    /**
     * @description The selected item, two-way bindable and compatible with Signal Forms via `[formField]`. It's the
     * data item, or with {@link valuePrimitive}, the value {@link valueField} gives for it. `null` means nothing is
     * selected.
     * @default null
     */
    public readonly value = model<TValue | null>(null);

    /**
     * @description Property name or accessor that gives an item's value: what identifies the item, matches a value
     * set from code to its node, and is the value with {@link valuePrimitive}. When unset, the item itself is the
     * value. It should be a stable, unique scalar.
     * @default undefined
     */
    public readonly valueField = input<DropdownFieldSelectorType<TData, unknown>>();

    /**
     * @description Whether the value is what {@link valueField} gives for the selected item (`true`), or the item
     * itself (`false`).
     * @default false
     */
    public readonly valuePrimitive = input(false, { transform: booleanAttribute });

    public constructor() {
        const treeService = this.#treeService;
        treeService.setSelectableOptions({ childrenOnly: false, enabled: true, mode: "single", toggleable: false });
        treeService.setExpandableOptions({ enabled: true });
        effect(() => {
            const textField = this.textField();
            untracked(() => treeService.setTextField(textField ?? ""));
        });
        effect(() => {
            const mode = this.mode();
            const children = this.children();
            const hasChildren = this.hasChildren();
            const idField = this.idField();
            const parentIdField = this.parentIdField();
            const data = this.data();
            untracked(() => {
                if (mode === "flat") {
                    treeService.setFlatIdField(idField);
                    treeService.setFlatParentIdField(parentIdField);
                } else {
                    treeService.setChildrenSelector(children);
                    treeService.setHasChildrenPredicate(hasChildren);
                }
                treeService.setDataStructure(mode);
                treeService.setData(data);
            });
        });
        effect(() => {
            const itemDisabled = this.itemDisabled();
            untracked(() => {
                // A disabled item's key is `true`, so `true` is the one disabled key.
                treeService.setDisableBy(itemDisabled ? item => Boolean(readDropdownField(item, itemDisabled)) : null);
                treeService.setDisableOptions({ disableChildren: true, enabled: itemDisabled != null });
                treeService.setDisabledKeys(itemDisabled ? [true] : []);
            });
        });
        effect(() => {
            const value = this.value();
            const valueField = this.valueField();
            const valuePrimitive = this.valuePrimitive();
            untracked(() => {
                treeService.setSelectBy(valueField ?? null);
                if (value == null) {
                    treeService.setSelectedKeys([]);
                } else if (valuePrimitive) {
                    treeService.setSelectedKeys([value]);
                } else {
                    treeService.setSelectedDataItems([value as unknown as TData]);
                }
            });
        });
        effect(() => {
            const popupTemplate = this.popupTemplate();
            untracked(() => this.#dropdownService.popupTemplate.set(popupTemplate));
        });
        // A click selects the node and closes the popup, even the node that is already selected.
        treeService.nodeClick$.pipe(takeUntilDestroyed()).subscribe(event => {
            event.preventDefault();
            const node = treeService.getNodeByUid(event.nodeItem.uid);
            if (node) {
                this.selectNode(node);
            }
        });
        afterNextRender({ read: () => this.setSubscriptions() });
    }

    /**
     * @description Moves focus to the dropdown tree.
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

    protected onValueClear(event: MouseEvent | KeyboardEvent): void {
        if (
            this.effectiveDisabled() ||
            this.readonly() ||
            (event instanceof KeyboardEvent && event.key !== "Enter" && event.key !== " ")
        ) {
            return;
        }
        event.stopImmediatePropagation();
        event.preventDefault();
        this.updateValue(null);
        this.focus();
    }

    private getControlValue(dataItem: TData): TValue {
        const value = this.valuePrimitive() ? readDropdownField(dataItem, this.valueField()) : dataItem;
        return value as TValue;
    }

    /** Selects a node, unless it's disabled, and closes the popup. */
    private selectNode(node: TreeNode<TData>): void {
        if (this.#treeService.isDisabled(node)) {
            return;
        }
        this.#treeService.navigatedNode.set(node);
        this.updateValue(this.getControlValue(node.data));
        this.#dropdownService.popupRef()?.close();
    }

    private setSubscriptions(): void {
        // Enter or Space, while the popup is open, selects the active node.
        this.#dropdownService.keydown$
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                filter(event => (event.key === "Enter" || event.key === " ") && this.expanded())
            )
            .subscribe(() => {
                const node = this.#treeService.navigatedNode();
                if (node) {
                    this.selectNode(node);
                }
            });
        this.#dropdownService.popupCloseComplete$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => {
            if (this.#dropdownService.focusCanReturn()) {
                window.setTimeout(() => this.focus());
            } else if (!this.#destroyRef.destroyed) {
                // Focus left from inside the popup (its filter box), so the host never saw a focusout.
                this.touch.emit();
            }
        });
    }

    private updateValue(value: TValue | null): void {
        if (this.value() !== value) {
            this.value.set(value);
        }
    }
}
