import { Component, ViewContainerRef, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";

import { NotificationService } from "./notification.service";

async function flush(): Promise<void> {
    await new Promise<void>(resolve => setTimeout(resolve, 10));
}

async function waitUntil(predicate: () => boolean, timeoutMs = 1000, intervalMs = 20): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (!predicate()) {
        if (Date.now() >= deadline) {
            return;
        }
        await new Promise<void>(resolve => setTimeout(resolve, intervalMs));
    }
}

describe("NotificationService", () => {
    let service: NotificationService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(NotificationService);
    });

    afterEach(async () => {
        service.hideAll();
        await flush();
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    it("should default closable to true when neither closable nor duration is supplied", async () => {
        service.show({ content: "hello", id: "closable-default" });
        await waitUntil(() => document.body.querySelector("mona-notification") !== null);

        const closeButton = document.body.querySelector("mona-notification button");

        expect(closeButton).toBeTruthy();
    });

    it("should not force closable when duration is supplied and closable is unset", async () => {
        service.show({ content: "hello", id: "duration-only", duration: 5000 });
        await waitUntil(() => document.body.querySelector("mona-notification") !== null);

        const closeButton = document.body.querySelector("mona-notification button");

        expect(closeButton).toBeFalsy();
    });

    it("should not mutate the options object passed to show()", async () => {
        const options = { content: "hello" };
        service.show(options);
        await flush();

        expect(options).toEqual({ content: "hello" });
    });

    it("should return a ref for the existing notification when show() is called again with the same id", async () => {
        const first = service.show({ content: "hello", id: "duplicate-id" });
        await waitUntil(() => document.body.querySelectorAll("mona-notification").length === 1);
        service.show({ content: "hello again", id: "duplicate-id" });
        await flush();

        let hidden = false;
        first.afterHide.subscribe(() => (hidden = true));

        service.hide("duplicate-id");
        await waitUntil(() => hidden);

        expect(hidden).toBe(true);
        expect(document.body.querySelectorAll("mona-notification").length).toBe(1);
    });

    it("should reuse the same container for notifications in the same position", async () => {
        service.show({ content: "first", id: "pos-1", position: "bottomleft" });
        await flush();
        service.show({ content: "second", id: "pos-2", position: "bottomleft" });
        await flush();

        expect(document.body.querySelectorAll("mona-notification-container").length).toBe(1);
        expect(document.body.querySelectorAll("mona-notification").length).toBe(2);
    });

    it("should hide a specific notification by id", async () => {
        const ref = service.show({ content: "hello", id: "to-hide" });
        await flush();

        let hidden = false;
        ref.afterHide.subscribe(() => (hidden = true));

        service.hide("to-hide");
        await flush();

        expect(hidden).toBe(true);
    });

    it("should hide all notifications across positions", async () => {
        const refA = service.show({ content: "a", id: "a", position: "top" });
        const refB = service.show({ content: "b", id: "b", position: "bottom" });
        await flush();

        let hiddenA = false;
        let hiddenB = false;
        refA.afterHide.subscribe(() => (hiddenA = true));
        refB.afterHide.subscribe(() => (hiddenB = true));

        service.hideAll();
        await flush();

        expect(hiddenA).toBe(true);
        expect(hiddenB).toBe(true);
    });

    it("should append the notification container to a scoped ViewContainerRef when appendTo is provided", async () => {
        @Component({
            template: `<div #container></div>`
        })
        class HostComponent {
            readonly container = viewChild.required("container", { read: ViewContainerRef });
        }

        const hostFixture: ComponentFixture<HostComponent> = TestBed.createComponent(HostComponent);
        hostFixture.detectChanges();

        service.show({
            content: "scoped",
            id: "scoped-notification",
            appendTo: hostFixture.componentInstance.container()
        });
        await flush();

        expect(hostFixture.nativeElement.querySelector("mona-notification-container")).toBeTruthy();
    });
});
