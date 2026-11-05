import { LiveAnnouncer } from "@angular/cdk/a11y";
import { DOCUMENT, NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    afterRenderEffect,
    Component,
    computed,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    Injector,
    input,
    signal,
    TemplateRef,
    type Type,
    untracked,
    viewChild,
    ViewContainerRef
} from "@angular/core";
import { LucideBadgeInfo, LucideCircleCheckBig, LucideOctagonAlert, LucideOctagonX, LucideX } from "@lucide/angular";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { ProgressBarComponent } from "@nanahoshi/mona-ui/progress-bar";
import { NOTIFICATION_DEFAULT_MESSAGES } from "../../i18n/notification.default-messages";
import type { NotificationData } from "../../models/NotificationData";
import { NOTIFICATION_DATA, NOTIFICATION_DEFAULTS, NOTIFICATION_REF } from "../../tokens/notification.tokens";
import {
    notificationActionThemeVariants,
    notificationBaseThemeVariants,
    notificationBodyThemeVariants,
    notificationContentThemeVariants,
    notificationHeaderThemeVariants,
    notificationIconThemeVariants,
    notificationTextThemeVariants
} from "../../styles/notification.styles";

/** Elements that can take focus with Tab, for moving focus to another notification. */
const TABBABLE = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled]):not([type='hidden'])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])"
].join(", ");

/** How long closing waits for the leave animation before removing the notification anyway. */
const LEAVE_FALLBACK = 1000;

/**
 * Where focus goes back to once a notification closes, by notification element. Focus handed from one notification
 * to the next keeps the place it first came from.
 */
