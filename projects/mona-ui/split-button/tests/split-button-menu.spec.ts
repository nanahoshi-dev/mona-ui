import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SplitButtonComponent } from "../components/split-button/split-button.component";
import { SplitButtonItemComponent } from "../components/split-button-item/split-button-item.component";
import { SplitButtonTextTemplateDirective } from "../directives/split-button-text-template.directive";

@Component({
    imports: [SplitButtonComponent, SplitButtonItemComponent, SplitButtonTextTemplateDirective],
    template: `
        <mona-split-button
            [disabled]="disabled()"
            [loading]="loading()"
            [text]="text()"
            (buttonClick)="clicks = clicks + 1">
            @if (useTemplate()) {
                <ng-template monaSplitButtonTextTemplate>Publish</ng-template>
            }
            <mona-split-button-item label="Save as draft"></mona-split-button-item>
            <mona-split-button-item label="Save and close"></mona-split-button-item>
        </mona-split-button>
    `
})
class SplitHostComponent {
    public readonly disabled = signal(false);
    public readonly loading = signal(false);
    public readonly text = signal("Save");
    public readonly useTemplate = signal(false);
    public clicks = 0;
}

function keydown(target: Element, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
    const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key, ...init });
    target.dispatchEvent(event);
    return event;
}

function wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function menus(): HTMLElement[] {
    return Array.from(document.querySelectorAll<HTMLElement>("[role='menu']"));
}

function activeLabel(menu: HTMLElement): string | null {
    const id = menu.getAttribute("aria-activedescendant");
    return id ? (document.getElementById(id)?.textContent?.trim() ?? null) : null;
}

describe("split button menu", () => {
    let fixture: ComponentFixture<SplitHostComponent>;
    let host: SplitHostComponent;
    let element: HTMLElement;
    let main: HTMLButtonElement;
    let arrow: HTMLButtonElement;

    async function settle(): Promise<void> {
        fixture.detectChanges();
        await fixture.whenStable();
        await wait(5);
        fixture.detectChanges();
    }

    beforeEach(async () => {
        fixture = TestBed.createComponent(SplitHostComponent);
        host = fixture.componentInstance;
        document.body.appendChild(fixture.nativeElement);
        await settle();
        element = (fixture.nativeElement as HTMLElement).querySelector("mona-split-button")!;
        [main, arrow] = Array.from(element.querySelectorAll("button"));
    });

    afterEach(() => {
        (fixture.nativeElement as HTMLElement).remove();
        document.querySelectorAll(".cdk-overlay-container").forEach(overlay => overlay.remove());
    });

    it("is a group named by its main button, with an arrow that opens a menu", async () => {
        expect(element.getAttribute("role")).toBe("group");
        expect(element.getAttribute("aria-labelledby")).toBe(main.id);
        expect(main.hasAttribute("aria-label")).toBe(false);
        expect(main.hasAttribute("aria-pressed")).toBe(false);
        expect(arrow.getAttribute("aria-haspopup")).toBe("menu");
        expect(arrow.getAttribute("aria-label")).toBe("More Save options");
        expect(arrow.hasAttribute("aria-controls")).toBe(false);

        host.text.set("");
        host.useTemplate.set(true);
        await settle();
        expect(main.textContent?.trim()).toBe("Publish");
        expect(main.hasAttribute("aria-label")).toBe(false);
        expect(arrow.getAttribute("aria-label")).toBe("Show menu options");
    });

    it("names its menu with the arrow button", async () => {
        arrow.click();
        await settle();

        expect(arrow.id).not.toBe("");
        expect(menus()[0].getAttribute("aria-labelledby")).toBe(arrow.id);
    });

    it("closes the menu when the main button is clicked, and runs the action", async () => {
        arrow.click();
        await settle();
        expect(menus().length).toBe(1);
        expect(arrow.getAttribute("aria-controls")).toBe(menus()[0].id);

        main.focus();
        main.click();
        await settle();
        await wait(200);

        expect(host.clicks).toBe(1);
        expect(menus().length).toBe(0);
        expect(document.activeElement).toBe(main);
    });

    it("opens from the main button with Alt+ArrowDown and returns focus there", async () => {
        main.focus();
        const event = keydown(main, "ArrowDown", { altKey: true });
        await settle();

        expect(event.defaultPrevented).toBe(true);
        expect(menus().length).toBe(1);
        expect(activeLabel(menus()[0])).toBe("Save as draft");

        keydown(menus()[0], "Escape");
        await settle();
        await wait(200);
        expect(menus().length).toBe(0);
        expect(document.activeElement).toBe(main);
    });

    it("highlights the last item when the arrow gets ArrowUp", async () => {
        arrow.focus();
        keydown(arrow, "ArrowUp");
        await settle();
        expect(activeLabel(menus()[0])).toBe("Save and close");
    });

    it("keeps the menu closed while loading, and closes it when loading starts", async () => {
        arrow.click();
        await settle();
        expect(menus().length).toBe(1);

        host.loading.set(true);
        await settle();
        await wait(200);
        expect(menus().length).toBe(0);
        expect(element.getAttribute("aria-busy")).toBe("true");
        expect(main.getAttribute("aria-busy")).toBe("true");

        arrow.click();
        keydown(arrow, "Enter");
        keydown(main, "ArrowDown", { altKey: true });
        await settle();
        expect(menus().length).toBe(0);
    });

    it("closes the menu when it becomes disabled", async () => {
        arrow.click();
        await settle();
        expect(menus().length).toBe(1);

        host.disabled.set(true);
        await settle();
        await wait(200);
        expect(menus().length).toBe(0);
    });
});
