import { LiveAnnouncer } from "@angular/cdk/a11y";
import { ApplicationRef, Component, inject, type TemplateRef, viewChild, ViewContainerRef } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { notificationBaseThemeVariants, notificationIconThemeVariants } from "../styles/notification.styles";
import type { NotificationRef } from "../models/NotificationRef";
import { provideNotificationDefaults } from "../providers/notification.providers";
import { NotificationService } from "../services/notification.service";
import { NOTIFICATION_DATA, NOTIFICATION_REF } from "../tokens/notification.tokens";

@Component({
    template: `<p id="injected">{{ data.label }} {{ ref.id }}</p>`
})
class InjectingContentComponent {
    public readonly data = inject<{ label: string }>(NOTIFICATION_DATA);
    public readonly ref = inject(NOTIFICATION_REF);
}

@Component({
    template: `
        <button id="trigger">Save</button>
        <div id="scope" #scope></div>
        <ng-template #tpl let-ref let-data="data">
            <p id="templated">{{ data }} {{ ref.id }}</p>
            <button id="undo" (click)="ref.hide()">Undo</button>
        </ng-template>
    `
})
class HostComponent {
    public readonly scope = viewChild.required("scope", { read: ViewContainerRef });
    public readonly tpl = viewChild.required<TemplateRef<unknown>>("tpl");
}

const FAKE_TIMERS: Parameters<typeof vi.useFakeTimers>[0] = {
    toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "performance"]
};

