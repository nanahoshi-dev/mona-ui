import {
    Component,
    ComponentRef,
    computed,
    createComponent,
    DestroyRef,
    Directive,
    effect,
    ElementRef,
    EnvironmentInjector,
    inject,
    input,
    linkedSignal,
    OnInit,
    Renderer2,
    signal,
    TemplateRef,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import { fromEvent, mergeWith, Subscription, take, takeUntil, tap } from "rxjs";
import { twMerge } from "tailwind-merge";
import { fadeIn, fadeOut } from "../../../layout/scroll-view/models/ScrollViewAnimations";
import { Position } from "../../../models/Position";
import { PopupRef } from "../../../popup/models/PopupRef";
import { PopupService } from "../../../popup/services/popup.service";
import { ThemeService } from "../../../theme/services/theme.service";
import {
    tooltipArrowThemeVariants,
    tooltipBaseThemeVariants,
    TooltipVariantInputs,
    TooltipVariantProps
} from "../styles/tooltip.styles";
import {
    getArrowPositionFromConnectionPair,
    getOffsetForPosition,
    getPositionConnectionPoints
} from "../utils/tooltip.utils";

@Directive({
    selector: "[monaTooltip]",
    host: {
        "[aria-describedby]": "originalTitle()",
        "[data.mona-title]": "originalTitle()",
        "[role]": "'tooltip'"
    }
})
export class TooltipDirective implements TooltipVariantInputs {
    readonly #destroyRef = inject(DestroyRef);
    readonly #host = inject(ElementRef<HTMLElement>);
    readonly #injector = inject(EnvironmentInjector);
    readonly #popupService = inject(PopupService);
    readonly #renderer = inject(Renderer2);
    #popupRef: PopupRef | null = null;
    #subscription: Subscription | null = null;
    #tooltipElement: HTMLElement | null = null;
    protected readonly originalTitle = signal("");

    /**
     * @description The filter to select elements that will have tooltips.
     * It can be a CSS selector that matches elements within the host element.
     * Only applies when `mode` is set to `content`.
     */
    public readonly filter = input<string>("[title]");

    /**
     * @description The mode of the tooltip.
     * "host" mode receives the tooltip from the host element's title attribute.
     * "content" mode uses the title attribute of elements matching the filter.
     */
    public readonly mode = input<"host" | "content">("host");

    /**
     * @description The position of the tooltip relative to the target element.
     */
    public readonly position = input<Position>("top");

    /**
     * @description The border radius of the tooltip.
     */
    public readonly rounded = input<TooltipVariantProps["rounded"]>("medium", {
        alias: "tooltipRounded"
    });

    public constructor() {
        effect(() => {
            this.mode();
            this.position();
            if (this.#subscription) {
                this.#subscription.unsubscribe();
                this.#subscription = null;
            }
            this.setSubscription();
        });
    }

    private createTooltip(text: string, anchor: HTMLElement): void {
        const component = this.createTooltipTemplate(text);
        if (!component) {
            return;
        }

        const connectionPoints = getPositionConnectionPoints(this.position());
        const offset = getOffsetForPosition(this.position(), true);
        this.#popupRef = this.#popupService.create({
            anchor,
            anchorConnectionPoint: connectionPoints.anchor,
            animation: {
                show: fadeIn,
                hide: fadeOut
            },
            closeOnMouseLeave: true,
            closeOnOutsideClick: true,
            content: component.instance.templateRef(),
            hasBackdrop: false,
            popupConnectionPoint: connectionPoints.popup,
            offset,
            restoreFocus: false,
            withPush: false
        });
        this.#popupRef.positionChanges
            .pipe(takeUntil(this.#popupRef.closed), takeUntilDestroyed(this.#destroyRef))
            .subscribe(connectionPair => {
                const newArrowPosition = getArrowPositionFromConnectionPair(connectionPair);
                component.instance.currentArrowPosition.set(newArrowPosition);
            });
        this.#popupRef.closed.pipe(take(1)).subscribe(() => {
            this.#popupRef = null;
            if (this.#tooltipElement) {
                this.#renderer.setAttribute(this.#tooltipElement, "title", text);
                this.#tooltipElement = null;
            }
        });
    }

    private createTooltipTemplate(text: string): ComponentRef<TooltipTemplateComponent> | null {
        if (!text) {
            return null;
        }
        const component = createComponent(TooltipTemplateComponent, {
            environmentInjector: this.#injector
        });
        component.setInput("content", text);
        component.setInput("position", this.position());
        component.setInput("rounded", this.rounded());
        return component;
    }

    private setSubscription(): void {
        const filter = this.filter();
        let element: HTMLElement[] = [];
        if (this.mode() === "host") {
            element = [this.#host.nativeElement];
        } else {
            element = this.#host.nativeElement.querySelectorAll(filter);
        }
        this.#subscription = fromEvent<PointerEvent>(element, "pointerenter")
            .pipe(
                tap(event => {
                    const targetElement = event.currentTarget as HTMLElement;
                    let title: string = "";
                    const mode = this.mode();
                    if (mode === "host") {
                        title = targetElement.getAttribute("title") || "";
                        this.#renderer.removeAttribute(targetElement, "title");
                    } else if (mode === "content") {
                        title = targetElement.getAttribute("title") || "";
                        this.#renderer.removeAttribute(targetElement, "title");
                    }
                    if (title && targetElement) {
                        this.createTooltip(title, targetElement);
                    }
                    this.#tooltipElement = targetElement;
                }),
                takeUntilDestroyed(this.#destroyRef)
            )
            .subscribe();
    }
}

@Component({
    template: `
        <ng-template>
            <div [class]="baseClasses()">
                <div>
                    {{ content() }}
                </div>
                <div [class]="arrowClasses()" [attr.data-position]="currentArrowPosition()"></div>
            </div>
        </ng-template>
    `
})
class TooltipTemplateComponent {
    readonly #themeService = inject(ThemeService);
    protected readonly arrowClasses = computed(() => {
        const theme = this.#themeService.theme();
        return tooltipArrowThemeVariants(theme)();
    });
    protected readonly baseClasses = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        const userClasses = `p-2`;
        const variants = tooltipBaseThemeVariants(theme)({ rounded });
        return twMerge(variants, userClasses);
    });
    public readonly currentArrowPosition = linkedSignal({
        source: () => this.position(),
        computation: () => this.position()
    });
    public readonly content = input.required<string>();
    /**
     * @description The position of the tooltip relative to the target element.
     */
    public readonly position = input<Position>("top");

    /**
     * @description The border radius of the tooltip.
     */
    public readonly rounded = input<TooltipVariantProps["rounded"]>("medium");
    public readonly templateRef = viewChild.required(TemplateRef);
}
