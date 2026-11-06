import { Component, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScrollViewComponent } from "../components/scroll-view/scroll-view.component";
import { ScrollViewSlideDirective } from "../directives/scroll-view-slide.directive";

@Component({
    imports: [ScrollViewComponent, ScrollViewSlideDirective],
    template: `
        <div [attr.dir]="dir()">
            <mona-scroll-view
                aria-label="Featured"
                [arrows]="arrows()"
                [data]="data()"
                [height]="200"
                [infinite]="infinite()"
                [pageable]="pageable()"
                [width]="300"
                [(index)]="index">
                <ng-template [monaScrollViewSlide]="data()" let-item let-width="width" let-height="height">
                    <div class="slide-body" [attr.data-size]="width + 'x' + height">
                        <span class="slide-text">{{ item.title }}</span>
                        <input class="slide-input" aria-label="Field" />
                        <div class="slide-slider" role="slider" aria-label="Level" aria-valuenow="1" tabindex="0"></div>
                        <button class="slide-button" type="button">Action</button>
                    </div>
                </ng-template>
            </mona-scroll-view>
        </div>
    `
})
class HostComponent {
    public readonly arrows = signal(false);
    public readonly data = signal([{ title: "One" }, { title: "Two" }, { title: "Three" }]);
    public readonly dir = signal("ltr");
    public readonly index = signal(0);
    public readonly infinite = signal(false);
    public readonly pageable = signal(false);
}

@Component({
    imports: [ScrollViewComponent],
    template: `
        <mona-scroll-view [data]="['A', 'B']" [height]="100" [width]="100">
            <ng-template let-item
                ><span class="bare">{{ item }}</span></ng-template
            >
        </mona-scroll-view>
    `
})
class BareHostComponent {}

@Component({
    imports: [ScrollViewComponent],
    template: `
        <span id="carousel-name">Named elsewhere</span>
        <mona-scroll-view aria-labelledby="carousel-name" [data]="['A']" [height]="100" [width]="100">
            <ng-template let-item>{{ item }}</ng-template>
        </mona-scroll-view>
    `
})
class LabelledByHostComponent {}

@Component({
    imports: [ScrollViewComponent],
    template: `
        <mona-scroll-view
            aria-label="First"
            [data]="['A', 'B']"
            [height]="100"
            [pageable]="true"
            [width]="100"
            [arrows]="true">
            <ng-template let-item>{{ item }}</ng-template>
        </mona-scroll-view>
        <mona-scroll-view
            aria-label="Second"
            [data]="['C', 'D']"
            [height]="100"
            [pageable]="true"
            [width]="100"
            [arrows]="true">
            <ng-template let-item>{{ item }}</ng-template>
        </mona-scroll-view>
    `
})
class TwoCarouselsHostComponent {}

@Component({
    imports: [ScrollViewComponent],
    template: `
        <mona-scroll-view [data]="data()" [height]="100" [width]="100">
            <ng-template let-item>{{ item }}</ng-template>
        </mona-scroll-view>
    `
})
class UnnamedHostComponent {
    public readonly data = signal<string[]>(["A"]);
}

