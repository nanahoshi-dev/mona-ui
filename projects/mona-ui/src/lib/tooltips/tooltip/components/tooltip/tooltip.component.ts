import {
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    ElementRef,
    inject,
    input,
    OnInit,
    signal,
    TemplateRef,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { concat, exhaustMap, filter, fromEvent, of, take, takeUntil, tap } from "rxjs";
import { fadeIn, fadeOut } from "../../../../layout/scroll-view/models/ScrollViewAnimations";
import { Position } from "../../../../models/Position";
import { PopupOffset } from "../../../../popup/models/PopupOffset";
import { PopupRef } from "../../../../popup/models/PopupRef";
import { PopupService } from "../../../../popup/services/popup.service";
import { ConnectionPoint } from "../../../../popup/utils/connectionPosition";
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
export class TooltipComponent implements OnInit, TooltipVariantInputs {
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
    protected readonly templateRef = viewChild.required(TemplateRef);
    protected popupRef: PopupRef | null = null;

    public readonly position = input<Position>("top");
    public readonly rounded = input<TooltipVariantProps["rounded"]>("medium");
    public readonly target = input.required<Element | ElementRef>();

    protected readonly currentArrowPosition = signal<Position>(this.position());

    public ngOnInit(): void {
        this.setSubscriptions();
    }

    private createTooltipPopup(target: Element): void {
        this.currentArrowPosition.set(this.position());
        const connectionPoints = this.getPositionConnectionPoints();
        const offset = this.getPositionOffset();
        this.popupRef = this.#popupService.create({
            content: this.templateRef(),
            anchor: target,
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

        const currentPopupRef = this.popupRef;
        currentPopupRef.positionChanges
            .pipe(takeUntil(currentPopupRef.closed), takeUntilDestroyed(this.#destroyRef))
            .subscribe(connectionPair => {
                const newArrowPosition = getArrowPositionFromConnectionPair(connectionPair);
                this.currentArrowPosition.set(newArrowPosition);
            });
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

    private setSubscriptions(): void {
        const target = this.target();
        const tooltipTarget = target instanceof ElementRef ? target.nativeElement : target;

        const pointerEnter$ = fromEvent<PointerEvent>(tooltipTarget, "pointerenter");
        const pointerLeave$ = fromEvent<PointerEvent>(tooltipTarget, "pointerleave");

        pointerEnter$
            .pipe(
                filter(() => !this.popupRef),
                exhaustMap(() =>
                    concat(
                        of(null).pipe(tap(() => this.createTooltipPopup(tooltipTarget))),
                        pointerLeave$.pipe(take(1))
                    )
                ),
                tap(() => (this.popupRef = null)),
                takeUntilDestroyed(this.#destroyRef)
            )
            .subscribe();
    }
}
