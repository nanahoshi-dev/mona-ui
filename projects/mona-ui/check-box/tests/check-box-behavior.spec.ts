import { Component, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import axe from "axe-core";
import { beforeEach, describe, expect, it } from "vitest";
import { CheckBoxComponent } from "../components/check-box/check-box.component";

async function settle<T>(fixture: ComponentFixture<T>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

@Component({
    template: `
        <mona-check-box label="All rows" [checked]="checked()" [(indeterminate)]="indeterminate" />
        <mona-check-box label="One way" [indeterminate]="oneWay()" />
        <mona-check-box label="Bare" indeterminate />
    `,
    imports: [CheckBoxComponent]
})
class HostComponent {
    public readonly checked = signal(false);
    public readonly indeterminate = signal(true);
    public readonly oneWay = signal(true);
}

describe("check box behavior", () => {
    let fixture: ComponentFixture<HostComponent>;
    let host: HostComponent;
    let inputs: HTMLInputElement[];

    beforeEach(async () => {
        fixture = TestBed.createComponent(HostComponent);
        host = fixture.componentInstance;
        await settle(fixture);
        inputs = [...fixture.nativeElement.querySelectorAll("input")];
    });

    it("sets the native flag and announces mixed", () => {
        expect(inputs[0].indeterminate).toBe(true);
        expect(inputs[0].getAttribute("aria-checked")).toBe("mixed");
        expect(inputs[2].indeterminate).toBe(true);
    });

    it("clears everything together on a click, and tells a two-way binding", async () => {
        inputs[0].click();
        await settle(fixture);

        expect(inputs[0].indeterminate).toBe(false);
        expect(inputs[0].hasAttribute("aria-checked")).toBe(false);
        expect(fixture.nativeElement.querySelector("mona-check-box").getAttribute("data-indeterminate")).toBe("false");
        expect(host.indeterminate()).toBe(false);
    });

    it("clears with a one-way binding too, and can be set again", async () => {
        inputs[1].click();
        await settle(fixture);
        expect(inputs[1].hasAttribute("aria-checked")).toBe(false);

        host.oneWay.set(false);
        await settle(fixture);
        host.oneWay.set(true);
        await settle(fixture);

        expect(inputs[1].indeterminate).toBe(true);
        expect(inputs[1].getAttribute("aria-checked")).toBe("mixed");
    });

    it("has no axe violations after a click", async () => {
        inputs[0].click();
        await settle(fixture);

        const result = await axe.run(fixture.nativeElement, {
            rules: { "color-contrast": { enabled: false }, region: { enabled: false } }
        });

        expect(result.violations.map(violation => violation.id)).toEqual([]);
    });

    it("draws the dash and not the check when both are set", async () => {
        host.checked.set(true);
        await settle(fixture);

        const first = fixture.nativeElement.querySelector("mona-check-box") as HTMLElement;
        expect(first.querySelector("svg")).toBeNull();

        inputs[0].click();
        await settle(fixture);
        host.checked.set(false);
        await settle(fixture);
        host.checked.set(true);
        await settle(fixture);

        expect(first.querySelector("svg")).not.toBeNull();
    });

    it("positions the dash against the box, with logical insets", () => {
        const box = fixture.nativeElement.querySelector("mona-check-box span") as HTMLElement;

        expect(box.classList.contains("relative")).toBe(true);
        expect(box.classList.contains("peer-indeterminate:after:inset-0")).toBe(true);
    });
});
