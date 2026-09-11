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
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { ProgressBarComponent } from "@nanahoshi/mona-ui/progress-bar";
import { asyncScheduler, interval, takeWhile } from "rxjs";
import { NOTIFICATION_DEFAULT_MESSAGES } from "../../i18n/notification.default-messages";
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
    readonly #i18n = inject(MonaI18nService);
    readonly #isUrgent = computed(() => this.type() === "error" || this.type() === "warning");
    readonly #paused = signal(false);
    protected readonly messages = this.#i18n.componentMessages("notification", NOTIFICATION_DEFAULT_MESSAGES);
    protected readonly actionClass = computed(() => {
        return notificationActionThemeVariants();
    });
    protected readonly ariaLive = computed(() => (this.#isUrgent() ? "assertive" : "polite"));
    protected readonly baseClass = computed(() => {
        return notificationBaseThemeVariants();
    });
    protected readonly bodyClass = computed(() => {
        return notificationBodyThemeVariants();
    });
    protected readonly closeTitle = computed(() => {
        return this.data().options.closeTitle ?? this.messages().close;
    });
    protected readonly contentClass = computed(() => {
        return notificationContentThemeVariants();
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
        return notificationHeaderThemeVariants();
    });
    protected readonly iconClass = computed(() => {
        const type = this.type();
        return notificationIconThemeVariants({ type });
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
        return notificationTextThemeVariants();
    });
    protected readonly type = computed(() => this.data().options.type ?? "info");
    protected readonly title = computed(() => this.data().options.title ?? this.messages()[this.type()]);
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
