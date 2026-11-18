import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    booleanAttribute,
    Component,
    computed,
    contentChild,
    type ElementRef,
    inject,
    input,
    output,
    TemplateRef,
    viewChild
} from "@angular/core";
import { LucideCircleCheck, LucideCircleX, LucideInfo, LucideTriangleAlert, LucideX } from "@lucide/angular";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { classInputToClass, type ClassInputType } from "@nanahoshi/mona-ui/common";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { injectLiveAnnouncer } from "@nanahoshi/mona-ui/internal/live-announcer";
import { twMerge } from "tailwind-merge";
import { AlertIconTemplateDirective } from "../../directives/alert-icon-template.directive";
import { ALERT_DEFAULT_MESSAGES } from "../../i18n/alert.default-messages";
import type { AlertAnnouncement } from "../../models/AlertAnnouncement";
import {
    ALERT_BODY_CLASSES,
    ALERT_DISMISS_CLASSES,
    ALERT_ICON_CLASSES,
    ALERT_TITLE_CLASSES,
    alertThemeVariants,
    type AlertVariantProps
} from "../../styles/alert.styles";

/**
 * A message that stays on the page, such as a failed payment above a form or a notice above a table, tinted by what it
 * means and marked with an icon. It can have a title, actions and a dismiss button, and it can be announced when it's
 * shown.
 */
@Component({
    selector: "mona-alert",
    templateUrl: "./alert.component.html",
    imports: [
        ButtonDirective,
        LucideCircleCheck,
        LucideCircleX,
        LucideInfo,
        LucideTriangleAlert,
        LucideX,
        NgTemplateOutlet
    ],
    host: {
        "[class]": "baseClass()"
    }
})
export class AlertComponent {
    readonly #announcer = injectLiveAnnouncer();
    readonly #i18n = inject(MonaI18nService);

    protected readonly baseClass = computed(() => twMerge(alertThemeVariants({ look: this.look() }), this.userClass()));
    protected readonly bodyClass = ALERT_BODY_CLASSES;
    protected readonly descriptionElement = viewChild.required<ElementRef<HTMLElement>>("descriptionElement");
    protected readonly dismissClass = ALERT_DISMISS_CLASSES;
    protected readonly iconClass = ALERT_ICON_CLASSES;
    protected readonly iconTemplate = contentChild(AlertIconTemplateDirective, { read: TemplateRef });
    protected readonly messages = this.#i18n.componentMessages("alert", ALERT_DEFAULT_MESSAGES);
    protected readonly titleClass = ALERT_TITLE_CLASSES;
    protected readonly titleElement = viewChild<ElementRef<HTMLElement>>("titleElement");

    /**
     * @description Reads the alert's title and text aloud once, when the alert is shown. Use it for an alert that appears
     * because of something the user did, such as a failed save: `assertive` interrupts, for something that needs
     * attention now, and `polite` waits for a pause. Leave it `off` for an alert that's part of the page when it loads.
     * @default "off"
     */
    public readonly announce = input<AlertAnnouncement>("off");

    /**
     * @description Emitted when the dismiss button is activated, with the click event. The alert doesn't hide itself:
     * remove it in your handler, and move focus to where the user can carry on, since the button goes with it.
     */
    public readonly dismiss = output<Event>();

    /**
     * @description Name of the dismiss button, in place of the localized "Dismiss", followed by the title when there is
     * one.
     * @default ""
     */
    public readonly dismissLabel = input("");

    /**
     * @description Shows a button in the alert's corner that emits `dismiss`.
     * @default false
     */
    public readonly dismissible = input(false, { transform: booleanAttribute });

    /**
     * @description What the alert means, which sets its tint, border and icon. Say it in the text too, since color and
     * shape alone don't reach everyone.
     * @default "info"
     */
    public readonly look = input<AlertVariantProps["look"]>("info");

    /**
     * @description Shows the look's icon before the text. A `monaAlertIconTemplate` replaces the icon.
     * @default true
     */
    public readonly showIcon = input(true, { transform: booleanAttribute });

    /**
     * @description A short heading above the text, in bold. It also names the dismiss button.
     * @default ""
     */
    public readonly title = input("");

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string, ClassInputType>("", {
        alias: "class",
        transform: value => classInputToClass(value)
    });

    public constructor() {
        afterNextRender({
            read: () => this.#announceOnShow()
        });
    }

    #announceOnShow(): void {
        const politeness = this.announce();
        if (politeness === "off") {
            return;
        }
        const message = [this.titleElement()?.nativeElement, this.descriptionElement().nativeElement]
            .map(element => element?.textContent?.replace(/\s+/g, " ").trim() ?? "")
            .filter(text => text !== "")
            .join(". ");
        if (message !== "") {
            void this.#announcer.announce(message, politeness);
        }
    }
}
