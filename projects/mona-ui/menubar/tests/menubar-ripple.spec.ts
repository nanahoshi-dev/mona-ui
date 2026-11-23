import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRipple } from "@nanahoshi/mona-ui/ripple";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MenuComponent } from "../components/menu/menu.component";
import { MenubarComponent } from "../components/menubar/menubar.component";

@Component({
    imports: [MenubarComponent, MenuComponent],
    template: `
        <mona-menubar [disabled]="disabled()">
            <mona-menu text="File"></mona-menu>
            <mona-menu text="Edit"></mona-menu>
        </mona-menubar>
    `
})
class MenubarRippleHostComponent {
    public readonly disabled = signal(false);
}

const animateDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, "animate");

describe("MenubarComponent ripple", () => {
    let fixture: ComponentFixture<MenubarRippleHostComponent>;
    const menus = (): HTMLElement[] =>
        Array.from(fixture.nativeElement.querySelectorAll("li[role='menuitem']") as NodeListOf<HTMLElement>);
    const layer = (element: Element): Element | null => element.querySelector(":scope > span[dir='ltr']");
    const press = (target: Element): void => {
        target.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, clientX: 4, clientY: 4 }));
    };

    beforeEach(async () => {
        Object.defineProperty(Element.prototype, "animate", {
            configurable: true,
            writable: true,
            value: (): Animation => ({ finished: Promise.resolve() }) as unknown as Animation
        });
        TestBed.configureTestingModule({ imports: [MenubarRippleHostComponent], providers: [provideRipple()] });
        fixture = TestBed.createComponent(MenubarRippleHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();
    });

    afterEach(() => {
        document.querySelectorAll(".cdk-overlay-container").forEach(element => element.remove());
        if (animateDescriptor) {
            Object.defineProperty(Element.prototype, "animate", animateDescriptor);
        } else {
            Reflect.deleteProperty(Element.prototype, "animate");
        }
    });

    it("should ripple a pressed menu of the bar", () => {
        const [file] = menus();
        press(file.querySelector("span") as Element);
        expect(layer(file)).not.toBeNull();
    });

    it("should not ripple the menus of a disabled bar", async () => {
        fixture.componentInstance.disabled.set(true);
        fixture.detectChanges();
        await fixture.whenStable();
        const [file] = menus();
        press(file);
        expect(layer(file)).toBeNull();
    });
});
