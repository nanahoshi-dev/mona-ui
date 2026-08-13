import { NgTemplateOutlet } from "@angular/common";
import {
    Component,
    computed,
    contentChild,
    ElementRef,
    input,
    model,
    output,
    signal,
    TemplateRef,
    viewChild
} from "@angular/core";
import type { FormValueControl } from "@angular/forms/signals";
import {
    LucideCircle,
    LucideDiamond,
    LucideDynamicIcon,
    LucideFlame,
    LucideHeart,
    LucideStar,
    type LucideIcon
} from "@lucide/angular";
import { createElementControlId } from "@nanahoshi/mona-ui/internal";
import { range } from "@mirei/ts-collections";
import { twMerge } from "tailwind-merge";
import { RatingHoveredItemTemplateDirective } from "../../directives/rating-hovered-item-template.directive";
import { RatingItemTemplateDirective } from "../../directives/rating-item-template.directive";
import { RatingSelectedItemTemplateDirective } from "../../directives/rating-selected-item-template.directive";
import type { RatingItemTemplateContext } from "../../models/RatingItemTemplateContext";
import type { RatingIconName } from "../../models/RatingIconName";
import type { RatingLabelPosition } from "../../models/RatingLabelPosition";
import type { RatingPrecision } from "../../models/RatingPrecision";
import type { RatingSelectionMode } from "../../models/RatingSelectionMode";
import {
    ratingContainerThemeVariants,
    ratingControlThemeVariants,
    ratingIconThemeVariants,
    ratingItemThemeVariants,
    ratingLabelThemeVariants,
    ratingOverlayClipThemeVariants,
    ratingOverlayContentThemeVariants,
    ratingOverlayIconThemeVariants,
    type RatingVariantInput,
    type RatingVariantProps
} from "../../styles/rating.styles";
import {
    getContinuousItemFill,
    getPointerRatingValue,
    getRatingStep,
    getSingleItemFill,
    normalizeItemsCount,
    normalizeRatingValue
} from "../../utils/rating-value.utils";

interface RatingItemDescriptor {
    readonly index: number;
    readonly itemValue: number;
}

type RatingKeyAction = "decrease" | "end" | "home" | "increase";

const ratingIcons = {
    circle: LucideCircle,
    diamond: LucideDiamond,
    flame: LucideFlame,
    heart: LucideHeart,
    star: LucideStar
} satisfies Record<RatingIconName, LucideIcon>;

@Component({
    selector: "mona-rating",
    templateUrl: "./rating.component.html",
    imports: [NgTemplateOutlet, LucideDynamicIcon]
})
export class RatingComponent implements RatingVariantInput, FormValueControl<number> {
    protected readonly activeState = computed<"hovered" | "selected">(() =>
        this.previewActive() ? "hovered" : "selected"
    );
    protected readonly containerClasses = computed(() => twMerge(ratingContainerThemeVariants(), this.userClass()));
    protected readonly controlClasses = computed(() => ratingControlThemeVariants({ size: this.size() }));
    protected readonly controlElement = viewChild.required<ElementRef<HTMLElement>>("ratingControl");
    protected readonly displayValue = computed(() => this.previewValue() ?? this.normalizedValue());
    protected readonly effectiveAriaLabelledBy = computed(() => {
        if (this.ariaLabelledBy()) {
            return this.ariaLabelledBy();
        }
        if (!this.ariaLabel() && this.label()) {
            return this.labelId;
        }
        return null;
    });
    protected readonly effectiveAriaValueText = computed(() => {
        const custom = this.ariaValueText();
        if (custom) {
            return custom(this.normalizedValue(), this.itemsCount());
        }
        return this.normalizedValue() === 0 ? "Not rated" : `${this.normalizedValue()} out of ${this.itemsCount()}`;
    });
    protected readonly effectiveTabIndex = computed(() => (this.disabled() ? -1 : this.tabindex()));
    protected readonly hoveredTemplate = contentChild(RatingHoveredItemTemplateDirective, {
        read: TemplateRef
    });
    protected readonly iconClasses = computed(() => ratingIconThemeVariants({ size: this.size() }));
    protected readonly iconToRender = computed(() => ratingIcons[this.icon()]);
    protected readonly interactionDisabled = computed(() => this.disabled() || this.readonly());
    protected readonly interactionStep = computed(() => getRatingStep(this.precision()));
    protected readonly invalidState = computed(() => this.touched() && this.invalid());
    protected readonly itemClasses = computed(() => ratingItemThemeVariants({ size: this.size() }));
    protected readonly itemTemplate = contentChild(RatingItemTemplateDirective, { read: TemplateRef });
    protected readonly items = computed<readonly RatingItemDescriptor[]>(() =>
        range(1, this.itemsCount())
            .select(itemValue => ({ index: itemValue - 1, itemValue }))
            .toArray()
    );
    protected readonly labelClasses = computed(() => ratingLabelThemeVariants({ size: this.size() }));
    protected readonly labelId = createElementControlId();
    protected readonly normalizedValue = computed(() =>
        normalizeRatingValue(this.value(), this.itemsCount(), this.precision())
    );
    protected readonly overlayClipClasses = computed(() => ratingOverlayClipThemeVariants());
    protected readonly overlayColor = computed(() => this.color() || "var(--color-primary)");
    protected readonly overlayContentClasses = computed(() => ratingOverlayContentThemeVariants({ size: this.size() }));
    protected readonly overlayIconClasses = computed(() => ratingOverlayIconThemeVariants({ size: this.size() }));
    protected readonly overlayTemplate = computed<TemplateRef<RatingItemTemplateContext> | undefined>(() =>
        this.activeState() === "hovered" ? this.hoveredTemplate() : this.selectedTemplate()
    );
    protected readonly previewActive = computed(() => this.previewValue() !== null);
    protected readonly previewValue = signal<number | null>(null);
    protected readonly selectedTemplate = contentChild(RatingSelectedItemTemplateDirective, {
        read: TemplateRef
    });

