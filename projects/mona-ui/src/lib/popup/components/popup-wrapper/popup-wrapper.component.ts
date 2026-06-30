import { ComponentType } from "@angular/cdk/overlay";
import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    ChangeDetectionStrategy,
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
import { PopupReferenceInjectionToken, PopupSettingsInjectionToken } from "../../models/PopupInjectionToken";
import { PopupAnimationSettings, PopupSettings } from "../../models/PopupSettings";

@Component({
    selector: "mona-popup-wrapper",
    templateUrl: "./popup-wrapper.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgTemplateOutlet],
    styles: [
        `
            :host {
                display: block;
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

            @media (prefers-reduced-motion: reduce) {
                .mona-popup-enter,
                .mona-popup-leave,
                .mona-dropdown-popup-enter,
                .mona-dropdown-popup-leave,
                .mona-popup-fade-enter,
                .mona-popup-fade-leave {
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
    public readonly wrapperClass = signal("");

    public constructor() {
        afterNextRender({
            read: () => {
                if (this.#popupSettings.popupWrapperClass != null) {
                    if (this.#popupSettings.popupWrapperClass instanceof Array) {
                        this.wrapperClass.set(this.#popupSettings.popupWrapperClass.join(" "));
                    } else {
                        this.wrapperClass.set(this.#popupSettings.popupWrapperClass);
                    }
                }
                this.#popupReference.closeStart$
                    .pipe(take(1), takeUntilDestroyed(this.#destroyRef))
                    .subscribe(event => {
                        this.#closeEvent = event;
                        const animationElement = this.animationElement().nativeElement;
                        this.visible.set(false);
                        if (!this.leaveAnimationClasses()) {
                            this.#completeClose();
                            return;
                        }
                        this.#document.defaultView?.setTimeout(() => this.#startFallbackTimer(animationElement));
                    });
            }
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
