import { ComponentType } from "@angular/cdk/overlay";
import { NgTemplateOutlet } from "@angular/common";
import {
    Component,
    ComponentRef,
    computed,
    DestroyRef,
    DOCUMENT,
    ElementRef,
    inject,
    Injector,
    OnInit,
    signal,
    TemplateRef,
    viewChild,
    ViewContainerRef
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { take } from "rxjs";
import { defaultPopupAnimation } from "../../models/PopupAnimationClasses";
import { PopupCloseEvent } from "../../models/PopupCloseEvent";
import { PopupSettingsInjectionToken } from "../../models/PopupInjectionToken";
import { PopupReferenceInjectionToken } from "../../models/PopupReferenceInjectionToken";
import { PopupAnimationSettings, PopupSettings } from "../../models/PopupSettings";

@Component({
    selector: "mona-popup-wrapper",
    templateUrl: "./popup-wrapper.component.html",
    imports: [NgTemplateOutlet],
    styles: [
        `
            :host {
                display: block;
            }

            /*
             * "clip" rather than "hidden" on purpose. "hidden" makes these elements scroll containers, so
             * when content inside the popup takes focus while the enter animation still has it translated
             * off-screen, the browser scrolls them to reveal it. That scroll cancels the transform before
             * the first paint and the popup appears instantly instead of sliding in. "clip" cannot scroll.
             */
            :host(.mona-popup-constrain-height) {
                min-height: 0;
                max-height: inherit;
                overflow: clip;
            }

            :host(.mona-popup-constrain-height) > div {
                display: flex;
                min-height: 0;
                max-height: inherit;
                overflow: clip;
            }

            .mona-popup-enter {
                animation: mona-popup-scale-in 150ms cubic-bezier(0.4, 0, 0.2, 1);
            }

            .mona-popup-leave {
                animation: mona-popup-scale-out 150ms cubic-bezier(0.4, 0, 0.2, 1);
            }

            .mona-dropdown-popup-enter {
                animation: mona-dropdown-popup-scale-in 150ms cubic-bezier(0.4, 0, 0.2, 1);
                transform-origin: top center;
            }

            .mona-dropdown-popup-leave {
                animation: mona-dropdown-popup-scale-out 150ms cubic-bezier(0.4, 0, 0.2, 1);
                transform-origin: top center;
            }

            .mona-popup-fade-enter {
                animation: mona-popup-fade-in 50ms ease-in;
            }

            .mona-popup-fade-leave {
                animation: mona-popup-fade-out 150ms ease-out;
            }

            .mona-popup-slide-from-right-enter,
            .mona-popup-slide-from-left-enter,
            .mona-popup-slide-from-top-enter,
            .mona-popup-slide-from-bottom-enter,
            .mona-popup-slide-to-right-leave,
            .mona-popup-slide-to-left-leave,
            .mona-popup-slide-to-top-leave,
            .mona-popup-slide-to-bottom-leave {
                animation-fill-mode: both;
                backface-visibility: hidden;
                will-change: transform;
            }

            /*
             * The curve is deliberately gentle rather than front-loaded. A sharply decelerating curve
             * covers most of the travel in the first few frames, which reads as a snap on the sides whose
             * leading edge carries the content (right and bottom), while looking calm on the sides that
             * lead with blank margin (left and top).
             */
            .mona-popup-slide-from-right-enter,
            .mona-popup-slide-from-left-enter,
            .mona-popup-slide-from-top-enter,
            .mona-popup-slide-from-bottom-enter {
                animation-duration: 320ms;
                animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
            }

            .mona-popup-slide-to-right-leave,
            .mona-popup-slide-to-left-leave,
            .mona-popup-slide-to-top-leave,
            .mona-popup-slide-to-bottom-leave {
                animation-duration: 240ms;
                animation-timing-function: cubic-bezier(0.4, 0, 1, 1);
            }

            .mona-popup-slide-from-right-enter {
                animation-name: mona-popup-slide-from-right;
            }

            .mona-popup-slide-to-right-leave {
                animation-name: mona-popup-slide-to-right;
            }

            .mona-popup-slide-from-left-enter {
                animation-name: mona-popup-slide-from-left;
            }

            .mona-popup-slide-to-left-leave {
                animation-name: mona-popup-slide-to-left;
            }

            .mona-popup-slide-from-top-enter {
                animation-name: mona-popup-slide-from-top;
            }

            .mona-popup-slide-to-top-leave {
                animation-name: mona-popup-slide-to-top;
            }

            .mona-popup-slide-from-bottom-enter {
                animation-name: mona-popup-slide-from-bottom;
            }

            .mona-popup-slide-to-bottom-leave {
                animation-name: mona-popup-slide-to-bottom;
            }

            @keyframes mona-popup-scale-in {
                from {
                    opacity: 0;
                    transform: scale(0.95);
                }

                to {
                    opacity: 1;
                    transform: scale(1);
                }
            }

            @keyframes mona-popup-scale-out {
                from {
                    opacity: 1;
                    transform: scale(1);
                }

                to {
                    opacity: 0;
                    transform: scale(0.95);
                }
            }

            @keyframes mona-dropdown-popup-scale-in {
                from {
                    opacity: 0;
                    transform: scale(0.95);
                }

                to {
                    opacity: 1;
                    transform: scale(1);
                }
            }

            @keyframes mona-dropdown-popup-scale-out {
                from {
                    opacity: 1;
                    transform: scale(1);
                }

                to {
                    opacity: 0;
                    transform: scale(0.95);
                }
            }

            @keyframes mona-popup-fade-in {
                from {
                    opacity: 0;
                }

                to {
                    opacity: 1;
                }
            }

            @keyframes mona-popup-fade-out {
                from {
                    opacity: 1;
                }

                to {
                    opacity: 0;
                }
            }

            @keyframes mona-popup-slide-from-right {
                from {
                    transform: translateX(100%);
                }
                to {
                    transform: translateX(0);
                }
            }

            @keyframes mona-popup-slide-to-right {
                from {
                    transform: translateX(0);
                }
                to {
                    transform: translateX(100%);
                }
            }

            @keyframes mona-popup-slide-from-left {
                from {
                    transform: translateX(-100%);
                }
                to {
                    transform: translateX(0);
                }
            }

            @keyframes mona-popup-slide-to-left {
                from {
                    transform: translateX(0);
                }
                to {
                    transform: translateX(-100%);
                }
            }

            @keyframes mona-popup-slide-from-top {
                from {
                    transform: translateY(-100%);
                }
                to {
                    transform: translateY(0);
                }
            }

            @keyframes mona-popup-slide-to-top {
                from {
                    transform: translateY(0);
                }
                to {
                    transform: translateY(-100%);
                }
            }

            @keyframes mona-popup-slide-from-bottom {
                from {
                    transform: translateY(100%);
                }
                to {
                    transform: translateY(0);
                }
            }

            @keyframes mona-popup-slide-to-bottom {
                from {
                    transform: translateY(0);
                }
                to {
                    transform: translateY(100%);
                }
            }

            @media (prefers-reduced-motion: reduce) {
                .mona-popup-enter,
                .mona-popup-leave,
                .mona-dropdown-popup-enter,
                .mona-dropdown-popup-leave,
                .mona-popup-fade-enter,
                .mona-popup-fade-leave,
                .mona-popup-slide-from-right-enter,
                .mona-popup-slide-to-right-leave,
                .mona-popup-slide-from-left-enter,
                .mona-popup-slide-to-left-leave,
                .mona-popup-slide-from-top-enter,
                .mona-popup-slide-to-top-leave,
                .mona-popup-slide-from-bottom-enter,
                .mona-popup-slide-to-bottom-leave {
                    animation-duration: 1ms;
                }
            }
        `
    ],
    host: {
        "[class]": "hostClasses()"
    }
})
export class PopupWrapperComponent implements OnInit {
    readonly #destroyRef = inject(DestroyRef);
    readonly #document = inject(DOCUMENT);
    readonly #popupReference = inject(PopupReferenceInjectionToken);
    readonly #popupSettings = inject<PopupSettings>(PopupSettingsInjectionToken);
    #closeEvent: PopupCloseEvent | null = null;
    #fallbackTimer: number | null = null;
    #leaveCompleted = false;
    protected readonly animationElement = viewChild.required<ElementRef<HTMLElement>>("animationElement");
    protected readonly componentOutlet = viewChild.required("componentOutlet", { read: ViewContainerRef });
    protected readonly hostClasses = computed(() => {
        const wrapperClass = this.wrapperClass();
        return ["mona-popup-wrapper", "w-full", "h-full", wrapperClass].filter(Boolean).join(" ");
    });
    protected readonly enterAnimationClasses = computed(() => this.#getAnimationConfig()?.enter ?? "");
    protected readonly leaveAnimationClasses = computed(() => this.#getAnimationConfig()?.leave ?? "");
    public readonly templateRef = signal<TemplateRef<any> | null>(null);
    public readonly visible = signal(true);
    public readonly wrapperClass = signal(
        this.#popupSettings.popupWrapperClass instanceof Array
            ? this.#popupSettings.popupWrapperClass.join(" ")
            : (this.#popupSettings.popupWrapperClass ?? "")
    );

    public constructor() {
        this.#popupReference.closeStart$.pipe(take(1), takeUntilDestroyed(this.#destroyRef)).subscribe(event => {
            this.#closeEvent = event;
            const animationElement = this.animationElement().nativeElement;
            this.visible.set(false);
            if (!this.leaveAnimationClasses()) {
                this.#completeClose();
                return;
            }
            this.#document.defaultView?.setTimeout(() => this.#startFallbackTimer(animationElement));
        });
        this.#destroyRef.onDestroy(() => this.#clearFallbackTimer());
    }

    public ngOnInit(): void {}

    public attachContent(
        content: TemplateRef<unknown> | ComponentType<unknown>,
        injector: Injector
    ): ComponentRef<any> | null {
        if (content instanceof TemplateRef) {
            this.templateRef.set(content);
            return null;
        }
        return this.componentOutlet().createComponent(content, { injector });
    }

    /**
     * Only completion events are observed. A cancellation is also raised when the enter animation is
     * replaced by the leave animation, so treating it as completion would dispose the overlay before
     * the leave animation had a chance to play. {@link #startFallbackTimer} covers genuine cancellations.
     */
    protected onNativeLeaveComplete(event: AnimationEvent | TransitionEvent): void {
        if (event.target !== event.currentTarget) {
            return;
        }
        this.#completeClose();
    }

    #getAnimationConfig(): Required<PopupAnimationSettings> | null {
        const config = this.#popupSettings.animation;
        if (config === false) {
            return null;
        }
        if (config == null || config === true) {
            return defaultPopupAnimation;
        }
        return {
            enter: config.enter ?? defaultPopupAnimation.enter,
            leave: config.leave ?? defaultPopupAnimation.leave
        };
    }

    #clearFallbackTimer(): void {
        if (this.#fallbackTimer == null) {
            return;
        }
        this.#document.defaultView?.clearTimeout(this.#fallbackTimer);
        this.#fallbackTimer = null;
    }

    #completeClose(): void {
        if (this.#leaveCompleted || this.#closeEvent == null) {
            return;
        }
        this.#leaveCompleted = true;
        this.#clearFallbackTimer();
        this.#popupReference.completeClose(this.#closeEvent);
    }

    #getLongestCssTime(style: CSSStyleDeclaration): number {
        return Math.max(
            this.#getLongestCssTimeFromProperties(style.animationDuration, style.animationDelay),
            this.#getLongestCssTimeFromProperties(style.transitionDuration, style.transitionDelay)
        );
    }

    #getLongestCssTimeFromProperties(durations: string, delays: string): number {
        const durationValues = durations.split(",").map(duration => this.#parseCssTime(duration));
        const delayValues = delays.split(",").map(delay => this.#parseCssTime(delay));
        const valueCount = Math.max(durationValues.length, delayValues.length);

        if (valueCount === 0) {
            return 0;
        }

        return Math.max(
            ...Array.from({ length: valueCount }, (_, index) => {
                const duration = durationValues[index % durationValues.length] ?? 0;
                const delay = delayValues[index % delayValues.length] ?? 0;
                return duration + delay;
            })
        );
    }

    #parseCssTime(value: string): number {
        const trimmedValue = value.trim();
        if (!trimmedValue) {
            return 0;
        }
        if (trimmedValue.endsWith("ms")) {
            return Number.parseFloat(trimmedValue);
        }
        if (trimmedValue.endsWith("s")) {
            return Number.parseFloat(trimmedValue) * 1000;
        }
        return 0;
    }

    #startFallbackTimer(animationElement: HTMLElement): void {
        if (this.#leaveCompleted) {
            return;
        }

        const win = this.#document.defaultView;
        if (!win) {
            this.#completeClose();
            return;
        }
        const duration = this.#getLongestCssTime(win.getComputedStyle(animationElement));
        if (duration <= 0) {
            this.#completeClose();
            return;
        }

        this.#fallbackTimer = win.setTimeout(() => this.#completeClose(), duration + 50);
    }
}