    /**
     * @description Associates help text or an error description with the focusable rating control.
     * @default null
     */
    public readonly ariaDescribedBy = input<string | null>(null, { alias: "aria-describedby" });

    /**
     * @description Explicit accessible name for the rating control. Provide `aria-label`,
     * `aria-labelledby`, or `label` so assistive technology can announce the control.
     * @default null
     */
    public readonly ariaLabel = input<string | null>(null, { alias: "aria-label" });

    /**
     * @description IDs of external elements providing the accessible name for the rating control.
     * @default null
     */
    public readonly ariaLabelledBy = input<string | null>(null, { alias: "aria-labelledby" });

    /**
     * @description Custom screen-reader value announcement. Receives the normalized value and the
     * item count and returns the string to expose through `aria-valuetext`.
     * @default null
     */
    public readonly ariaValueText = input<((value: number, maximum: number) => string) | null>(null);

    /**
     * @description CSS color for selected and hovered rating visuals. Empty, `null`, and `undefined` values use the
     * primary theme color.
     * @default undefined
     */
    public readonly color = input<string | null>();

    /**
     * @description Disables pointer and keyboard interaction and removes the control from the tab
     * sequence. When bound to a signal form field via `[formField]`, this is written by the signal
     * forms `Field` directive.
     * @default false
     */
    public readonly disabled = input(false);

    /**
     * @description Built-in icon used for the default rating visuals. Choose `star`, `heart`,
     * `circle`, `diamond`, or `flame`; use item templates to supply a custom icon.
     * @default "star"
     */
    public readonly icon = input<RatingIconName>("star");

    /**
     * @description Marks the component as invalid. Error styling requires both `invalid` and
     * `touched` to be `true`. When bound to a signal form field via `[formField]`, this is written
     * by the signal forms `Field` directive.
     * @default false
     */
    public readonly invalid = input(false);

    /**
     * @description Number of rating items. Fractional values are floored and values below one are
     * raised to one.
     * @default 5
     */
    public readonly itemsCount = input<number>(5, {
        transform: normalizeItemsCount
    });

    /**
     * @description Optional visible label rendered before or after the rating items. When no
     * explicit `aria-label` or `aria-labelledby` is supplied, the label provides the accessible
     * name.
     * @default null
     */
    public readonly label = input<string | null>(null);

    /**
     * @description Places the visible label before or after the item group.
     * @default "after"
     */
    public readonly labelPosition = input<RatingLabelPosition>("after");

    /**
     * @description Selection granularity of the rating.
     * @default "item"
     */
    public readonly precision = input<RatingPrecision>("item");

    /**
     * @description Prevents value changes while preserving focusability and normal visual emphasis.
     * @default false
     */
    public readonly readonly = input(false);

    /**
     * @description Controls cumulative or single-item filling.
     * @default "continuous"
     */
    public readonly selection = input<RatingSelectionMode>("continuous");