describe("ScrollViewComponent behavior", () => {
    let fixture: ComponentFixture<HostComponent>;
    let host: HTMLElement;

    const render = async (): Promise<void> => {
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    };

    const key = (target: Element, name: string, init: KeyboardEventInit = {}): KeyboardEvent => {
        const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: name, ...init });
        target.dispatchEvent(event);
        return event;
    };

    const pointer = (
        target: EventTarget,
        type: string,
        x: number,
        y: number,
        init: Record<string, unknown> = {}
    ): void => {
        const event = new MouseEvent(type, { bubbles: true, button: 0, cancelable: true, clientX: x, clientY: y });
        Object.assign(event, { isPrimary: true, pointerId: 1, pointerType: "touch" }, init);
        target.dispatchEvent(event);
    };

    const swipe = (fromX: number, toX: number, init: Record<string, unknown> = {}, dy = 0): void => {
        const content = host.querySelector("[data-scroll-view-content]") as HTMLElement;
        pointer(content, "pointerdown", fromX, 100, init);
        pointer(document, "pointerup", toX, 100 + dy, init);
    };

    beforeEach(async () => {
        vi.spyOn(console, "warn").mockImplementation(() => undefined);
        fixture = TestBed.createComponent(HostComponent);
        await render();
        document.body.appendChild(fixture.nativeElement);
        host = fixture.nativeElement.querySelector("mona-scroll-view");
    });

    afterEach(() => {
        fixture.destroy();
        vi.restoreAllMocks();
    });

    describe("naming", () => {
        it("is a named region when it has a label, and keeps the counter on the slide", () => {
            expect(host.getAttribute("role")).toBe("region");
            expect(host.getAttribute("aria-label")).toBe("Featured");
            expect(host.querySelector("[data-scroll-view-slide]")?.getAttribute("aria-label")).toBe("Page 1 of 3");
        });

        it("doesn't change its name with the page", async () => {
            fixture.componentInstance.index.set(1);
            await render();
            expect(host.getAttribute("aria-label")).toBe("Featured");
            expect(host.querySelector("[data-scroll-view-slide]")?.getAttribute("aria-label")).toBe("Page 2 of 3");
        });

        it("takes aria-labelledby as a name", async () => {
            const labelled = TestBed.createComponent(LabelledByHostComponent);
            labelled.detectChanges();
            await labelled.whenStable();
            const element = labelled.nativeElement.querySelector("mona-scroll-view") as HTMLElement;
            expect(element.getAttribute("role")).toBe("region");
            expect(element.getAttribute("aria-labelledby")).toBe("carousel-name");
            expect(element.getAttribute("aria-label")).toBeNull();
            expect(console.warn).not.toHaveBeenCalled();
            labelled.destroy();
        });

        it("is a plain group and warns when it has no name", async () => {
            const unnamed = TestBed.createComponent(UnnamedHostComponent);
            unnamed.detectChanges();
            await unnamed.whenStable();
            expect(unnamed.nativeElement.querySelector("mona-scroll-view").getAttribute("role")).toBe("group");
            expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("a carousel needs a name"));
            unnamed.destroy();
        });

        it("doesn't warn about an empty carousel, can't be focused, and has no role description", async () => {
            const empty = TestBed.createComponent(UnnamedHostComponent);
            empty.componentInstance.data.set([]);
            empty.detectChanges();
            await empty.whenStable();
            const element = empty.nativeElement.querySelector("mona-scroll-view") as HTMLElement;
            expect(element.getAttribute("tabindex")).toBeNull();
            expect(element.getAttribute("aria-roledescription")).toBeNull();
            expect(console.warn).not.toHaveBeenCalled();
            empty.destroy();
        });

        it("gives a carousel with slides a tab stop and a role description", () => {
            expect(host.getAttribute("tabindex")).toBe("0");
            expect(host.getAttribute("aria-roledescription")).toBe("carousel");
        });
    });

    describe("axe", () => {
        const rules = { rules: { "color-contrast": { enabled: false } } };

        it("passes with slides, arrows and a pager", async () => {
            fixture.componentInstance.arrows.set(true);
            fixture.componentInstance.pageable.set(true);
            await render();
            expect((await axe.run(fixture.nativeElement, rules)).violations).toEqual([]);
        });

        it("passes with two on a page", async () => {
            const two = TestBed.createComponent(TwoCarouselsHostComponent);
            two.detectChanges();
            await two.whenStable();
            expect((await axe.run(two.nativeElement, rules)).violations).toEqual([]);
            two.destroy();
        });

        it("passes while empty", async () => {
            const empty = TestBed.createComponent(UnnamedHostComponent);
            empty.componentInstance.data.set([]);
            empty.detectChanges();
            await empty.whenStable();
            expect((await axe.run(empty.nativeElement, rules)).violations).toEqual([]);
            empty.destroy();
        });

        it("keeps slides out of a list, and labels the pager", async () => {
            fixture.componentInstance.pageable.set(true);
            await render();
            const content = host.querySelector("[data-scroll-view-content]") as HTMLElement;
            expect(content.querySelector("ul, li")).toBeNull();
            expect(host.querySelector("ul")?.getAttribute("aria-label")).toBe("Pages");
        });
    });

    describe("announcing slides", () => {
        it("makes the slide container a polite, non-atomic live region", () => {
            const content = host.querySelector("[data-scroll-view-content]") as HTMLElement;
            expect(content.getAttribute("aria-live")).toBe("polite");
            expect(content.getAttribute("aria-atomic")).toBe("false");
        });
    });

    describe("keys", () => {
        it("moves with arrows, and takes the key", async () => {
            const event = key(host, "ArrowRight");
            await render();
            expect(fixture.componentInstance.index()).toBe(1);
            expect(event.defaultPrevented).toBe(true);
        });

        it("leaves an unrelated key alone", async () => {
            const event = key(host, "PageDown");
            await render();
            expect(fixture.componentInstance.index()).toBe(0);
            expect(event.defaultPrevented).toBe(false);
        });

        it.each([
            ["an input", ".slide-input"],
            ["a slider", ".slide-slider"],
            ["a button", ".slide-button"]
        ])("leaves arrows in %s inside a slide alone", async (_name, selector) => {
            const field = host.querySelector(selector) as HTMLElement;
            field.focus();
            const event = key(field, "ArrowRight");
            await render();
            expect(fixture.componentInstance.index()).toBe(0);
            expect(event.defaultPrevented).toBe(false);
            expect(document.activeElement).toBe(field);
        });

        it.each(["altKey", "ctrlKey", "metaKey", "shiftKey"])("ignores an arrow with %s", async modifier => {
            const event = key(host, "ArrowRight", { [modifier]: true });
            await render();
            expect(fixture.componentInstance.index()).toBe(0);
            expect(event.defaultPrevented).toBe(false);
        });

        it("ignores a key something else already took", async () => {
            const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowRight" });
            event.preventDefault();
            host.dispatchEvent(event);
            await render();
            expect(fixture.componentInstance.index()).toBe(0);
        });

        it("goes to the first and last slide with Home and End", async () => {
            const end = key(host, "End");
            await render();
            expect(fixture.componentInstance.index()).toBe(2);
            expect(end.defaultPrevented).toBe(true);
            const home = key(host, "Home");
            await render();
            expect(fixture.componentInstance.index()).toBe(0);
            expect(home.defaultPrevented).toBe(true);
        });

        it("still moves with arrows on a pager dot and an arrow button", async () => {
            fixture.componentInstance.arrows.set(true);
            fixture.componentInstance.pageable.set(true);
            await render();
            key(host.querySelector("[data-active-page='true']") as HTMLElement, "ArrowRight");
            await render();
            expect(fixture.componentInstance.index()).toBe(1);
            key(host.querySelector("[data-navigate-next]") as HTMLElement, "ArrowLeft");
            await render();
            expect(fixture.componentInstance.index()).toBe(0);
        });

        it("reverses arrows in RTL, but not Home and End", async () => {
            fixture.componentInstance.dir.set("rtl");
            await render();
            key(host, "ArrowLeft");
            await render();
            expect(fixture.componentInstance.index()).toBe(1);
            key(host, "ArrowRight");
            await render();
            expect(fixture.componentInstance.index()).toBe(0);
            key(host, "End");
            await render();
            expect(fixture.componentInstance.index()).toBe(2);
        });
    });

    describe("keeping the page where it is", () => {
        const stubRects = (list: HTMLElement): void => {
            vi.spyOn(list, "getBoundingClientRect").mockReturnValue({ left: 100, width: 200 } as DOMRect);
            vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
                return (this === list ? { left: 100, width: 200 } : { left: 400, width: 20 }) as DOMRect;
            });
        };

        let scrollIntoView: ReturnType<typeof vi.fn>;
        let scrollTo: ReturnType<typeof vi.fn>;

        beforeEach(() => {
            scrollIntoView = vi.fn();
            scrollTo = vi.fn();
            Element.prototype.scrollIntoView = scrollIntoView as unknown as typeof Element.prototype.scrollIntoView;
            Element.prototype.scrollTo = scrollTo as unknown as typeof Element.prototype.scrollTo;
        });

        afterEach(() => {
            Reflect.deleteProperty(Element.prototype, "scrollIntoView");
            Reflect.deleteProperty(Element.prototype, "scrollTo");
        });

        it("doesn't move anything when a pager first shows on the first page", async () => {
            fixture.componentInstance.pageable.set(true);
            await render();
            expect(scrollTo).not.toHaveBeenCalled();
            expect(scrollIntoView).not.toHaveBeenCalled();
        });

        it("centers the dot on the pager list, at once, when it first shows on a later page", async () => {
            fixture.componentInstance.index.set(2);
            await render();
            fixture.componentInstance.pageable.set(true);
            await render();
            expect(scrollTo).toHaveBeenCalledTimes(1);
            expect(scrollTo.mock.calls[0][0].behavior).toBe("instant");
            expect(scrollIntoView).not.toHaveBeenCalled();
        });

        it("centers the dot on the list when the index is set from outside, without touching the page", async () => {
            fixture.componentInstance.pageable.set(true);
            await render();
            const list = host.querySelector("ul") as HTMLElement;
            stubRects(list);
            list.scrollLeft = 30;
            fixture.componentInstance.index.set(1);
            await render();
            // The dot's center is at 410 and the list's at 200, so the list moves on by 210.
            expect(scrollTo).toHaveBeenCalledWith({ behavior: "smooth", left: 240 });
            expect(scrollTo.mock.contexts[0]).toBe(list);
            expect(scrollIntoView).not.toHaveBeenCalled();
        });

        it("centers again after a dot click and an arrow", async () => {
            fixture.componentInstance.arrows.set(true);
            fixture.componentInstance.pageable.set(true);
            await render();
            (host.querySelectorAll("[data-page-item] button")[2] as HTMLElement).click();
            await render();
            expect(fixture.componentInstance.index()).toBe(2);
            expect(scrollTo).toHaveBeenCalledTimes(1);
            (host.querySelector("[data-navigate-prev]") as HTMLElement).click();
            await render();
            expect(scrollTo).toHaveBeenCalledTimes(2);
            expect(scrollIntoView).not.toHaveBeenCalled();
        });

        it("centers at once again when a hidden pager comes back", async () => {
            fixture.componentInstance.pageable.set(true);
            await render();
            fixture.componentInstance.pageable.set(false);
            await render();
            fixture.componentInstance.index.set(2);
            await render();
            scrollTo.mockClear();
            fixture.componentInstance.pageable.set(true);
            await render();
            expect(scrollTo).toHaveBeenCalledTimes(1);
            expect(scrollTo.mock.calls[0][0].behavior).toBe("instant");
        });
    });

    describe("focus", () => {
        it("moves to the other arrow when the focused one goes at the end", async () => {
            fixture.componentInstance.arrows.set(true);
            fixture.componentInstance.index.set(1);
            await render();
            const next = host.querySelector("[data-navigate-next]") as HTMLButtonElement;
            next.focus();
            next.click();
            await render();
            expect(fixture.componentInstance.index()).toBe(2);
            expect(next.classList.contains("hidden")).toBe(true);
            expect(document.activeElement).toBe(host.querySelector("[data-navigate-prev]"));
        });

        it("moves to the other arrow when the focused one goes at the start", async () => {
            fixture.componentInstance.arrows.set(true);
            fixture.componentInstance.index.set(1);
            await render();
            const previous = host.querySelector("[data-navigate-prev]") as HTMLButtonElement;
            previous.focus();
            previous.click();
            await render();
            expect(document.activeElement).toBe(host.querySelector("[data-navigate-next]"));
        });

        it("moves to the host when both arrows go", async () => {
            fixture.componentInstance.arrows.set(true);
            fixture.componentInstance.index.set(1);
            await render();
            (host.querySelector("[data-navigate-next]") as HTMLButtonElement).focus();
            fixture.componentInstance.data.set([{ title: "Only" }]);
            await render();
            expect(document.activeElement).toBe(host);
        });

        it("moves to the host from the start arrow when both go", async () => {
            fixture.componentInstance.arrows.set(true);
            fixture.componentInstance.index.set(1);
            await render();
            (host.querySelector("[data-navigate-prev]") as HTMLButtonElement).focus();
            fixture.componentInstance.data.set([{ title: "Only" }]);
            await render();
            expect(document.activeElement).toBe(host);
        });

        it("leaves focus on an arrow that stays", async () => {
            fixture.componentInstance.arrows.set(true);
            await render();
            const next = host.querySelector("[data-navigate-next]") as HTMLButtonElement;
            next.focus();
            next.click();
            await render();
            expect(fixture.componentInstance.index()).toBe(1);
            expect(document.activeElement).toBe(next);
        });

        it("moves to the host when the slide holding focus is replaced from outside", async () => {
            (host.querySelector(".slide-button") as HTMLElement).focus();
            fixture.componentInstance.index.set(1);
            await render();
            expect(document.activeElement).toBe(host);
        });

        it("doesn't take focus when a slide changes with focus elsewhere", async () => {
            const outside = document.createElement("button");
            document.body.appendChild(outside);
            outside.focus();
            fixture.componentInstance.index.set(1);
            await render();
            expect(document.activeElement).toBe(outside);
            outside.remove();
        });

        it("shows a solid ring on the host, arrows and dots", async () => {
            fixture.componentInstance.arrows.set(true);
            fixture.componentInstance.pageable.set(true);
            await render();
            const elements = [
                host,
                host.querySelector("[data-navigate-next]"),
                host.querySelector("[data-active-page='true']")
            ];
            for (const element of elements) {
                expect(element?.classList.contains("focus-visible:outline-2")).toBe(true);
                expect(element?.classList.contains("focus-visible:outline-focus-indicator")).toBe(true);
                expect(element?.classList.contains("outline-none")).toBe(false);
            }
        });
    });

    describe("swipe", () => {
        it("leaves vertical scrolling and pinch zoom to the browser", () => {
            const content = host.querySelector("[data-scroll-view-content]") as HTMLElement;
            expect(content.classList.contains("touch-pan-y")).toBe(true);
            expect(content.classList.contains("touch-pinch-zoom")).toBe(true);
        });

        it("goes forward with a swipe left, and back with a swipe right", async () => {
            swipe(200, 100);
            await render();
            expect(fixture.componentInstance.index()).toBe(1);
            swipe(100, 200);
            await render();
            expect(fixture.componentInstance.index()).toBe(0);
        });

        it("reverses in RTL", async () => {
            fixture.componentInstance.dir.set("rtl");
            await render();
            swipe(100, 200);
            await render();
            expect(fixture.componentInstance.index()).toBe(1);
            swipe(200, 100);
            await render();
            expect(fixture.componentInstance.index()).toBe(0);
        });

        it("accepts exactly the distance, and not less", async () => {
            swipe(200, 161);
            await render();
            expect(fixture.componentInstance.index()).toBe(0);
            swipe(200, 160);
            await render();
            expect(fixture.componentInstance.index()).toBe(1);
        });

        it("ignores a mostly vertical drag", async () => {
            swipe(200, 100, {}, 150);
            await render();
            expect(fixture.componentInstance.index()).toBe(0);
        });

        it("stops at the end, and wraps when infinite", async () => {
            swipe(100, 200);
            await render();
            expect(fixture.componentInstance.index()).toBe(0);
            fixture.componentInstance.infinite.set(true);
            await render();
            swipe(100, 200);
            await render();
            expect(fixture.componentInstance.index()).toBe(2);
        });

        it("leaves a mouse drag to text selection", async () => {
            swipe(200, 100, { pointerType: "mouse" });
            await render();
            expect(fixture.componentInstance.index()).toBe(0);
        });

        it("accepts a pen", async () => {
            swipe(200, 100, { pointerType: "pen" });
            await render();
            expect(fixture.componentInstance.index()).toBe(1);
        });

        it("ignores a second finger, and drops the swipe in progress", async () => {
            const content = host.querySelector("[data-scroll-view-content]") as HTMLElement;
            pointer(content, "pointerdown", 200, 100);
            pointer(content, "pointerdown", 250, 100, { isPrimary: false, pointerId: 2 });
            pointer(document, "pointerup", 100, 100);
            pointer(document, "pointerup", 100, 100, { isPrimary: false, pointerId: 2 });
            await render();
            expect(fixture.componentInstance.index()).toBe(0);
        });

        it("ignores a press that isn't the main button", async () => {
            const content = host.querySelector("[data-scroll-view-content]") as HTMLElement;
            const event = new MouseEvent("pointerdown", { bubbles: true, button: 2, clientX: 200, clientY: 100 });
            Object.assign(event, { isPrimary: true, pointerId: 1, pointerType: "touch" });
            content.dispatchEvent(event);
            pointer(document, "pointerup", 100, 100);
            await render();
            expect(fixture.componentInstance.index()).toBe(0);
        });

        it("ignores the end of a different pointer", async () => {
            const content = host.querySelector("[data-scroll-view-content]") as HTMLElement;
            pointer(content, "pointerdown", 200, 100);
            pointer(document, "pointerup", 100, 100, { pointerId: 9 });
            await render();
            expect(fixture.componentInstance.index()).toBe(0);
            pointer(document, "pointerup", 100, 100);
            await render();
            expect(fixture.componentInstance.index()).toBe(1);
        });

        it("does nothing when the browser takes the gesture", async () => {
            const content = host.querySelector("[data-scroll-view-content]") as HTMLElement;
            pointer(content, "pointerdown", 200, 100);
            pointer(document, "pointercancel", 100, 100);
            pointer(document, "pointerup", 100, 100);
            await render();
            expect(fixture.componentInstance.index()).toBe(0);
        });

        it.each([".slide-input", ".slide-slider"])("leaves a drag that starts on %s alone", async selector => {
            pointer(host.querySelector(selector) as HTMLElement, "pointerdown", 200, 100);
            pointer(document, "pointerup", 100, 100);
            await render();
            expect(fixture.componentInstance.index()).toBe(0);
        });

        it("does nothing with one slide", async () => {
            fixture.componentInstance.data.set([{ title: "Only" }]);
            await render();
            const add = vi.spyOn(document, "addEventListener");
            pointer(host.querySelector("[data-scroll-view-content]") as HTMLElement, "pointerdown", 200, 100);
            expect(add).not.toHaveBeenCalled();
        });

        it("listens only during a swipe, and stops when destroyed", async () => {
            const content = host.querySelector("[data-scroll-view-content]") as HTMLElement;
            const add = vi.spyOn(document, "addEventListener");
            const remove = vi.spyOn(document, "removeEventListener");
            pointer(content, "pointerdown", 200, 100);
            expect(add.mock.calls.map(call => call[0])).toEqual(["pointerup", "pointercancel"]);
            const handlers = add.mock.calls.map(call => call[1]);
            remove.mockClear();
            fixture.destroy();
            expect(remove.mock.calls.map(call => call[1])).toEqual(expect.arrayContaining(handlers));
            const before = fixture.componentInstance.index();
            pointer(document, "pointerup", 100, 100);
            expect(fixture.componentInstance.index()).toBe(before);
        });
    });

    describe("animation direction", () => {
        const animation = (): string => {
            const view = fixture.debugElement.children[0].children[0].componentInstance as ScrollViewComponent;
            return view["enterAnimation"]();
        };

        it("reads forward and back from the arrows with two slides that wrap", async () => {
            fixture.componentInstance.data.set([{ title: "A" }, { title: "B" }]);
            fixture.componentInstance.infinite.set(true);
            fixture.componentInstance.arrows.set(true);
            await render();
            const next = host.querySelector("[data-navigate-next]") as HTMLElement;
            const previous = host.querySelector("[data-navigate-prev]") as HTMLElement;

            next.click();
            await render();
            expect(animation()).toBe("slide-in-from-right");
            next.click();
            await render();
            expect(fixture.componentInstance.index()).toBe(0);
            expect(animation()).toBe("slide-in-from-right");
            previous.click();
            await render();
            expect(fixture.componentInstance.index()).toBe(1);
            expect(animation()).toBe("slide-in-from-left");
        });

        it("treats an outside change with two slides as a plain step", async () => {
            fixture.componentInstance.data.set([{ title: "A" }, { title: "B" }]);
            fixture.componentInstance.infinite.set(true);
            await render();
            fixture.componentInstance.index.set(1);
            await render();
            expect(animation()).toBe("slide-in-from-right");
            fixture.componentInstance.index.set(0);
            await render();
            expect(animation()).toBe("slide-in-from-left");
        });

        it("still wraps an outside change with three slides", async () => {
            fixture.componentInstance.infinite.set(true);
            await render();
            fixture.componentInstance.index.set(2);
            await render();
            expect(animation()).toBe("slide-in-from-left");
            fixture.componentInstance.index.set(0);
            await render();
            expect(animation()).toBe("slide-in-from-right");
        });

        it("doesn't keep an intent from an arrow that went nowhere", async () => {
            fixture.componentInstance.index.set(2);
            await render();
            key(host, "ArrowRight");
            await render();
            fixture.componentInstance.index.set(1);
            await render();
            expect(animation()).toBe("slide-in-from-left");
        });
    });

    describe("slide template", () => {
        it("renders the directive's template with its item", () => {
            expect(host.querySelector(".slide-text")?.textContent).toBe("One");
        });

        it("prefers the directive's template over another one in the content", async () => {
            @Component({
                imports: [ScrollViewComponent, ScrollViewSlideDirective],
                template: `
                    <mona-scroll-view aria-label="Both" [data]="['A']" [height]="100" [width]="100">
                        <ng-template><span class="other">Other</span></ng-template>
                        <ng-template monaScrollViewSlide let-item
                            ><span class="marked">{{ item }}</span></ng-template
                        >
                    </mona-scroll-view>
                `
            })
            class BothHostComponent {}
            const both = TestBed.createComponent(BothHostComponent);
            both.detectChanges();
            await both.whenStable();
            expect(both.nativeElement.querySelector(".marked")?.textContent).toBe("A");
            expect(both.nativeElement.querySelector(".other")).toBeNull();
            both.destroy();
        });

        it("still takes a bare template", async () => {
            const bare = TestBed.createComponent(BareHostComponent);
            bare.detectChanges();
            await bare.whenStable();
            expect(bare.nativeElement.querySelector(".bare")?.textContent).toBe("A");
            bare.destroy();
        });

        describe("size", () => {
            let callback: (() => void) | undefined;
            let disconnect: ReturnType<typeof vi.fn>;
            let observed: Element[];

            beforeEach(() => {
                observed = [];
                disconnect = vi.fn();
                vi.stubGlobal(
                    "ResizeObserver",
                    class {
                        public disconnect = disconnect;
                        public unobserve = vi.fn();
                        public constructor(next: () => void) {
                            callback = next;
                        }
                        public observe(element: Element): void {
                            observed.push(element);
                        }
                    }
                );
            });

            afterEach(() => {
                vi.unstubAllGlobals();
            });

            it("follows the slide area as it resizes, and stops when destroyed", async () => {
                let width = 320;
                vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(() => width);
                vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockImplementation(() => 180);

                const sized = TestBed.createComponent(HostComponent);
                sized.detectChanges();
                await sized.whenStable();
                sized.detectChanges();
                const body = (): HTMLElement => sized.nativeElement.querySelector(".slide-body");
                expect(observed).toContain(sized.nativeElement.querySelector("[data-scroll-view-content]"));
                expect(body().getAttribute("data-size")).toBe("320x180");

                width = 640;
                callback?.();
                await sized.whenStable();
                sized.detectChanges();
                expect(body().getAttribute("data-size")).toBe("640x180");

                sized.destroy();
                expect(disconnect).toHaveBeenCalled();
            });
        });
    });
});
