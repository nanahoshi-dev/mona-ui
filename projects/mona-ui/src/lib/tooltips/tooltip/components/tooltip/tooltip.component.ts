import {
    afterRenderEffect,
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    inject,
    input,
    linkedSignal,
    TemplateRef,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { fromEvent, take, takeUntil } from "rxjs";
import { fadeIn, fadeOut } from "../../../../layout/scroll-view/models/ScrollViewAnimations";
import { Position } from "../../../../models/Position";
import { PopupRef } from "../../../../popup/models/PopupRef";
import { PopupAnchor } from "../../../../popup/models/PopupSettings";
import { PopupService } from "../../../../popup/services/popup.service";
import { ThemeService } from "../../../../theme/services/theme.service";
import {
    tooltipArrowThemeVariants,
    tooltipBaseThemeVariants,
    TooltipVariantInputs,
    TooltipVariantProps
} from "../../styles/tooltip.styles";
import {
    getArrowPositionFromConnectionPair,
    getOffsetForPosition,
    getPositionConnectionPoints
} from "../../utils/tooltip.utils";

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
     */
    public readonly target = input.required<PopupAnchor>();

    public constructor() {
        afterRenderEffect({
            read: () => {
                const target = this.target();
                if (typeof target === "string") {
                    this.#createTooltip();
                } else {
                    const element = this.#getAnchorElement(target);
                    if (element) {
                        fromEvent<PointerEvent>(element, "pointerenter")
                            .pipe(takeUntilDestroyed(this.#destroyRef))
                            .subscribe(() => {
                                if (this.popupRef) {
                                    return;
                                }
                                this.#createTooltip();
                            });
                    }
                }
            }
        });
    }

    #createTooltip(): void {
        this.currentArrowPosition.set(this.position());
        const connectionPoints = getPositionConnectionPoints(this.position());
        const offset = getOffsetForPosition(this.position(), true);

        this.popupRef = this.#popupService.create({
            anchor: this.target(),
            anchorConnectionPoint: connectionPoints.anchor,
            animation: {
                show: fadeIn,
                hide: fadeOut
            },
            closeOnMouseLeave: true,
            closeOnOutsideClick: true,
            content: this.templateRef(),
            hasBackdrop: false,
            offset,
            popupConnectionPoint: connectionPoints.popup,
            restoreFocus: false,
            withPush: false
        });

        this.popupRef.closed.pipe(take(1)).subscribe(() => {
            this.popupRef = null;
        });

        if (typeof this.target() !== "string") {
            this.popupRef.positionChanges
                .pipe(takeUntil(this.popupRef.closed), takeUntilDestroyed(this.#destroyRef))
                .subscribe(connectionPair => {
                    const newArrowPosition = getArrowPositionFromConnectionPair(connectionPair);
                    this.currentArrowPosition.set(newArrowPosition);
                });
        }
    }

    #getAnchorElement(anchor: PopupAnchor): HTMLElement | null {
        if (anchor instanceof HTMLElement) {
            return anchor;
        }
        if (typeof anchor === "object" && "nativeElement" in anchor && anchor.nativeElement instanceof HTMLElement) {
            return anchor.nativeElement;
        }
        return null;
    }
}
