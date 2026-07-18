import { Component, signal, TemplateRef, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Subject } from "rxjs";
import { NotificationData } from "../../models/NotificationData";
import { notificationBaseThemeVariants, notificationIconThemeVariants } from "../../styles/notification.styles";
import { NotificationComponent } from "./notification.component";

function createNotificationData(overrides: Partial<NotificationData["options"]> = {}): NotificationData {
    return {
        componentDestroy$: new Subject<string>(),
        options: {
            content: "Notification test",
            id: "test-id",
            ...overrides
        },
        afterHide$: new Subject(),
        contentComponentRef: signal(null)
    };
}

function createFixture(data: NotificationData): ComponentFixture<NotificationComponent> {
    const notificationFixture = TestBed.createComponent(NotificationComponent);
    notificationFixture.componentRef.setInput("data", data);
    notificationFixture.detectChanges();
    return notificationFixture;
}

async function wait(ms: number): Promise<void> {
    await new Promise<void>(resolve => setTimeout(resolve, ms));
}

describe("NotificationComponent", () => {
    let component: NotificationComponent;
    let fixture: ComponentFixture<NotificationComponent>;
    let notificationData: NotificationData;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [NotificationComponent]
        });
        notificationData = createNotificationData();
        fixture = createFixture(notificationData);
        component = fixture.componentInstance;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("uses an overlay surface while keeping semantic color on the status icon", () => {
        const notificationClasses = notificationBaseThemeVariants("mona")().split(/\s+/);
        const errorIconClasses = notificationIconThemeVariants("mona")({ type: "error" }).split(/\s+/);

        expect(notificationClasses).toContain("bg-surface-overlay");
        expect(notificationClasses).toContain("border-border");
        expect(notificationClasses).toContain("shadow-md");
        expect(notificationClasses).not.toContain("bg-error");
        expect(errorIconClasses).toContain("text-error");
    });

    it("should emit on componentDestroy$ when close() is called", () => {
        const emitted: string[] = [];
        notificationData.componentDestroy$.subscribe(id => emitted.push(id));

        component.close();

        expect(emitted).toEqual(["test-id"]);
    });

    it("should emit on componentDestroy$ when the component is destroyed", () => {
        const emitted: string[] = [];
        notificationData.componentDestroy$.subscribe(id => emitted.push(id));

        fixture.destroy();

        expect(emitted).toEqual(["test-id"]);
    });

    it("should use role=alert and aria-live=assertive for error/warning types", () => {
        const data = createNotificationData({ type: "error" });
        const errorFixture = createFixture(data);

        const host: HTMLElement = errorFixture.nativeElement.querySelector("[role]");
        expect(host.getAttribute("role")).toBe("alert");
        expect(host.getAttribute("aria-live")).toBe("assertive");
    });

    it("should use role=status and aria-live=polite for info/success types", () => {
        const data = createNotificationData({ type: "success" });
        const successFixture = createFixture(data);

        const host: HTMLElement = successFixture.nativeElement.querySelector("[role]");
        expect(host.getAttribute("role")).toBe("status");
        expect(host.getAttribute("aria-live")).toBe("polite");
    });

    it("should render string content", () => {
        expect(fixture.nativeElement.textContent).toContain("Notification test");
    });

    it("should render TemplateRef content", () => {
        @Component({
            template: `<ng-template #tpl>Templated content</ng-template>`
        })
        class HostComponent {
            readonly tpl = viewChild.required<TemplateRef<unknown>>("tpl");
        }

        const hostFixture = TestBed.createComponent(HostComponent);
        hostFixture.detectChanges();

        const data = createNotificationData({ content: hostFixture.componentInstance.tpl() });
        const templateFixture = createFixture(data);

        expect(templateFixture.nativeElement.textContent).toContain("Templated content");
    });

    it("should render a component content type", async () => {
        @Component({
            template: `Custom component content`
        })
        class CustomContentComponent {}

        const data = createNotificationData({ content: CustomContentComponent });
        const contentFixture = createFixture(data);
        contentFixture.detectChanges();

        expect(contentFixture.nativeElement.textContent).toContain("Custom component content");
        expect(data.contentComponentRef()).toBeTruthy();
    });

    describe("duration-based auto-dismiss", () => {
        const duration = 1000;
        const generousMargin = 3000;
        const shortMargin = 100;

        it("should call close() once the duration elapses", async () => {
            const data = createNotificationData({ duration, progressBar: true });
            createFixture(data);

            const emitted: string[] = [];
            data.componentDestroy$.subscribe(id => emitted.push(id));

            await wait(duration + generousMargin);

            expect(emitted).toEqual(["test-id"]);
        });

        it("should pause the countdown while hovered and resume after pointerleave", async () => {
            const data = createNotificationData({ duration, progressBar: true });
            const durationFixture = createFixture(data);

            const emitted: string[] = [];
            data.componentDestroy$.subscribe(id => emitted.push(id));

            const host: HTMLElement = durationFixture.nativeElement;
            host.dispatchEvent(new Event("pointerenter"));
            durationFixture.detectChanges();

            await wait(shortMargin);
            expect(emitted).toEqual([]);

            host.dispatchEvent(new Event("pointerleave"));
            durationFixture.detectChanges();

            await wait(duration + generousMargin);
            expect(emitted).toEqual(["test-id"]);
        });

        it("should pause the countdown while focused and resume after focusout", async () => {
            const data = createNotificationData({ duration, progressBar: true });
            const durationFixture = createFixture(data);

            const emitted: string[] = [];
            data.componentDestroy$.subscribe(id => emitted.push(id));

            const host: HTMLElement = durationFixture.nativeElement;
            host.dispatchEvent(new Event("focusin"));
            durationFixture.detectChanges();

            await wait(shortMargin);
            expect(emitted).toEqual([]);

            host.dispatchEvent(new Event("focusout"));
            durationFixture.detectChanges();

            await wait(duration + generousMargin);
            expect(emitted).toEqual(["test-id"]);
        });
    });
});
