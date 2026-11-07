import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { FieldsetComponent } from "./fieldset.component";

@Component({
    template: `
        <mona-fieldset legend="Outer" disabled>
            <mona-fieldset class="inner" legend="Inner"></mona-fieldset>
        </mona-fieldset>
        <mona-fieldset legend="Enabled">
            <mona-fieldset class="inner-enabled" legend="Inner"></mona-fieldset>
        </mona-fieldset>
    `,
    imports: [FieldsetComponent]
})
class HostComponent {}

describe("mona-fieldset nested in another", () => {
    async function setup(): Promise<HTMLElement> {
        const fixture = TestBed.createComponent(HostComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
        return fixture.nativeElement;
    }

    it("is painted disabled under a disabled parent, since its controls are", async () => {
        const inner = (await setup()).querySelector(".inner");
        expect(inner?.querySelector("fieldset")?.classList.contains("cursor-not-allowed")).toBe(true);
    });

    it("isn't painted disabled under an enabled parent", async () => {
        const inner = (await setup()).querySelector(".inner-enabled");
        expect(inner?.querySelector("fieldset")?.classList.contains("cursor-not-allowed")).toBe(false);
    });
});
