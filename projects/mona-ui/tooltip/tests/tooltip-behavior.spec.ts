import { OverlayContainer } from "@angular/cdk/overlay";
import { ApplicationRef, Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { HOVER_GRACE } from "@nanahoshi/mona-ui/internal";
import { PopupService, type PopupSettings } from "@nanahoshi/mona-ui/popup";
import { TooltipComponent } from "../components/tooltip/tooltip.component";
import { TooltipDirective } from "../directives/tooltip.directive";
import type { TooltipPosition } from "../models/TooltipPosition";
import { tooltipArrowThemeVariants, tooltipBaseThemeVariants } from "../styles/tooltip.styles";

@Component({
    imports: [TooltipDirective],
    template: `
        <button
            id="host"
            monaTooltip
            aria-describedby="help"
            [title]="title()"
            [position]="position()"
            [showDelay]="showDelay()"
            [hideDelay]="hideDelay()"
            (shown)="shownCount = shownCount + 1"
            (hidden)="hiddenCount = hiddenCount + 1">
            <span id="host-label">Hover me</span>
        </button>
        <p id="help">Help text</p>
        <button id="templated" [monaTooltip]="richTip"></button>
        <button id="icon" monaTooltip title="Close"><svg aria-hidden="true"></svg></button>
        <ng-template #richTip><strong id="rich">Rich</strong></ng-template>
    `
})
class HostModeComponent {
    public readonly hideDelay = signal(0);
    public readonly position = signal<TooltipPosition>("top");
    public readonly showDelay = signal(0);
    public readonly title = signal("Save the file");
    public hiddenCount = 0;
    public shownCount = 0;
}

@Component({
    imports: [TooltipDirective],
    template: `
        <ul monaTooltip mode="content" [showDelay]="showDelay()" [disabled]="disabled()">
            @for (item of items(); track item) {
                <li [attr.id]="item" [title]="'Tip ' + item">{{ item }}</li>
            }
            <li id="plain">No tip</li>
        </ul>
    `
})
class ContentModeComponent {
    public readonly disabled = signal(false);
    public readonly items = signal(["a", "b"]);
    public readonly showDelay = signal(0);
}

@Component({
    imports: [TooltipComponent],
    template: `
        <button #anchor id="anchor" aria-describedby="help">Anchor</button>
        <mona-tooltip [target]="anchor" [disabled]="disabled()">Element tip</mona-tooltip>
        <mona-tooltip target=".cell" [position]="position()">Cell tip</mona-tooltip>
        <div id="cells">
            @for (cell of cells(); track cell) {
                <span class="cell" [attr.id]="cell">{{ cell }}</span>
            }
        </div>
    `
})
class ComponentHostComponent {
    public readonly cells = signal(["c1"]);
    public readonly disabled = signal(false);
    public readonly position = signal<TooltipPosition>("top");
}
@Component({
    imports: [ButtonDirective, TooltipDirective],
    template: `<button id="button" type="button" monaButton monaTooltip="Save" [tooltipDisabled]="off()">Save</button>`
})
class ButtonHostComponent {
    public readonly off = signal(true);
}

const readDataTip = (element: HTMLElement): string => element.getAttribute("data-tip") ?? "";

describe("Tooltip behavior", () => {
    let overlayContainer: HTMLElement;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        overlayContainer = TestBed.inject(OverlayContainer).getContainerElement();
    });

    afterEach(() => {
        vi.useRealTimers();
        overlayContainer.replaceChildren();
        document.documentElement.removeAttribute("dir");
        vi.restoreAllMocks();
    });

    function create<T>(type: new () => T): ComponentFixture<T> {
        const fixture = TestBed.createComponent(type);
        document.body.appendChild(fixture.nativeElement);
        fixture.detectChanges();
        settle();
        return fixture;
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

    function el(id: string): HTMLElement {
        const element = document.getElementById(id);
        expect(element).not.toBeNull();
        return element!;
    }

    function over(target: Element, pointerType = "mouse"): void {
        target.dispatchEvent(new PointerEvent("pointerover", { bubbles: true, pointerType }));
        settle();
    }

    function out(target: Element, to: Element | null = document.body, pointerType = "mouse"): void {
        target.dispatchEvent(new PointerEvent("pointerout", { bubbles: true, pointerType, relatedTarget: to }));
    }

    function tooltips(): HTMLElement[] {
        return Array.from(overlayContainer.querySelectorAll<HTMLElement>('[role="tooltip"]'));
    }

    function panel(): HTMLElement {
        const pane = overlayContainer.querySelector<HTMLElement>(".cdk-overlay-pane");
        expect(pane).not.toBeNull();
        return pane!;
    }

    it("keeps the body and arrow on the overlay surface", () => {
        const tooltipClasses = tooltipBaseThemeVariants({ rounded: "medium" }).split(/\s+/);
        const arrowClasses = tooltipArrowThemeVariants().split(/\s+/);
        const surface = "[background-color:var(--mona-effect-overlay-background-color,var(--color-surface-overlay))]";
        expect(tooltipClasses).toContain(surface);
        expect(arrowClasses).toContain(surface);
        expect(arrowClasses).toContain("border-border");
    });

    describe("directive in host mode", () => {
        it("shows the host's title, keeps it out of the browser's own tooltip, and adds to aria-describedby", () => {
            const fixture = create(HostModeComponent);
            const host = el("host");
            expect(host.hasAttribute("title")).toBe(false);
            expect(host.getAttribute("data-mona-title")).toBe("Save the file");

            over(el("host-label"));
            expect(tooltips().map(tip => tip.textContent?.trim())).toEqual(["Save the file"]);
            const id = tooltips()[0].id;
            expect(host.getAttribute("aria-describedby")).toBe(`help ${id}`);
            expect(fixture.componentInstance.shownCount).toBe(1);

            host.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: document.body }));
            out(host);
            finishLeaveAnimation();
            fixture.destroy();
        });

        it("stays open while the pointer is on the tooltip, and closes after a grace once it leaves both", () => {
            vi.useFakeTimers();
            const fixture = create(HostModeComponent);
            const host = el("host");
            over(host);
            out(host);
            vi.advanceTimersByTime(HOVER_GRACE - 10);
            panel().dispatchEvent(new PointerEvent("pointerenter", { pointerType: "mouse" }));
            vi.advanceTimersByTime(HOVER_GRACE * 3);
            settle();
            expect(tooltips()).toHaveLength(1);

            panel().dispatchEvent(new PointerEvent("pointerleave", { pointerType: "mouse" }));
            vi.advanceTimersByTime(HOVER_GRACE);
            settle();
            finishLeaveAnimation();
            expect(tooltips()).toHaveLength(0);
            expect(el("host").getAttribute("aria-describedby")).toBe("help");
            fixture.destroy();
        });

        it("cancels a pending show when the pointer leaves first, and a pending hide when it comes back", () => {
            vi.useFakeTimers();
            const fixture = create(HostModeComponent);
            fixture.componentInstance.showDelay.set(40);
            fixture.componentInstance.hideDelay.set(300);
            fixture.detectChanges();
            const host = el("host");

            over(host);
            vi.advanceTimersByTime(10);
            out(host);
            vi.advanceTimersByTime(200);
            settle();
            expect(tooltips()).toHaveLength(0);
            expect(host.getAttribute("data-mona-title")).toBe("Save the file");

            over(host);
            vi.advanceTimersByTime(40);
            settle();
            expect(tooltips()).toHaveLength(1);
            out(host);
            vi.advanceTimersByTime(200);
            over(host);
            vi.advanceTimersByTime(500);
            settle();
            expect(tooltips()).toHaveLength(1);
            out(host);
            vi.advanceTimersByTime(300);
            settle();
            finishLeaveAnimation();
            expect(tooltips()).toHaveLength(0);
            fixture.destroy();
        });

        it("doesn't bring the title back after Escape, and stays closed until the pointer leaves", () => {
            const fixture = create(HostModeComponent);
            const host = el("host");
            over(host);
            document.body.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
            tooltips()[0]?.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
            settle();
            finishLeaveAnimation();
            expect(tooltips()).toHaveLength(0);
            expect(host.hasAttribute("title")).toBe(false);

            over(el("host-label"));
            expect(tooltips()).toHaveLength(0);
            out(host);
            over(host);
            expect(tooltips()).toHaveLength(1);
            fixture.destroy();
            finishLeaveAnimation();
        });

        it("ignores touch pointers, and shows on focus", () => {
            const fixture = create(HostModeComponent);
            const host = el("host");
            over(host, "touch");
            expect(tooltips()).toHaveLength(0);

            host.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
            settle();
            expect(tooltips()).toHaveLength(1);
            out(host, document.body, "touch");
            expect(tooltips()).toHaveLength(1);
            host.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: document.body }));
            settle();
            finishLeaveAnimation();
            expect(tooltips()).toHaveLength(0);
            fixture.destroy();
        });

        it("shows a template given to monaTooltip", () => {
            const fixture = create(HostModeComponent);
            over(el("templated"));
            expect(overlayContainer.querySelector("#rich")?.textContent).toBe("Rich");
            fixture.destroy();
            finishLeaveAnimation();
        });

        it("keeps the title as the name of an element that has no other, and puts everything back on destroy", () => {
            const fixture = create(HostModeComponent);
            const host = el("host");
            const icon = el("icon");
            expect(host.hasAttribute("aria-label")).toBe(false);
            expect(icon.getAttribute("aria-label")).toBe("Close");
            expect(icon.hasAttribute("title")).toBe(false);

            fixture.destroy();
            expect(host.getAttribute("title")).toBe("Save the file");
            expect(host.hasAttribute("data-mona-title")).toBe(false);
            expect(icon.getAttribute("title")).toBe("Close");
            expect(icon.hasAttribute("aria-label")).toBe(false);
        });

        it("emits shown when it opens and hidden once it has closed", async () => {
            const fixture = create(HostModeComponent);
            const host = el("host");
            host.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
            settle();
            expect(fixture.componentInstance.shownCount).toBe(1);
            host.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: document.body }));
            expect(fixture.componentInstance.hiddenCount).toBe(0);
            // Without a running animation, the popup finishes closing from its fallback timer.
            await new Promise(resolve => setTimeout(resolve, 50));
            settle();
            expect(fixture.componentInstance.hiddenCount).toBe(1);
            fixture.destroy();
        });

        it("places left and right physically in RTL, start and end by direction, with the gap on the flipped side", () => {
            const settings = captureSettings();
            document.documentElement.setAttribute("dir", "rtl");
            const fixture = create(HostModeComponent);
            const host = el("host");

            fixture.componentInstance.position.set("left");
            fixture.detectChanges();
            settle();
            over(host);
            const [left, flipped] = settings.at(-1)!.positions as Array<{
                originX: string;
                overlayX: string;
                offsetX: number;
            }>;
            // In RTL the overlay's end is its left edge.
            expect(left).toEqual(expect.objectContaining({ offsetX: -12, originX: "end", overlayX: "start" }));
            expect(flipped).toEqual(expect.objectContaining({ offsetX: 12, originX: "start", overlayX: "end" }));
            expect(tooltips()[0].querySelector("[data-position]")?.getAttribute("data-position")).toBe("left");
            out(host);
            finishLeaveAnimation();

            fixture.componentInstance.position.set("start");
            fixture.detectChanges();
            settle();
            over(host);
            expect(tooltips()[0].querySelector("[data-position]")?.getAttribute("data-position")).toBe("right");

            fixture.componentInstance.position.set("top");
            fixture.detectChanges();
            settle();
            over(host);
            const [top, bottom] = settings.at(-1)!.positions as Array<{ offsetY: number }>;
            expect(top.offsetY).toBe(-12);
            expect(bottom.offsetY).toBe(12);
            fixture.destroy();
            finishLeaveAnimation();
        });
    });

    describe("directive reading its text with contentOf", () => {
        @Component({
            imports: [TooltipDirective],
            template: `
                <ul monaTooltip mode="content" filter="[data-tip]" [contentOf]="contentOf">
                    <li id="tipped" data-tip="From the attribute" title="Left alone">Tipped</li>
                    <li id="empty" data-tip="" title="Not shown">Empty</li>
                    <li id="titled" title="Not matched">Titled</li>
                </ul>
            `
        })
        class ContentOfComponent {
            public readonly contentOf = readDataTip;
        }

        it("shows what it returns, and leaves the title where it is", () => {
            const fixture = create(ContentOfComponent);
            over(el("tipped"));
            settle();
            expect(tooltips().map(tip => tip.textContent?.trim())).toEqual(["From the attribute"]);
            expect(el("tipped").getAttribute("title")).toBe("Left alone");
            expect(el("tipped").hasAttribute("data-mona-title")).toBe(false);
            fixture.destroy();
        });

        it("shows nothing for an empty result", () => {
            const fixture = create(ContentOfComponent);
            over(el("empty"));
            settle();
            expect(tooltips()).toHaveLength(0);
            expect(el("empty").getAttribute("title")).toBe("Not shown");
            fixture.destroy();
        });

        it("leaves what the filter doesn't match alone", () => {
            const fixture = create(ContentOfComponent);
            over(el("titled"));
            settle();
            expect(tooltips()).toHaveLength(0);
            expect(el("titled").getAttribute("title")).toBe("Not matched");
            fixture.destroy();
        });
    });

    describe("directive in content mode", () => {
        it("keeps one tooltip at a time when hovering quickly across items with a show delay", () => {
            vi.useFakeTimers();
            const fixture = create(ContentModeComponent);
            fixture.componentInstance.showDelay.set(40);
            fixture.detectChanges();

            over(el("a"));
            vi.advanceTimersByTime(40);
            settle();
            out(el("a"), el("b"));
            over(el("b"));
            vi.advanceTimersByTime(40);
            settle();
            finishLeaveAnimation();
            expect(tooltips().map(tip => tip.textContent?.trim())).toEqual(["Tip b"]);

            out(el("b"));
            vi.advanceTimersByTime(HOVER_GRACE);
            settle();
            finishLeaveAnimation();
            expect(tooltips()).toHaveLength(0);
            fixture.destroy();
        });

        it("keeps working for items that are re-rendered or added while a tooltip is open", () => {
            const fixture = create(ContentModeComponent);
            over(el("a"));
            expect(tooltips()).toHaveLength(1);
            fixture.componentInstance.items.set(["a", "b", "c"]);
            fixture.detectChanges();
            settle();
            out(el("a"));
            finishLeaveAnimation();

            over(el("a"));
            expect(tooltips().map(tip => tip.textContent?.trim())).toEqual(["Tip a"]);
            out(el("a"));
            finishLeaveAnimation();
            over(el("c"));
            expect(tooltips().map(tip => tip.textContent?.trim())).toEqual(["Tip c"]);
            over(el("plain"));
            finishLeaveAnimation();
            expect(tooltips().map(tip => tip.textContent?.trim())).toEqual(["Tip c"]);
            fixture.destroy();
            finishLeaveAnimation();
        });

        it("closes when its anchor is removed, or when it is disabled", async () => {
            const fixture = create(ContentModeComponent);
            over(el("b"));
            expect(tooltips()).toHaveLength(1);
            fixture.componentInstance.items.set(["a"]);
            fixture.detectChanges();
            settle();
            await Promise.resolve();
            finishLeaveAnimation();
            expect(tooltips()).toHaveLength(0);

            over(el("a"));
            expect(tooltips()).toHaveLength(1);
            fixture.componentInstance.disabled.set(true);
            fixture.detectChanges();
            settle();
            finishLeaveAnimation();
            expect(tooltips()).toHaveLength(0);
            over(el("a"));
            expect(tooltips()).toHaveLength(0);
            fixture.destroy();
        });
    });

    it("disables only the tooltip through tooltipDisabled, leaving the button enabled", () => {
        const fixture = create(ButtonHostComponent);
        const button = el("button") as HTMLButtonElement;

        over(button);
        expect(tooltips()).toHaveLength(0);
        expect(button.disabled).toBe(false);

        fixture.componentInstance.off.set(false);
        fixture.detectChanges();
        settle();
        over(button);
        expect(tooltips()).toHaveLength(1);
        fixture.destroy();
    });

    describe("component", () => {
        it("adds to an element target's aria-describedby and closes when disabled", () => {
            const fixture = create(ComponentHostComponent);
            const anchor = el("anchor");
            over(anchor);
            expect(tooltips().map(tip => tip.textContent?.trim())).toEqual(["Element tip"]);
            expect(anchor.getAttribute("aria-describedby")).toBe(`help ${tooltips()[0].id}`);

            fixture.componentInstance.disabled.set(true);
            fixture.detectChanges();
            settle();
            finishLeaveAnimation();
            expect(tooltips()).toHaveLength(0);
            expect(anchor.getAttribute("aria-describedby")).toBe("help");
            fixture.destroy();
        });

        it("delegates a selector target from the document, for elements added later, without observing the page", () => {
            const observe = vi.spyOn(MutationObserver.prototype, "observe");
            const fixture = create(ComponentHostComponent);
            expect(observe).not.toHaveBeenCalled();

            fixture.componentInstance.cells.set(["c1", "c2"]);
            fixture.detectChanges();
            settle();
            over(el("c2"));
            expect(tooltips().map(tip => tip.textContent?.trim())).toEqual(["Cell tip"]);
            out(el("c2"), el("c1"));
            over(el("c1"));
            finishLeaveAnimation();
            expect(tooltips()).toHaveLength(1);
            fixture.destroy();
            finishLeaveAnimation();
            expect(tooltips()).toHaveLength(0);
        });
    });
});
