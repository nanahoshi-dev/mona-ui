import { ElementRef } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { Observable, of, Subject, throwError } from "rxjs";
import { SpinnerService } from "./spinner.service";

describe("SpinnerService", () => {
    let service: SpinnerService;
    let targetElement: HTMLElement;
    let targetElement2: HTMLElement;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [SpinnerService]
        });
        service = TestBed.inject(SpinnerService);

        targetElement = document.createElement("div");
        document.body.appendChild(targetElement);

        targetElement2 = document.createElement("div");
        document.body.appendChild(targetElement2);
    });

    afterEach(() => {
        vi.useRealTimers();
        if (targetElement.parentElement) {
            targetElement.parentElement.removeChild(targetElement);
        }
        if (targetElement2.parentElement) {
            targetElement2.parentElement.removeChild(targetElement2);
        }
        // Clean up any body overlays
        const overlays = document.body.querySelectorAll("mona-spinner-overlay");
        overlays.forEach(overlay => {
            if (overlay.parentElement === document.body) {
                overlay.parentElement.removeChild(overlay);
            }
        });
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    describe("Basic Lifecycle & Targets", () => {
        it("should show and close a spinner on a specific HTMLElement target", () => {
            const ref = service.show({ target: targetElement });
            expect(targetElement.querySelector("mona-spinner-overlay")).toBeTruthy();

            ref.close();
            expect(targetElement.querySelector("mona-spinner-overlay")).toBeNull();
        });

        it("should allow close() to be idempotent", () => {
            const ref = service.show({ target: targetElement });
            expect(targetElement.querySelector("mona-spinner-overlay")).toBeTruthy();

            ref.close();
            expect(() => ref.close()).not.toThrow();
            expect(() => ref.close()).not.toThrow();
            expect(targetElement.querySelector("mona-spinner-overlay")).toBeNull();
        });

        it("should support hiding by SpinnerRef via hide()", () => {
            const ref = service.show({ target: targetElement });
            expect(targetElement.querySelector("mona-spinner-overlay")).toBeTruthy();

            service.hide(ref);
            expect(targetElement.querySelector("mona-spinner-overlay")).toBeNull();
        });

        it("should support hiding by string id via hide()", () => {
            service.show({ id: "my-custom-spinner", target: targetElement });
            expect(targetElement.querySelector("mona-spinner-overlay")).toBeTruthy();

            service.hide("my-custom-spinner");
            expect(targetElement.querySelector("mona-spinner-overlay")).toBeNull();
        });

        it("should target document.body as full-page overlay when target is omitted", () => {
            const ref = service.show();
            const bodyOverlay = document.body.querySelector("mona-spinner-overlay");
            expect(bodyOverlay).toBeTruthy();
            expect(bodyOverlay?.classList.contains("fixed")).toBe(true);

            ref.close();
            expect(document.body.querySelector("mona-spinner-overlay")).toBeNull();
        });

        it("should support ElementRef as target", () => {
            const elementRef = new ElementRef(targetElement);
            const ref = service.show({ target: elementRef });
            expect(targetElement.querySelector("mona-spinner-overlay")).toBeTruthy();

            ref.close();
            expect(targetElement.querySelector("mona-spinner-overlay")).toBeNull();
        });

        it("should support an array of targets", () => {
            const ref = service.show({ target: [targetElement, targetElement2] });
            expect(targetElement.querySelector("mona-spinner-overlay")).toBeTruthy();
            expect(targetElement2.querySelector("mona-spinner-overlay")).toBeTruthy();

            ref.close();
            expect(targetElement.querySelector("mona-spinner-overlay")).toBeNull();
            expect(targetElement2.querySelector("mona-spinner-overlay")).toBeNull();
        });
    });

    describe("Positioning Ownership", () => {
        it("should temporarily set static element position to relative and restore on close", () => {
            targetElement.style.position = "";
            const ref = service.show({ target: targetElement });

            expect(targetElement.style.position).toBe("relative");

            ref.close();
            expect(targetElement.style.position).toBe("");
        });

        it("should preserve target elements already having non-static positioning", () => {
            targetElement.style.position = "absolute";
            const ref = service.show({ target: targetElement });

            expect(targetElement.style.position).toBe("absolute");

            ref.close();
            expect(targetElement.style.position).toBe("absolute");
        });

        it("should not overwrite application-modified positioning on cleanup", () => {
            targetElement.style.position = "";
            const ref = service.show({ target: targetElement });
            expect(targetElement.style.position).toBe("relative");

            // Application code mutates style during spinner lifetime
            targetElement.style.position = "fixed";

            ref.close();
            // Should remain fixed, not reverted to empty
            expect(targetElement.style.position).toBe("fixed");
        });
    });

    describe("aria-busy Ownership", () => {
        it("should set aria-busy to true and remove it on close if originally absent", () => {
            expect(targetElement.getAttribute("aria-busy")).toBeNull();

            const ref = service.show({ target: targetElement });
            expect(targetElement.getAttribute("aria-busy")).toBe("true");

            ref.close();
            expect(targetElement.getAttribute("aria-busy")).toBeNull();
        });

        it("should restore original aria-busy='false' attribute on close", () => {
            targetElement.setAttribute("aria-busy", "false");

            const ref = service.show({ target: targetElement });
            expect(targetElement.getAttribute("aria-busy")).toBe("true");

            ref.close();
            expect(targetElement.getAttribute("aria-busy")).toBe("false");
        });

        it("should maintain aria-busy='true' while concurrent requests are active", () => {
            const a = service.show({ target: targetElement });
            const b = service.show({ target: targetElement });

            expect(targetElement.getAttribute("aria-busy")).toBe("true");

            a.close();
            expect(targetElement.getAttribute("aria-busy")).toBe("true");

            b.close();
            expect(targetElement.getAttribute("aria-busy")).toBeNull();
        });
    });

    describe("Same-Target Concurrency & Presentation Precedence", () => {
        it("should create at most one physical overlay for concurrent requests on the same target", () => {
            const a = service.show({ target: targetElement, text: "Operation A" });
            const b = service.show({ target: targetElement, text: "Operation B" });

            const overlays = targetElement.querySelectorAll("mona-spinner-overlay");
            expect(overlays.length).toBe(1);

            a.close();
            expect(targetElement.querySelectorAll("mona-spinner-overlay").length).toBe(1);

            b.close();
            expect(targetElement.querySelectorAll("mona-spinner-overlay").length).toBe(0);
        });

        it("should give presentation priority to the latest active request and fall back on close", () => {
            const a = service.show({
                appearance: "default",
                size: "small",
                target: targetElement,
                text: "Loading A"
            });
            expect(targetElement.textContent).toContain("Loading A");

            const b = service.show({
                appearance: "pulsing",
                size: "large",
                target: targetElement,
                text: "Loading B"
            });
            expect(targetElement.textContent).toContain("Loading B");
            const spinner = targetElement.querySelector("mona-spinner");
            expect(spinner?.classList.contains("w-6")).toBe(true);

            // Closing B restores presentation of A
            b.close();
            expect(targetElement.textContent).toContain("Loading A");
            expect(spinner?.classList.contains("w-3")).toBe(true);

            a.close();
            expect(targetElement.querySelector("mona-spinner-overlay")).toBeNull();
        });

        it("should preserve updates to hidden requests until they win presentation", () => {
            const a = service.show({ target: targetElement, text: "Original A" });
            const b = service.show({ target: targetElement, text: "Winning B" });

            expect(targetElement.textContent).toContain("Winning B");

            // Update hidden request A
            a.update({ text: "Updated A" });
            // B is still winning and visible
            expect(targetElement.textContent).toContain("Winning B");

            // Close B -> A becomes visible with updated text
            b.close();
            expect(targetElement.textContent).toContain("Updated A");

            a.close();
        });

        it("should immediately update active winning request via update()", () => {
            const ref = service.show({ target: targetElement, text: "Initial Text" });
            expect(targetElement.textContent).toContain("Initial Text");

            ref.update({ text: "Modified Text" });
            expect(targetElement.textContent).toContain("Modified Text");

            ref.close();
        });
    });

    describe("Delay Semantics", () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        it("should immediately set aria-busy and delay physical DOM creation", () => {
            const ref = service.show({ delay: 200, target: targetElement });

            // aria-busy is immediately true
            expect(targetElement.getAttribute("aria-busy")).toBe("true");
            // No physical overlay yet
            expect(targetElement.querySelector("mona-spinner-overlay")).toBeNull();

            // Advance timer past delay
            vi.advanceTimersByTime(200);
            expect(targetElement.querySelector("mona-spinner-overlay")).toBeTruthy();

            ref.close();
            expect(targetElement.querySelector("mona-spinner-overlay")).toBeNull();
        });

        it("should not create physical overlay if closed before delay expires", () => {
            const ref = service.show({ delay: 200, target: targetElement });
            expect(targetElement.getAttribute("aria-busy")).toBe("true");
            expect(targetElement.querySelector("mona-spinner-overlay")).toBeNull();

            vi.advanceTimersByTime(100);
            ref.close();

            vi.advanceTimersByTime(200);
            expect(targetElement.querySelector("mona-spinner-overlay")).toBeNull();
            expect(targetElement.getAttribute("aria-busy")).toBeNull();
        });

        it("should not recreate or hide overlay when a delayed request arrives on an already visible target", () => {
            const a = service.show({ target: targetElement, text: "Visible Immediately" });
            expect(targetElement.querySelector("mona-spinner-overlay")).toBeTruthy();

            const b = service.show({ delay: 500, target: targetElement, text: "Delayed Arrived" });
            // Overlay remains visible throughout
            expect(targetElement.querySelectorAll("mona-spinner-overlay").length).toBe(1);

            a.close();
            b.close();
            expect(targetElement.querySelector("mona-spinner-overlay")).toBeNull();
        });
    });

    describe("Minimum Visible Duration", () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        it("should keep overlay visible until minimumVisibleDuration has elapsed", () => {
            const ref = service.show({
                minimumVisibleDuration: 300,
                target: targetElement
            });
            expect(targetElement.querySelector("mona-spinner-overlay")).toBeTruthy();

            // Close after 50ms (before min 300ms)
            vi.advanceTimersByTime(50);
            ref.close();

            // Overlay is still present
            expect(targetElement.querySelector("mona-spinner-overlay")).toBeTruthy();

            // Advance to 299ms
            vi.advanceTimersByTime(249);
            expect(targetElement.querySelector("mona-spinner-overlay")).toBeTruthy();

            // Reach 300ms
            vi.advanceTimersByTime(2);
            expect(targetElement.querySelector("mona-spinner-overlay")).toBeNull();
        });

        it("should tear down immediately if closed after minimumVisibleDuration has elapsed", () => {
            const ref = service.show({
                minimumVisibleDuration: 200,
                target: targetElement
            });

            vi.advanceTimersByTime(300);
            ref.close();

            expect(targetElement.querySelector("mona-spinner-overlay")).toBeNull();
        });
    });

    describe("Cancellation", () => {
        it("should emit cancelled$ and invoke onCancel callback when cancelled", () => {
            let callbackFired = false;
            let cancelledEmitted = false;

            const ref = service.show({
                cancellable: {
                    onCancel: () => {
                        callbackFired = true;
                    },
                    text: "Cancel Process"
                },
                target: targetElement
            });

            ref.cancelled$.subscribe(() => {
                cancelledEmitted = true;
            });

            const cancelButton = targetElement.querySelector("button");
            expect(cancelButton).toBeTruthy();
            expect(cancelButton?.textContent?.trim()).toBe("Cancel Process");

            cancelButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

            expect(callbackFired).toBe(true);
            expect(cancelledEmitted).toBe(true);
            expect(targetElement.querySelector("mona-spinner-overlay")).toBeNull();
        });

        it("should clean up safely even if onCancel throws an error", () => {
            service.show({
                cancellable: {
                    onCancel: () => {
                        throw new Error("Consumer cancellation error");
                    }
                },
                target: targetElement
            });

            const cancelButton = targetElement.querySelector("button");
            expect(() => {
                cancelButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            }).not.toThrow();

            expect(targetElement.querySelector("mona-spinner-overlay")).toBeNull();
        });

        it("should cancel multi-target request across all targets", () => {
            let callbackCount = 0;
            const ref = service.show({
                cancellable: {
                    onCancel: () => {
                        callbackCount++;
                    }
                },
                target: [targetElement, targetElement2]
            });

            expect(targetElement.querySelector("mona-spinner-overlay")).toBeTruthy();
            expect(targetElement2.querySelector("mona-spinner-overlay")).toBeTruthy();

            const cancelButtonOnA = targetElement.querySelector("button");
            cancelButtonOnA?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

            expect(callbackCount).toBe(1);
            expect(targetElement.querySelector("mona-spinner-overlay")).toBeNull();
            expect(targetElement2.querySelector("mona-spinner-overlay")).toBeNull();

            ref.close();
        });
    });

    describe("RxJS track()", () => {
        it("should show spinner on subscription and close on completion", () => {
            const subject = new Subject<number>();
            const tracked$ = service.track(subject.asObservable(), { target: targetElement });

            expect(targetElement.querySelector("mona-spinner-overlay")).toBeNull();

            const sub = tracked$.subscribe();
            expect(targetElement.querySelector("mona-spinner-overlay")).toBeTruthy();

            subject.next(1);
            subject.complete();

            expect(targetElement.querySelector("mona-spinner-overlay")).toBeNull();
            sub.unsubscribe();
        });

        it("should close spinner on error", () => {
            const tracked$ = service.track(throwError(() => new Error("Failed")), { target: targetElement });

            tracked$.subscribe({
                error: () => {}
            });

            expect(targetElement.querySelector("mona-spinner-overlay")).toBeNull();
        });

        it("should close spinner on unsubscription", () => {
            const subject = new Subject<void>();
            const tracked$ = service.track(subject.asObservable(), { target: targetElement });

            const sub = tracked$.subscribe();
            expect(targetElement.querySelector("mona-spinner-overlay")).toBeTruthy();

            sub.unsubscribe();
            expect(targetElement.querySelector("mona-spinner-overlay")).toBeNull();
        });

        it("should subscribe to cold observable exactly once per consumer subscription even with multiple targets", () => {
            let subscriptionCount = 0;
            const cold$ = new Observable<string>(observer => {
                subscriptionCount++;
                observer.next("data");
                observer.complete();
            });

            const tracked$ = service.track(cold$, { target: [targetElement, targetElement2] });
            expect(subscriptionCount).toBe(0);

            tracked$.subscribe();
            expect(subscriptionCount).toBe(1);
        });
    });
});
