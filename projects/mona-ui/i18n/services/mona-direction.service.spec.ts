import { Directionality } from "@angular/cdk/bidi";
import { Component, ElementRef, EventEmitter, inject } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { describe, expect, it, vi } from "vitest";
import { MonaI18nService } from "./mona-i18n.service";
import type { MonaTextDirection } from "../models/mona-direction";
import {
    injectComponentDirection,
    MonaDirectionService,
    observeComponentDirection,
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

        it("skips invalid or empty dir attribute and inherits from valid ancestor", () => {
            const root = document.createElement("div");
            root.setAttribute("dir", "rtl");

            const middle = document.createElement("div");
            middle.setAttribute("dir", "invalid");
            root.appendChild(middle);

            const child = document.createElement("span");
            middle.appendChild(child);

            expect(resolveComponentDirection(child, null)).toBe("rtl");

            middle.setAttribute("dir", "");
            expect(resolveComponentDirection(child, null)).toBe("rtl");

            middle.setAttribute("dir", "   ");
            expect(resolveComponentDirection(child, null)).toBe("rtl");
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

        it("trusts the platform for dir='auto' instead of a Unicode text heuristic", () => {
            const cases: Array<{ html: string; expected: "ltr" | "rtl"; note: string }> = [
                {
                    html: "\u0661\u0662\u0663 Hello",
                    expected: "ltr",
                    note: "Arabic-Indic digits are bidi class AN, not strong RTL"
                },
                {
                    html: "\u0905 \u0645\u0631\u062d\u0628\u0627",
                    expected: "ltr",
                    note: "Devanagari letter is the first strong L character"
                },
                {
                    html: "\u0645\u0631\u062d\u0628\u0627 Hello",
                    expected: "rtl",
                    note: "Arabic letter is the first strong R character"
                },
                {
                    html: '<span dir="rtl">\u0645\u0631\u062d\u0628\u0627</span> Hello',
                    expected: "ltr",
                    note: "nested explicit-direction subtree is excluded from the outer auto determination"
                },
                {
                    html: "<bdi>\u0645\u0631\u062d\u0628\u0627</bdi> Hello",
                    expected: "ltr",
                    note: "bdi subtrees are excluded from the outer auto determination"
                },
                {
                    html: "\u05B0Hello",
                    expected: "ltr",
                    note: "Hebrew combining mark (NSM) is not a strong character"
                }
            ];

            for (const { html, expected, note } of cases) {
                const container = document.createElement("div");
                container.setAttribute("dir", "auto");
                container.innerHTML = html;
                document.body.appendChild(container);

                const child = document.createElement("span");
                container.appendChild(child);

                expect(resolveComponentDirection(child, null), note).toBe(expected);
                // Mona's TypeScript direction must agree with the CSS the browser actually applies.
                expect(getComputedStyle(container).direction, note).toBe(expected);
                expect(child.matches(":dir(rtl)"), note).toBe(expected === "rtl");

                document.body.removeChild(container);
            }
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

            const expectAgreement = (expected: "ltr" | "rtl") => {
                expect(fixture.componentInstance.direction()).toBe(expected);
                expect(getComputedStyle(container).direction).toBe(expected);
                expect(fixture.nativeElement.matches(":dir(rtl)")).toBe(expected === "rtl");
            };

            expectAgreement("ltr");

            // Change content to Arabic text without changing dir attribute
            textSpan.textContent = "مرحبا بالعالم";
            await new Promise(resolve => setTimeout(resolve, 20));
            fixture.detectChanges();

            expectAgreement("rtl");

            // Switch content back to Latin text
            textSpan.textContent = "Welcome back";
            await new Promise(resolve => setTimeout(resolve, 20));
            fixture.detectChanges();

            expectAgreement("ltr");

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

        it("shares a single content MutationObserver across multiple consumers under the same dir='auto' root", async () => {
            const observeSpy = vi.spyOn(MutationObserver.prototype, "observe");
            const disconnectSpy = vi.spyOn(MutationObserver.prototype, "disconnect");

            const container = document.createElement("div");
            container.setAttribute("dir", "auto");
            const textSpan = document.createElement("span");
            textSpan.textContent = "Hello world";
            container.appendChild(textSpan);

            const children = Array.from({ length: 10 }, () => {
                const child = document.createElement("span");
                container.appendChild(child);
                return child;
            });
            document.body.appendChild(container);

            const observedDirections: MonaTextDirection[] = Array.from({ length: 10 }, () => "ltr");
            const cleanups = children.map((child, index) =>
                observeComponentDirection(child, null, dir => {
                    observedDirections[index] = dir;
                })
            );

            // Initial direction for all consumers should be LTR
            for (const child of children) {
                expect(resolveComponentDirection(child, null)).toBe("ltr");
            }

            // Only ONE content observer is attached to the container root, not 10
            const rootContentObserverCalls = observeSpy.mock.calls.filter(args => {
                const target = args[0] as Element;
                const options = args[1] as MutationObserverInit;
                return target === container && (options?.childList === true || options?.characterData === true);
            });
            expect(rootContentObserverCalls).toHaveLength(1);

            // Change content to Arabic text -> all 10 consumers update to RTL
            textSpan.textContent = "مرحبا بالعالم";
            await new Promise(resolve => setTimeout(resolve, 50));

            for (let i = 0; i < 10; i++) {
                expect(observedDirections[i]).toBe("rtl");
            }

            // Content change that does NOT change direction should not fire callbacks
            let spuriousCallbackFired = false;
            const extraCleanup = observeComponentDirection(children[0], null, () => {
                spuriousCallbackFired = true;
            });
            textSpan.textContent = "مرحبا بالجميع"; // Still RTL
            await new Promise(resolve => setTimeout(resolve, 50));
            expect(spuriousCallbackFired).toBe(false);
            extraCleanup();

            const previousDisconnectCount = disconnectSpy.mock.calls.length;

            // Destroy 9 consumers: root content observer must NOT disconnect
            for (let i = 0; i < 9; i++) {
                cleanups[i]();
            }
            // Disconnect should not have been called on the container observer yet
            const containerDisconnectsBeforeFinal = disconnectSpy.mock.calls.filter(
                call => call.length === 0 // disconnect() has 0 args
            );

            // Destroy the final consumer: now the shared observer disconnects
            cleanups[9]();
            expect(disconnectSpy.mock.calls.length).toBeGreaterThan(previousDisconnectCount);

            observeSpy.mockRestore();
            disconnectSpy.mockRestore();
            document.body.removeChild(container);
        });

        it("ignores intermediate invalid dir when finding auto root", async () => {
            const container = document.createElement("div");
            container.setAttribute("dir", "auto");
            const textSpan = document.createElement("span");
            textSpan.textContent = "Hello world";
            container.appendChild(textSpan);

            const invalidWrapper = document.createElement("div");
            invalidWrapper.setAttribute("dir", "garbage");
            container.appendChild(invalidWrapper);

            document.body.appendChild(container);

            let observedDir: MonaTextDirection = "ltr";
            const cleanup = observeComponentDirection(invalidWrapper, null, dir => {
                observedDir = dir;
            });

            expect(resolveComponentDirection(invalidWrapper, null)).toBe("ltr");

            textSpan.textContent = "مرحبا بالعالم";
            await new Promise(resolve => setTimeout(resolve, 50));

            expect(observedDir).toBe("rtl");

            cleanup();
            document.body.removeChild(container);
        });
    });
});
