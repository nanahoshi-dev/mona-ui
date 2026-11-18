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
import { CHIP_DEFAULT_MESSAGES, ChipComponent } from "@nanahoshi/mona-ui/chip";
import type { PreventableEvent } from "@nanahoshi/mona-ui/common";
import {
    type AdaptiveMode,
    type DropdownFieldPredicateType,
    type DropdownFieldSelectorType,
    DropdownFooterTemplateDirective,
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
    injectLabelledByText,
    restoreOverlayScroll,
    rxFromResize
} from "@nanahoshi/mona-ui/internal";
import { IndicatorIconComponent } from "@nanahoshi/mona-ui/internal/indicator-icon";
import type { ListSizeInputType } from "@nanahoshi/mona-ui/internal/list";
import {
    type ChildrenSelector,
    type DataStructure,
    type TreeNode,
    TreeService
} from "@nanahoshi/mona-ui/internal/tree";
import {
    multiSelectAffixContainerThemeVariants,
    multiSelectBaseThemeVariants,
    multiSelectIndicatorContainerThemeVariants,
    multiSelectItemContainerThemeVariants,
    MultiSelectService,
    MultiSelectTagTemplateDirective,
    type MultiSelectVariantInput,
    type MultiSelectVariantProps
} from "@nanahoshi/mona-ui/multi-select";
import type { PopupCloseEvent } from "@nanahoshi/mona-ui/popup";
import { filter } from "rxjs";
import { twMerge } from "tailwind-merge";
import { MULTI_SELECT_TREE_DEFAULT_MESSAGES } from "../../i18n/multi-select-tree.default-messages";

/** A checked item, as its tag shows it. */
interface MultiSelectTreeTag<TData, TValue> {
    /** The item, when its node is loaded or the value holds items. */
    readonly data: TData | null;
    readonly key: unknown;
    readonly text: string;
    readonly value: TValue;
}

