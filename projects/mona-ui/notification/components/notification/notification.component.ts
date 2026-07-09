import { DOCUMENT, NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    Component,
    computed,
    DestroyRef,
    inject,
    input,
    signal,
    TemplateRef,
    Type,
    viewChild,
    ViewContainerRef
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { LucideBadgeInfo, LucideCircleCheckBig, LucideOctagonAlert, LucideOctagonX, LucideX } from "@lucide/angular";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { ProgressBarComponent } from "@nanahoshi/mona-ui/progress-bar";
import { ThemeService } from "@nanahoshi/mona-ui/theme";
import { asyncScheduler, interval, takeWhile } from "rxjs";
import { NotificationData } from "../../models/NotificationData";
import {
    notificationActionThemeVariants,
    notificationBaseThemeVariants,
    notificationBodyThemeVariants,
    notificationContentThemeVariants,
    notificationHeaderThemeVariants,
    notificationIconThemeVariants,
    notificationTextThemeVariants
} from "../../styles/notification.styles";

@Component({
    selector: "mona-notification",
    templateUrl: "./notification.component.html",
    styleUrl: "./notification.component.css",
    imports: [
        NgTemplateOutlet,
        ProgressBarComponent,
        ButtonDirective,
        LucideOctagonX,
        LucideBadgeInfo,
        LucideCircleCheckBig,
        LucideOctagonAlert,
        LucideX
    ],
    host: {
        "(pointerenter)": "onInteractionStart()",
        "(pointerleave)": "onInteractionEnd()",
        "(focusin)": "onInteractionStart()",
        "(focusout)": "onInteractionEnd()"
    }
})
export class NotificationComponent {
    readonly #destroyRef = inject(DestroyRef);
    readonly #document = inject(DOCUMENT);
    readonly #isUrgent = computed(() => this.type() === "error" || this.type() === "warning");
    readonly #paused = signal(false);
    readonly #themeService = inject(ThemeService);
    protected readonly actionClass = computed(() => {
        const theme = this.#themeService.theme();
        return notificationActionThemeVariants(theme)();
    });
    protected readonly ariaLive = computed(() => (this.#isUrgent() ? "assertive" : "polite"));
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        return notificationBaseThemeVariants(theme)();
    });
    protected readonly bodyClass = computed(() => {
        const theme = this.#themeService.theme();
        return notificationBodyThemeVariants(theme)();
    });
    protected readonly contentClass = computed(() => {
        const theme = this.#themeService.theme();
        return notificationContentThemeVariants(theme)();
    });
    protected readonly contentComponent = computed(() => {
        const content = this.data().options.content;
        return typeof content !== "string" && !(content instanceof TemplateRef) ? (content as Type<unknown>) : null;
    });
    protected readonly contentTemplate = computed(() => {
        const content = this.data().options.content;
        return content instanceof TemplateRef ? (content as TemplateRef<unknown>) : null;
    });
    protected readonly contentHost = viewChild<unknown, ViewContainerRef>("contentHost", { read: ViewContainerRef });
    protected readonly headerClass = computed(() => {
        const theme = this.#themeService.theme();
        return notificationHeaderThemeVariants(theme)();
    });
    protected readonly iconClass = computed(() => {
        const theme = this.#themeService.theme();
        const type = this.type();
        return notificationIconThemeVariants(theme)({ type });
    });
    protected readonly isStringContent = computed(() => typeof this.data().options.content === "string");
    protected readonly progressColor = computed(() => {
        const type = this.type();
        const propertyName = `--color-${type}`;
        return getComputedStyle(this.#document.documentElement).getPropertyValue(propertyName);
    });
    protected readonly progressValue = signal(100);
    protected readonly role = computed(() => (this.#isUrgent() ? "alert" : "status"));
    protected readonly textClass = computed(() => {
        const theme = this.#themeService.theme();
        return notificationTextThemeVariants(theme)();
    });
    protected readonly type = computed(() => this.data().options.type ?? "info");
    /**
     * @description The notification's internal state, created and managed by `NotificationService`. Not intended to be provided directly by consumers.
     */
    public readonly data = input.required<NotificationData>();

    public constructor() {
        afterNextRender({
            write: () => {
                this.#setupProgressBar();
                const type = this.contentComponent();
                const vcr = this.contentHost();
                if (type && vcr) {
                    this.data().contentComponentRef.set(vcr.createComponent(type));
                }
            }
        });
        this.#destroyRef.onDestroy(() => this.data().componentDestroy$.next(this.data().options.id as string));
    }

    public close(): void {
        this.data().componentDestroy$.next(this.data().options.id as string);
    }

    protected onInteractionEnd(): void {
        this.#paused.set(false);
    }

    protected onInteractionStart(): void {
        this.#paused.set(true);
    }

    #setupProgressBar(): void {
        const duration = this.data().options.duration;
        if (duration == null) {
            return;
        }
        const progressInterval = Math.max(duration, 100) / 100;
        interval(progressInterval)
            .pipe(
                takeWhile(() => this.progressValue() > 0),
                takeUntilDestroyed(this.#destroyRef)
            )
            .subscribe({
                next: () => {
                    if (this.#paused()) {
                        return;
                    }
                    this.progressValue.set(this.progressValue() - 1);
                    if (this.progressValue() === 0) {
                        asyncScheduler.schedule(() => {
                            this.close();
                        }, 300);
                    }
                }
            });
    }
}
