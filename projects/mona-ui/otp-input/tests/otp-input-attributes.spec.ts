import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { OtpInputComponent } from "../components/otp-input/otp-input.component";

@Component({
    template: `
        <mona-otp-input
            class="both"
            aria-label="Code"
            inputId="real-id"
            name="real-name"
            [inputAttributes]="{ id: 'attribute-id', name: 'attribute-name', title: 'Kept' }"></mona-otp-input>
        <mona-otp-input
            class="attributes"
            aria-label="Code"
            [inputAttributes]="{ id: 'attribute-id', name: 'attribute-name' }"></mona-otp-input>
    `,
    imports: [OtpInputComponent]
})
class HostComponent {}

describe("mona-otp-input inputAttributes", () => {
    async function setup(): Promise<HTMLElement> {
        const fixture = TestBed.createComponent(HostComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
        return fixture.nativeElement;
    }

    it("lets the id and name inputs win over the attributes", async () => {
        const input = (await setup()).querySelector<HTMLInputElement>(".both input");
        expect(input?.id).toBe("real-id");
        expect(input?.getAttribute("name")).toBe("real-name");
        expect(input?.getAttribute("title")).toBe("Kept");
    });

    it("takes the id and the name from the attributes when those inputs aren't set", async () => {
        const input = (await setup()).querySelector<HTMLInputElement>(".attributes input");
        expect(input?.getAttribute("name")).toBe("attribute-name");
        expect(input?.id).toBe("attribute-id");
    });
});
