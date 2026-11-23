import { Component } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRipple } from "@nanahoshi/mona-ui/ripple";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { TabComponent } from "../components/tab/tab.component";
import { TabsComponent } from "../components/tabs/tabs.component";

@Component({
    template: `
        <mona-tabs aria-label="Sections">
            <mona-tab title="First" [closable]="true"></mona-tab>
            <mona-tab title="Second"></mona-tab>
            <mona-tab title="Third" [disabled]="true"></mona-tab>
        </mona-tabs>
    `,
    imports: [TabComponent, TabsComponent]
})
class TabsRippleHostComponent {}

const animateDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, "animate");

describe("Tabs ripple", () => {
    let fixture: ComponentFixture<TabsRippleHostComponent>;
    const items = (): HTMLLIElement[] => [...fixture.nativeElement.querySelectorAll("li[monaTabListItem]")];
    const layer = (element: Element): Element | null => element.querySelector(":scope > span[aria-hidden='true']");
    const press = (target: Element): void => {
        target.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, clientX: 4, clientY: 4 }));
    };

    beforeEach(async () => {
        Object.defineProperty(Element.prototype, "animate", {
            configurable: true,
            writable: true,
            value: (): Animation => ({ finished: Promise.resolve() }) as unknown as Animation
        });
        TestBed.configureTestingModule({ imports: [TabsRippleHostComponent], providers: [provideRipple()] });
        fixture = TestBed.createComponent(TabsRippleHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    });

    afterEach(() => {
        if (animateDescriptor) {
            Object.defineProperty(Element.prototype, "animate", animateDescriptor);
        } else {
            Reflect.deleteProperty(Element.prototype, "animate");
        }
    });

    it("should ripple a tab's item when its tab is pressed", () => {
        const [, second] = items();
        press(second.querySelector("[role='tab']") as Element);
        expect(layer(second)).not.toBeNull();
    });

    it("should not ripple the tab for a press on its close button", () => {
        const [first] = items();
        press(first.querySelector("button[data-tab-close]") as Element);
        expect(layer(first)).toBeNull();
    });

    it("should not ripple a disabled tab", () => {
        const [, , third] = items();
        press(third.querySelector("[role='tab']") as Element);
        expect(layer(third)).toBeNull();
    });
});
