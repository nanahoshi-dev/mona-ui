import { Component, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { disabled, form, FormField, readonly, required } from "@angular/forms/signals";
import { FieldsetComponent } from "@nanahoshi/mona-ui/fieldset";
import axe from "axe-core";
import { vi } from "vitest";
import { RadioButtonComponent } from "../radio-button/radio-button.component";
import { RadioGroupComponent } from "./radio-group.component";

async function settle<T>(fixture: ComponentFixture<T>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

async function axeViolations(element: Element): Promise<string[]> {
    const result = await axe.run(
        { include: [element] },
        { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } }
    );
    return result.violations.map(violation => violation.id);
}

function focusOut(target: Element, relatedTarget: Element | null): void {
    target.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget }));
}

@Component({
    template: `
        <mona-radio-group
            aria-describedby="hint"
            aria-label="Season"
            [disabled]="groupDisabled()"
            [invalid]="invalid()"
            [orientation]="orientation()"
            [readonly]="groupReadonly()"
            [required]="groupRequired()"
            [touched]="touched()"
            [(value)]="value"
            (touch)="touches.update(count => count + 1)">
            <mona-radio-button label="Autumn" radioValue="autumn" />
            <mona-radio-button label="Winter" radioValue="winter" />
            <mona-radio-button label="Spring" radioValue="spring" [disabled]="springDisabled()" />
        </mona-radio-group>
        <mona-radio-group aria-label="Other" [(value)]="other">
            <mona-radio-button label="One" radioValue="one" />
            <mona-radio-button label="Two" radioValue="two" />
        </mona-radio-group>
    `,
    imports: [RadioButtonComponent, RadioGroupComponent]
})
class GroupHostComponent {
    public readonly groupDisabled = signal(false);
    public readonly groupReadonly = signal(false);
    public readonly groupRequired = signal(false);
    public readonly invalid = signal(false);
    public readonly orientation = signal<"horizontal" | "vertical">("vertical");
    public readonly other = signal<unknown>("two");
    public readonly springDisabled = signal(false);
    public readonly touched = signal(false);
    public readonly touches = signal(0);
    public readonly value = signal<unknown>("autumn");
}

@Component({
    template: `
        <mona-radio-group aria-label="Season" [formField]="form.season">
            <mona-radio-button label="Autumn" radioValue="autumn" />
            <mona-radio-button label="Winter" radioValue="winter" />
        </mona-radio-group>
    `,
    imports: [FormField, RadioButtonComponent, RadioGroupComponent]
})
class FormHostComponent {
    readonly #model = signal({ season: "" });
    public readonly form = form(this.#model, schema => {
        disabled(schema.season, { when: () => this.formDisabled() });
        readonly(schema.season, { when: () => this.formReadonly() });
        required(schema.season);
    });
    public readonly formDisabled = signal(false);
    public readonly formReadonly = signal(false);
    public readonly model = this.#model;
}

@Component({
    template: `
        <mona-fieldset legend="Section" disabled>
            <mona-radio-group aria-label="Season">
                <mona-radio-button label="Autumn" radioValue="autumn" />
            </mona-radio-group>
        </mona-fieldset>
    `,
    imports: [FieldsetComponent, RadioButtonComponent, RadioGroupComponent]
})
class FieldsetHostComponent {}

@Component({
    template: `
        <mona-radio-group>
            <mona-radio-button label="Autumn" radioValue="autumn" />
        </mona-radio-group>
    `,
    imports: [RadioButtonComponent, RadioGroupComponent]
})
class UnnamedHostComponent {}

