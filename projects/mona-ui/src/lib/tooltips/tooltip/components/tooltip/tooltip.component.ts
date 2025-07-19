import {
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    ElementRef,
    inject,
    input,
    OnInit,
    TemplateRef,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { concat, exhaustMap, filter, fromEvent, of, take, tap } from "rxjs";
import { fadeIn, fadeOut } from "../../../../layout/scroll-view/models/ScrollViewAnimations";
import { Position } from "../../../../models/Position";
import { PopupOffset } from "../../../../popup/models/PopupOffset";
import { PopupRef } from "../../../../popup/models/PopupRef";
import { PopupService } from "../../../../popup/services/popup.service";
import { ConnectionPoint } from "../../../../popup/utils/connectionPosition";
import { ThemeService } from "../../../../theme/services/theme.service";
import { tooltipArrowThemeVariants, tooltipBaseThemeVariants } from "../../styles/tooltip.styles";

@Component({
    selector: "mona-tooltip",
    templateUrl: "./tooltip.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TooltipComponent implements OnInit {
    readonly #destroyRef = inject(DestroyRef);
    readonly #popupService = inject(PopupService);
    readonly #themeService = inject(ThemeService);
    protected readonly arrowClasses = computed(() => {
        const theme = this.#themeService.theme();
        return tooltipArrowThemeVariants(theme)();
    });
    protected readonly baseClasses = computed(() => {
        const theme = this.#themeService.theme();
        return tooltipBaseThemeVariants(theme)();
    });
    protected readonly templateRef = viewChild.required(TemplateRef);
    protected popupRef: PopupRef | null = null;

    public readonly position = input<Position>("top");
    public readonly target = input.required<Element | ElementRef>();

    public ngOnInit(): void {
        this.setSubscriptions();
    }

    private createTooltipPopup(target: Element): void {
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
        switch (this.position()) {
            case "top":
                return { horizontal: 0, vertical: -12 };
            case "bottom":
                return { horizontal: 0, vertical: 12 };
            case "right":
                return { horizontal: 12, vertical: 0 };
            case "left":
                return { horizontal: -12, vertical: 0 };
        }
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
