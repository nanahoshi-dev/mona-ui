import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ButtonDirective } from "../../button/directives/button.directive";
import { ContextMenuComponent } from "../components/contextmenu/context-menu.component";
import { ContextMenuItemComponent } from "../components/contextmenu-item/context-menu-item.component";

@Component({
    imports: [ButtonDirective, ContextMenuComponent, ContextMenuItemComponent],
    template: `
        <button #first id="first-target" type="button" aria-haspopup="true">First</button>
        <!-- A monaButton binds aria-haspopup itself; the context menu's must survive it. -->
        <button #second monaButton>Second</button>
        <div #region class="region" tabindex="0">Region</div>
        @if (shown()) {
            <mona-contextmenu
                [target]="target() === 'first' ? first : target() === 'second' ? second : region"
                [aria-label]="ariaLabel()">
                <mona-contextmenu-item label="Copy"></mona-contextmenu-item>
                <mona-contextmenu-item label="Paste"></mona-contextmenu-item>
            </mona-contextmenu>
        }
    `
})
class TargetHostComponent {
    public readonly ariaLabel = signal("");
    public readonly shown = signal(true);
    public readonly target = signal<"first" | "region" | "second">("second");
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

describe("context menu target", () => {
    let fixture: ComponentFixture<TargetHostComponent>;
    let host: TargetHostComponent;
    let first: HTMLButtonElement;
    let second: HTMLButtonElement;
    let region: HTMLElement;

    async function settle(): Promise<void> {
        fixture.detectChanges();
        await fixture.whenStable();
        await wait(5);
        fixture.detectChanges();
    }

    async function closeMenu(): Promise<void> {
        keydown(menus()[0], "Escape");
        await settle();
        await wait(200);
    }

    beforeEach(async () => {
        fixture = TestBed.createComponent(TargetHostComponent);
        host = fixture.componentInstance;
        document.body.appendChild(fixture.nativeElement);
        await settle();
        const element = fixture.nativeElement as HTMLElement;
        [first, second] = Array.from(element.querySelectorAll("button"));
        region = element.querySelector(".region")!;
    });

    afterEach(() => {
        (fixture.nativeElement as HTMLElement).remove();
        document.querySelectorAll(".cdk-overlay-container").forEach(overlay => overlay.remove());
    });

    it("marks a button target as opening a menu, and links the menu while it's open", async () => {
        expect(second.getAttribute("aria-haspopup")).toBe("menu");
        expect(second.getAttribute("aria-expanded")).toBe("false");
        expect(second.hasAttribute("aria-controls")).toBe(false);

        second.focus();
        keydown(second, "F10", { shiftKey: true });
        await settle();
        expect(menus().length).toBe(1);
        expect(second.getAttribute("aria-expanded")).toBe("true");
        expect(second.getAttribute("aria-controls")).toBe(menus()[0].id);

        await closeMenu();
        expect(second.getAttribute("aria-expanded")).toBe("false");
        expect(second.hasAttribute("aria-controls")).toBe(false);
    });

    it("leaves the attributes off a target whose role doesn't allow them, and still opens from the keyboard", async () => {
        host.target.set("region");
        await settle();

        expect(region.hasAttribute("aria-haspopup")).toBe(false);
        expect(region.hasAttribute("aria-expanded")).toBe(false);

        region.focus();
        keydown(region, "ContextMenu");
        await settle();
        expect(menus().length).toBe(1);
        expect(region.hasAttribute("aria-expanded")).toBe(false);
    });

    it("follows a change of target and puts the old target's attributes back", async () => {
        host.target.set("first");
        await settle();

        expect(second.hasAttribute("aria-haspopup")).toBe(false);
        expect(second.hasAttribute("aria-expanded")).toBe(false);
        expect(first.getAttribute("aria-haspopup")).toBe("menu");

        keydown(second, "ContextMenu");
        await settle();
        expect(menus().length).toBe(0);

        first.focus();
        keydown(first, "ContextMenu");
        await settle();
        expect(menus().length).toBe(1);
        await closeMenu();

        host.shown.set(false);
        await settle();
        expect(first.getAttribute("aria-haspopup")).toBe("true");
        expect(first.hasAttribute("aria-expanded")).toBe(false);
    });

    it("is named by ariaLabel, or by the target's id", async () => {
        host.target.set("first");
        await settle();
        first.focus();
        keydown(first, "ContextMenu");
        await settle();
        expect(menus()[0].getAttribute("aria-labelledby")).toBe("first-target");
        await closeMenu();

        host.ariaLabel.set("Row actions");
        await settle();
        keydown(first, "ContextMenu");
        await settle();
        expect(menus()[0].getAttribute("aria-label")).toBe("Row actions");
    });

    it("closes when the window loses focus", async () => {
        second.focus();
        keydown(second, "ContextMenu");
        await settle();
        expect(menus().length).toBe(1);

        window.dispatchEvent(new FocusEvent("blur"));
        await settle();
        await wait(200);
        expect(menus().length).toBe(0);
    });
});
