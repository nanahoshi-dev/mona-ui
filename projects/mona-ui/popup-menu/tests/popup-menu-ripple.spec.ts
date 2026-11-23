import { Component } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRipple } from "@nanahoshi/mona-ui/ripple";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PopupMenuComponent } from "../components/popup-menu/popup-menu.component";
import { PopupMenuItemComponent } from "../components/popup-menu-item/popup-menu-item.component";

@Component({
    imports: [PopupMenuComponent, PopupMenuItemComponent],
    template: `
        <button #trigger type="button">Open</button>
        <mona-popup-menu [target]="trigger">
            <mona-popup-menu-item label="Cut"></mona-popup-menu-item>
            <mona-popup-menu-item label="Paste" [disabled]="true"></mona-popup-menu-item>
        </mona-popup-menu>
    `
})
class PopupMenuRippleHostComponent {}

const animateDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, "animate");

function item(label: string): HTMLElement {
    const found = Array.from(document.querySelectorAll<HTMLElement>("[role^='menuitem']")).find(
        element => element.textContent?.trim() === label
    );
    if (!found) {
        throw new Error(`No menu item "${label}"`);
    }
    return found;
}

function layer(element: Element): Element | null {
    return element.querySelector(":scope > span[dir='ltr']");
}

function press(target: Element): void {
    target.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, clientX: 4, clientY: 4 }));
}

describe("PopupMenuComponent ripple", () => {
    let fixture: ComponentFixture<PopupMenuRippleHostComponent>;

    async function settle(): Promise<void> {
        fixture.detectChanges();
        await fixture.whenStable();
        await new Promise(resolve => setTimeout(resolve, 5));
        fixture.detectChanges();
    }

    beforeEach(async () => {
        Object.defineProperty(Element.prototype, "animate", {
            configurable: true,
            writable: true,
            value: (): Animation => ({ finished: Promise.resolve() }) as unknown as Animation
        });
        TestBed.configureTestingModule({ imports: [PopupMenuRippleHostComponent], providers: [provideRipple()] });
        fixture = TestBed.createComponent(PopupMenuRippleHostComponent);
        await settle();
        (fixture.nativeElement as HTMLElement).querySelector("button")?.click();
        await settle();
    });

    afterEach(() => {
        document.querySelectorAll(".cdk-overlay-container").forEach(element => element.remove());
        if (animateDescriptor) {
            Object.defineProperty(Element.prototype, "animate", animateDescriptor);
        } else {
            Reflect.deleteProperty(Element.prototype, "animate");
        }
    });

    it("should ripple a pressed menu item", () => {
        press(item("Cut"));
        expect(layer(item("Cut"))).not.toBeNull();
    });

    it("should not ripple a disabled menu item", () => {
        press(item("Paste"));
        expect(layer(item("Paste"))).toBeNull();
    });
});
