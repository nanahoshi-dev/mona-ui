import { Component, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { form, FormField } from "@angular/forms/signals";
import axe from "axe-core";
import { beforeEach, describe, expect, it } from "vitest";
import { RadioButtonComponent } from "../components/radio-button/radio-button.component";
import { RadioGroupComponent } from "../components/radio-group/radio-group.component";
import { RadioButtonDirective } from "../directives/radio-button.directive";

async function settle<T>(fixture: ComponentFixture<T>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

type Size = "large" | "small";

interface Plan {
    readonly id: number;
}

const PLAN_A: Plan = { id: 1 };
const PLAN_B: Plan = { id: 2 };

/** Each binding here has to compile against a typed signal, which `model<unknown>` would refuse. */
@Component({
    template: `
        <mona-radio-group aria-label="Size" [(value)]="size">
            <mona-radio-button label="Small" radioValue="small" />
            <mona-radio-button label="Large" radioValue="large" />
        </mona-radio-group>

        <mona-radio-group aria-label="Form size" [formField]="form.size">
            <mona-radio-button label="Small" radioValue="small" />
            <mona-radio-button label="Large" radioValue="large" />
        </mona-radio-group>

        <mona-radio-group aria-label="Plan" [(value)]="plan">
            <mona-radio-button label="A" [radioValue]="planA" />
            <mona-radio-button label="B" [radioValue]="planB" />
        </mona-radio-group>

        <mona-radio-button label="Alone" name="alone" radioValue="small" [(value)]="alone" />
        <mona-radio-button label="Form alone" radioValue="small" [formField]="form.size" />
        <mona-radio-button label="No value" name="unset" />
    `,
    imports: [FormField, RadioButtonComponent, RadioGroupComponent]
})
class HostComponent {
    public readonly alone = signal("large");
    public readonly form = form(signal<{ size: Size }>({ size: "small" }));
    public readonly plan = signal<Plan>(PLAN_B);
    public readonly planA = PLAN_A;
    public readonly planB = PLAN_B;
    public readonly size = signal<Size>("small");
}

@Component({
    template: `<input type="radio" aria-label="Native" monaRadioButton />`,
    imports: [RadioButtonDirective]
})
class DirectiveHostComponent {}

describe("radio button values", () => {
    let fixture: ComponentFixture<HostComponent>;
    let host: HostComponent;

    function radio(label: string): HTMLInputElement {
        const labels: HTMLLabelElement[] = [...fixture.nativeElement.querySelectorAll("label")];
        const match = labels.find(element => element.textContent?.trim() === label);
        return match?.querySelector("input") as HTMLInputElement;
    }

    beforeEach(async () => {
        fixture = TestBed.createComponent(HostComponent);
        host = fixture.componentInstance;
        await settle(fixture);
    });

    it("binds a group to a typed signal", async () => {
        const groups = fixture.nativeElement.querySelectorAll("mona-radio-group");
        groups[0].querySelectorAll("input")[1].click();
        await settle(fixture);

        expect(host.size()).toBe("large");
    });

    it("selects an object value by identity", async () => {
        expect(radio("B").checked).toBe(true);

        radio("A").click();
        await settle(fixture);

        expect(host.plan()).toBe(PLAN_A);
    });

    it("doesn't write an object to the native value", () => {
        expect(radio("A").hasAttribute("value")).toBe(false);
        expect(radio("A").value).not.toContain("[object");
    });

    it("writes a primitive to the native value", () => {
        expect(radio("Alone").value).toBe("small");
    });

    it("doesn't select a radio with no value while the model is empty too", () => {
        const noValue = radio("No value");

        expect(noValue.checked).toBe(false);
        expect(noValue.closest("mona-radio-button")?.getAttribute("data-selected")).toBe("false");
    });

    it("doesn't cover projected content with the native input", () => {
        expect(radio("Alone").classList.contains("sr-only")).toBe(true);
        expect(radio("Alone").classList.contains("absolute")).toBe(false);
        expect(radio("Alone").classList.contains("z-10")).toBe(false);
    });

    it("still selects when the label is clicked", async () => {
        (radio("Alone").closest("label") as HTMLLabelElement).click();
        await settle(fixture);

        expect(host.alone()).toBe("small");
    });

    it("has no axe violations", async () => {
        const result = await axe.run(fixture.nativeElement, {
            rules: { "color-contrast": { enabled: false }, region: { enabled: false } }
        });

        expect(result.violations.map(violation => violation.id)).toEqual([]);
    });

    describe("native directive", () => {
        it("is round by default, and leaves the role to the element", async () => {
            const directiveFixture = TestBed.createComponent(DirectiveHostComponent);
            await settle(directiveFixture);

            const input = directiveFixture.nativeElement.querySelector("input") as HTMLInputElement;

            expect(input.classList.contains("rounded-full")).toBe(true);
            expect(input.hasAttribute("role")).toBe(false);
        });
    });
});
