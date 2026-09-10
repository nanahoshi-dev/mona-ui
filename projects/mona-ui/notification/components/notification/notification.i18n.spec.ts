import { signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { generatePseudoLocale, MonaI18nService, type MonaLocale } from "@nanahoshi/mona-ui/i18n";
import { Subject } from "rxjs";
import { describe, expect, it } from "vitest";
import { NOTIFICATION_DEFAULT_MESSAGES } from "../../i18n/notification.default-messages";
import { NotificationData } from "../../models/NotificationData";
import { NotificationType } from "../../models/NotificationType";
import { NotificationComponent } from "./notification.component";

function createNotificationData(overrides: Partial<NotificationData["options"]> = {}): NotificationData {
    return {
        componentDestroy$: new Subject<string>(),
        options: {
            content: "Notification i18n content",
            id: "i18n-test-id",
            closable: true,
            ...overrides
        },
        afterHide$: new Subject(),
        contentComponentRef: signal(null)
    };
}

function createFixture(data: NotificationData): ComponentFixture<NotificationComponent> {
    const fixture = TestBed.createComponent(NotificationComponent);
    fixture.componentRef.setInput("data", data);
    fixture.detectChanges();
    return fixture;
}

function getHeader(fixture: ComponentFixture<NotificationComponent>): HTMLElement | null {
    return fixture.nativeElement.querySelector(".select-none");
}

const TR_LOCALE: MonaLocale = {
    id: "tr-TR",
    direction: "ltr",
    messages: {
        notification: {
            close: "Kapat",
            error: "Hata",
            info: "Bilgi",
            success: "Başarılı",
            warning: "Uyarı"
        }
    }
};

describe("NotificationComponent i18n", () => {
    it("renders default English titles for all notification types when title is omitted", () => {
        TestBed.configureTestingModule({
            imports: [NotificationComponent]
        });

        const types: Array<{ type: NotificationType; expected: string }> = [
            { type: "info", expected: "Info" },
            { type: "success", expected: "Success" },
            { type: "warning", expected: "Warning" },
            { type: "error", expected: "Error" }
        ];

        for (const { type, expected } of types) {
            const data = createNotificationData({ type });
            const fixture = createFixture(data);
            const header = getHeader(fixture);
            expect(header?.textContent?.trim()).toBe(expected);
        }
    });

    it("renders default English close button title and aria-label", () => {
        TestBed.configureTestingModule({
            imports: [NotificationComponent]
        });

        const data = createNotificationData();
        const fixture = createFixture(data);

        const closeBtn = fixture.nativeElement.querySelector("button");
        expect(closeBtn.getAttribute("title")).toBe("Close");
        expect(closeBtn.getAttribute("aria-label")).toBe("Close");
    });

    it("reactively updates default title and close labels on runtime locale switch for an already mounted notification", async () => {
        TestBed.configureTestingModule({
            imports: [NotificationComponent]
        });

        const data = createNotificationData({ type: "info" });
        const fixture = createFixture(data);
        const i18n = TestBed.inject(MonaI18nService);

        const header = getHeader(fixture);
        const closeBtn = fixture.nativeElement.querySelector("button");

        // 1. Initial English defaults
        expect(header?.textContent?.trim()).toBe("Info");
        expect(closeBtn.getAttribute("title")).toBe("Close");
        expect(closeBtn.getAttribute("aria-label")).toBe("Close");

        // 2. Switch to Turkish without destroying or recreating the component
        i18n.use(TR_LOCALE);
        fixture.detectChanges();
        await fixture.whenStable();

        expect(header?.textContent?.trim()).toBe("Bilgi");
        expect(closeBtn.getAttribute("title")).toBe("Kapat");
        expect(closeBtn.getAttribute("aria-label")).toBe("Kapat");

        // 3. Switch back to English
        i18n.use({ id: "en-US", direction: "ltr", messages: {} });
        fixture.detectChanges();
        await fixture.whenStable();

        expect(header?.textContent?.trim()).toBe("Info");
        expect(closeBtn.getAttribute("title")).toBe("Close");
        expect(closeBtn.getAttribute("aria-label")).toBe("Close");
    });

    it("preserves explicit consumer title and closeTitle across locale switches", async () => {
        TestBed.configureTestingModule({
            imports: [NotificationComponent]
        });

        const data = createNotificationData({
            title: "Custom Consumer Title",
            closeTitle: "Custom Dismiss"
        });
        const fixture = createFixture(data);
        const i18n = TestBed.inject(MonaI18nService);

        const header = getHeader(fixture);
        const closeBtn = fixture.nativeElement.querySelector("button");

        expect(header?.textContent?.trim()).toBe("Custom Consumer Title");
        expect(closeBtn.getAttribute("title")).toBe("Custom Dismiss");
        expect(closeBtn.getAttribute("aria-label")).toBe("Custom Dismiss");

        // Switch to Turkish
        i18n.use(TR_LOCALE);
        fixture.detectChanges();
        await fixture.whenStable();

        // Must NOT be overridden by localized defaults
        expect(header?.textContent?.trim()).toBe("Custom Consumer Title");
        expect(closeBtn.getAttribute("title")).toBe("Custom Dismiss");
        expect(closeBtn.getAttribute("aria-label")).toBe("Custom Dismiss");
    });

    it("prioritizes application patchMessages over active locale messages", async () => {
        TestBed.configureTestingModule({
            imports: [NotificationComponent]
        });

        const data = createNotificationData({ type: "warning" });
        const fixture = createFixture(data);
        const i18n = TestBed.inject(MonaI18nService);

        i18n.use(TR_LOCALE);
        fixture.detectChanges();
        await fixture.whenStable();

        const header = getHeader(fixture);
        expect(header?.textContent?.trim()).toBe("Uyarı");

        // Application patch
        i18n.patchMessages({
            notification: {
                warning: "DİKKAT!"
            }
        });
        fixture.detectChanges();
        await fixture.whenStable();

        expect(header?.textContent?.trim()).toBe("DİKKAT!");

        // Clear overrides
        i18n.clearMessages();
        fixture.detectChanges();
        await fixture.whenStable();

        expect(header?.textContent?.trim()).toBe("Uyarı");
    });

    it("applies pseudo-localization to notification defaults", async () => {
        TestBed.configureTestingModule({
            imports: [NotificationComponent]
        });

        const data = createNotificationData({ type: "success" });
        const fixture = createFixture(data);
        const i18n = TestBed.inject(MonaI18nService);

        const pseudo = generatePseudoLocale({
            notification: NOTIFICATION_DEFAULT_MESSAGES
        });
        i18n.use(pseudo);
        fixture.detectChanges();
        await fixture.whenStable();

        const header = getHeader(fixture);
        const closeBtn = fixture.nativeElement.querySelector("button");

        expect(header?.textContent?.trim()).toContain("[!!");
        expect(closeBtn.getAttribute("title")).toContain("[!!");
    });
});
