import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { SwitchComponent } from "@nanahoshi/mona-ui/switch";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LabelComponent } from "../components/label/label.component";

@Component({
    template: `
        <mona-label>
            <mona-switch aria-label="Wi-Fi"></mona-switch>
        </mona-label>
    `,
    imports: [LabelComponent, SwitchComponent]
})
class NamedHostComponent {}

@Component({
    template: `
        <mona-label>
            <mona-switch aria-labelledby="heading"></mona-switch>
        </mona-label>
    `,
    imports: [LabelComponent, SwitchComponent]
})
class LabelledByHostComponent {}

@Component({
    template: `
        <mona-label>
            Wi-Fi
            <mona-switch></mona-switch>
        </mona-label>
    `,
    imports: [LabelComponent, SwitchComponent]
})
class UnnamedHostComponent {}

describe("mona-label's warning about a wrapped control", () => {
    let warn: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    });

    afterEach(() => vi.restoreAllMocks());

    async function render(component: new () => unknown): Promise<void> {
        const fixture = TestBed.createComponent(component);
        fixture.detectChanges();
        await fixture.whenStable();
    }

    it("stays quiet for a control named by aria-label", async () => {
        await render(NamedHostComponent);
        expect(warn).not.toHaveBeenCalled();
    });

    it("stays quiet for a control named by aria-labelledby", async () => {
        await render(LabelledByHostComponent);
        expect(warn).not.toHaveBeenCalled();
    });

    it("warns for a control with no name", async () => {
        await render(UnnamedHostComponent);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("wrapped control"), expect.anything());
    });
});
