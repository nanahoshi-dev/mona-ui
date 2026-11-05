import { InteractivityChecker } from "@angular/cdk/a11y";
import { OverlayContainer } from "@angular/cdk/overlay";
import { ApplicationRef, Component, InjectionToken, Injector, inject, signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { MONA_DEFAULT_LOCALE, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { PopupCloseSource, PopupService, type PopupSettings } from "@nanahoshi/mona-ui/popup";
import { DialogComponent } from "../components/dialog/dialog.component";
import type { DialogActionEvent } from "../models/DialogActionEvent";
import { DIALOG_DATA } from "../models/DialogData";
import { DialogRef } from "../models/DialogRef";
import type { DialogResult } from "../models/DialogResult";
import { DIALOG_CANCEL, DIALOG_OK, DialogService } from "../services/dialog.service";

const DIALOG_SELECTOR = '[role="dialog"], [role="alertdialog"]';
const GREETING = new InjectionToken<string>("GREETING");

@Component({
    selector: "mona-test-dialog-body",
    template: `<p id="body-text">{{ greeting }} {{ data.name }}</p>`
})
class DialogBodyComponent {
    public readonly data = inject<{ name: string }>(DIALOG_DATA);
    public readonly dialogRef = inject(DialogRef);
    public readonly greeting = inject(GREETING);
}

@Component({
    selector: "mona-test-dialog-form",
    template: `<input id="first-field" aria-label="First" /><input id="second-field" aria-label="Second" />`
})
class DialogFormComponent {}

@Component({
    imports: [DialogComponent],
    template: `
        @if (open()) {
            <mona-dialog title="Hosted" (close)="closeCount = closeCount + 1" (closed)="closedCount = closedCount + 1">
                <p>Hosted body</p>
            </mona-dialog>
        }
    `
})
class DialogHostComponent {
    public readonly open = signal(true);
    public closeCount = 0;
    public closedCount = 0;
}

describe("Dialog close contract", () => {
    let overlayContainer: HTMLElement;
    let page: HTMLElement;
    let service: DialogService;

    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [DialogHostComponent] });
        TestBed.inject(MonaI18nService).use(MONA_DEFAULT_LOCALE);
        overlayContainer = TestBed.inject(OverlayContainer).getContainerElement();
        service = TestBed.inject(DialogService);
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

    function dialogElement(): HTMLElement {
        const element = overlayContainer.querySelector<HTMLElement>(DIALOG_SELECTOR);
        expect(element).not.toBeNull();
        return element!;
    }

    function footerButton(text: string): HTMLButtonElement {
        const button = Array.from(dialogElement().querySelectorAll<HTMLButtonElement>("button")).find(
            candidate => candidate.textContent?.trim() === text
        );
        expect(button).toBeDefined();
        return button!;
    }

    function closeButton(): HTMLButtonElement {
        const button = dialogElement().querySelector<HTMLButtonElement>('button[aria-label="Close dialog"]');
        expect(button).not.toBeNull();
        return button!;
    }

    function finishLeaveAnimation(): void {
        overlayContainer
            .querySelectorAll<HTMLElement>(".mona-popup-wrapper > div")
            .forEach(element => element.dispatchEvent(new Event("animationend", { bubbles: true })));
        settle();
    }

    function record<R>(dialogRef: DialogRef<R>): {
        closed: DialogResult<R>[];
        results: DialogResult<R>[];
        resultCompleted: () => boolean;
    } {
        const results: DialogResult<R>[] = [];
        const closed: DialogResult<R>[] = [];
        let completed = false;
        dialogRef.result.subscribe({ complete: () => (completed = true), next: value => results.push(value) });
        dialogRef.closed$.subscribe(value => closed.push(value));
        return { closed, resultCompleted: () => completed, results };
    }

    it("closes a service dialog from its action and reports the action", () => {
        const dialogRef = service.show({ actions: [{ text: "Save" }], title: "Save changes" });
        settle();
        const log = record(dialogRef);

        footerButton("Save").click();

        expect(log.results).toEqual([
            { action: expect.objectContaining({ text: "Save" }), via: "action", viaClose: false }
        ]);
        expect(log.closed).toEqual([]);
        finishLeaveAnimation();
        expect(log.closed).toEqual(log.results);
        expect(log.resultCompleted()).toBe(true);
        expect(overlayContainer.querySelector(DIALOG_SELECTOR)).toBeNull();
    });

    it("closes a service dialog from its close button", () => {
        const dialogRef = service.show({ title: "Closable" });
        settle();
        const log = record(dialogRef);

        closeButton().click();
        finishLeaveAnimation();

        expect(log.results).toEqual([{ value: undefined, via: PopupCloseSource.CloseButton, viaClose: true }]);
        expect(log.closed).toEqual(log.results);
    });

    it("reports Escape and programmatic closes, with the value passed to close()", () => {
        const escaped = service.show({ title: "Escape" });
        settle();
        const escapeLog = record(escaped);
        dialogElement().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
        finishLeaveAnimation();
        expect(escapeLog.results).toEqual([{ value: undefined, via: PopupCloseSource.Escape, viaClose: true }]);

        const programmatic = service.show<number>({ title: "Programmatic" });
        settle();
        const log = record(programmatic);
        programmatic.close(42);
        finishLeaveAnimation();
        expect(log.results).toEqual([{ value: 42, via: PopupCloseSource.Programmatic, viaClose: true }]);
        expect(log.closed).toEqual(log.results);
    });

    it("replays the result to late subscribers and emits it only once", () => {
        const dialogRef = service.show({ title: "Once" });
        settle();
        dialogRef.close();
        dialogRef.close();
        finishLeaveAnimation();

        const late = record(dialogRef);
        expect(late.results).toHaveLength(1);
        expect(late.closed).toHaveLength(1);
        expect(late.resultCompleted()).toBe(true);
    });

    it("stays open when the action event is prevented", () => {
        const dialogRef = service.show({ actions: [{ text: "Apply" }], title: "Apply" });
        settle();
        const log = record(dialogRef);
        const events: DialogActionEvent[] = [];
        dialogRef.action$.subscribe(event => {
            events.push(event);
            event.preventDefault();
        });

        footerButton("Apply").click();
        finishLeaveAnimation();

        expect(events).toHaveLength(1);
        expect(log.results).toEqual([]);
        expect(overlayContainer.querySelector(DIALOG_SELECTOR)).not.toBeNull();
        dialogRef.close();
        finishLeaveAnimation();
    });

    it("stays open when the close is prevented", () => {
        const dialogRef = service.show({ actions: [{ text: "Apply" }], title: "Apply" });
        settle();
        const log = record(dialogRef);
        dialogRef.close$.subscribe(event => event.preventDefault());

        footerButton("Apply").click();
        closeButton().click();
        finishLeaveAnimation();

        expect(log.results).toEqual([]);
        expect(overlayContainer.querySelector(DIALOG_SELECTOR)).not.toBeNull();
    });

    it("resolves confirm() to true for OK and false for anything else", () => {
        const answers: boolean[] = [];
        let completed = 0;
        service
            .confirm({ title: "First" })
            .subscribe({ complete: () => completed++, next: value => answers.push(value) });
        settle();
        footerButton("OK").click();
        finishLeaveAnimation();

        service
            .confirm({ title: "Second" })
            .subscribe({ complete: () => completed++, next: value => answers.push(value) });
        settle();
        footerButton("Cancel").click();
        finishLeaveAnimation();

        service.confirm({ title: "Third" }).subscribe(value => answers.push(value));
        settle();
        closeButton().click();
        finishLeaveAnimation();

        expect(answers).toEqual([true, false, false]);
        expect(completed).toBe(2);
    });

    it("resolves alert() once it closes, with message overrides on its button", () => {
        const values: unknown[] = [];
        service.alert({ messages: { ok: "Got it" }, title: "Notice" }).subscribe(value => values.push(value));
        settle();
        footerButton("Got it").click();
        finishLeaveAnimation();

        expect(values).toEqual([undefined]);
        expect(DIALOG_OK).toBe("ok");
        expect(DIALOG_CANCEL).toBe("cancel");
    });

    it("names a modal dialog and marks it modal", () => {
        const titled = service.show({ title: "Titled" });
        settle();
        const element = dialogElement();
        expect(element.getAttribute("aria-modal")).toBe("true");
        const labelledBy = element.getAttribute("aria-labelledby");
        expect(labelledBy).toBeTruthy();
        expect(document.getElementById(labelledBy!)?.textContent?.trim()).toBe("Titled");
        expect(element.hasAttribute("aria-label")).toBe(false);
        titled.close();
        finishLeaveAnimation();

        const unnamed = service.show({ ariaLabel: "Settings", text: "No title" });
        settle();
        const untitled = dialogElement();
        expect(untitled.querySelector("h2")).toBeNull();
        expect(untitled.hasAttribute("aria-labelledby")).toBe(false);
        expect(untitled.getAttribute("aria-label")).toBe("Settings");
        unnamed.close();
        finishLeaveAnimation();
    });

    it("warns in dev mode when a dialog has no accessible name", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
        const dialogRef = service.show({ text: "Nameless" });
        settle();

        expect(warn).toHaveBeenCalledWith(expect.stringContaining("[Mona Dialog]"), expect.anything());
        warn.mockRestore();
        dialogRef.close();
        finishLeaveAnimation();
    });

    it("makes the page inert behind a modal dialog and releases it when the dialog starts closing", () => {
        const settings = captureSettings();
        const dialogRef = service.show({ title: "Modal" });
        settle();

        expect(page.hasAttribute("inert")).toBe(true);
        expect(overlayContainer.hasAttribute("inert")).toBe(false);
        expect(settings[0]?.blockScroll).toBe(true);

        dialogRef.close();
        expect(page.hasAttribute("inert")).toBe(false);
        finishLeaveAnimation();
    });

    it("keeps the page usable behind a non-modal dialog", () => {
        const settings = captureSettings();
        const dialogRef = service.show({ modal: false, title: "Non-modal" });
        settle();
        const element = dialogElement();

        expect(element.hasAttribute("aria-modal")).toBe(false);
        expect(page.hasAttribute("inert")).toBe(false);
        expect(settings[0]?.blockScroll).toBe(false);
        overlayContainer.querySelectorAll(".cdk-focus-trap-anchor").forEach(anchor => {
            expect(anchor.hasAttribute("tabindex")).toBe(false);
        });
        dialogRef.close();
        finishLeaveAnimation();
    });

    it("leaves a stacked modal's page inert when the top one closes", () => {
        const first = service.show({ title: "First" });
        settle();
        const second = service.show({ title: "Second" });
        settle();
        const hosts = overlayContainer.querySelectorAll(".cdk-overlay-popover, .cdk-global-overlay-wrapper");
        expect(hosts.length).toBeGreaterThanOrEqual(2);

        second.close();
        finishLeaveAnimation();
        expect(page.hasAttribute("inert")).toBe(true);

        first.close();
        finishLeaveAnimation();
        expect(page.hasAttribute("inert")).toBe(false);
    });

    it("renders component content with its data, injector and DialogRef", () => {
        const parent = Injector.create({
            providers: [{ provide: GREETING, useValue: "Hello" }],
            parent: TestBed.inject(Injector)
        });
        const dialogRef = service.show({
            content: DialogBodyComponent,
            data: { name: "Mona" },
            injector: parent,
            title: "Component"
        });
        settle();

        expect(dialogElement().querySelector("#body-text")?.textContent?.trim()).toBe("Hello Mona");
        const instance = dialogRef.component?.instance as DialogBodyComponent;
        expect(instance).toBeInstanceOf(DialogBodyComponent);
        expect(instance.dialogRef).toBe(dialogRef);
        dialogRef.close();
        finishLeaveAnimation();
    });

    it("triggers the default action from Enter, but not from a control that handles Enter", () => {
        const dialogRef = service.show({
            actions: [{ text: "Other" }, { default: true, text: "Submit" }],
            text: "Body",
            title: "Default"
        });
        settle();
        const log = record(dialogRef);
        const element = dialogElement();

        footerButton("Other").dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
        expect(log.results).toEqual([]);

        element.querySelector("p")!.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
        expect(log.results).toEqual([
            { action: expect.objectContaining({ text: "Submit" }), via: "action", viaClose: false }
        ]);
        finishLeaveAnimation();
    });

    it("positions through the overlay's strategy, centered by default and offset when asked", () => {
        const centered = service.show({ title: "Centered" });
        settle();
        const centeredWrapper = overlayContainer.querySelector<HTMLElement>(".cdk-overlay-pane")!.parentElement!;
        expect(centeredWrapper.style.justifyContent).toBe("center");
        expect(centeredWrapper.style.alignItems).toBe("center");
        centered.close();
        finishLeaveAnimation();

        const placed = service.show({ left: 24, title: "Placed", top: 48 });
        settle();
        const pane = overlayContainer.querySelector<HTMLElement>(".cdk-overlay-pane")!;
        expect(pane.parentElement!.style.justifyContent).toBe("flex-start");
        expect(pane.style.marginLeft).toBe("24px");
        expect(pane.style.marginTop).toBe("48px");
        expect(pane.style.left).toBe("");
        expect(pane.style.top).toBe("");
        placed.close();
        finishLeaveAnimation();
    });

    it("keeps its place when the overlay is repositioned after a direction change", () => {
        const dialogRef = service.show({ title: "Steady", top: 48 });
        settle();
        const pane = overlayContainer.querySelector<HTMLElement>(".cdk-overlay-pane")!;

        document.documentElement.setAttribute("dir", "rtl");
        try {
            dialogRef.popupRef.overlayRef.updatePosition();

            expect(pane.parentElement!.style.justifyContent).toBe("center");
            expect(pane.style.marginTop).toBe("48px");
            expect(pane.style.position).not.toBe("absolute");
            expect(dialogElement().style.top).toBe("");
        } finally {
            document.documentElement.removeAttribute("dir");
        }
        dialogRef.close();
        finishLeaveAnimation();
    });

    it("caps the dialog to the viewport unless given its own limits", () => {
        const settings = captureSettings();
        const dialogRef = service.show({ title: "Capped" });
        settle();
        expect(settings[0]?.maxHeight).toBe("calc(100dvh - 2rem)");
        expect(settings[0]?.maxWidth).toBe("calc(100dvw - 2rem)");
        dialogRef.close();
        finishLeaveAnimation();
    });

    it("closes silently when a <mona-dialog> host is destroyed", () => {
        const errors = vi.spyOn(console, "error").mockImplementation(() => undefined);
        const fixture = TestBed.createComponent(DialogHostComponent);
        fixture.detectChanges();
        settle();
        expect(overlayContainer.querySelector(DIALOG_SELECTOR)).not.toBeNull();

        expect(() => {
            fixture.destroy();
            finishLeaveAnimation();
        }).not.toThrow();

        expect(overlayContainer.querySelector(DIALOG_SELECTOR)).toBeNull();
        expect(errors).not.toHaveBeenCalled();
        errors.mockRestore();
    });

    it("emits close and closed from <mona-dialog> when closed from its close button", () => {
        const fixture = TestBed.createComponent(DialogHostComponent);
        fixture.detectChanges();
        settle();

        closeButton().click();
        finishLeaveAnimation();

        expect(fixture.componentInstance.closeCount).toBe(1);
        expect(fixture.componentInstance.closedCount).toBe(1);
        fixture.destroy();
    });

    it("focuses the element it is given when it opens, ahead of its first tabbable element", () => {
        // jsdom has no layout, so the focus trap sees nothing as visible and never moves focus on its own.
        vi.spyOn(TestBed.inject(InteractivityChecker), "isVisible").mockReturnValue(true);
        const dialogRef = service.show({
            content: DialogFormComponent,
            focusedElement: "#second-field",
            title: "Focus"
        });
        settle();

        expect(document.activeElement).toBe(dialogElement().querySelector("#second-field"));
        dialogRef.close();
        finishLeaveAnimation();
    });
});