@Component({
    selector: "mona-multi-select-tree",
    templateUrl: "./multi-select-tree.component.html",
    hostDirectives: [DropdownTreePopupHandlerDirective],
    providers: [
        DropdownService,
        MultiSelectService,
        TreeService,
        {
            provide: DROPDOWN_POPUP_INPUT_TOKEN,
            useExisting: forwardRef(() => MultiSelectTreeComponent)
        }
    ],
    imports: [ChipComponent, DropdownTreePopupComponent, IndicatorIconComponent, NgTemplateOutlet],
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
export class MultiSelectTreeComponent<TData = unknown, TValue = TData>
    implements FormValueControl<Iterable<TValue>>, MultiSelectVariantInput, DropdownPopupInput
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
    readonly #multiSelectService = inject(MultiSelectService);
    /** The loaded nodes by their check key, which is what identifies an item. */
    readonly #nodesByKey = computed(() => {
        const nodes = new Map<unknown, TreeNode<TData>>();
        TreeService.flatten(this.#treeService.nodeSet()).forEach(node => {
            nodes.set(this.#treeService.getCheckKey(node), node);
        });
        return nodes;
    });
    readonly #treeService = inject<TreeService<TData>>(TreeService);

    /** While the popup is open and the field has focus (no filter box), the active node of the popup's tree. */
    protected readonly activeDescendant = computed(() => {
        const node = this.#treeService.navigatedNode();
        if (!this.expanded() || node === null || this.#treeService.filterableOptions().enabled) {
            return null;
        }
        return this.#treeService.getNodeElementId(node.uid);
    });
    protected readonly affixClass = computed(() => multiSelectAffixContainerThemeVariants());
    protected readonly baseClass = computed(() => {
        const variantClass = multiSelectBaseThemeVariants({
            disabled: this.effectiveDisabled(),
            focused: this.expanded(),
            invalid: this.invalidState(),
            rounded: this.rounded(),
            size: this.size()
        });
        return twMerge(variantClass, this.userClass());
    });
    protected readonly chipMessages = this.#i18n.componentMessages("chip", CHIP_DEFAULT_MESSAGES);
    protected readonly clearButtonVisible = computed(
        () =>
            this.showClearButton() &&
            this.tags().length > 0 &&
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
    protected readonly indicatorClass = computed(() =>
        multiSelectIndicatorContainerThemeVariants({ size: this.size() })
    );
    protected readonly invalidState = computed(
        () => this.touched() && (this.invalid() || (this.required() && this.tags().length === 0))
    );
    protected readonly itemContainerClass = computed(() =>
        multiSelectItemContainerThemeVariants({ rounded: this.rounded() })
    );
    protected readonly itemTemplate = contentChild(DropdownItemTemplateDirective, { read: TemplateRef });
    protected readonly labelledBy = this.#label.labelledBy;
    protected readonly messages = this.#i18n.componentMessages("multiSelectTree", MULTI_SELECT_TREE_DEFAULT_MESSAGES);
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
    protected readonly sheet = this.#dropdownService.sheet.asReadonly();
    protected readonly summaryTagTemplate = this.#multiSelectService.summaryTagTemplate.asReadonly();
    protected readonly tagCount = this.#multiSelectService.tagCount.asReadonly();
    protected readonly tagTemplate = contentChild(MultiSelectTagTemplateDirective, { read: TemplateRef });
    /** One tag per checked item, in the order of the value. */
    protected readonly tags = computed<ReadonlyArray<MultiSelectTreeTag<TData, TValue>>>(() => {
        const nodesByKey = this.#nodesByKey();
        const textField = this.textField();
        return Array.from((this.value() as Iterable<TValue> | null) ?? [], value => {
            const key = this.getValueKey(value);
            const node = nodesByKey.get(key);
            const data = node ? node.data : this.valuePrimitive() ? null : (value as unknown as TData);
            let text: unknown;
            if (node) {
                text = this.#treeService.getNodeText(node);
            } else {
                text = data == null ? key : readDropdownField(data, textField);
            }
            return { data, key, text: text == null ? "" : String(text), value };
        });
    });
    protected readonly treeId = createElementControlId();
    /** The tags shown before the summary tag: all of them unless `monaMultiSelectSummaryTag` limits them. */
    protected readonly visibleTags = computed(() => {
        const tagCount = this.tagCount();
        const tags = this.tags();
        return tagCount < 0 ? tags : tags.slice(0, tagCount);
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
     * @description ID of an element that describes the multi-select tree, such as help text or an error message.
     * @default ""
     */
    public readonly ariaDescribedBy = input("", { alias: "aria-describedby" });

    /**
     * @description Accessible name of the multi-select tree. Describe what it represents. Falls back to
     * {@link placeholder} when neither this nor `aria-labelledby` is set.
     * @default ""
     */
    public readonly ariaLabel = input("", { alias: "aria-label" });

    /**
     * @description ID of an external element that provides the accessible name of the multi-select tree.
     * @default ""
     */
    public readonly ariaLabelledBy = input("", { alias: "aria-labelledby" });

    /**
     * @description Whether checking an item checks its children too, and unchecking it unchecks them.
     * @default true
     */
    public readonly checkChildren = input(true, { transform: booleanAttribute });

    /**
     * @description Whether an item is checked when all its children are, and unchecked when one of them isn't. An
     * item with only some of its children checked shows a mixed checkbox.
     * @default true
     */
    public readonly checkParents = input(true, { transform: booleanAttribute });

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
     * @description Disables the component, preventing the popup from opening and blocking tag removal.
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
     * @description Marks the multi-select tree as invalid. When bound to a signal form field via `[formField]`, this
     * is written by the `FormField` directive.
     * @default false
     */
    public readonly invalid = input(false, { transform: booleanAttribute });

    /**
     * @description Predicate or field name that tells whether an item is disabled. A disabled item can't be checked
     * or opened, and neither can its children; checking its parent leaves it as it is.
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
     * @description Text shown when nothing is checked. It also names the multi-select tree when neither `aria-label`
     * nor `aria-labelledby` is set.
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
     * @description Marks the field as required: at least one item has to be checked.
     * @default false
     */
    public readonly required = input(false, { transform: booleanAttribute });

    /**
     * @description Border-radius preset applied to the component.
     * @default "medium"
     */
    public readonly rounded = input<MultiSelectVariantProps["rounded"]>("medium");

    /**
     * @description Shows a button that unchecks every item when at least one is checked.
     * @default false
     */
    public readonly showClearButton = input(false, { transform: booleanAttribute });

    /**
     * @description Size preset controlling the component's dimensions.
     * @default "medium"
     */
    public readonly size = input<MultiSelectVariantProps["size"]>("medium");

    /**
     * @description Property name or accessor that gives an item's text. When unset, the item itself is the text.
     * @default undefined
     */
    public readonly textField = input<DropdownFieldSelectorType<TData, string>>();

    /**
     * @description Emitted when focus leaves the multi-select tree. Moving between it, its tags, its clear button and
     * its popup doesn't count. The `FormField` directive listens to this to mark the field as touched.
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
     * @description The checked items, two-way bindable and compatible with Signal Forms via `[formField]`: the data
     * items, or with {@link valuePrimitive}, the values {@link valueField} gives for them. A user's change lists them
     * in the tree's order. Nothing checked is an empty array.
     * @default []
     */
    public readonly value = model<Iterable<TValue>>([]);

    /**
     * @description Property name or accessor that gives an item's value: what identifies the item, matches the
     * values set from code to their nodes, and is the value with {@link valuePrimitive}. When unset, the item itself
     * is the value. It should be a stable, unique scalar.
     * @default undefined
     */
    public readonly valueField = input<DropdownFieldSelectorType<TData, unknown>>();

    /**
     * @description Whether the value holds what {@link valueField} gives for the checked items (`true`), or the items
     * themselves (`false`).
     * @default false
     */
    public readonly valuePrimitive = input(false, { transform: booleanAttribute });

    public constructor() {
        const treeService = this.#treeService;
        treeService.setSelectableOptions({ enabled: false });
        treeService.setExpandableOptions({ enabled: true });
        effect(() => {
            const checkChildren = this.checkChildren();
            const checkParents = this.checkParents();
            untracked(() =>
                treeService.setCheckableOptions({
                    checkChildren,
                    checkDisabledChildren: false,
                    checkParents,
                    childrenOnly: false,
                    enabled: true,
                    mode: "multiple"
                })
            );
        });
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
            const valueField = this.valueField();
            const value = this.value();
            this.valuePrimitive();
            untracked(() => {
                treeService.setCheckBy(valueField ?? null);
                // NgModel writes null before its first value, and so does a reset form control. Both mean nothing is
                // checked.
                const values = (value as Iterable<TValue> | null) ?? [];
                treeService.setCheckedKeys(Array.from(values, v => this.getValueKey(v)));
            });
        });
        effect(() => {
            const popupTemplate = this.popupTemplate();
            untracked(() => this.#dropdownService.popupTemplate.set(popupTemplate));
        });
        // A click on a node's row checks or unchecks it, as a click on its checkbox does.
        treeService.nodeClick$.pipe(takeUntilDestroyed()).subscribe(event => {
            event.preventDefault();
            const node = treeService.getNodeByUid(event.nodeItem.uid);
            if (node) {
                treeService.navigatedNode.set(node);
                this.toggleNode(node);
            }
        });
        treeService.checkedKeysChange$.pipe(takeUntilDestroyed()).subscribe(keys => this.updateValueFromKeys(keys));
        afterNextRender({ read: () => this.setSubscriptions() });
    }

    /**
     * @description Moves focus to the multi-select tree.
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

    /** The summary tag's remove button unchecks the items it stands for, and leaves the rest as they are. */
    protected onSummaryTagRemove(event: Event): void {
        event.stopImmediatePropagation();
        if (this.readonly() || this.effectiveDisabled()) {
            return;
        }
        this.updateValue(this.visibleTags().map(tag => tag.value));
        this.focus();
    }

    /** A tag's remove button unchecks its item, as unchecking it in the tree does (its children too). */
    protected onTagRemove(event: Event, tag: MultiSelectTreeTag<TData, TValue>): void {
        event.stopImmediatePropagation();
        if (this.readonly() || this.effectiveDisabled()) {
            return;
        }
        this.uncheckTag(tag);
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
        this.focus();
    }

    /** What identifies a value: the value itself with `valuePrimitive`, else what `valueField` gives for the item. */
    private getValueKey(value: TValue): unknown {
        return this.valuePrimitive() ? value : readDropdownField(value as unknown as TData, this.valueField());
    }

    private handlePopupPositionUpdate(): void {
        const popupRef = this.#dropdownService.popupRef();
        if (popupRef) {
            restoreOverlayScroll(popupRef.overlayRef, this.#hostElementRef.nativeElement);
        }
    }

    private setSubscriptions(): void {
        // Enter or Space, while the popup is open, checks or unchecks the active node.
        this.#dropdownService.keydown$
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                filter(event => (event.key === "Enter" || event.key === " ") && this.expanded())
            )
            .subscribe(() => {
                const node = this.#treeService.navigatedNode();
                if (node) {
                    this.toggleNode(node);
                }
            });
        // Backspace unchecks the item of the last tag.
        this.#dropdownService.keydown$
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                filter(event => event.key === "Backspace")
            )
            .subscribe(event => {
                event.preventDefault();
                const tags = this.tags();
                if (tags.length > 0) {
                    this.uncheckTag(tags[tags.length - 1]);
                }
            });
        this.#dropdownService.popupCloseComplete$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => {
            if (!this.#dropdownService.focusCanReturn() && !this.#destroyRef.destroyed) {
                // Focus left from inside the popup (its filter box), so the host never saw a focusout.
                this.touch.emit();
            }
        });
        // The tags wrap onto more lines as items are checked, which moves the field's bottom edge.
        rxFromResize(this.#hostElementRef.nativeElement)
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(() => this.handlePopupPositionUpdate());
    }

    /** Checks or unchecks a node the way its checkbox does. Disabled nodes, and nodes without a checkbox, stay. */
    private toggleNode(node: TreeNode<TData>): void {
        if (this.#treeService.isDisabled(node) || !this.#treeService.isCheckable(node)) {
            return;
        }
        this.#treeService.setNodeCheck(node, !this.#treeService.isChecked(node));
    }

    private uncheckTag(tag: MultiSelectTreeTag<TData, TValue>): void {
        const node = this.#nodesByKey().get(tag.key);
        if (node && this.#treeService.isChecked(node)) {
            this.#treeService.setNodeCheck(node, false);
            return;
        }
        // An item whose node isn't loaded (its parent hasn't been opened) just leaves the value.
        this.updateValue(
            this.tags()
                .filter(t => t !== tag)
                .map(t => t.value)
        );
    }

    private updateValue(value: Iterable<TValue>): void {
        this.value.set(Array.from(value));
    }

    /**
     * Turns the tree's checked keys into the value: the loaded items in the tree's order, then the checked items whose
     * nodes aren't loaded, kept from the current value.
     */
    private updateValueFromKeys(keys: Iterable<unknown>): void {
        const keySet = new Set(keys);
        const values: TValue[] = [];
        const seen = new Set<unknown>();
        TreeService.flatten(this.#treeService.nodeSet()).forEach(node => {
            const key = this.#treeService.getCheckKey(node);
            if (keySet.has(key) && !seen.has(key)) {
                seen.add(key);
                values.push((this.valuePrimitive() ? key : node.data) as TValue);
            }
        });
        for (const tag of this.tags()) {
            if (keySet.has(tag.key) && !seen.has(tag.key)) {
                seen.add(tag.key);
                values.push(tag.value);
            }
        }
        this.updateValue(values);
    }
}
