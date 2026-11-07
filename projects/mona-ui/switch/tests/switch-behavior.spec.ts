import { Component, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import axe from "axe-core";
import { beforeEach, describe, expect, it } from "vitest";
import { SwitchComponent } from "../components/switch/switch.component";
import { SwitchHandleContentTemplateDirective } from "../directives/switch-handle-content-template.directive";

async function settle<T>(fixture: ComponentFixture<T>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

function press(target: Element, key: string, repeat = false): KeyboardEvent {
    const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key, repeat });
    target.dispatchEvent(event);
    return event;
}

@Component({
    template: `
        <mona-switch aria-label="Wi-Fi" [tabindex]="tabindex()" [(checked)]="checked">
            <ng-template monaSwitchHandleContentTemplate let-active>
                <button type="button">{{ active ? "on" : "off" }}</button>
            </ng-template>
        </mona-switch>
    `,
    imports: [SwitchComponent, SwitchHandleContentTemplateDirective]
})
class HostComponent {
    public readonly checked = signal(false);
    public readonly tabindex = signal<number | string>(0);
}

@Component({
    template: `<mona-switch aria-label="Wi-Fi" onLabel="On" offLabel="Off" [required]="required()" />`,
    imports: [SwitchComponent]
})
class PlainHostComponent {
    public readonly required = signal(false);
}

describe("switch behavior", () => {
    let fixture: ComponentFixture<HostComponent>;
    let host: HostComponent;
    let element: HTMLElement;

    beforeEach(async () => {
        fixture = TestBed.createComponent(HostComponent);
        host = fixture.componentInstance;
        await settle(fixture);
        element = fixture.nativeElement.querySelector("mona-switch");
    });

    it("toggles once while a key is held, and still stops the page scrolling", () => {
        press(element, " ");
        const repeat = press(element, " ", true);

        expect(host.checked()).toBe(true);
        expect(repeat.defaultPrevented).toBe(true);
    });

    it("leaves keys pressed on a control in a template to that control", () => {
        const inner = element.querySelector("button") as HTMLButtonElement;

        const event = press(inner, "Enter");

        expect(host.checked()).toBe(false);
        expect(event.defaultPrevented).toBe(false);
    });

    it("passes the context to the handle template", async () => {
        const inner = element.querySelector("button") as HTMLButtonElement;
        expect(inner.textContent).toBe("off");

        press(element, "Enter");
        await settle(fixture);

        expect(inner.textContent).toBe("on");
    });

    it.each([
        [5, "5"],
        ["3", "3"],
        ["abc", "0"]
    ])("takes tabindex %s", async (value, expected) => {
        host.tabindex.set(value);
        await settle(fixture);

        expect(element.getAttribute("tabindex")).toBe(expected);
    });

    it.each([false, true])("has no axe violations with required %s", async required => {
        const plain = TestBed.createComponent(PlainHostComponent);
        plain.componentInstance.required.set(required);
        await settle(plain);

        const result = await axe.run(plain.nativeElement, {
            rules: { "color-contrast": { enabled: false }, region: { enabled: false } }
        });

        expect(result.violations.map(violation => violation.id)).toEqual([]);
    });
});
