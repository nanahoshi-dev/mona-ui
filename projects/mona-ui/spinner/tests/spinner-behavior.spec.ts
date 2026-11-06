import { LiveAnnouncer } from "@angular/cdk/a11y";
import { Component, ElementRef } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import axe from "axe-core";
import { Observable, Subject } from "rxjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SpinnerComponent } from "../components/spinner/spinner.component";
import { SpinnerService } from "../services/spinner.service";

@Component({
    imports: [SpinnerComponent],
    template: `<mona-spinner decorative />`
})
class DecorativeHostComponent {}

@Component({
    imports: [SpinnerComponent],
    template: `<mona-spinner />`
})
class PlainHostComponent {}

describe("SpinnerService behavior", () => {
    let service: SpinnerService;
    let target: HTMLElement;
    let announce: ReturnType<typeof vi.spyOn>;

    const overlayIn = (element: Element): HTMLElement | null => element.querySelector(":scope > mona-spinner-overlay");
    const cancelIn = (element: Element): HTMLButtonElement | null =>
        overlayIn(element)?.querySelector("button") ?? null;

    beforeEach(() => {
        service = TestBed.inject(SpinnerService);
        announce = vi.spyOn(TestBed.inject(LiveAnnouncer), "announce").mockResolvedValue(undefined);
        target = document.createElement("div");
        document.body.appendChild(target);
    });

    afterEach(() => {
        service.ngOnDestroy();
        target.remove();
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    describe("cancelling track()", () => {
        it("unsubscribes the source and completes, without its later values", () => {
            const source = new Subject<number>();
            let unsubscribed = false;
            const tracked = new Observable<number>(subscriber => {
                const subscription = source.subscribe(subscriber);
                return () => {
                    unsubscribed = true;
                    subscription.unsubscribe();
                };
            });
            const values: number[] = [];
            let completed = false;
            const subscription = service.track(tracked, { cancellable: true, target }).subscribe({
                complete: () => (completed = true),
                next: value => values.push(value)
            });
            source.next(1);
            cancelIn(target)?.click();

            expect(unsubscribed).toBe(true);
            expect(completed).toBe(true);
            expect(subscription.closed).toBe(true);
            expect(overlayIn(target)).toBeNull();
            source.next(2);
            expect(values).toEqual([1]);
        });

        it("still calls onCancel", () => {
            const onCancel = vi.fn();
            service.track(new Subject<void>(), { cancellable: { onCancel }, target }).subscribe();
            cancelIn(target)?.click();
            expect(onCancel).toHaveBeenCalledTimes(1);
        });

        it("doesn't complete a source just because the spinner closes some other way", () => {
            const source = new Subject<number>();
            const values: number[] = [];
            service.track(source, { id: "kept", target }).subscribe(value => values.push(value));
            service.hide("kept");
            source.next(1);
            expect(values).toEqual([1]);
        });
    });

    describe("the Cancel button's text", () => {
        beforeEach(() => {
            TestBed.inject(MonaI18nService).use({
                direction: "ltr",
                id: "tr-TR",
                messages: { spinner: { cancel: "İptal", loading: "Yükleniyor" } }
            });
        });

        it("is localized", () => {
            service.show({ cancellable: true, target });
            expect(cancelIn(target)?.textContent?.trim()).toBe("İptal");
        });

        it("is localized when options give no text", () => {
            service.show({ cancellable: { onCancel: () => undefined }, target });
            expect(cancelIn(target)?.textContent?.trim()).toBe("İptal");
        });

        it("is the consumer's when given", () => {
            service.show({ cancellable: { text: "Stop" }, target });
            expect(cancelIn(target)?.textContent?.trim()).toBe("Stop");
        });
    });

    describe("releasing a target", () => {
        it("reads aria-busy afresh for the next request", () => {
            service.show({ target }).close();
            target.setAttribute("aria-busy", "false");
            service.show({ target }).close();
            expect(target.getAttribute("aria-busy")).toBe("false");
        });

        it("reads the inline position afresh for the next request", () => {
            service.show({ target }).close();
            target.style.position = "sticky";
            const ref = service.show({ target });
            ref.close();
            expect(target.style.position).toBe("sticky");
        });

        it("restores the target when the service is destroyed", () => {
            target.setAttribute("aria-busy", "mixed");
            service.show({ target });
            expect(target.style.position).toBe("relative");
            service.ngOnDestroy();
            expect(overlayIn(target)).toBeNull();
            expect(target.getAttribute("aria-busy")).toBe("mixed");
            expect(target.style.position).toBe("");
        });

        it("clears a pending hold when the service is destroyed", () => {
            vi.useFakeTimers();
            const ref = service.show({ minimumVisibleDuration: 1000, target });
            ref.close();
            expect(overlayIn(target)).not.toBeNull();
            service.ngOnDestroy();
            expect(overlayIn(target)).toBeNull();
            vi.advanceTimersByTime(20);
            expect(vi.getTimerCount()).toBe(0);
        });

        it("clears delay and announcement timers when the service is destroyed", () => {
            vi.useFakeTimers();
            service.show({ delay: 1000, target });
            const shown = service.show({ target: document.createElement("div"), text: "A" });
            shown.update({ text: "B" });
            service.ngOnDestroy();
            vi.advanceTimersByTime(20);
            expect(vi.getTimerCount()).toBe(0);
        });
    });

    describe("the whole page", () => {
        it("is fixed, above every CDK overlay, and leaves the body's aria-busy alone", () => {
            const ref = service.show();
            const overlay = overlayIn(document.body) as HTMLElement;
            expect(overlay.classList.contains("fixed")).toBe(true);
            expect(Number(overlay.style.zIndex)).toBeGreaterThan(1000);
            expect(document.body.hasAttribute("aria-busy")).toBe(false);
            ref.close();
            expect(overlayIn(document.body)).toBeNull();
            expect(document.body.hasAttribute("aria-busy")).toBe(false);
        });

        it("leaves an aria-busy the app set on the body", () => {
            document.body.setAttribute("aria-busy", "false");
            service.show().close();
            expect(document.body.getAttribute("aria-busy")).toBe("false");
            document.body.removeAttribute("aria-busy");
        });

        it("leaves an aria-busy the app sets on the body while it shows", () => {
            const ref = service.show();
            document.body.setAttribute("aria-busy", "true");
            ref.close();
            expect(document.body.getAttribute("aria-busy")).toBe("true");
            document.body.removeAttribute("aria-busy");
        });

        it("is what targeting the body means too", () => {
            const ref = service.show({ target: document.body });
            expect(overlayIn(document.body)?.classList.contains("fixed")).toBe(true);
            expect(document.body.style.position).toBe("");
            expect(document.body.hasAttribute("aria-busy")).toBe(false);
            ref.close();
        });

        it("still marks a targeted element as busy", () => {
            const ref = service.show({ target });
            expect(target.getAttribute("aria-busy")).toBe("true");
            ref.close();
            expect(target.hasAttribute("aria-busy")).toBe(false);
        });
    });

    describe("announcing", () => {
        it("announces through the live announcer, not a region in the overlay", () => {
            service.show({ target, text: "Saving" });
            expect(announce).toHaveBeenCalledTimes(1);
            expect(announce).toHaveBeenCalledWith("Saving", "polite");
            expect(target.querySelector("[role='status'], [aria-live]")).toBeNull();
        });

        it("announces the localized loading text when there's no text", () => {
            TestBed.inject(MonaI18nService).use({
                direction: "ltr",
                id: "tr-TR",
                messages: { spinner: { cancel: "İptal", loading: "Yükleniyor" } }
            });
            service.show({ target });
            expect(announce).toHaveBeenCalledWith("Yükleniyor", "polite");
        });

        it("announces when it shows, not before, and not at all if it never shows", () => {
            vi.useFakeTimers();
            const quick = service.show({ delay: 500, target, text: "Quick" });
            expect(announce).not.toHaveBeenCalled();
            quick.close();
            vi.advanceTimersByTime(1000);
            expect(announce).not.toHaveBeenCalled();

            service.show({ delay: 500, target, text: "Slow" });
            vi.advanceTimersByTime(500);
            expect(announce).toHaveBeenCalledTimes(1);
            expect(announce).toHaveBeenCalledWith("Slow", "polite");
        });

        it("announces a request once however many targets it has", () => {
            const other = document.createElement("div");
            document.body.appendChild(other);
            service.show({ target: [target, other], text: "Saving" });
            expect(announce).toHaveBeenCalledTimes(1);
            other.remove();
        });

        it("announces the latest text when updated while still in its delay", () => {
            vi.useFakeTimers();
            const ref = service.show({ delay: 500, target, text: "A" });
            ref.update({ text: "B" });
            expect(announce).not.toHaveBeenCalled();
            vi.advanceTimersByTime(500);
            expect(announce).toHaveBeenCalledTimes(1);
            expect(announce).toHaveBeenCalledWith("B", "polite");
        });

        it("reads a stream of updates no more than once per interval, ending on the latest", () => {
            vi.useFakeTimers();
            const ref = service.show({ target, text: "0%" });
            announce.mockClear();
            for (let percent = 1; percent <= 20; percent++) {
                ref.update({ text: `${percent}%` });
            }
            expect(announce).not.toHaveBeenCalled();
            vi.advanceTimersByTime(4999);
            expect(announce).not.toHaveBeenCalled();
            vi.advanceTimersByTime(1);
            expect(announce).toHaveBeenCalledTimes(1);
            expect(announce).toHaveBeenCalledWith("20%", "polite");
            vi.advanceTimersByTime(20000);
            expect(announce).toHaveBeenCalledTimes(1);
        });

        it("reads an update at once when the interval has passed", () => {
            vi.useFakeTimers();
            const ref = service.show({ target, text: "A" });
            announce.mockClear();
            vi.advanceTimersByTime(5000);
            ref.update({ text: "B" });
            expect(announce).toHaveBeenCalledWith("B", "polite");
        });

        it("doesn't repeat itself", () => {
            vi.useFakeTimers();
            const ref = service.show({ target, text: "A" });
            announce.mockClear();
            vi.advanceTimersByTime(5000);
            ref.update({ text: "A" });
            expect(announce).not.toHaveBeenCalled();
        });

        it("doesn't announce for a change that isn't text", () => {
            vi.useFakeTimers();
            const ref = service.show({ target, text: "A" });
            announce.mockClear();
            vi.advanceTimersByTime(5000);
            ref.update({ size: "large" });
            expect(announce).not.toHaveBeenCalled();
        });

        it("doesn't wait on anything for a change that isn't text", () => {
            vi.useFakeTimers();
            const ref = service.show({ target, text: "A" });
            vi.advanceTimersByTime(20);
            const timers = vi.getTimerCount();
            ref.update({ size: "large" });
            vi.advanceTimersByTime(20);
            expect(vi.getTimerCount()).toBe(timers);
        });

        it("doesn't restart the interval for text it didn't read", () => {
            vi.useFakeTimers();
            const ref = service.show({ target, text: "A" });
            announce.mockClear();
            vi.advanceTimersByTime(6000);
            ref.update({ text: "A" });
            ref.update({ text: "B" });
            expect(announce).toHaveBeenCalledWith("B", "polite");
        });

        it("waits out the interval when another target's delay runs out", () => {
            vi.useFakeTimers();
            const other = document.createElement("div");
            document.body.appendChild(other);
            service.show({ target, text: "Visible" });
            const ref = service.show({ delay: 200, target: [target, other], text: "A" });
            announce.mockClear();
            ref.update({ text: "B" });
            vi.advanceTimersByTime(200);
            expect(overlayIn(other)).not.toBeNull();
            expect(announce).not.toHaveBeenCalled();
            vi.advanceTimersByTime(4800);
            expect(announce).toHaveBeenCalledTimes(1);
            expect(announce).toHaveBeenCalledWith("B", "polite");
            other.remove();
        });

        it("drops a waiting announcement when it closes", () => {
            vi.useFakeTimers();
            const ref = service.show({ target, text: "A" });
            announce.mockClear();
            ref.update({ text: "B" });
            ref.update({ text: "C" });
            ref.close();
            vi.advanceTimersByTime(20000);
            expect(announce).not.toHaveBeenCalled();
        });
    });

    describe("a target that doesn't resolve", () => {
        beforeEach(() => {
            vi.spyOn(console, "error").mockImplementation(() => undefined);
        });

        it.each([
            ["undefined", undefined],
            ["an empty list", []],
            ["an empty ElementRef", new ElementRef(null)],
            ["null", null]
        ])("shows nothing for %s, and says so", (_name, value) => {
            const ref = service.show({ target: value as unknown as HTMLElement, text: "Saving" });
            expect(overlayIn(document.body)).toBeNull();
            expect(document.body.hasAttribute("aria-busy")).toBe(false);
            expect(announce).not.toHaveBeenCalled();
            expect(console.error).toHaveBeenCalledWith(expect.stringContaining("didn't resolve"));
            ref.update({ text: "Still" });
            ref.close();
        });

        it("shows on the ones that do, and says so", () => {
            service.show({ target: [target, new ElementRef(null)] as unknown as HTMLElement[] });
            expect(overlayIn(target)).not.toBeNull();
            expect(overlayIn(document.body)).toBeNull();
            expect(console.error).toHaveBeenCalledTimes(1);
        });

        it("is quiet about targets that all resolve", () => {
            service.show({ target: [target, new ElementRef(document.createElement("div"))] });
            expect(console.error).not.toHaveBeenCalled();
        });

        it("still means the whole page when the key is left out", () => {
            service.show({ text: "Saving" });
            expect(overlayIn(document.body)).not.toBeNull();
            expect(console.error).not.toHaveBeenCalled();
        });

        it("accepts an element from another document, and an ElementRef to one", () => {
            const frame = document.createElement("iframe");
            document.body.appendChild(frame);
            const inFrame = (frame.contentDocument as Document).createElement("div");
            (frame.contentDocument as Document).body.appendChild(inFrame);

            const ref = service.show({ target: inFrame });
            expect(overlayIn(inFrame)).not.toBeNull();
            ref.close();
            const refByElementRef = service.show({ target: new ElementRef(inFrame) });
            expect(overlayIn(inFrame)).not.toBeNull();
            refByElementRef.close();
            expect(console.error).not.toHaveBeenCalled();
            frame.remove();
        });
    });

    describe("several requests on one target", () => {
        it("shows a request still in its delay when the visible one closes", () => {
            vi.useFakeTimers();
            const onCancel = vi.fn();
            service.show({ cancellable: { onCancel }, delay: 1000, target, text: "Waiting" });
            const shown = service.show({ target, text: "Shown" });
            expect(overlayIn(target)?.textContent).toContain("Shown");

            shown.close();

            expect(overlayIn(target)?.textContent).toContain("Waiting");
            cancelIn(target)?.click();
            expect(onCancel).toHaveBeenCalledTimes(1);
            expect(overlayIn(target)).toBeNull();
        });

        it("announces that request once, though its delay runs out later", () => {
            vi.useFakeTimers();
            service.show({ delay: 1000, target, text: "Waiting" });
            const shown = service.show({ target, text: "Shown" });
            announce.mockClear();
            shown.close();
            expect(announce).toHaveBeenCalledTimes(1);
            vi.advanceTimersByTime(1000);
            expect(announce).toHaveBeenCalledTimes(1);
        });

        it("doesn't keep a closed request's zIndex", () => {
            const first = service.show({ target, zIndex: 999 });
            const second = service.show({ target });
            const overlay = overlayIn(target) as HTMLElement;
            expect(overlay.style.zIndex).toBe("1");
            second.close();
            expect(overlay.style.zIndex).toBe("999");
            first.close();
        });

        it("holds for the request that asked to, though another closes last", () => {
            vi.useFakeTimers();
            const held = service.show({ minimumVisibleDuration: 1000, target });
            const plain = service.show({ target });
            held.close();
            plain.close();
            expect(overlayIn(target)).not.toBeNull();
            vi.advanceTimersByTime(1000);
            expect(overlayIn(target)).toBeNull();
        });

        it("holds for the longest asked for", () => {
            vi.useFakeTimers();
            const long = service.show({ minimumVisibleDuration: 1000, target });
            const short = service.show({ minimumVisibleDuration: 100, target });
            long.close();
            short.close();
            vi.advanceTimersByTime(999);
            expect(overlayIn(target)).not.toBeNull();
            vi.advanceTimersByTime(1);
            expect(overlayIn(target)).toBeNull();
        });

        it("doesn't carry a hold over to the next time the target is used", () => {
            vi.useFakeTimers();
            const held = service.show({ minimumVisibleDuration: 1000, target });
            held.close();
            vi.advanceTimersByTime(1000);
            service.show({ target }).close();
            expect(overlayIn(target)).toBeNull();
        });
    });

    describe("Cancel during a hold", () => {
        it("is gone, with nothing left to cancel", () => {
            vi.useFakeTimers();
            const ref = service.show({ cancellable: true, minimumVisibleDuration: 1000, target });
            expect(cancelIn(target)).not.toBeNull();
            ref.close();
            expect(overlayIn(target)).not.toBeNull();
            expect(cancelIn(target)).toBeNull();
        });

        it("comes back if a new cancellable request arrives", () => {
            vi.useFakeTimers();
            service.show({ cancellable: true, minimumVisibleDuration: 1000, target }).close();
            service.show({ cancellable: true, target });
            expect(cancelIn(target)).not.toBeNull();
        });
    });

    describe("focus", () => {
        let opener: HTMLButtonElement;

        beforeEach(() => {
            opener = document.createElement("button");
            document.body.appendChild(opener);
            opener.focus();
        });

        afterEach(() => opener.remove());

        const moveFocusToCancel = (): HTMLButtonElement => {
            const cancel = cancelIn(target) as HTMLButtonElement;
            cancel.focus();
            cancel.dispatchEvent(new FocusEvent("focusin", { bubbles: true, relatedTarget: opener }));
            return cancel;
        };

        it("returns to where it came from after Cancel", () => {
            service.show({ cancellable: true, target });
            moveFocusToCancel().click();
            expect(overlayIn(target)).toBeNull();
            expect(document.activeElement).toBe(opener);
        });

        it("returns when the request closes with focus on Cancel", () => {
            const ref = service.show({ cancellable: true, target });
            moveFocusToCancel();
            ref.close();
            expect(document.activeElement).toBe(opener);
        });

        it("returns when a hold removes Cancel", () => {
            vi.useFakeTimers();
            const ref = service.show({ cancellable: true, minimumVisibleDuration: 1000, target });
            moveFocusToCancel();
            ref.close();
            expect(document.activeElement).toBe(opener);
        });

        it("isn't moved when it never entered the overlay", () => {
            const other = document.createElement("button");
            document.body.appendChild(other);
            const ref = service.show({ cancellable: true, target });
            moveFocusToCancel();
            other.focus();
            ref.close();
            expect(document.activeElement).toBe(other);
            other.remove();
        });

        it("has nowhere to return to if the origin has gone", () => {
            const ref = service.show({ cancellable: true, target });
            moveFocusToCancel();
            opener.remove();
            expect(() => ref.close()).not.toThrow();
        });

        it("isn't confused by focus moving inside the overlay", () => {
            const ref = service.show({ cancellable: true, target });
            const cancel = moveFocusToCancel();
            cancel.dispatchEvent(new FocusEvent("focusin", { bubbles: true, relatedTarget: overlayIn(target) }));
            ref.close();
            expect(document.activeElement).toBe(opener);
        });
    });

    describe("the overlay", () => {
        it("gives its focus ring a solid outline", () => {
            service.show({ cancellable: true, target });
            const classes = cancelIn(target)?.classList;
            expect(classes?.contains("focus-visible:outline-2")).toBe(true);
            expect(classes?.contains("focus-visible:outline-focus-indicator")).toBe(true);
            expect(classes?.contains("focus-visible:outline-none")).toBe(false);
        });

        it("wraps long text rather than cutting it off", () => {
            service.show({ target, text: "A long status" });
            const text = overlayIn(target)?.querySelector("span.max-w-xs") as HTMLElement;
            expect(text.classList.contains("truncate")).toBe(false);
            expect(text.classList.contains("wrap-anywhere")).toBe(true);
        });

        it("passes axe", async () => {
            service.show({ cancellable: true, target, text: "Saving" });
            const result = await axe.run(target, { rules: { "color-contrast": { enabled: false } } });
            expect(result.violations).toEqual([]);
        });
    });
});

describe("SpinnerComponent behavior", () => {
    it("is a named image, and doesn't claim to be a live region", () => {
        const fixture = TestBed.createComponent(PlainHostComponent);
        fixture.detectChanges();
        const host = fixture.nativeElement.querySelector("mona-spinner") as HTMLElement;
        expect(host.getAttribute("role")).toBe("img");
        expect(host.getAttribute("aria-label")).toBe("Loading");
    });

    it("takes decorative as a bare attribute", () => {
        const fixture = TestBed.createComponent(DecorativeHostComponent);
        fixture.detectChanges();
        const host = fixture.nativeElement.querySelector("mona-spinner") as HTMLElement;
        expect(host.getAttribute("role")).toBeNull();
        expect(host.getAttribute("aria-hidden")).toBe("true");
        expect(host.getAttribute("aria-label")).toBeNull();
    });

    it("grows its glyph with the host", () => {
        const fixture = TestBed.createComponent(PlainHostComponent);
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector("svg").classList.contains("size-full")).toBe(true);
    });

    it("keeps its segments visible in forced colors", () => {
        TestBed.createComponent(PlainHostComponent).detectChanges();
        const css = Array.from(document.querySelectorAll("style"), style => style.textContent).join("\n");
        expect(css).toMatch(
            /forced-colors:\s*active\)\s*\{\s*\[data-segment\][^{]*\{\s*background-color:\s*CanvasText/
        );
    });

    it("passes axe when named", async () => {
        const plain = TestBed.createComponent(PlainHostComponent);
        plain.detectChanges();
        expect((await axe.run(plain.nativeElement)).violations).toEqual([]);
    });

    it("passes axe when decorative", async () => {
        const decorative = TestBed.createComponent(DecorativeHostComponent);
        decorative.detectChanges();
        expect((await axe.run(decorative.nativeElement)).violations).toEqual([]);
    });
});