describe("RadioGroupComponent", () => {
    describe("in a template", () => {
        let fixture: ComponentFixture<GroupHostComponent>;
        let host: GroupHostComponent;
        let root: HTMLElement;
        let group: HTMLElement;
        let inputs: HTMLInputElement[];

        beforeEach(async () => {
            fixture = TestBed.createComponent(GroupHostComponent);
            host = fixture.componentInstance;
            root = fixture.nativeElement;
            await settle(fixture);
            group = root.querySelector("mona-radio-group")!;
            inputs = Array.from(group.querySelectorAll<HTMLInputElement>("input"));
        });

        it("is a named radio group with no accessibility violations", async () => {
            expect(group.getAttribute("role")).toBe("radiogroup");
            expect(group.getAttribute("aria-label")).toBe("Season");
            expect(group.getAttribute("aria-describedby")).toBe("hint");
            expect(await axeViolations(root)).toEqual([]);
        });

        it("gives its radios one generated name, different from another group's", () => {
            const names = new Set(inputs.map(input => input.name));
            const otherName = root.querySelectorAll<HTMLInputElement>("mona-radio-group input")[3].name;
            expect(names.size).toBe(1);
            expect(inputs[0].name).not.toBe("");
            expect(otherName).not.toBe(inputs[0].name);
        });

        it("keeps two groups from clearing each other's selection", () => {
            inputs[1].click();
            expect(root.querySelector<HTMLInputElement>("mona-radio-group:last-child input:checked")!.value).toBe(
                "two"
            );
        });

        it("checks the radio matching its value", () => {
            expect(inputs.map(input => input.checked)).toEqual([true, false, false]);
        });

        it("follows a value set from outside", async () => {
            host.value.set("spring");
            await settle(fixture);
            expect(inputs.map(input => input.checked)).toEqual([false, false, true]);
        });

        it("writes the chosen radio to its value, and only one looks selected", async () => {
            inputs[1].click();
            await settle(fixture);
            expect(host.value()).toBe("winter");
            const selected = Array.from(group.querySelectorAll("mona-radio-button")).map(radio =>
                radio.getAttribute("data-selected")
            );
            expect(selected).toEqual(["false", "true", "false"]);
        });

        it("draws one indicator after a selection", async () => {
            inputs[1].click();
            await settle(fixture);
            expect(group.querySelectorAll("mona-radio-button span span").length).toBe(1);
        });

        it("puts the native state back when the value is set back before rendering", async () => {
            const component = fixture.debugElement.children[0].componentInstance as RadioGroupComponent;
            inputs[1].click();
            component.value.set("autumn");
            await settle(fixture);
            expect(inputs.map(input => input.checked)).toEqual([true, false, false]);
        });

        it("disables every radio", async () => {
            host.groupDisabled.set(true);
            await settle(fixture);
            expect(inputs.every(input => input.disabled)).toBe(true);
            expect(group.getAttribute("aria-disabled")).toBe("true");
        });

        it("leaves a radio's own disabled alone", async () => {
            host.springDisabled.set(true);
            await settle(fixture);
            expect(inputs.map(input => input.disabled)).toEqual([false, false, true]);
        });

        it("keeps the value when read-only", async () => {
            host.groupReadonly.set(true);
            await settle(fixture);
            inputs[1].click();
            await settle(fixture);
            expect(host.value()).toBe("autumn");
            expect(inputs[1].checked).toBe(false);
            expect(group.getAttribute("aria-readonly")).toBe("true");
            expect(inputs[1].closest("mona-radio-button")!.getAttribute("data-readonly")).toBe("true");
        });

        it("reports required on the group and the native inputs", async () => {
            host.groupRequired.set(true);
            await settle(fixture);
            expect(group.getAttribute("aria-required")).toBe("true");
            expect(inputs.every(input => input.required)).toBe(true);
            expect(await axeViolations(root)).toEqual([]);
        });

        it("shows invalid on the group only once touched, and paints the radios", async () => {
            host.invalid.set(true);
            await settle(fixture);
            expect(group.getAttribute("aria-invalid")).toBeNull();

            host.touched.set(true);
            await settle(fixture);
            expect(group.getAttribute("aria-invalid")).toBe("true");
            expect(inputs[0].getAttribute("aria-invalid")).toBeNull();
            expect(group.querySelectorAll("[data-invalid='true']").length).toBe(3);
        });

        it("lays out and announces its orientation", async () => {
            expect(group.getAttribute("aria-orientation")).toBe("vertical");
            expect(group.classList).toContain("flex-col");

            host.orientation.set("horizontal");
            await settle(fixture);
            expect(group.getAttribute("aria-orientation")).toBe("horizontal");
            expect(group.classList).toContain("flex-row");
        });

        it("touches when focus leaves the group, not when it moves inside", () => {
            focusOut(inputs[0], inputs[1]);
            expect(host.touches()).toBe(0);
            focusOut(inputs[1], null);
            expect(host.touches()).toBe(1);
        });

        it("touches when a radio is selected", async () => {
            inputs[1].click();
            await settle(fixture);
            expect(host.touches()).toBe(1);
        });
    });

    describe("attached to the document", () => {
        let fixture: ComponentFixture<GroupHostComponent>;
        let group: HTMLElement;

        beforeEach(async () => {
            fixture = TestBed.createComponent(GroupHostComponent);
            document.body.appendChild(fixture.nativeElement);
            await settle(fixture);
            group = fixture.nativeElement.querySelector("mona-radio-group");
        });

        afterEach(() => {
            fixture.nativeElement.remove();
        });

        it("focuses the selected radio", () => {
            const component = fixture.debugElement.children[0].componentInstance as RadioGroupComponent;
            component.focus();
            expect(document.activeElement).toBe(group.querySelectorAll("input")[0]);
        });

        it("focuses the selected radio when it isn't the first", async () => {
            fixture.componentInstance.value.set("winter");
            await settle(fixture);
            const component = fixture.debugElement.children[0].componentInstance as RadioGroupComponent;
            component.focus();
            expect(document.activeElement).toBe(group.querySelectorAll("input")[1]);
        });

        it("focuses the first enabled radio when nothing is selected", async () => {
            fixture.componentInstance.value.set("none");
            await settle(fixture);
            const component = fixture.debugElement.children[0].componentInstance as RadioGroupComponent;
            component.focus();
            expect(document.activeElement).toBe(group.querySelectorAll("input")[0]);
        });
    });

    describe("bound to a signal form", () => {
        let fixture: ComponentFixture<FormHostComponent>;
        let host: FormHostComponent;
        let group: HTMLElement;
        let inputs: HTMLInputElement[];

        beforeEach(async () => {
            fixture = TestBed.createComponent(FormHostComponent);
            host = fixture.componentInstance;
            document.body.appendChild(fixture.nativeElement);
            await settle(fixture);
            group = fixture.nativeElement.querySelector("mona-radio-group");
            inputs = Array.from(group.querySelectorAll<HTMLInputElement>("input"));
        });

        afterEach(() => {
            fixture.nativeElement.remove();
        });

        it("writes the selection to the model", async () => {
            inputs[1].click();
            await settle(fixture);
            expect(host.model().season).toBe("winter");
        });

        it("receives required from the form", () => {
            expect(group.getAttribute("aria-required")).toBe("true");
            expect(inputs[0].required).toBe(true);
        });

        it("uses the field's name for its radios", () => {
            expect(inputs[0].name).toContain("season");
            expect(inputs[1].name).toBe(inputs[0].name);
        });

        it("becomes invalid after the user leaves it empty", async () => {
            expect(group.getAttribute("aria-invalid")).toBeNull();
            focusOut(inputs[0], null);
            await settle(fixture);
            expect(host.form.season().touched()).toBe(true);
            expect(group.getAttribute("aria-invalid")).toBe("true");
        });

        it("receives disabled from the form", async () => {
            host.formDisabled.set(true);
            await settle(fixture);
            expect(inputs.every(input => input.disabled)).toBe(true);
        });

        it("holds a read-only field", async () => {
            host.formReadonly.set(true);
            await settle(fixture);
            inputs[1].click();
            await settle(fixture);
            expect(host.model().season).toBe("");
        });

        it("takes focus from focusBoundControl", () => {
            host.form.season().focusBoundControl();
            expect(document.activeElement).toBe(inputs[0]);
        });
    });

    it("is disabled by a surrounding mona-fieldset", async () => {
        const fixture = TestBed.createComponent(FieldsetHostComponent);
        await settle(fixture);
        const group: HTMLElement = fixture.nativeElement.querySelector("mona-radio-group");
        expect(group.getAttribute("aria-disabled")).toBe("true");
        expect(group.querySelector("input")!.disabled).toBe(true);
    });

    describe("without a name", () => {
        afterEach(() => {
            vi.restoreAllMocks();
        });

        it("warns in development", async () => {
            const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
            const fixture = TestBed.createComponent(UnnamedHostComponent);
            await settle(fixture);
            expect(warn).toHaveBeenCalledWith(expect.stringContaining("[Mona Radio Group]"), expect.anything());
        });

        it("stays quiet once named", async () => {
            const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
            const fixture = TestBed.createComponent(GroupHostComponent);
            await settle(fixture);
            expect(warn).not.toHaveBeenCalled();
        });
    });
});
