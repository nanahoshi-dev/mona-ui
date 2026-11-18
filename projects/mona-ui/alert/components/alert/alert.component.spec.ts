import { LiveAnnouncer } from "@angular/cdk/a11y";
import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AlertActionsDirective } from "../../directives/alert-actions.directive";
import { AlertIconTemplateDirective } from "../../directives/alert-icon-template.directive";
import type { AlertAnnouncement } from "../../models/AlertAnnouncement";
import type { AlertVariantProps } from "../../styles/alert.styles";
import { AlertComponent } from "./alert.component";

@Component({
    imports: [AlertActionsDirective, AlertComponent, AlertIconTemplateDirective],
    template: `
        @if (shown()) {
            <mona-alert
                [announce]="announce()"
                [dismissible]="dismissible()"
                [dismissLabel]="dismissLabel()"
                [look]="look()"
                [showIcon]="showIcon()"
                [title]="title()"
                [class]="userClass()"
                (dismiss)="dismissed($event)">
                Your card was declined.
                @if (customIcon()) {
                    <ng-template monaAlertIconTemplate><span class="custom-icon">!</span></ng-template>
                }
                <div monaAlertActions>
                    <button type="button">Try again</button>
                </div>
            </mona-alert>
        }
    `
})
class HostComponent {
    public readonly announce = signal<AlertAnnouncement>("off");
    public readonly customIcon = signal(false);
    public readonly dismissLabel = signal("");
    public readonly dismissible = signal(false);
    public readonly events: Event[] = [];
    public readonly look = signal<AlertVariantProps["look"]>("info");
    public readonly showIcon = signal(true);
    public readonly shown = signal(true);
    public readonly title = signal("Payment failed");
    public readonly userClass = signal("");

    public dismissed(event: Event): void {
        this.events.push(event);
    }
}