describe("Notification behavior", () => {
    let service: NotificationService;
    let announce: ReturnType<typeof vi.fn<LiveAnnouncer["announce"]>>;

    function setup(providers: unknown[] = []): void {
        TestBed.configureTestingModule({ providers: providers as never[] });
        service = TestBed.inject(NotificationService);
        announce = vi.fn<LiveAnnouncer["announce"]>().mockResolvedValue(undefined);
        vi.spyOn(TestBed.inject(LiveAnnouncer), "announce").mockImplementation(announce);
    }

    function settle(): void {
        TestBed.inject(ApplicationRef).tick();
    }

    function containers(): HTMLElement[] {
        return Array.from(document.querySelectorAll<HTMLElement>("mona-notification-container"));
    }

    function notifications(): HTMLElement[] {
        return Array.from(document.querySelectorAll<HTMLElement>("mona-notification"));
    }

    function hidden(ref: NotificationRef): () => boolean {
        let done = false;
        ref.afterHide.subscribe(() => (done = true));
        return () => done;
    }

    afterEach(() => {
        service?.hideAll();
        settle();
        vi.useRealTimers();
        vi.restoreAllMocks();
        TestBed.resetTestingModule();
        document.querySelectorAll("mona-notification-container").forEach(element => element.remove());
    });

    it("uses an overlay surface while keeping semantic color on the status icon", () => {
        expect(notificationBaseThemeVariants().split(/\s+/)).toContain(
            "[background-color:var(--mona-effect-overlay-background-color,var(--color-surface-overlay))]"
        );
        expect(notificationIconThemeVariants({ type: "error" }).split(/\s+/)).toContain("text-error");
    });

    describe("containers", () => {
        it("leaves nothing behind when shown and hidden in the same tick, however often", () => {
            setup();
            const ref = service.show({ content: "a" });
            const isHidden = hidden(ref);
            ref.hide();
            expect(isHidden()).toBe(true);
            for (let i = 0; i < 20; i++) {
                service.show({ content: `pair ${i}` }).hide();
            }
            settle();
            expect(containers()).toHaveLength(0);

            service.show({ content: "b", id: "b" });
            service.hide("b");
            service.show({ content: "c", id: "c" });
            settle();
            expect(containers()).toHaveLength(1);
            expect(notifications()).toHaveLength(1);
            expect(notifications()[0].textContent).toContain("c");
        });

        it("is a named region in the app's direction and language, removed once its last notification closes", () => {
            setup();
            document.documentElement.setAttribute("dir", "rtl");
            try {
                const ref = service.show({ content: "Saved" });
                settle();
                const [container] = containers();
                expect(container.getAttribute("role")).toBe("region");
                expect(container.getAttribute("aria-label")).toBe("Notifications");
                expect(container.getAttribute("lang")).toBeTruthy();
                ref.hide();
                settle();
                expect(containers()).toHaveLength(0);
            } finally {
                document.documentElement.removeAttribute("dir");
            }
        });

        it("keeps one container per position, returns the same ref for a repeated id, and can be scoped", () => {
            setup();
            const fixture = TestBed.createComponent(HostComponent);
            document.body.append(fixture.nativeElement);
            fixture.detectChanges();
            const first = service.show({ content: "one", id: "same" });
            expect(service.show({ content: "two", id: "same" })).toBe(first);
            service.show({ content: "three", position: "bottomleft" });
            service.show({ appendTo: fixture.componentInstance.scope(), content: "four", position: "bottom" });
            settle();
            expect(containers()).toHaveLength(3);
            expect(fixture.nativeElement.querySelector("#scope mona-notification-container")).not.toBeNull();
            fixture.destroy();
        });

        it("removes its containers when the application is destroyed", () => {
            setup();
            service.show({ content: "a" });
            settle();
            expect(containers()).toHaveLength(1);
            TestBed.resetTestingModule();
            expect(containers()).toHaveLength(0);
        });
    });

    describe("timing", () => {
        it("closes after its duration by the clock, with a close button by default", () => {
            vi.useFakeTimers(FAKE_TIMERS);
            setup();
            const ref = service.show({ content: "Saved", duration: 300, progressBar: true });
            const isHidden = hidden(ref);
            settle();
            expect(notifications()[0].querySelector("button[aria-label='Close']")).not.toBeNull();
            vi.advanceTimersByTime(150);
            settle();
            const bar = notifications()[0].querySelector("mona-progress-bar")!;
            expect(bar.parentElement?.getAttribute("aria-hidden")).toBe("true");
            vi.advanceTimersByTime(149);
            settle();
            expect(isHidden()).toBe(false);
            vi.advanceTimersByTime(1);
            settle();
            expect(isHidden()).toBe(true);
            expect(containers()).toHaveLength(0);
        });

        it("doesn't close while focus is inside, even when the pointer comes and goes, and resumes with the time left", () => {
            vi.useFakeTimers(FAKE_TIMERS);
            setup();
            const ref = service.show({ content: "Saved", duration: 1000 });
            const isHidden = hidden(ref);
            settle();
            const element = notifications()[0];
            vi.advanceTimersByTime(400);
            element.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
            settle();
            element.dispatchEvent(new PointerEvent("pointerenter"));
            element.dispatchEvent(new PointerEvent("pointerleave"));
            settle();
            vi.advanceTimersByTime(5000);
            settle();
            expect(isHidden()).toBe(false);

            element.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: document.body }));
            settle();
            vi.advanceTimersByTime(599);
            settle();
            expect(isHidden()).toBe(false);
            vi.advanceTimersByTime(1);
            settle();
            expect(isHidden()).toBe(true);
        });

        it("pauses while the window is in the background", () => {
            vi.useFakeTimers(FAKE_TIMERS);
            setup();
            const isHidden = hidden(service.show({ content: "Saved", duration: 500 }));
            settle();
            window.dispatchEvent(new Event("blur"));
            settle();
            vi.advanceTimersByTime(2000);
            settle();
            expect(isHidden()).toBe(false);
            window.dispatchEvent(new Event("focus"));
            settle();
            vi.advanceTimersByTime(500);
            settle();
            expect(isHidden()).toBe(true);
        });

        it("follows provideNotificationDefaults: no auto-hide, a longer duration, and a stacking limit", () => {
            vi.useFakeTimers(FAKE_TIMERS);
            setup([provideNotificationDefaults({ autoHide: false })]);
            const kept = hidden(service.show({ content: "kept", duration: 100 }));
            settle();
            vi.advanceTimersByTime(10_000);
            settle();
            expect(kept()).toBe(false);
            service.hideAll();
            settle();
            TestBed.resetTestingModule();

            setup([provideNotificationDefaults({ durationScale: 3, maxVisible: 2 })]);
            const scaled = hidden(service.show({ content: "scaled", duration: 100 }));
            settle();
            vi.advanceTimersByTime(299);
            settle();
            expect(scaled()).toBe(false);
            vi.advanceTimersByTime(1);
            settle();
            expect(scaled()).toBe(true);

            const oldest = hidden(service.show({ content: "1" }));
            service.show({ content: "2" });
            settle();
            service.show({ content: "3" });
            settle();
            expect(oldest()).toBe(true);
            expect(notifications()).toHaveLength(2);
        });
    });

    describe("announcements and focus", () => {
        it("announces through the live announcer instead of inserting a filled live region, and again on update", () => {
            setup();
            const ref = service.show({ content: "Saved", type: "success" });
            settle();
            expect(announce).toHaveBeenLastCalledWith("Success Saved", "polite");
            expect(
                document.querySelector("mona-notification [role='status'], mona-notification [role='alert']")
            ).toBeNull();

            ref.update({ content: "Upload failed", type: "error" });
            settle();
            expect(notifications()[0].textContent).toContain("Upload failed");
            expect(announce).toHaveBeenLastCalledWith("Error Upload failed", "assertive");
        });

        it("hands focus to the next notification when a focused one closes, and back to the trigger after the last", () => {
            setup();
            const fixture = TestBed.createComponent(HostComponent);
            document.body.append(fixture.nativeElement);
            fixture.detectChanges();
            const trigger = fixture.nativeElement.querySelector("#trigger") as HTMLButtonElement;
            service.show({ content: "first" });
            service.show({ content: "second" });
            settle();
            const [first, second] = notifications().map(element => element.querySelector("button")!);

            trigger.focus();
            first.focus();
            first.dispatchEvent(new FocusEvent("focusin", { bubbles: true, relatedTarget: trigger }));
            first.click();
            settle();
            expect(document.activeElement).toBe(second);

            second.dispatchEvent(new FocusEvent("focusin", { bubbles: true, relatedTarget: first }));
            second.click();
            settle();
            expect(document.activeElement).toBe(trigger);
            fixture.destroy();
        });
    });

    describe("content", () => {
        it("gives a content component its ref and data", () => {
            setup();
            const ref = service.show({ content: InjectingContentComponent, data: { label: "Report" }, id: "report" });
            settle();
            expect(document.querySelector("#injected")?.textContent).toBe("Report report");
            expect(ref.content?.instance).toBeInstanceOf(InjectingContentComponent);
            expect(announce).toHaveBeenLastCalledWith("Report report", "polite");
        });

        it("gives a template the ref as $implicit and the data", () => {
            setup();
            const fixture = TestBed.createComponent(HostComponent);
            fixture.detectChanges();
            const ref = service.show({ content: fixture.componentInstance.tpl(), data: "Moved", id: "moved" });
            const isHidden = hidden(ref);
            settle();
            expect(document.querySelector("#templated")?.textContent).toBe("Moved moved");
            (document.querySelector("#undo") as HTMLButtonElement).click();
            settle();
            expect(isHidden()).toBe(true);
            fixture.destroy();
        });

        it("emits afterHide only once the leave animation has ended", () => {
            setup();
            const ref = service.show({ content: "Saved" });
            const isHidden = hidden(ref);
            settle();
            const element = notifications()[0];
            element.style.animationName = "notification-slide-out-top";
            ref.hide();
            settle();
            expect(element.hasAttribute("data-closing")).toBe(true);
            expect(isHidden()).toBe(false);
            element.dispatchEvent(new Event("animationend"));
            settle();
            expect(isHidden()).toBe(true);
            expect(containers()).toHaveLength(0);
        });

        it("draws the countdown in the type's theme color, so it follows a theme switch", () => {
            setup();
            service.show({ content: "Saved", duration: 5000, progressBar: true, type: "success" });
            settle();
            const bar = notifications()[0].querySelector<HTMLElement>("mona-progress-bar [style*='background-color']");
            expect(bar?.style.backgroundColor).toBe("var(--color-success)");
        });
    });
});
