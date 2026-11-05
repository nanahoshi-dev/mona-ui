import { OverlayContainer } from "@angular/cdk/overlay";
import { ApplicationRef, Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { HOVER_GRACE } from "@nanahoshi/mona-ui/internal";
import { PopupService, type PopupSettings } from "@nanahoshi/mona-ui/popup";
import { PopoverFooterTemplateDirective } from "../../directives/popover-footer-template.directive";
import { PopoverTitleTemplateDirective } from "../../directives/popover-title-template.directive";
import type { PopoverHideEvent } from "../../models/PopoverHideEvent";
import type { PopoverPosition } from "../../models/PopoverPosition";
import type { PopoverShowEvent } from "../../models/PopoverShowEvent";
import type { PopoverTrigger } from "../../models/PopoverTrigger";
import { popoverArrowThemeVariants, popoverBaseThemeVariants } from "../../styles/popover.styles";
import { PopoverComponent } from "./popover.component";

@Component({
    imports: [ButtonDirective, PopoverComponent],
    template: `
        <button #first id="first" monaButton>First</button>
        <input #check id="check" type="checkbox" />
        @if (present()) {
            <mona-popover
                [target]="useCheckbox() ? check : first"
                [trigger]="trigger()"
                [title]="title()"
                [ariaLabel]="ariaLabel()"
                [position]="position()"
                [closeOnEscape]="closeOnEscape()"
                (show)="onShow($event)"
                (shown)="shownCount = shownCount + 1"
                (hide)="onHide($event)"
                (hidden)="hiddenCount = hiddenCount + 1">
                <button id="inside">Inside</button>
            </mona-popover>
        }
    `
})
class PopoverHostComponent {
    public readonly ariaLabel = signal<string | undefined>(undefined);
    public readonly closeOnEscape = signal(true);
    public readonly onHide = vi.fn<(event: PopoverHideEvent) => void>();
    public readonly onShow = vi.fn<(event: PopoverShowEvent) => void>();
    public readonly position = signal<PopoverPosition>("top");
    public readonly present = signal(true);
    public readonly title = signal("Details");
    public readonly trigger = signal<PopoverTrigger>("click");
    public readonly useCheckbox = signal(false);
    public hiddenCount = 0;
    public shownCount = 0;
}

@Component({
    imports: [PopoverComponent, PopoverTitleTemplateDirective, PopoverFooterTemplateDirective],
    template: `
        <button #target>Popover Anchor</button>
        <mona-popover [target]="target">
            <ng-template monaPopoverTitleTemplate>Custom Title</ng-template>
            <ng-template monaPopoverFooterTemplate>Custom Footer</ng-template>
        </mona-popover>
    `
})
class PopoverTemplatesHostComponent {}

describe("Popover visual contract", () => {
    it("keeps the overlay and its arrow on the same surface tier", () => {
        const popoverClasses = popoverBaseThemeVariants({ rounded: "medium" }).split(/\s+/);
        const arrowClasses = popoverArrowThemeVariants().split(/\s+/);
        const surface = "[background-color:var(--mona-effect-overlay-background-color,var(--color-surface-overlay))]";
        expect(popoverClasses).toContain(surface);
        expect(arrowClasses).toContain(surface);
        expect(arrowClasses).toContain("border-border");
    });
});

describe("PopoverComponent", () => {
    let fixture: ComponentFixture<PopoverHostComponent>;
    let host: PopoverHostComponent;
    let overlayContainer: HTMLElement;

    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [PopoverHostComponent, PopoverTemplatesHostComponent] });
        overlayContainer = TestBed.inject(OverlayContainer).getContainerElement();
    });

    afterEach(() => {
        vi.useRealTimers();
        fixture?.destroy();
        overlayContainer.replaceChildren();
        document.documentElement.removeAttribute("dir");
        vi.restoreAllMocks();
    });

    function start(configure?: (component: PopoverHostComponent) => void): void {
        fixture = TestBed.createComponent(PopoverHostComponent);
        host = fixture.componentInstance;
        configure?.(host);
        document.body.appendChild(fixture.nativeElement);
        fixture.detectChanges();
        settle();
    }

    function settle(): void {
        fixture?.detectChanges();
        TestBed.inject(ApplicationRef).tick();
    }

    /** Without a running animation, a popup finishes closing from its fallback timer. */
    async function finishClose(): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 50));
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

    function dialog(): HTMLElement | null {
        return overlayContainer.querySelector<HTMLElement>('[role="dialog"]');
    }

    function click(element: HTMLElement): void {
        element.click();
        settle();
    }

    it("tells assistive technology it opens a dialog before the first open, and which one while open", async () => {
        start();
        const target = el("first");
        expect(target.getAttribute("aria-haspopup")).toBe("dialog");
        expect(target.getAttribute("aria-expanded")).toBe("false");
        expect(target.hasAttribute("aria-controls")).toBe(false);

        click(target);
        expect(target.getAttribute("aria-expanded")).toBe("true");
        expect(target.getAttribute("aria-controls")).toBe(dialog()?.id);

        click(target);
        await finishClose();
        expect(dialog()).toBeNull();
        expect(target.getAttribute("aria-expanded")).toBe("false");
        expect(target.hasAttribute("aria-controls")).toBe(false);
    });

    it("moves focus into the popover when opened from a click", () => {
        start();
        el("first").focus();
        click(el("first"));
        settle();
        expect(document.activeElement).toBe(overlayContainer.querySelector("#inside"));
    });

    it("leaves the target's own click behavior alone", () => {
        start(component => component.useCheckbox.set(true));
        const checkbox = el("check") as HTMLInputElement;
        click(checkbox);
        expect(checkbox.checked).toBe(true);
        expect(dialog()).not.toBeNull();
    });

    it("emits show before opening (preventable) and shown once open", () => {
        start();
        host.onShow.mockImplementationOnce(event => event.preventDefault());
        click(el("first"));
        expect(dialog()).toBeNull();
        expect(host.shownCount).toBe(0);

        click(el("first"));
        expect(dialog()).not.toBeNull();
        expect(host.onShow).toHaveBeenCalledTimes(2);
        expect(host.shownCount).toBe(1);
    });

    it("emits hide before closing (preventable) and hidden once closed", async () => {
        start();
        click(el("first"));
        host.onHide.mockImplementationOnce(event => event.preventDefault());
        click(el("first"));
        expect(dialog()).not.toBeNull();
        expect(el("first").getAttribute("aria-expanded")).toBe("true");

        click(el("first"));
        await finishClose();
        expect(host.onHide).toHaveBeenCalledTimes(2);
        expect(host.hiddenCount).toBe(1);
        expect(dialog()).toBeNull();
    });

    it("opens a hover popover on pointer or focus, without taking focus, and keeps it while on the panel", () => {
        vi.useFakeTimers();
        start(component => component.trigger.set("hover"));
        const target = el("first");

        target.dispatchEvent(new PointerEvent("pointerover", { bubbles: true, pointerType: "mouse" }));
        settle();
        expect(dialog()).not.toBeNull();
        expect(document.activeElement).not.toBe(overlayContainer.querySelector("#inside"));

        target.dispatchEvent(
            new PointerEvent("pointerout", { bubbles: true, pointerType: "mouse", relatedTarget: document.body })
        );
        const pane = overlayContainer.querySelector<HTMLElement>(".cdk-overlay-pane")!;
        pane.dispatchEvent(new PointerEvent("pointerenter", { pointerType: "mouse" }));
        vi.advanceTimersByTime(HOVER_GRACE * 3);
        expect(dialog()).not.toBeNull();

        pane.dispatchEvent(new PointerEvent("pointerleave", { pointerType: "mouse" }));
        vi.advanceTimersByTime(HOVER_GRACE + 100);
        settle();
        expect(dialog()).toBeNull();

        target.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
        settle();
        expect(dialog()).not.toBeNull();
    });

    it("closes and cleans up its target when destroyed while open", () => {
        const errors = vi.spyOn(console, "error").mockImplementation(() => undefined);
        start();
        click(el("first"));
        expect(dialog()).not.toBeNull();

        host.present.set(false);
        fixture.detectChanges();
        settle();
        const target = el("first");
        expect(target.hasAttribute("aria-haspopup")).toBe(false);
        expect(target.hasAttribute("aria-expanded")).toBe(false);
        expect(target.hasAttribute("aria-controls")).toBe(false);
        expect(errors).not.toHaveBeenCalled();
    });

    it("moves its attributes to a new target", () => {
        start();
        host.useCheckbox.set(true);
        fixture.detectChanges();
        settle();
        expect(el("first").hasAttribute("aria-haspopup")).toBe(false);
        expect(el("check").getAttribute("aria-haspopup")).toBe("dialog");
    });

    it("is named by its title, or by ariaLabel without one, and warns in dev mode when it has neither", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
        start();
        click(el("first"));
        expect(dialog()?.getAttribute("aria-labelledby")).toBeTruthy();
        expect(dialog()?.hasAttribute("aria-label")).toBe(false);
        expect(warn).not.toHaveBeenCalled();
        fixture.destroy();
        overlayContainer.replaceChildren();

        start(component => {
            component.title.set("");
            component.ariaLabel.set("Filters");
        });
        click(el("first"));
        expect(dialog()?.getAttribute("aria-label")).toBe("Filters");
        expect(dialog()?.hasAttribute("aria-labelledby")).toBe(false);
        fixture.destroy();
        overlayContainer.replaceChildren();

        start(component => component.title.set(""));
        click(el("first"));
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("[Mona Popover]"), expect.anything());
    });

    it("passes closeOnEscape and places start and end by direction, with the gap on the flipped side", () => {
        const settings = captureSettings();
        document.documentElement.setAttribute("dir", "rtl");
        start(component => {
            component.closeOnEscape.set(false);
            component.position.set("end");
        });
        click(el("first"));
        const created = settings.at(-1)!;
        expect(created.closeOnEscape).toBe(false);
        expect(created.closeOnOutsideClick).toBe(true);
        expect(created.closeOnMouseLeave).toBe(false);
        // "end" in RTL is the physical left, so the gap is negative on X and positive once flipped to the right.
        const [primary, flipped] = created.positions as Array<{ offsetX: number }>;
        expect(primary.offsetX).toBe(-4);
        expect(flipped.offsetX).toBe(4);
    });

    it("resolves projected title and footer templates", () => {
        const templates = TestBed.createComponent(PopoverTemplatesHostComponent);
        templates.detectChanges();
        const popover = templates.debugElement.query(By.directive(PopoverComponent)).componentInstance as unknown as {
            footerTemplateRef: () => unknown;
            titleTemplateRef: () => unknown;
        };
        expect(popover.titleTemplateRef()).toBeTruthy();
        expect(popover.footerTemplateRef()).toBeTruthy();
        templates.destroy();
    });
});
