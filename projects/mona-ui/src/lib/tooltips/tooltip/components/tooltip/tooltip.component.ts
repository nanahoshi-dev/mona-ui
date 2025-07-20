import {
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    input,
    linkedSignal,
    TemplateRef,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { takeUntil } from "rxjs";
import { fadeIn, fadeOut } from "../../../../layout/scroll-view/models/ScrollViewAnimations";
import { Position } from "../../../../models/Position";
import { PopupOffset } from "../../../../popup/models/PopupOffset";
import { PopupRef } from "../../../../popup/models/PopupRef";
import { PopupService } from "../../../../popup/services/popup.service";
import { ConnectionPoint } from "../../../../popup/utils/connectionPosition";
import { PopupAnchor } from "../../../../popup/models/PopupSettings";
import { ThemeService } from "../../../../theme/services/theme.service";
import {
    tooltipArrowThemeVariants,
    tooltipBaseThemeVariants,
    TooltipVariantInputs,
    TooltipVariantProps
} from "../../styles/tooltip.styles";
import { getArrowPositionFromConnectionPair, getOffsetForPosition } from "../../utils/tooltip.utils";

@Component({
    selector: "mona-tooltip",
    templateUrl: "./tooltip.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TooltipComponent implements TooltipVariantInputs {
    readonly #destroyRef = inject(DestroyRef);
    readonly #popupService = inject(PopupService);
    readonly #themeService = inject(ThemeService);
    protected readonly arrowClasses = computed(() => {
        const theme = this.#themeService.theme();
        return tooltipArrowThemeVariants(theme)();
    });
    protected readonly baseClasses = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        return tooltipBaseThemeVariants(theme)({ rounded });
    });
    protected readonly currentArrowPosition = linkedSignal({
        source: () => this.position(),
        computation: () => this.position()
    });
    protected readonly templateRef = viewChild.required(TemplateRef);
    protected popupRef: PopupRef | null = null;

    /**
     * @description The position of the tooltip relative to the target element.
     */
    public readonly position = input<Position>("top");

    /**
     * @description The border radius of the tooltip.
     */
    public readonly rounded = input<TooltipVariantProps["rounded"]>("medium");

    /**
     * @description The target element(s) to which the tooltip is attached.
     * Can be an Element, ElementRef, or CSS selector string.
     * When using a CSS selector, tooltips will be applied to all matching elements.
     * Dynamic elements added after initialization will also receive tooltips.
     * The component reactively updates when the target input changes at runtime.
     */
    public readonly target = input.required<PopupAnchor>();

    public constructor() {
        effect(() => {
            // Close existing popup when target changes (this will trigger cleanup)
            if (this.popupRef) {
                this.popupRef.close();
                this.popupRef = null;
            }

            // Create tooltip using PopupService (handles everything internally)
            this.createTooltip();
        });
    }

    private createTooltip(): void {
        this.currentArrowPosition.set(this.position());
        const connectionPoints = this.getPositionConnectionPoints();
        const offset = this.getPositionOffset();
        
        // PopupService now handles CSS selectors internally - we just pass the target as-is
        this.popupRef = this.#popupService.create({
            content: this.templateRef(),
            anchor: this.target(), // PopupService handles single elements AND CSS selectors
            anchorConnectionPoint: connectionPoints.anchor,
            animation: {
                show: fadeIn,
                hide: fadeOut
            },
            hasBackdrop: false,
            closeOnOutsideClick: true,
            closeOnMouseLeave: true,
            popupConnectionPoint: connectionPoints.popup,
            offset,
            withPush: false
        });

        // Track position changes for arrow positioning (only for single elements)
        if (typeof this.target() !== "string") {
            this.popupRef.positionChanges
                .pipe(takeUntil(this.popupRef.closed), takeUntilDestroyed(this.#destroyRef))
                .subscribe(connectionPair => {
                    const newArrowPosition = getArrowPositionFromConnectionPair(connectionPair);
                    this.currentArrowPosition.set(newArrowPosition);
                });
        }
    }

    private getPositionConnectionPoints(): { anchor: ConnectionPoint; popup: ConnectionPoint } {
        switch (this.position()) {
            case "top":
                return { anchor: "topcenter", popup: "bottomcenter" };
            case "bottom":
                return { anchor: "bottomcenter", popup: "topcenter" };
            case "right":
                return { anchor: "centerright", popup: "centerleft" };
            case "left":
                return { anchor: "centerleft", popup: "centerright" };
        }
    }

    private getPositionOffset(): PopupOffset {
        return getOffsetForPosition(this.position());
    }
}
