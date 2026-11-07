import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { describe, expect, it } from "vitest";
import { ButtonGroupComponent } from "../components/button-group/button-group.component";
import type { ButtonGroupClickEvent } from "../models/ButtonGroupClickEvent";

@Component({
    template: `
        <mona-button-group aria-label="Tools" readonly (buttonClick)="clicks.push($event)">
            <button monaButton type="button" value="toggle">Toggle</button>
            <button monaButton type="button" value="action" [toggleable]="false">Action</button>
        </mona-button-group>
    `,
    imports: [ButtonDirective, ButtonGroupComponent]
})
class HostComponent {
    public readonly clicks: ButtonGroupClickEvent[] = [];
}

describe("mona-button-group read-only", () => {
    async function setup() {
        const fixture = TestBed.createComponent(HostComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
        const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll("button"));
        return { buttons, clicks: fixture.componentInstance.clicks };
    }

    it("doesn't report a toggle button's click, since nothing was selected", async () => {
        const { buttons, clicks } = await setup();
        buttons[0].click();
        expect(clicks).toEqual([]);
    });

    it("still reports a button that isn't a toggle, since it's a command rather than a value", async () => {
        const { buttons, clicks } = await setup();
        buttons[1].click();
        expect(clicks.map(click => click.button)).toEqual([buttons[1]]);
    });
});
