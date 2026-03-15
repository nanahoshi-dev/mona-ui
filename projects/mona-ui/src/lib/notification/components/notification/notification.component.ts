import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    inject,
    input,
    signal,
    TemplateRef,
    Type,
    ViewContainerRef,
    viewChild
} from "@angular/core";
import { BadgeInfo, CircleCheckBig, LucideAngularModule, OctagonAlert, OctagonX, X } from "lucide-angular";
import { asyncScheduler, interval, takeWhile } from "rxjs";
import { ButtonDirective } from "../../../buttons/button/directives/button.directive";
import { ProgressBarComponent } from "../../../progress-bars/progress-bar/components/progress-bar/progress-bar.component";
import { ThemeService } from "../../../theme/services/theme.service";
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
    styleUrl: "./notification.component.scss",
    imports: [NgTemplateOutlet, ProgressBarComponent, LucideAngularModule, ButtonDirective],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationComponent {
    readonly #themeService = inject(ThemeService);
    protected readonly actionClass = computed(() => {
        const theme = this.#themeService.theme();
        return notificationActionThemeVariants(theme)();
    });
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        return notificationBaseThemeVariants(theme)();
    });
    protected readonly bodyClass = computed(() => {
        const theme = this.#themeService.theme();
        return notificationBodyThemeVariants(theme)();
    });
    protected readonly closeIcon = X;
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
    protected readonly errorIcon = OctagonX;
    protected readonly headerClass = computed(() => {
        const theme = this.#themeService.theme();
        return notificationHeaderThemeVariants(theme)();
    });
    protected readonly iconClass = computed(() => {
        const theme = this.#themeService.theme();
        const type = this.type();
        return notificationIconThemeVariants(theme)({ type });
    });
    protected readonly infoIcon = BadgeInfo;
    protected readonly isStringContent = computed(() => typeof this.data().options.content === "string");
    protected readonly progressColor = computed(() => {
        const type = this.type();
        const propertyName = `--color-${type}`;
        return getComputedStyle(document.documentElement).getPropertyValue(propertyName);
    });
    protected readonly progressValue = signal(100);
    protected readonly successIcon = CircleCheckBig;
    protected readonly textClass = computed(() => {
        const theme = this.#themeService.theme();
        return notificationTextThemeVariants(theme)();
    });
    protected readonly type = computed(() => this.data().options.type ?? "info");
    protected readonly warningIcon = OctagonAlert;
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
        inject(DestroyRef).onDestroy(() => this.data().componentDestroy$.next(this.data().options.id as string));
    }

    public close(): void {
        this.data().componentDestroy$.next(this.data().options.id as string);
    }

    #setupProgressBar(): void {
        const duration = this.data().options.duration;
        if (duration == null) {
            return;
        }
        const progressInterval = duration / 100;
        interval(progressInterval)
            .pipe(takeWhile(() => this.progressValue() > 0))
            .subscribe({
                next: () => {
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
