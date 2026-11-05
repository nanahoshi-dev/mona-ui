import { OverlayContainer } from "@angular/cdk/overlay";
import {
    ApplicationRef,
    Component,
    InjectionToken,
    Injector,
    inject,
    signal,
    type TemplateRef,
    viewChild
} from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { MONA_DEFAULT_LOCALE, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { PopupCloseSource, PopupService, type PopupSettings } from "@nanahoshi/mona-ui/popup";
import { WindowComponent } from "../components/window/window.component";
import { WINDOW_DATA } from "../models/WindowData";
import { WindowRef } from "../models/WindowRef";
import type { WindowResult } from "../models/WindowResult";
import { WindowService } from "../services/window.service";

const GREETING = new InjectionToken<string>("GREETING");

@Component({
    selector: "mona-test-window-body",
    template: `<p id="body-text">{{ greeting }} {{ data.name }}</p>
        <input id="body-input" />`
})
class WindowBodyComponent {
    public readonly data = inject<{ name: string }>(WINDOW_DATA);
    public readonly greeting = inject(GREETING);
    public readonly windowRef = inject(WindowRef);
}

@Component({
    imports: [WindowComponent],
    template: `
        @if (open()) {
            <mona-window
                #hosted
                title="Hosted"
                (close)="closeCount = closeCount + 1"
                (closed)="closedCount = closedCount + 1">
                <p id="projected">Projected body</p>
            </mona-window>
        }
        <ng-template #body let-data let-windowRef="windowRef">
            <p id="template-text">{{ data?.name }}</p>
            <input id="template-input" />
        </ng-template>
    `
})
class WindowHostComponent {
    public readonly body = viewChild.required<TemplateRef<unknown>>("body");
    public readonly hosted = viewChild<WindowComponent>("hosted");
    public readonly open = signal(true);
    public closeCount = 0;
    public closedCount = 0;
}

describe("Window contract", () => {
    let overlayContainer: HTMLElement;
    let page: HTMLElement;
    let service: WindowService;

    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [WindowHostComponent] });
        TestBed.inject(MonaI18nService).use(MONA_DEFAULT_LOCALE);
        overlayContainer = TestBed.inject(OverlayContainer).getContainerElement();
        service = TestBed.inject(WindowService);
        page = document.createElement("main");
        page.innerHTML = `<button id="page-button" type="button">Page</button>`;
        document.body.prepend(page);
    });

    afterEach(() => {
        overlayContainer.replaceChildren();
        page.remove();
        document.documentElement.classList.remove("cdk-global-scrollblock");
        vi.restoreAllMocks();
    });

    function captureSettings(): PopupSettings[] {
        const popupService = TestBed.inject(PopupService);
        const create = popupService.create.bind(popupService);
        const captured: PopupSettings[] = [];
        vi.spyOn(popupService, "create").mockImplementation(settings => {
            captured.push(settings);
            return create(settings);
        });
        return captured;
    }

    function settle(): void {
        TestBed.inject(ApplicationRef).tick();
    }

    function finishLeaveAnimation(): void {
        overlayContainer
            .querySelectorAll<HTMLElement>(".mona-popup-wrapper > div")
            .forEach(element => element.dispatchEvent(new Event("animationend", { bubbles: true })));
        settle();
    }

    function windowElements(): HTMLElement[] {
        return Array.from(overlayContainer.querySelectorAll<HTMLElement>('[role="dialog"]'));
    }

    function within(windowRef: WindowRef<unknown>): HTMLElement {
        const element = windowRef.element.querySelector<HTMLElement>('[role="dialog"]');
        expect(element).not.toBeNull();
        return element!;
    }

    function titleBar(windowRef: WindowRef<unknown>): HTMLElement {
        return within(windowRef).querySelector<HTMLElement>("[monaWindowDragHandler]")!;
    }

    function button(windowRef: WindowRef<unknown>, label: string): HTMLButtonElement {
        const found = within(windowRef).querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
        expect(found).not.toBeNull();
        return found!;
    }

    function pane(windowRef: WindowRef<unknown>): HTMLElement {
        return windowRef.element;
    }

    function placeAt(windowRef: WindowRef<unknown>, left: number, top: number, width: number, height: number): void {
        vi.spyOn(windowRef.element, "getBoundingClientRect").mockReturnValue(new DOMRect(left, top, width, height));
    }

    function key(target: HTMLElement, init: KeyboardEventInit): KeyboardEvent {
        const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init });
        target.dispatchEvent(event);
        return event;
    }

    function pointer(target: EventTarget, type: string, init: MouseEventInit & { pointerId?: number }): void {
        const event = new MouseEvent(type, { bubbles: true, cancelable: true, ...init });
        Object.defineProperties(event, {
            isPrimary: { value: true },
            pointerId: { value: init.pointerId ?? 1 }
        });
        target.dispatchEvent(event);
    }

    function record<R>(windowRef: WindowRef<R>): { closed: WindowResult<R>[]; completed: string[] } {
        const closed: WindowResult<R>[] = [];
        const completed: string[] = [];
        windowRef.closed$.subscribe({ complete: () => completed.push("closed$"), next: value => closed.push(value) });
        windowRef.close$.subscribe({ complete: () => completed.push("close$") });
        windowRef.drag$.subscribe({ complete: () => completed.push("drag$") });
        windowRef.dragStart$.subscribe({ complete: () => completed.push("dragStart$") });
        windowRef.dragEnd$.subscribe({ complete: () => completed.push("dragEnd$") });
        windowRef.resize$.subscribe({ complete: () => completed.push("resize$") });
        return { closed, completed };
    }

    it("keeps component content alive while minimized and shows it again on restore", () => {
        const parent = Injector.create({
            providers: [{ provide: GREETING, useValue: "Hello" }],
            parent: TestBed.inject(Injector)
        });
        const windowRef = service.open({
            content: WindowBodyComponent,
            data: { name: "Mona" },
            injector: parent,
            minimizable: true,
            title: "Minimize"
        });
        settle();
        const instance = windowRef.component?.instance as WindowBodyComponent;
        const input = within(windowRef).querySelector<HTMLInputElement>("#body-input")!;
        input.value = "draft";

        button(windowRef, "Minimize").click();
        settle();
        const content = input.closest<HTMLElement>("[hidden]");
        expect(content).not.toBeNull();
        expect(content!.hasAttribute("inert")).toBe(true);
        expect(windowRef.popupRef.overlayRef.getConfig().height).toBe("fit-content");
        // A window sized by its content keeps the width it had instead of shrinking to its title.
        expect(windowRef.popupRef.overlayRef.getConfig().width).toBeDefined();

        button(windowRef, "Restore").click();
        settle();
        expect(windowRef.component?.instance).toBe(instance);
        expect(within(windowRef).querySelector<HTMLInputElement>("#body-input")).toBe(input);
        expect(input.value).toBe("draft");
        expect(input.closest("[hidden]")).toBeNull();
        expect(windowRef.popupRef.overlayRef.getConfig().height).toBe("fit-content");
        expect(windowRef.popupRef.overlayRef.getConfig().width).toBeUndefined();
        windowRef.close();
        finishLeaveAnimation();
    });

    it("gives component content its data, the opener's injector and its WindowRef", () => {
        const parent = Injector.create({
            providers: [{ provide: GREETING, useValue: "Hi" }],
            parent: TestBed.inject(Injector)
        });
        const windowRef = service.open({
            content: WindowBodyComponent,
            data: { name: "Mona" },
            injector: parent,
            title: "Data"
        });
        settle();
        expect(within(windowRef).querySelector("#body-text")?.textContent?.trim()).toBe("Hi Mona");
        expect((windowRef.component?.instance as WindowBodyComponent).windowRef).toBe(windowRef);
        windowRef.close();
        finishLeaveAnimation();
    });

    it("gives template content its data as the implicit context", () => {
        const fixture = TestBed.createComponent(WindowHostComponent);
        fixture.componentInstance.open.set(false);
        fixture.detectChanges();
        const windowRef = service.open({
            content: fixture.componentInstance.body(),
            data: { name: "Luna" },
            title: "Tpl"
        });
        settle();
        expect(within(windowRef).querySelector("#template-text")?.textContent?.trim()).toBe("Luna");
        windowRef.close();
        finishLeaveAnimation();
        fixture.destroy();
    });

    it("centers through the overlay and keeps centering as the size changes", () => {
        const windowRef = service.open({ left: 24, title: "Center", top: 48, width: 400 });
        settle();
        windowRef.center();
        const wrapper = pane(windowRef).parentElement!;
        expect(wrapper.style.justifyContent).toBe("center");
        expect(wrapper.style.alignItems).toBe("center");
        expect(pane(windowRef).style.marginLeft).toBe("");
        expect(pane(windowRef).style.marginTop).toBe("");

        windowRef.resize({ center: true, width: 500 });
        expect(pane(windowRef).style.width).toBe("500px");
        expect(wrapper.style.justifyContent).toBe("center");
        windowRef.close();
        finishLeaveAnimation();
    });

    it("moves and resizes only the axes it is given", () => {
        const windowRef = service.open({ height: 300, left: 24, title: "Axes", top: 48, width: 400 });
        settle();
        const element = pane(windowRef);
        expect(element.style.marginLeft).toBe("24px");
        expect(element.style.marginTop).toBe("48px");
        expect(element.style.position).not.toBe("absolute");

        windowRef.move({ top: 10 });
        expect(element.style.marginLeft).toBe("24px");
        expect(element.style.marginTop).toBe("10px");

        windowRef.resize({ width: 500 });
        expect(element.style.width).toBe("500px");
        expect(element.style.height).toBe("300px");

        windowRef.resize({ height: 0 });
        expect(element.style.width).toBe("500px");
        expect(element.style.height).toBe("0px");
        windowRef.close();
        finishLeaveAnimation();
    });

    it("moves and resizes a <mona-window> on both axes in one call", () => {
        const fixture = TestBed.createComponent(WindowHostComponent);
        fixture.detectChanges();
        settle();
        const hosted = fixture.componentInstance.hosted()!;
        const element = overlayContainer.querySelector<HTMLElement>(".cdk-overlay-pane")!;

        hosted.move({ left: 30, top: 40 });
        expect(element.style.marginLeft).toBe("30px");
        expect(element.style.marginTop).toBe("40px");

        hosted.resize({ height: 400, width: 500 });
        expect(element.style.width).toBe("500px");
        expect(element.style.height).toBe("400px");
        fixture.destroy();
        finishLeaveAnimation();
    });

    it("keeps its place, physically, when the overlay is repositioned after a direction change", () => {
        const windowRef = service.open({ left: 24, title: "Steady", top: 48 });
        settle();
        document.documentElement.setAttribute("dir", "rtl");
        try {
            windowRef.popupRef.overlayRef.updatePosition();
            expect(pane(windowRef).style.marginLeft).toBe("24px");
            expect(pane(windowRef).style.marginTop).toBe("48px");
            expect(within(windowRef).style.top).toBe("");
        } finally {
            document.documentElement.removeAttribute("dir");
        }
        windowRef.close();
        finishLeaveAnimation();
    });

    it("renders content placed directly inside <mona-window>", () => {
        const fixture = TestBed.createComponent(WindowHostComponent);
        fixture.detectChanges();
        settle();
        expect(overlayContainer.querySelector("#projected")?.textContent).toBe("Projected body");
        fixture.destroy();
        finishLeaveAnimation();
    });

    it("is named by its title, or by ariaLabel without one, and warns in dev mode when it has neither", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
        const titled = service.open({ title: "Titled" });
        const labelled = service.open({ ariaLabel: "Labelled" });
        settle();
        expect(within(titled).getAttribute("aria-labelledby")).toBeTruthy();
        expect(within(titled).hasAttribute("aria-label")).toBe(false);
        expect(within(labelled).getAttribute("aria-label")).toBe("Labelled");
        expect(within(labelled).hasAttribute("aria-labelledby")).toBe(false);
        expect(warn).not.toHaveBeenCalled();

        const unnamed = service.open({});
        settle();
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("[Mona Window]"), expect.anything());
        for (const windowRef of [titled, labelled, unnamed]) {
            windowRef.close();
        }
        finishLeaveAnimation();
    });

    it("gives the title bar one Tab stop that names the keys it takes", () => {
        const plain = service.open({ title: "Plain" });
        const moving = service.open({ draggable: true, title: "Moving" });
        const sizing = service.open({ resizable: true, title: "Sizing" });
        settle();
        expect(titleBar(plain).hasAttribute("tabindex")).toBe(false);
        expect(titleBar(plain).hasAttribute("role")).toBe(false);
        expect(titleBar(moving).getAttribute("aria-label")).toBe("Move window. Use arrow keys to move.");
        expect(titleBar(sizing).getAttribute("aria-label")).toBe(
            "Resize window. Use Control and arrow keys to resize."
        );
        expect(titleBar(sizing).getAttribute("tabindex")).toBe("0");
        for (const windowRef of [plain, moving, sizing]) {
            windowRef.close();
        }
        finishLeaveAnimation();
    });

    it("moves with the arrow keys from the title bar only, and stays in the viewport", () => {
        const windowRef = service.open({ draggable: true, title: "Keys" });
        settle();
        const moves: unknown[] = [];
        windowRef.drag$.subscribe(event => moves.push(event));
        placeAt(windowRef, 100, 50, 400, 300);

        const fromButton = key(button(windowRef, "Close window"), { key: "ArrowRight" });
        expect(fromButton.defaultPrevented).toBe(false);
        expect(moves).toEqual([]);

        const fromBar = key(titleBar(windowRef), { key: "ArrowRight" });
        expect(fromBar.defaultPrevented).toBe(true);
        expect(pane(windowRef).style.marginLeft).toBe("110px");
        expect(moves).toEqual([{ left: 110, top: 50 }]);

        key(titleBar(windowRef), { key: "ArrowDown", shiftKey: true });
        expect(pane(windowRef).style.marginTop).toBe("51px");

        placeAt(windowRef, innerWidth - 405, innerHeight - 302, 400, 300);
        key(titleBar(windowRef), { key: "ArrowRight" });
        expect(pane(windowRef).style.marginLeft).toBe(`${innerWidth - 400}px`);
        key(titleBar(windowRef), { key: "ArrowDown" });
        expect(pane(windowRef).style.marginTop).toBe(`${innerHeight - 300}px`);
        windowRef.close();
        finishLeaveAnimation();
    });

    it("resizes with Control and the arrow keys from the title bar, within its limits", () => {
        const windowRef = service.open({ minWidth: 200, resizable: true, title: "Size" });
        settle();
        const sizes: unknown[] = [];
        windowRef.resize$.subscribe(event => sizes.push(event));
        placeAt(windowRef, 100, 50, 400, 300);

        expect(key(titleBar(windowRef), { ctrlKey: true, key: "ArrowRight" }).defaultPrevented).toBe(true);
        expect(pane(windowRef).style.width).toBe("410px");
        expect(sizes).toEqual([{ height: 300, left: 100, top: 50, width: 410 }]);

        key(titleBar(windowRef), { key: "ArrowDown", metaKey: true });
        expect(pane(windowRef).style.height).toBe("310px");

        placeAt(windowRef, 100, 50, 205, 300);
        key(titleBar(windowRef), { ctrlKey: true, key: "ArrowLeft" });
        expect(pane(windowRef).style.width).toBe("200px");

        // Not draggable: plain arrows do nothing.
        expect(key(titleBar(windowRef), { key: "ArrowLeft" }).defaultPrevented).toBe(false);
        windowRef.close();
        finishLeaveAnimation();
    });

    it("maximizes from the title bar only when maximizable, and restores the size and place it had", () => {
        const fixed = service.open({ maximizable: false, title: "Fixed", width: 400 });
        settle();
        titleBar(fixed).dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
        expect(fixed.popupRef.overlayRef.getConfig().width).toBe(400);
        fixed.close();

        const windowRef = service.open({ left: 24, title: "Max", top: 48, width: 400 });
        settle();
        titleBar(windowRef).dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
        settle();
        const config = () => windowRef.popupRef.overlayRef.getConfig();
        expect(config().width).toBe("100dvw");
        expect(config().height).toBe("100dvh");
        expect(pane(windowRef).parentElement!.style.justifyContent).toBe("center");
        expect(within(windowRef).querySelector("[monaWindowResizeHandler]")).toBeNull();

        button(windowRef, "Restore").click();
        settle();
        expect(config().width).toBe(400);
        expect(config().height).toBe("fit-content");
        expect(pane(windowRef).style.marginLeft).toBe("24px");
        expect(pane(windowRef).style.marginTop).toBe("48px");
        windowRef.close();
        finishLeaveAnimation();
    });

    it("asks preventClose once per close-button click", () => {
        const preventClose = vi.fn(() => true);
        const windowRef = service.open({ preventClose, title: "Guarded" });
        settle();
        button(windowRef, "Close window").click();
        expect(preventClose).toHaveBeenCalledTimes(1);
        expect(windowElements()).toHaveLength(1);

        preventClose.mockReturnValue(false);
        button(windowRef, "Close window").click();
        finishLeaveAnimation();
        expect(windowElements()).toHaveLength(0);
    });

    it("reports how it closed on closed$, and completes every stream", () => {
        const windowRef = service.open<number>({ title: "Result" });
        settle();
        const log = record(windowRef);
        windowRef.close(42);
        expect(log.closed).toEqual([]);
        finishLeaveAnimation();
        expect(log.closed).toEqual([{ value: 42, via: PopupCloseSource.Programmatic }]);
        expect([...log.completed].sort()).toEqual(
            ["close$", "closed$", "drag$", "dragEnd$", "dragStart$", "resize$"].sort()
        );

        let late: WindowResult<number> | undefined;
        windowRef.closed$.subscribe(value => (late = value));
        expect(late).toEqual({ value: 42, via: PopupCloseSource.Programmatic });

        const viaButton = service.open({ title: "Button" });
        settle();
        const buttonLog = record(viaButton);
        button(viaButton, "Close window").click();
        finishLeaveAnimation();
        expect(buttonLog.closed).toEqual([{ value: undefined, via: PopupCloseSource.CloseButton }]);

        const viaEscape = service.open({ title: "Escape" });
        settle();
        const escapeLog = record(viaEscape);
        within(viaEscape).dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
        finishLeaveAnimation();
        expect(escapeLog.closed).toEqual([{ value: undefined, via: PopupCloseSource.Escape }]);
    });

    it("makes the page inert and locks scrolling behind a modal window", () => {
        const settings = captureSettings();
        const modal = service.open({ modal: true, title: "Modal" });
        settle();
        expect(settings[0]?.blockScroll).toBe(true);
        expect(page.hasAttribute("inert")).toBe(true);
        expect(within(modal).getAttribute("aria-modal")).toBe("true");
        modal.close();
        expect(page.hasAttribute("inert")).toBe(false);
        finishLeaveAnimation();

        const plain = service.open({ title: "Plain" });
        settle();
        expect(settings[1]?.blockScroll).toBe(false);
        expect(page.hasAttribute("inert")).toBe(false);
        plain.close();
        finishLeaveAnimation();
    });

    it("caps the window to the viewport and keeps its size when dragged past an edge", () => {
        const settings = captureSettings();
        const windowRef = service.open({ title: "Capped", windowClass: "first  second" });
        settle();
        expect(settings[0]?.maxHeight).toBe("100dvh");
        expect(settings[0]?.maxWidth).toBe("100dvw");
        expect(settings[0]?.popupClass).toEqual(["shrink-0", "first", "second"]);
        expect(pane(windowRef).classList).toContain("second");
        windowRef.close();
        finishLeaveAnimation();
    });

    it("raises a lower window when it is pressed or focused from outside, keeping focus inside it", () => {
        const fixture = TestBed.createComponent(WindowHostComponent);
        fixture.componentInstance.open.set(false);
        fixture.detectChanges();
        const lower = service.open({ content: fixture.componentInstance.body(), title: "Lower" });
        const upper = service.open({ title: "Upper" });
        settle();
        const hosts = () => Array.from(overlayContainer.children);
        const lowerHost = lower.popupRef.overlayRef.hostElement;
        const upperHost = upper.popupRef.overlayRef.hostElement;
        expect(hosts().indexOf(lowerHost)).toBeLessThan(hosts().indexOf(upperHost));

        const input = within(lower).querySelector<HTMLInputElement>("#template-input")!;
        input.focus();
        expect(hosts().indexOf(lowerHost)).toBeGreaterThan(hosts().indexOf(upperHost));
        expect(document.activeElement).toBe(input);

        pointer(within(upper), "pointerdown", { button: 0 });
        expect(hosts().indexOf(upperHost)).toBeGreaterThan(hosts().indexOf(lowerHost));
        for (const windowRef of [lower, upper]) {
            windowRef.close();
        }
        finishLeaveAnimation();
        fixture.destroy();
    });

    it("drags from the title bar with the primary button after a small movement, and not from its buttons", () => {
        const windowRef = service.open({ draggable: true, title: "Drag" });
        settle();
        placeAt(windowRef, 100, 50, 400, 300);
        const events: string[] = [];
        windowRef.dragStart$.subscribe(() => events.push("start"));
        windowRef.drag$.subscribe(({ left, top }) => events.push(`move ${left},${top}`));
        windowRef.dragEnd$.subscribe(() => events.push("end"));

        pointer(titleBar(windowRef), "pointerdown", { button: 2, clientX: 200, clientY: 60 });
        pointer(document, "pointermove", { clientX: 260, clientY: 90 });
        pointer(document, "pointerup", {});
        expect(events).toEqual([]);

        pointer(button(windowRef, "Close window"), "pointerdown", { button: 0, clientX: 200, clientY: 60 });
        pointer(document, "pointermove", { clientX: 260, clientY: 90 });
        pointer(document, "pointerup", {});
        expect(events).toEqual([]);

        pointer(titleBar(windowRef), "pointerdown", { button: 0, clientX: 200, clientY: 60 });
        pointer(document, "pointermove", { clientX: 201, clientY: 61 });
        expect(events).toEqual([]);
        pointer(document, "pointermove", { clientX: 230, clientY: 80 });
        pointer(document, "pointercancel", {});
        pointer(document, "pointermove", { clientX: 300, clientY: 100 });
        expect(events).toEqual(["start", "move 130,70", "end"]);
        expect(pane(windowRef).style.marginLeft).toBe("130px");
        windowRef.close();
        finishLeaveAnimation();
    });

    it("closes silently when a <mona-window> host is destroyed", () => {
        const errors = vi.spyOn(console, "error").mockImplementation(() => undefined);
        const fixture = TestBed.createComponent(WindowHostComponent);
        fixture.detectChanges();
        settle();
        expect(windowElements()).toHaveLength(1);

        expect(() => {
            fixture.destroy();
            finishLeaveAnimation();
        }).not.toThrow();
        expect(windowElements()).toHaveLength(0);
        expect(errors).not.toHaveBeenCalled();
    });

    it("emits close and closed from <mona-window>, and reopens only once it has closed", () => {
        const fixture = TestBed.createComponent(WindowHostComponent);
        fixture.detectChanges();
        settle();
        const hosted = fixture.componentInstance.hosted()!;

        hosted.openWindow();
        settle();
        expect(windowElements()).toHaveLength(1);

        overlayContainer.querySelector<HTMLButtonElement>('button[aria-label="Close window"]')!.click();
        finishLeaveAnimation();
        expect(fixture.componentInstance.closeCount).toBe(1);
        expect(fixture.componentInstance.closedCount).toBe(1);
        expect(windowElements()).toHaveLength(0);

        hosted.openWindow();
        settle();
        expect(windowElements()).toHaveLength(1);
        fixture.destroy();
        finishLeaveAnimation();
    });
});