const RETURN_FOCUS = new WeakMap<Element, HTMLElement>();

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
        "[attr.data-closing]": "data().closing() ? '' : null",
        "[class.notification-leave-bottom]": "data().closing() && side() === 'bottom'",
        "[class.notification-leave-top]": "data().closing() && side() !== 'bottom'",
        "(focusin)": "onFocusIn($event)",
        "(focusout)": "onFocusOut($event)",
        "(pointerenter)": "onPointerChange(true)",
        "(pointerleave)": "onPointerChange(false)"
    }
})
export class NotificationComponent {
    readonly #announcer = inject(LiveAnnouncer);
    readonly #defaults = inject(NOTIFICATION_DEFAULTS);
    readonly #destroyRef = inject(DestroyRef);
    readonly #document = inject(DOCUMENT);
    readonly #focused = signal(false);
    readonly #host: ElementRef<HTMLElement> = inject(ElementRef);
    readonly #hovered = signal(false);
    readonly #i18n = inject(MonaI18nService);
    readonly #injector = inject(Injector);
    readonly #isUrgent = computed(() => this.type() === "error" || this.type() === "warning");
    /** Whether the countdown runs: there is one, and nothing pauses it. */
    readonly #running = computed(
        () =>
            this.options().duration != null &&
            !this.data().closing() &&
            !this.#hovered() &&
            !this.#focused() &&
            !this.#windowBlurred()
    );
    readonly #windowBlurred = signal(false);
    #closeTimer: ReturnType<typeof setTimeout> | null = null;
    #progressTimer: ReturnType<typeof setInterval> | null = null;
    #remaining: number | null = null;
    #startedAt = 0;
    protected readonly actionClass = computed(() => {
        return notificationActionThemeVariants();
    });
    protected readonly baseClass = computed(() => {
        return notificationBaseThemeVariants();
    });
    protected readonly bodyClass = computed(() => {
        return notificationBodyThemeVariants();
    });
    protected readonly closeTitle = computed(() => {
        return this.options().closeTitle ?? this.messages().close;
    });
    protected readonly contentClass = computed(() => {
        return notificationContentThemeVariants();
    });
    protected readonly contentComponent = computed(() => {
        const content = this.options().content;
        return typeof content !== "string" && !(content instanceof TemplateRef) ? (content as Type<unknown>) : null;
    });
    protected readonly contentHost = viewChild<unknown, ViewContainerRef>("contentHost", { read: ViewContainerRef });
    /** Gives a content component or template the notification's reference and data. */
    protected readonly contentInjector = computed(() => {
        const data = this.data();
        return Injector.create({
            parent: this.#injector,
            providers: [
                { provide: NOTIFICATION_REF, useValue: data.ref },
                { provide: NOTIFICATION_DATA, useValue: untracked(() => data.options().data) }
            ]
        });
    });
    protected readonly contentTemplate = computed(() => {
        const content = this.options().content;
        return content instanceof TemplateRef ? (content as TemplateRef<unknown>) : null;
    });
    protected readonly headerClass = computed(() => {
        return notificationHeaderThemeVariants();
    });
    protected readonly iconClass = computed(() => {
        const type = this.type();
        return notificationIconThemeVariants({ type });
    });
    protected readonly messageElement = viewChild<ElementRef<HTMLElement>>("message");
    protected readonly messages = this.#i18n.componentMessages("notification", NOTIFICATION_DEFAULT_MESSAGES);
    protected readonly options = computed(() => this.data().options());
    /** A theme color through its variable, so it follows a theme switch. */
    protected readonly progressColor = computed(() => `var(--color-${this.type()})`);
    protected readonly progressValue = signal(100);
    protected readonly stringContent = computed(() => {
        const content = this.options().content;
        return typeof content === "string" ? content : null;
    });
    protected readonly templateContext = computed(() => ({
        $implicit: this.data().ref,
        data: this.options().data
    }));
    protected readonly textClass = computed(() => {
        return notificationTextThemeVariants();
    });
    protected readonly title = computed(() => this.options().title ?? this.messages()[this.type()]);
    protected readonly type = computed(() => this.options().type ?? "info");

    /**
     * @description The notification's internal state, created and managed by `NotificationService`. Not intended to be provided directly by consumers.
     */
    public readonly data = input.required<NotificationData>();

    /**
     * @description The edge the notification's container is on, which its leave animation moves towards.
     */
    public readonly side = input<"top" | "bottom">("top");

    public constructor() {
        effect(() => {
            this.data().rendered = true;
        });
        effect(() => {
            const running = this.#running();
            untracked(() => (running ? this.#resume() : this.#pause()));
        });
        effect(() => {
            if (this.data().closing()) {
                untracked(() => this.#leave());
            }
        });
        afterRenderEffect({
            write: () => {
                const type = this.contentComponent();
                const host = this.contentHost();
                const injector = this.contentInjector();
                untracked(() => {
                    host?.clear();
                    const componentRef = type && host ? host.createComponent(type, { injector }) : null;
                    componentRef?.changeDetectorRef.detectChanges();
                    this.data().contentComponentRef.set(componentRef);
                });
            }
        });
        // Announced once rendered, and again when update() changes it. The notification itself isn't a live
        // region: one inserted with its text already in it is often skipped by screen readers.
        afterRenderEffect({
            read: () => {
                this.options();
                untracked(() => this.#announce());
            }
        });
        this.#listenForWindowFocus();
        this.#destroyRef.onDestroy(() => {
            this.#stopTimers();
            this.data().finish();
        });
    }

    public close(): void {
        this.data().close();
    }

    protected onFocusIn(event: FocusEvent): void {
        const host = this.#host.nativeElement;
        const from = event.relatedTarget;
        if (!this.#focused() && from instanceof HTMLElement && !host.contains(from)) {
            const fromNotification = from.closest(host.tagName);
            const target = fromNotification ? RETURN_FOCUS.get(fromNotification) : from;
            if (target) {
                RETURN_FOCUS.set(host, target);
            }
        }
        this.#focused.set(true);
    }

    protected onFocusOut(event: FocusEvent): void {
        const to = event.relatedTarget;
        if (to instanceof Node && this.#host.nativeElement.contains(to)) {
            return;
        }
        this.#focused.set(false);
    }

    protected onPointerChange(inside: boolean): void {
        this.#hovered.set(inside);
    }

    #announce(): void {
        const content = this.stringContent();
        const element = this.messageElement()?.nativeElement;
        const text =
            content != null
                ? `${this.title()} ${content}`
                : ((element as (HTMLElement & { innerText?: string }) | undefined)?.innerText ?? element?.textContent);
        const message = text?.replace(/\s+/g, " ").trim();
        if (message) {
            void this.#announcer.announce(message, this.#isUrgent() ? "assertive" : "polite");
        }
    }

    /** Plays the leave animation, then removes the notification. */
    #leave(): void {
        this.#stopTimers();
        this.#moveFocusAway();
        afterNextRender(
            {
                read: () => {
                    const host = this.#host.nativeElement;
                    const animation = this.#document.defaultView?.getComputedStyle(host).animationName;
                    if (!animation || animation === "none") {
                        this.data().finish();
                        return;
                    }
                    const done = (): void => {
                        clearTimeout(fallback);
                        host.removeEventListener("animationend", onEnd);
                        this.data().finish();
                    };
                    const onEnd = (event: AnimationEvent): void => {
                        if (event.target === host) {
                            done();
                        }
                    };
                    const fallback = setTimeout(done, LEAVE_FALLBACK);
                    host.addEventListener("animationend", onEnd);
                }
            },
            { injector: this.#injector }
        );
    }

    #listenForWindowFocus(): void {
        const view = this.#document.defaultView;
        if (!this.#defaults.pauseOnWindowBlur || !view) {
            return;
        }
        const blur = (): void => this.#windowBlurred.set(true);
        const focus = (): void => this.#windowBlurred.set(false);
        view.addEventListener("blur", blur);
        view.addEventListener("focus", focus);
        this.#destroyRef.onDestroy(() => {
            view.removeEventListener("blur", blur);
            view.removeEventListener("focus", focus);
        });
    }

    /** A closing notification that has focus hands it to the next notification, else back to where it came from. */
    #moveFocusAway(): void {
        const host = this.#host.nativeElement;
        const active = this.#document.activeElement;
        if (!(active instanceof HTMLElement) || !host.contains(active)) {
            return;
        }
        const siblings = Array.from(host.parentElement?.children ?? []).filter(
            element => element !== host && element.tagName === host.tagName && !element.hasAttribute("data-closing")
        );
        const isAfter = (element: Element): boolean =>
            !!(host.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING);
        const ordered = [...siblings.filter(isAfter), ...siblings.filter(element => !isAfter(element)).reverse()];
        for (const sibling of ordered) {
            const target = sibling.querySelector<HTMLElement>(TABBABLE);
            if (target) {
                target.focus();
                return;
            }
        }
        const returnFocus = RETURN_FOCUS.get(host);
        if (returnFocus?.isConnected) {
            returnFocus.focus();
            return;
        }
        active.blur();
    }

    #pause(): void {
        if (this.#closeTimer == null) {
            return;
        }
        const duration = this.options().duration ?? 0;
        this.#remaining = Math.max(0, (this.#remaining ?? duration) - (performance.now() - this.#startedAt));
        this.#stopTimers();
        this.progressValue.set(duration > 0 ? (this.#remaining / duration) * 100 : 0);
    }

    /** Runs the countdown from the time left, measured with the clock rather than by counting ticks. */
    #resume(): void {
        const duration = this.options().duration;
        if (duration == null || this.#closeTimer != null) {
            return;
        }
        const remaining = (this.#remaining ??= duration);
        this.#startedAt = performance.now();
        this.#closeTimer = setTimeout(() => {
            this.#closeTimer = null;
            this.#remaining = 0;
            this.#stopTimers();
            this.progressValue.set(0);
            this.data().close();
        }, remaining);
        if (this.options().progressBar && duration > 0) {
            const step = Math.min(100, Math.max(16, duration / 100));
            this.#progressTimer = setInterval(() => {
                const left = remaining - (performance.now() - this.#startedAt);
                this.progressValue.set(Math.max(0, (left / duration) * 100));
            }, step);
        }
    }

    #stopTimers(): void {
        if (this.#closeTimer != null) {
            clearTimeout(this.#closeTimer);
            this.#closeTimer = null;
        }
        if (this.#progressTimer != null) {
            clearInterval(this.#progressTimer);
            this.#progressTimer = null;
        }
    }
}
