import { Directionality } from "@angular/cdk/bidi";
import { Component, ElementRef, EventEmitter, inject } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { describe, expect, it, vi } from "vitest";
import { MonaI18nService } from "./mona-i18n.service";
import {
    injectComponentDirection,
    MonaDirectionService,
    resolveComponentDirection
} from "./mona-direction.service";

@Component({
    selector: "mona-test-direction-consumer",
    template: "<div>consumer</div>"
})
class TestDirectionConsumerComponent {
    public readonly direction = injectComponentDirection();
}

describe("MonaDirectionService and direction utilities", () => {
    describe("resolveComponentDirection", () => {
        it("defaults to ltr when no element or directionality provided", () => {
            expect(resolveComponentDirection(null, null)).toBe("ltr");
            expect(resolveComponentDirection(undefined, undefined)).toBe("ltr");
        });

        it("respects CDK Directionality when element has no dir attribute", () => {
            const fakeDir = { value: "rtl", change: new EventEmitter<any>() } as Directionality;
            expect(resolveComponentDirection(null, fakeDir)).toBe("rtl");
        });

        it("respects element closest [dir] attribute", () => {
            const div = document.createElement("div");
            div.setAttribute("dir", "rtl");
            const child = document.createElement("span");
            div.appendChild(child);

            expect(resolveComponentDirection(child, null)).toBe("rtl");

            div.setAttribute("dir", "ltr");
            expect(resolveComponentDirection(child, null)).toBe("ltr");
        });

        it("prefers element [dir] attribute over root Directionality", () => {
            const fakeDir = { value: "ltr", change: new EventEmitter<any>() } as Directionality;
            const div = document.createElement("div");
            div.setAttribute("dir", "rtl");
            const child = document.createElement("span");
            div.appendChild(child);

            // Subtree is RTL even though root Directionality is LTR
            expect(resolveComponentDirection(child, fakeDir)).toBe("rtl");
        });
    });

    describe("injectComponentDirection", () => {
        it("returns ltr by default in standard LTR environment", () => {
            TestBed.configureTestingModule({
                imports: [TestDirectionConsumerComponent]
            });
            const fixture = TestBed.createComponent(TestDirectionConsumerComponent);
            fixture.detectChanges();
            expect(fixture.componentInstance.direction()).toBe("ltr");
        });

        it("returns rtl when host element has dir='rtl'", () => {
            TestBed.configureTestingModule({
                imports: [TestDirectionConsumerComponent]
            });
            const fixture = TestBed.createComponent(TestDirectionConsumerComponent);
            fixture.nativeElement.setAttribute("dir", "rtl");
            fixture.detectChanges();
            expect(fixture.componentInstance.direction()).toBe("rtl");
        });

        it("updates reactively when CDK directionality changes", () => {
            const changeEmitter = new EventEmitter<any>();
            const fakeDirectionality = { value: "ltr", change: changeEmitter };

            TestBed.configureTestingModule({
                imports: [TestDirectionConsumerComponent],
                providers: [{ provide: Directionality, useValue: fakeDirectionality }]
            });
            const fixture = TestBed.createComponent(TestDirectionConsumerComponent);
            fixture.detectChanges();
            expect(fixture.componentInstance.direction()).toBe("ltr");

            fakeDirectionality.value = "rtl";
            changeEmitter.emit("rtl");
            fixture.detectChanges();
            expect(fixture.componentInstance.direction()).toBe("rtl");
        });
    });

    describe("MonaDirectionService", () => {
        it("resolves direction correctly via injectable service", () => {
            TestBed.configureTestingModule({});
            const service = TestBed.inject(MonaDirectionService);
            expect(service.getDirection(null)).toBe("ltr");
            expect(service.isRtl(null)).toBe(false);

            const div = document.createElement("div");
            div.setAttribute("dir", "rtl");
            expect(service.getDirection(div)).toBe("rtl");
            expect(service.isRtl(div)).toBe(true);
        });
    });

    describe("Direction mismatch scenarios", () => {
        it("Case 2: RTL locale + LTR DOM maintains LTR direction", () => {
            TestBed.configureTestingModule({
                imports: [TestDirectionConsumerComponent]
            });
            const i18n = TestBed.inject(MonaI18nService);
            i18n.use({ id: "ar-SA", direction: "rtl", messages: {} });

            const fixture = TestBed.createComponent(TestDirectionConsumerComponent);
            fixture.detectChanges();

            // Locale is RTL, but DOM is LTR: direction must remain LTR
            expect(i18n.direction()).toBe("rtl");
            expect(fixture.componentInstance.direction()).toBe("ltr");
        });

        it("Case 3: LTR locale + RTL DOM resolves to RTL direction", () => {
            TestBed.configureTestingModule({
                imports: [TestDirectionConsumerComponent]
            });
            const i18n = TestBed.inject(MonaI18nService);
            i18n.use({ id: "en-US", direction: "ltr", messages: {} });

            const fixture = TestBed.createComponent(TestDirectionConsumerComponent);
            fixture.nativeElement.setAttribute("dir", "rtl");
            fixture.detectChanges();

            // Locale is LTR, but DOM is RTL: direction must be RTL
            expect(i18n.direction()).toBe("ltr");
            expect(fixture.componentInstance.direction()).toBe("rtl");
        });

        it("handles case-insensitive dir attribute values ('RTL', ' LTR ')", () => {
            const div = document.createElement("div");
            div.setAttribute("dir", "RTL");
            const child = document.createElement("span");
            div.appendChild(child);

            expect(resolveComponentDirection(child, null)).toBe("rtl");

            div.setAttribute("dir", " LTR ");
            expect(resolveComponentDirection(child, null)).toBe("ltr");
        });

        it("resolves dir='auto' using computed style direction", () => {
            const div = document.createElement("div");
            div.setAttribute("dir", "auto");
            div.style.direction = "rtl";
            document.body.appendChild(div);

            const child = document.createElement("span");
            div.appendChild(child);

            expect(resolveComponentDirection(child, null)).toBe("rtl");
            document.body.removeChild(div);
        });

        it("detects dynamic ancestor dir change via mutation observer", async () => {
            const parent = document.createElement("div");
            parent.setAttribute("dir", "ltr");
            document.body.appendChild(parent);

            TestBed.configureTestingModule({
                imports: [TestDirectionConsumerComponent]
            });
            const fixture = TestBed.createComponent(TestDirectionConsumerComponent);
            parent.appendChild(fixture.nativeElement);
            fixture.detectChanges();

            expect(fixture.componentInstance.direction()).toBe("ltr");

            parent.setAttribute("dir", "rtl");
            // Wait for MutationObserver callback to trigger
            await new Promise(resolve => setTimeout(resolve, 20));
            fixture.detectChanges();

            expect(fixture.componentInstance.direction()).toBe("rtl");

            document.body.removeChild(parent);
        });

        it("reacts dynamically to content-driven direction changes with dir='auto'", async () => {
            const container = document.createElement("div");
            container.setAttribute("dir", "auto");
            const textSpan = document.createElement("span");
            textSpan.textContent = "Hello world";
            container.appendChild(textSpan);
            document.body.appendChild(container);

            TestBed.configureTestingModule({
                imports: [TestDirectionConsumerComponent]
            });
            const fixture = TestBed.createComponent(TestDirectionConsumerComponent);
            container.appendChild(fixture.nativeElement);
            fixture.detectChanges();

            expect(fixture.componentInstance.direction()).toBe("ltr");

            // Change content to Arabic text without changing dir attribute
            textSpan.textContent = "مرحبا بالعالم";
            await new Promise(resolve => setTimeout(resolve, 20));
            fixture.detectChanges();

            expect(fixture.componentInstance.direction()).toBe("rtl");

            // Switch content back to Latin text
            textSpan.textContent = "Welcome back";
            await new Promise(resolve => setTimeout(resolve, 20));
            fixture.detectChanges();

            expect(fixture.componentInstance.direction()).toBe("ltr");

            document.body.removeChild(container);
        });

        it("does not install content observers for normal dir='ltr' or dir='rtl' consumers", () => {
            const observeSpy = vi.spyOn(MutationObserver.prototype, "observe");

            const div = document.createElement("div");
            div.setAttribute("dir", "ltr");
            document.body.appendChild(div);

            TestBed.configureTestingModule({
                imports: [TestDirectionConsumerComponent]
            });
            const fixture = TestBed.createComponent(TestDirectionConsumerComponent);
            div.appendChild(fixture.nativeElement);
            fixture.detectChanges();

            const contentObserverCalls = observeSpy.mock.calls.filter(args => {
                const options = args[1] as MutationObserverInit;
                return options?.childList === true || options?.characterData === true;
            });

            expect(contentObserverCalls).toHaveLength(0);

            observeSpy.mockRestore();
            document.body.removeChild(div);
        });
    });
});