describe("AlertComponent", () => {
    let fixture: ComponentFixture<HostComponent>;

    const alert = (): HTMLElement => fixture.nativeElement.querySelector("mona-alert");
    const dismissButton = (): HTMLButtonElement | null => alert().querySelector("button[aria-label]");
    const set = (change: (host: HostComponent) => void): void => {
        change(fixture.componentInstance);
        fixture.detectChanges();
    };

    beforeEach(() => {
        fixture = TestBed.createComponent(HostComponent);
        fixture.detectChanges();
    });

    afterEach(() => fixture.destroy());

    describe("content", () => {
        it("shows the title, the text and the actions in order", () => {
            const text = alert().textContent?.replace(/\s+/g, " ").trim();
            expect(text).toBe("Payment failed Your card was declined. Try again");
            const actions = alert().querySelector("[monaAlertActions]") as HTMLElement;
            expect(actions.classList).toContain("flex");
            expect(actions.previousElementSibling?.textContent?.trim()).toBe("Your card was declined.");
        });

        it("leaves the title out when there's none", () => {
            set(host => host.title.set(""));
            expect(alert().querySelector(".font-semibold")).toBeNull();
        });

        it("adds no role, so it reads as part of the page", () => {
            expect(alert().getAttribute("role")).toBeNull();
        });
    });

    describe("looks", () => {
        it("tints the alert and picks the icon for what it means", () => {
            expect(alert().classList).toContain("bg-info-subtle");
            expect(alert().querySelector("svg[lucideInfo]")).not.toBeNull();
            set(host => host.look.set("error"));
            expect(alert().classList).toContain("bg-error-subtle");
            expect(alert().classList).toContain("border-error-border");
            expect(alert().querySelector("svg[lucideCircleX]")).not.toBeNull();
            set(host => host.look.set("warning"));
            expect(alert().querySelector("svg[lucideTriangleAlert]")).not.toBeNull();
            set(host => host.look.set("success"));
            expect(alert().querySelector("svg[lucideCircleCheck]")).not.toBeNull();
            set(host => host.look.set("neutral"));
            expect(alert().classList).toContain("bg-secondary-subtle");
            expect(alert().querySelector("svg[lucideInfo]")).not.toBeNull();
        });

        it("hides the icon from assistive technology, and can leave it out or replace it", () => {
            const icon = alert().querySelector("span[aria-hidden='true']");
            expect(icon?.querySelector("svg")).not.toBeNull();
            set(host => host.customIcon.set(true));
            expect(alert().querySelector("span[aria-hidden='true'] .custom-icon")).not.toBeNull();
            expect(alert().querySelector("svg[lucideInfo]")).toBeNull();
            set(host => host.showIcon.set(false));
            expect(alert().querySelector("span[aria-hidden='true']")).toBeNull();
        });

        it("merges its class input", () => {
            set(host => host.userClass.set("p-2"));
            expect(alert().classList).toContain("p-2");
            expect(alert().classList).not.toContain("p-4");
        });
    });

    describe("dismissing", () => {
        it("has no dismiss button unless it's dismissible", () => {
            expect(dismissButton()).toBeNull();
        });

        it("names its button with the title and emits dismiss when it's activated", () => {
            set(host => host.dismissible.set(true));
            expect(dismissButton()?.getAttribute("aria-label")).toBe("Dismiss, Payment failed");
            expect(dismissButton()?.type).toBe("button");
            dismissButton()?.click();
            expect(fixture.componentInstance.events).toHaveLength(1);
            expect(fixture.componentInstance.events[0]).toBeInstanceOf(MouseEvent);
            // It's the page's to remove.
            expect(alert()).not.toBeNull();
        });

        it("names its button without a title, from dismissLabel, and in the locale", () => {
            set(host => {
                host.dismissible.set(true);
                host.title.set("");
            });
            expect(dismissButton()?.getAttribute("aria-label")).toBe("Dismiss");
            set(host => host.dismissLabel.set("Hide the notice"));
            expect(dismissButton()?.getAttribute("aria-label")).toBe("Hide the notice");
            set(host => host.dismissLabel.set(""));
            TestBed.inject(MonaI18nService).setMessages({ alert: { dismissLabel: title => `Close ${title ?? "it"}` } });
            fixture.detectChanges();
            expect(dismissButton()?.getAttribute("aria-label")).toBe("Close it");
        });
    });

    describe("announcing", () => {
        const showAgain = (announce: AlertAnnouncement): void => {
            set(host => host.shown.set(false));
            set(host => {
                host.announce.set(announce);
                host.shown.set(true);
            });
            TestBed.tick();
        };

        it("reads its title and text once when it's shown, without the actions", () => {
            const announce = vi.spyOn(TestBed.inject(LiveAnnouncer), "announce").mockResolvedValue();
            showAgain("assertive");
            expect(announce).toHaveBeenCalledTimes(1);
            expect(announce).toHaveBeenCalledWith("Payment failed. Your card was declined.", "assertive");
            set(host => host.look.set("warning"));
            expect(announce).toHaveBeenCalledTimes(1);
        });

        it("reads only the text when there's no title, politely when asked to", () => {
            const announce = vi.spyOn(TestBed.inject(LiveAnnouncer), "announce").mockResolvedValue();
            set(host => host.title.set(""));
            showAgain("polite");
            expect(announce).toHaveBeenCalledWith("Your card was declined.", "polite");
        });

        it("stays quiet by default", () => {
            const announce = vi.spyOn(TestBed.inject(LiveAnnouncer), "announce").mockResolvedValue();
            showAgain("off");
            expect(announce).not.toHaveBeenCalled();
        });
    });

    it("passes axe, dismissible or not", async () => {
        let result = await axe.run(fixture.nativeElement, { rules: { "color-contrast": { enabled: false } } });
        expect(result.violations).toEqual([]);
        set(host => host.dismissible.set(true));
        result = await axe.run(fixture.nativeElement, { rules: { "color-contrast": { enabled: false } } });
        expect(result.violations).toEqual([]);
    });
});
