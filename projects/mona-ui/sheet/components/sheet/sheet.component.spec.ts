import { OverlayContainer } from "@angular/cdk/overlay";
import { ApplicationRef, Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { PopupCloseEvent, PopupCloseSource, PopupService, type PopupSettings } from "@nanahoshi/mona-ui/popup";
import axe from "axe-core";
import { SheetSide } from "../../models/SheetSide";
import { SheetComponent } from "./sheet.component";

@Component({
    imports: [SheetComponent],
    template: `
        @if (open()) {
            <mona-sheet title="Projected sheet" (closed)="open.set(false)">
                <button id="projected-action" type="button">Projected action</button>
            </mona-sheet>
        }
    `
})
class SheetHostComponent {
    protected readonly open = signal(true);
}

describe("SheetComponent", () => {
    let fixture: ComponentFixture<SheetComponent> | undefined;
    let overlayContainer: HTMLElement;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [SheetComponent, SheetHostComponent]
        });
        overlayContainer = TestBed.inject(OverlayContainer).getContainerElement();
    });

    afterEach(() => {
        fixture?.destroy();
        fixture = undefined;
        overlayContainer.replaceChildren();
        document.documentElement.classList.remove("cdk-global-scrollblock");
    });

    async function createSheet(
        inputs: Partial<{
            side: SheetSide;
            title: string;
            description: string;
            ariaLabel: string;
            closable: boolean;
            closeOnEscape: boolean;
            closeOnBackdropClick: boolean;
            width: number | string;
            height: number | string;
        }> = {}
    ): Promise<SheetComponent> {
        fixture = TestBed.createComponent(SheetComponent);
        Object.entries(inputs).forEach(([name, value]) => fixture?.componentRef.setInput(name, value));
        fixture.detectChanges();
        await fixture.whenStable();
        TestBed.inject(ApplicationRef).tick();
        return fixture.componentInstance;
    }

    function getDialog(): HTMLElement {
        const dialog = overlayContainer.querySelector<HTMLElement>('[role="dialog"]');
        expect(dialog).not.toBeNull();
        return dialog!;
    }

    function getPanel(): HTMLElement {
        const panel = overlayContainer.querySelector<HTMLElement>(".cdk-overlay-pane");
        expect(panel).not.toBeNull();
        return panel!;
    }

    function finishLeaveAnimation(): void {
        const animationElement = overlayContainer.querySelector<HTMLElement>(".mona-popup-wrapper > div");
        animationElement?.dispatchEvent(new Event("animationend", { bubbles: true }));
        TestBed.inject(ApplicationRef).tick();
    }

    it("renders projected content in the overlay", async () => {
        const hostFixture = TestBed.createComponent(SheetHostComponent);
        hostFixture.detectChanges();
        await hostFixture.whenStable();
        TestBed.inject(ApplicationRef).tick();

        expect(overlayContainer.querySelector("#projected-action")?.textContent).toContain("Projected action");

        hostFixture.destroy();
    });

    it("renders title, description, close button, and modal semantics", async () => {
        await createSheet({ title: "Edit profile", description: "Update your details." });

        const dialog = getDialog();
        const title = dialog.querySelector("h2");
        const description = dialog.querySelector("p");

        expect(title?.textContent).toBe("Edit profile");
        expect(description?.textContent).toBe("Update your details.");
        expect(dialog.getAttribute("aria-modal")).toBe("true");
        expect(dialog.getAttribute("aria-labelledby")).toBe(title?.id);
        expect(dialog.getAttribute("aria-describedby")).toBe(description?.id);
        expect(dialog.querySelector('button[aria-label="Close sheet"]')).not.toBeNull();
    });

    it("has no AXE accessibility violations", async () => {
        await createSheet({ title: "Accessible sheet", description: "Sheet details." });

        const results = await axe.run(document.body, {
            rules: {
                "color-contrast": { enabled: false },
                region: { enabled: false }
            }
        });

        expect(results.violations).toEqual([]);
    });

    it("uses ariaLabel without an unnecessary header when no title is present and closable is false", async () => {
        await createSheet({ ariaLabel: "Navigation", closable: false });

        const dialog = getDialog();
        expect(dialog.getAttribute("aria-label")).toBe("Navigation");
        expect(dialog.hasAttribute("aria-labelledby")).toBe(false);
        expect(dialog.hasAttribute("aria-describedby")).toBe(false);
        expect(dialog.querySelector("header")).toBeNull();
    });

    it.each([
        ["right", { justifyContent: "flex-end", alignItems: "flex-start" }],
        ["left", { justifyContent: "flex-start", alignItems: "flex-start" }],
        ["top", { justifyContent: "flex-start", alignItems: "flex-start" }],
        ["bottom", { justifyContent: "flex-start", alignItems: "flex-end" }]
    ] as const)("positions a %s sheet against the corresponding viewport edge", async (side, expected) => {
        await createSheet({ side, ariaLabel: `${side} sheet` });

        const style = getPanel().parentElement?.style;
        expect({ justifyContent: style?.justifyContent, alignItems: style?.alignItems }).toEqual(expected);
    });

    it("uses mobile-safe defaults and applies explicit dimensions", async () => {
        const popupService = TestBed.inject(PopupService);
        const createPopup = popupService.create.bind(popupService);
        let settings: PopupSettings | undefined;
        vi.spyOn(popupService, "create").mockImplementation(value => {
            settings = value;
            return createPopup(value);
        });
        await createSheet({ ariaLabel: "Default sheet" });

        expect(settings?.width).toBe("min(100dvw, 24rem)");
        expect(settings?.height).toBe("100dvh");
        expect(settings?.maxWidth).toBe("100dvw");
        expect(settings?.popupWrapperClass).toBe("mona-popup-constrain-height");

        fixture?.destroy();
        overlayContainer.replaceChildren();
        await createSheet({ side: "bottom", ariaLabel: "Sized sheet", width: "75dvw", height: 480 });

        expect(settings?.width).toBe("75dvw");
        expect(settings?.height).toBe(480);
        expect(settings?.maxHeight).toBe("90dvh");
    });

    it("applies width and height changes to an open sheet", async () => {
        // Explicit dimensions rather than the dvw/dvh defaults, which JSDOM drops as unparsable values.
        await createSheet({ ariaLabel: "Resizable sheet", width: "20rem", height: 300 });

        expect(getPanel().style.width).toBe("20rem");
        expect(getPanel().style.height).toBe("300px");

        fixture?.componentRef.setInput("width", "32rem");
        fixture?.componentRef.setInput("height", 480);
        fixture?.detectChanges();
        TestBed.inject(ApplicationRef).tick();

        expect(getPanel().style.width).toBe("32rem");
        expect(getPanel().style.height).toBe("480px");
    });

    it.each([
        ["closeOnEscape", () => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))],
        ["closeOnBackdropClick", () => overlayContainer.querySelector<HTMLElement>(".cdk-overlay-backdrop")?.click()]
    ] as const)("honours %s changes made while the sheet is open", async (input, closeSheet) => {
        const component = await createSheet({ ariaLabel: "Toggling sheet" });
        const sources: Array<PopupCloseSource | undefined> = [];
        component.close.subscribe(event => sources.push(event.via));

        fixture?.componentRef.setInput(input, false);
        TestBed.inject(ApplicationRef).tick();
        closeSheet();

        expect(sources).toEqual([]);
        expect(getDialog()).toBeTruthy();

        fixture?.componentRef.setInput(input, true);
        TestBed.inject(ApplicationRef).tick();
        closeSheet();

        expect(sources).toHaveLength(1);
    });

    it("blocks background scrolling while open", async () => {
        const popupService = TestBed.inject(PopupService);
        const createPopup = popupService.create.bind(popupService);
        let settings: PopupSettings | undefined;
        vi.spyOn(popupService, "create").mockImplementation(value => {
            settings = value;
            return createPopup(value);
        });
        await createSheet({ ariaLabel: "Modal sheet" });

        expect(settings?.blockScroll).toBe(true);
    });

    it("requests close from the close button and reports the source", async () => {
        const component = await createSheet({ title: "Closable sheet" });
        const closeEvents: PopupCloseEvent[] = [];
        component.close.subscribe(event => closeEvents.push(event));

        getDialog().querySelector<HTMLButtonElement>('button[aria-label="Close sheet"]')?.click();

        expect(closeEvents).toHaveLength(1);
        expect(closeEvents[0]?.via).toBe(PopupCloseSource.CloseButton);
    });

    it("allows close requests to be prevented", async () => {
        const component = await createSheet({ title: "Protected sheet" });
        let closedCount = 0;
        component.close.subscribe(event => event.preventDefault());
        component.closed.subscribe(() => closedCount++);

        getDialog().querySelector<HTMLButtonElement>('button[aria-label="Close sheet"]')?.click();

        expect(getDialog()).toBeTruthy();
        expect(closedCount).toBe(0);
    });

    it("closes from Escape by default and can disable Escape closing", async () => {
        const component = await createSheet({ ariaLabel: "Escape sheet" });
        const sources: Array<PopupCloseSource | undefined> = [];
        component.close.subscribe(event => sources.push(event.via));

        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
        expect(sources).toEqual([PopupCloseSource.Escape]);

        finishLeaveAnimation();
        fixture?.destroy();
        overlayContainer.replaceChildren();

        const persistentComponent = await createSheet({ ariaLabel: "Persistent sheet", closeOnEscape: false });
        persistentComponent.close.subscribe(event => sources.push(event.via));
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

        expect(sources).toEqual([PopupCloseSource.Escape]);
        expect(getDialog()).toBeTruthy();
    });

    it("closes from the backdrop by default and can disable backdrop closing", async () => {
        const component = await createSheet({ ariaLabel: "Backdrop sheet" });
        const sources: Array<PopupCloseSource | undefined> = [];
        component.close.subscribe(event => sources.push(event.via));

        overlayContainer.querySelector<HTMLElement>(".cdk-overlay-backdrop")?.click();
        expect(sources).toEqual([PopupCloseSource.BackdropClick]);

        finishLeaveAnimation();
        fixture?.destroy();
        overlayContainer.replaceChildren();

        const persistentComponent = await createSheet({
            ariaLabel: "Persistent sheet",
            closeOnBackdropClick: false
        });
        persistentComponent.close.subscribe(event => sources.push(event.via));
        overlayContainer.querySelector<HTMLElement>(".cdk-overlay-backdrop")?.click();

        expect(sources).toEqual([PopupCloseSource.BackdropClick]);
        expect(getDialog()).toBeTruthy();
    });

    it.each([
        [
            "Escape",
            () => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })),
            PopupCloseSource.Escape
        ],
        [
            "a backdrop click",
            () => overlayContainer.querySelector<HTMLElement>(".cdk-overlay-backdrop")?.click(),
            PopupCloseSource.BackdropClick
        ]
    ] as const)("allows a close from %s to be prevented", async (_, closeSheet, expectedSource) => {
        const component = await createSheet({ ariaLabel: "Protected sheet" });
        const sources: Array<PopupCloseSource | undefined> = [];
        let closedCount = 0;
        component.close.subscribe(event => {
            sources.push(event.via);
            event.preventDefault();
        });
        component.closed.subscribe(() => closedCount++);

        closeSheet();

        expect(sources).toEqual([expectedSource]);
        expect(closedCount).toBe(0);
        expect(getDialog()).toBeTruthy();
    });

    /*
     * Only the trap's installation is asserted. The anchors are what make Tab wrap back into the sheet,
     * but JSDOM neither moves focus on Tab nor reports element sizes, and CDK skips elements it measures
     * as invisible — so both the wrap-around and the auto-capture landing spot need a real browser.
     */
    it("installs a focus trap around the sheet", async () => {
        await createSheet({ title: "Trapped sheet" });

        const dialog = getDialog();
        const anchors = overlayContainer.querySelectorAll(".cdk-focus-trap-anchor");

        expect(anchors).toHaveLength(2);
        expect(anchors[0]?.nextElementSibling).toBe(dialog);
        expect(anchors[1]?.previousElementSibling).toBe(dialog);
    });

    it("disposes the overlay when the host component is destroyed", async () => {
        const hostFixture = TestBed.createComponent(SheetHostComponent);
        hostFixture.detectChanges();
        await hostFixture.whenStable();
        TestBed.inject(ApplicationRef).tick();

        expect(overlayContainer.querySelector('[role="dialog"]')).not.toBeNull();

        hostFixture.destroy();
        finishLeaveAnimation();

        expect(overlayContainer.querySelector('[role="dialog"]')).toBeNull();
        expect(overlayContainer.querySelector(".cdk-overlay-backdrop")).toBeNull();
    });

    it("emits closed only after the leave animation completes and restores focus", async () => {
        const trigger = document.createElement("button");
        document.body.append(trigger);
        trigger.focus();
        const component = await createSheet({ title: "Animated sheet" });
        let closedCount = 0;
        component.closed.subscribe(() => closedCount++);

        getDialog().querySelector<HTMLButtonElement>('button[aria-label="Close sheet"]')?.click();
        expect(closedCount).toBe(0);

        finishLeaveAnimation();

        expect(closedCount).toBe(1);
        expect(document.activeElement).toBe(trigger);
        trigger.remove();
    });
});
