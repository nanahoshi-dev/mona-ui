import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { ButtonDirective } from "../../button/directives/button.directive";
import { DropdownButtonComponent } from "../../dropdown-button/components/dropdown-button/dropdown-button.component";
import { DropdownButtonItemComponent } from "../../dropdown-button/components/dropdown-button-item/dropdown-button-item.component";
import { SplitButtonComponent } from "../../split-button/components/split-button/split-button.component";
import { SplitButtonItemComponent } from "../../split-button/components/split-button-item/split-button-item.component";
import { ButtonGroupComponent } from "../components/button-group/button-group.component";

@Component({
    imports: [
        ButtonDirective,
        ButtonGroupComponent,
        DropdownButtonComponent,
        DropdownButtonItemComponent,
        SplitButtonComponent,
        SplitButtonItemComponent
    ],
    template: `
        <mona-button-group aria-label="Editing" size="small" [disabled]="disabled()">
            <button monaButton>Bold</button>
            <mona-dropdown-button text="Insert">
                <mona-dropdown-button-item label="Table"></mona-dropdown-button-item>
            </mona-dropdown-button>
            <mona-split-button text="Save">
                <mona-split-button-item label="Save as"></mona-split-button-item>
            </mona-split-button>
        </mona-button-group>
    `
})
class GroupHostComponent {
    public readonly disabled = signal(false);
}

describe("button group members", () => {
    let fixture: ComponentFixture<GroupHostComponent>;
    let buttons: HTMLButtonElement[];

    beforeEach(() => {
        fixture = TestBed.createComponent(GroupHostComponent);
        fixture.detectChanges();
        buttons = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll("mona-button-group button"));
    });

    it("renders dropdown and split buttons placed in the group", () => {
        const group = (fixture.nativeElement as HTMLElement).querySelector("mona-button-group")!;
        expect(group.querySelector("mona-dropdown-button")).not.toBeNull();
        expect(group.querySelector("mona-split-button")).not.toBeNull();
        expect(buttons.map(button => button.textContent?.trim())).toEqual(["Bold", "Insert", "Save", ""]);
    });

    it("gives their buttons the group's size and disabled state", () => {
        expect(buttons.every(button => button.getAttribute("data-size") === "small")).toBe(true);

        fixture.componentInstance.disabled.set(true);
        fixture.detectChanges();
        expect(buttons.every(button => button.hasAttribute("disabled"))).toBe(true);
    });

    it("keeps their buttons out of the group's selection", () => {
        expect(buttons[0].getAttribute("aria-pressed")).toBe("false");
        expect(buttons.slice(1).some(button => button.hasAttribute("aria-pressed"))).toBe(false);

        buttons[1].click();
        fixture.detectChanges();
        expect(buttons[1].hasAttribute("aria-pressed")).toBe(false);
    });
});