    /**
     * @description Size preset controlling the icon dimensions, item hitboxes, spacing, and label
     * typography.
     * @default "medium"
     */
    public readonly size = input<RatingVariantProps["size"]>("medium");

    /**
     * @description Tab index applied to the focusable rating control when not disabled. Accepts a
     * numeric string and converts it to a number.
     * @default 0
     */
    public readonly tabindex = input<number, number | string>(0, {
        transform: (value: number | string) => (typeof value === "string" ? parseInt(value, 10) : value)
    });

    /**
     * @description Emitted when the user interacts with the control, marking the field as touched.
     */
    public readonly touch = output<void>();

    /**
     * @description Marks the component as touched. When bound to a signal form field via
     * `[formField]`, this is written by the signal forms `Field` directive.
     * @default false
     */
    public readonly touched = input(false);

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string>("", { alias: "class" });

    /**
     * @description Current rating value. `0` represents an unrated state. Values are normalized
     * for rendering but are not rewritten until the user interacts with the component.
     * @default 0
     */
    public readonly value = model(0);

    public blur(): void {
        this.controlElement().nativeElement.blur();
    }

    public focus(options?: FocusOptions): void {
        if (!this.disabled()) {
            this.controlElement().nativeElement.focus(options);
        }
    }

    protected createItemContext(item: RatingItemDescriptor): RatingItemTemplateContext {
        return {
            $implicit: item.index,
            fill: this.getItemFill(item.itemValue),
            hovered: this.previewActive(),
            index: item.index,
            itemValue: item.itemValue,
            selected: !this.previewActive()
        };
    }

    protected getItemFill(itemValue: number): number {
        const displayValue = this.displayValue();
        if (this.selection() === "single") {
            return getSingleItemFill(displayValue, itemValue);
        }
        return getContinuousItemFill(displayValue, itemValue);
    }

    protected onBlur(): void {
        this.previewValue.set(null);
        this.touch.emit();
    }

    protected onClick(event: MouseEvent): void {
        if (this.interactionDisabled()) {
            return;
        }
        const candidate = this.getCandidateFromPointerEvent(event);
        if (candidate === null) {
            return;
        }
        const normalized = this.normalizeCandidate(candidate);
        if (normalized !== this.normalizedValue()) {
            this.value.set(normalized);
        }
        this.touch.emit();
    }

    protected onKeydown(event: KeyboardEvent): void {
        if (this.interactionDisabled()) {
            return;
        }
        const action = this.getKeyAction(event.key);
        if (action === null) {
            return;
        }
        event.preventDefault();
        this.previewValue.set(null);
        const current = this.normalizedValue();
        let next: number;
        switch (action) {
            case "decrease":
                next = this.normalizeCandidate(current - this.interactionStep());
                break;
            case "end":
                next = this.itemsCount();
                break;
            case "home":
                next = 0;
                break;
            case "increase":
                next = this.normalizeCandidate(current + this.interactionStep());
                break;
        }
        if (next !== current) {
            this.value.set(next);
        }
        this.touch.emit();
    }

    protected onPointerLeave(): void {
        this.previewValue.set(null);
    }

    protected onPointerMove(event: PointerEvent): void {
        if (this.interactionDisabled()) {
            return;
        }
        const candidate = this.getCandidateFromPointerEvent(event);
        if (candidate !== null) {
            this.previewValue.set(candidate);
        }
    }

    private getCandidateFromPointerEvent(event: MouseEvent): number | null {
        const controlElement = this.controlElement().nativeElement;
        const target = event.target as HTMLElement | null;
        const itemElement = target?.closest("[data-rating-index]") ?? null;
        if (!itemElement || !controlElement.contains(itemElement)) {
            return null;
        }
        const itemValue = Number(itemElement.getAttribute("data-rating-value"));
        const itemRect = itemElement.getBoundingClientRect();
        const direction = getComputedStyle(controlElement).direction === "rtl" ? "rtl" : "ltr";
        return getPointerRatingValue({
            clientX: event.clientX,
            direction,
            itemRect,
            itemValue,
            precision: this.precision()
        });
    }

    private getKeyAction(key: string): RatingKeyAction | null {
        switch (key) {
            case "ArrowRight":
            case "ArrowUp":
                return "increase";
            case "ArrowLeft":
            case "ArrowDown":
                return "decrease";
            case "Home":
                return "home";
            case "End":
                return "end";
            default:
                return null;
        }
    }

    private normalizeCandidate(value: number): number {
        return normalizeRatingValue(value, this.itemsCount(), this.precision());
    }
}
