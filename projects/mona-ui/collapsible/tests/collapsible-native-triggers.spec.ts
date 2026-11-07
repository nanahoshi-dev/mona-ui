import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { CollapsibleTriggerDirective } from "../directives/collapsible-trigger.directive";
import { CollapsibleDirective } from "../directives/collapsible.directive";

@Component({
    template: `
        <div monaCollapsible disabled class="off">
            <details>
                <summary monaCollapsibleTrigger>Summary</summary>
            </details>
            <input monaCollapsibleTrigger type="button" value="Input" />
        </div>
        <div monaCollapsible class="on">
            <details>
                <summary monaCollapsibleTrigger>Summary</summary>
            </details>
            <input monaCollapsibleTrigger type="button" value="Input" />
        </div>
    `,
    imports: [CollapsibleDirective, CollapsibleTriggerDirective]
})
class HostComponent {}

describe("monaCollapsibleTrigger on native triggers", () => {
    async function setup(): Promise<HTMLElement> {
        const fixture = TestBed.createComponent(HostComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
        return fixture.nativeElement;
    }

    function clickDefaultPrevented(element: Element | null | undefined): boolean {
        const event = new MouseEvent("click", { bubbles: true, cancelable: true });
        element?.dispatchEvent(event);
        return event.defaultPrevented;
    }

    it("stops a disabled summary opening its details", async () => {
        const root = await setup();
        expect(clickDefaultPrevented(root.querySelector(".off summary"))).toBe(true);
    });

    it("leaves an enabled summary's click alone", async () => {
        const root = await setup();
        expect(clickDefaultPrevented(root.querySelector(".on summary"))).toBe(false);
    });

    it("disables a native input while disabled", async () => {
        const root = await setup();
        expect(root.querySelector<HTMLInputElement>(".off input")?.disabled).toBe(true);
        expect(root.querySelector<HTMLInputElement>(".on input")?.disabled).toBe(false);
    });
});
