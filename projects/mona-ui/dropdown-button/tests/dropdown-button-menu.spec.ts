import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ContextMenuItemComponent } from "../../contextmenu/components/contextmenu-item/context-menu-item.component";
import { DropdownButtonComponent } from "../components/dropdown-button/dropdown-button.component";
import { DropdownButtonItemComponent } from "../components/dropdown-button-item/dropdown-button-item.component";
import { DropdownButtonTextTemplateDirective } from "../directives/dropdown-button-text-template.directive";

@Component({
    imports: [DropdownButtonComponent, DropdownButtonItemComponent, DropdownButtonTextTemplateDirective],
    template: `
        <mona-dropdown-button
            [aria-label]="ariaLabel()"
            [disabled]="disabled()"
            [iconOnly]="iconOnly()"
            [loading]="loading()"
            [showArrow]="showArrow()"
            [text]="text()">
            @if (useTemplate()) {
                <ng-template monaDropdownButtonTextTemplate>Export</ng-template>
            }
            <mona-dropdown-button-item label="First"></mona-dropdown-button-item>
            <mona-dropdown-button-item label="Middle"></mona-dropdown-button-item>
            <mona-dropdown-button-item label="Last"></mona-dropdown-button-item>
        </mona-dropdown-button>
    `
})
class DropdownHostComponent {
    public readonly ariaLabel = signal("");
    public readonly disabled = signal(false);
    public readonly iconOnly = signal(false);
    public readonly loading = signal(false);
    public readonly showArrow = signal(true);
    public readonly text = signal("Actions");
    public readonly useTemplate = signal(false);
}

@Component({
    imports: [DropdownButtonComponent, ContextMenuItemComponent],
    template: `
        <mona-dropdown-button text="Actions">
            <mona-contextmenu-item label="Foreign"></mona-contextmenu-item>
        </mona-dropdown-button>
    `
})
class ForeignItemHostComponent {}

function keydown(target: Element, key: string): KeyboardEvent {
    const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key });
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

describe("dropdown button menu", () => {
    let fixture: ComponentFixture<DropdownHostComponent>;
    let host: DropdownHostComponent;
    let button: HTMLButtonElement;

    async function settle(): Promise<void> {
        fixture.detectChanges();
        await fixture.whenStable();
        await wait(5);
        fixture.detectChanges();
    }

    beforeEach(async () => {
        fixture = TestBed.createComponent(DropdownHostComponent);
        host = fixture.componentInstance;
        document.body.appendChild(fixture.nativeElement);
        await settle();
        button = (fixture.nativeElement as HTMLElement).querySelector("button")!;
    });

    afterEach(() => {
        (fixture.nativeElement as HTMLElement).remove();
        document.querySelectorAll(".cdk-overlay-container").forEach(element => element.remove());
    });

    it("tells assistive technology it opens a menu, and which one while it's open", async () => {
        expect(button.getAttribute("aria-haspopup")).toBe("menu");
        expect(button.getAttribute("aria-expanded")).toBe("false");
        expect(button.hasAttribute("aria-controls")).toBe(false);

        button.focus();
        keydown(button, "ArrowDown");
        await settle();

        expect(button.getAttribute("aria-expanded")).toBe("true");
        expect(button.getAttribute("aria-controls")).toBe(menus()[0].id);
    });

    it("names its menu with the button", async () => {
        button.click();
        await settle();

        expect(button.id).not.toBe("");
        expect(menus()[0].getAttribute("aria-labelledby")).toBe(button.id);
    });

    it("is named by its content unless aria-label is given", async () => {
        expect(button.hasAttribute("aria-label")).toBe(false);
        expect(button.textContent?.trim()).toBe("Actions");

        host.text.set("");
        host.useTemplate.set(true);
        await settle();
        expect(button.hasAttribute("aria-label")).toBe(false);
        expect(button.textContent?.trim()).toBe("Export");

        host.ariaLabel.set("More actions");
        await settle();
        expect(button.getAttribute("aria-label")).toBe("More actions");
        expect(
            (fixture.nativeElement as HTMLElement).querySelector("mona-dropdown-button")!.hasAttribute("aria-label")
        ).toBe(false);
    });

    it("highlights the first item on ArrowDown and the last on ArrowUp", async () => {
        button.focus();
        keydown(button, "ArrowDown");
        await settle();
        expect(activeLabel(menus()[0])).toBe("First");

        keydown(menus()[0], "Escape");
        await settle();
        await wait(200);
        expect(document.activeElement).toBe(button);

        keydown(button, "ArrowUp");
        await settle();
        expect(activeLabel(menus()[0])).toBe("Last");
    });

    it("closes its menu when it becomes disabled or starts loading", async () => {
        button.focus();
        keydown(button, "Enter");
        await settle();
        expect(menus().length).toBe(1);

        host.disabled.set(true);
        await settle();
        await wait(200);
        expect(menus().length).toBe(0);

        host.disabled.set(false);
        await settle();
        button.focus();
        keydown(button, "Enter");
        await settle();
        expect(menus().length).toBe(1);

        host.loading.set(true);
        await settle();
        await wait(200);
        expect(menus().length).toBe(0);
    });

    it("ignores the keyboard while disabled or loading", async () => {
        host.loading.set(true);
        await settle();
        keydown(button, "Enter");
        await settle();
        expect(menus().length).toBe(0);

        host.loading.set(false);
        host.disabled.set(true);
        await settle();
        keydown(button, "ArrowDown");
        await settle();
        expect(menus().length).toBe(0);
    });

    it("shows an arrow unless it is icon-only or showArrow is false", async () => {
        expect(button.querySelector("svg.lucide")).not.toBeNull();
        expect(button.querySelector("svg.lucide")!.getAttribute("aria-hidden")).toBe("true");

        host.showArrow.set(false);
        await settle();
        expect(button.querySelector("svg.lucide")).toBeNull();

        host.showArrow.set(true);
        host.iconOnly.set(true);
        await settle();
        expect(button.querySelector("svg.lucide")).toBeNull();
    });

    it("rejects items from another menu family", () => {
        const foreign = TestBed.createComponent(ForeignItemHostComponent);
        expect(() => foreign.detectChanges()).toThrow(/mona-dropdown-button-item/);
    });
});
