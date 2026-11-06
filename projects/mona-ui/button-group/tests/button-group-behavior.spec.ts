import { Component, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { disabled, form, FormField, readonly } from "@angular/forms/signals";
import { By } from "@angular/platform-browser";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { LabelComponent } from "@nanahoshi/mona-ui/label";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DropdownButtonComponent } from "../../dropdown-button/components/dropdown-button/dropdown-button.component";
import { DropdownButtonItemComponent } from "../../dropdown-button/components/dropdown-button-item/dropdown-button-item.component";
import { SplitButtonComponent } from "../../split-button/components/split-button/split-button.component";
import { SplitButtonItemComponent } from "../../split-button/components/split-button-item/split-button-item.component";
import { ButtonGroupComponent } from "../components/button-group/button-group.component";
import type { ButtonGroupClickEvent } from "../models/ButtonGroupClickEvent";

async function settle<T>(fixture: ComponentFixture<T>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

function pressed<T>(fixture: ComponentFixture<T>): (string | null)[] {
    const buttons: HTMLButtonElement[] = [...fixture.nativeElement.querySelectorAll("mona-button-group button")];
    return buttons.map(button => button.getAttribute("aria-pressed"));
}

function clickNth<T>(fixture: ComponentFixture<T>, index: number): void {
    (fixture.nativeElement.querySelectorAll("mona-button-group button")[index] as HTMLButtonElement).click();
}

@Component({
    template: `
        <mona-button-group [allowEmpty]="allowEmpty()" [selection]="selection()" (buttonClick)="clicks.push($event)">
            <button monaButton [(selected)]="a">A</button>
            <button monaButton [(selected)]="b">B</button>
            <button monaButton [toggleable]="false">Action</button>
        </mona-button-group>
    `,
    imports: [ButtonDirective, ButtonGroupComponent]
})
class SelectedHostComponent {
    public readonly a = signal(false);
    public readonly allowEmpty = signal(true);
    public readonly b = signal(false);
    public readonly clicks: ButtonGroupClickEvent[] = [];
    public readonly selection = signal<"multiple" | "single">("single");
}

@Component({
    template: `
        <mona-button-group
            aria-label="Align"
            [disabled]="isDisabled()"
            [readonly]="isReadonly()"
            [selection]="selection()"
            [(value)]="value"
            (buttonClick)="clicks.push($event)"
            (touch)="touches = touches + 1">
            @for (option of options(); track option) {
                <button monaButton [value]="option">{{ option }}</button>
            }
            <button monaButton>No value</button>
            <button monaButton value="action" [toggleable]="false">Action</button>
        </mona-button-group>
        <button type="button" id="after">After</button>
    `,
    imports: [ButtonDirective, ButtonGroupComponent]
})
class ValueHostComponent {
    public readonly clicks: ButtonGroupClickEvent<string>[] = [];
    public readonly isDisabled = signal(false);
    public readonly isReadonly = signal(false);
    public readonly options = signal(["left", "center", "right"]);
    public readonly selection = signal<"multiple" | "single">("single");
    public readonly value = signal<string | readonly string[] | null | undefined>(undefined);
    public touches = 0;
}

@Component({
    template: `
        <mona-button-group aria-label="Align" selection="single" [formField]="form.align">
            <button monaButton value="left">Left</button>
            <button monaButton value="right">Right</button>
        </mona-button-group>
    `,
    imports: [ButtonDirective, ButtonGroupComponent, FormField]
})
class FormHostComponent {
    readonly #model = signal<{ align: string | null }>({ align: "left" });
    public readonly fieldDisabled = signal(false);
    public readonly fieldReadonly = signal(false);
    public readonly form = form(this.#model, schema => {
        disabled(schema.align, { when: () => this.fieldDisabled() });
        readonly(schema.align, { when: () => this.fieldReadonly() });
    });
}

@Component({
    template: `
        <mona-label text="Align">
            <mona-button-group>
                <button monaButton>Left</button>
            </mona-button-group>
        </mona-label>
    `,
    imports: [ButtonDirective, ButtonGroupComponent, LabelComponent]
})
class LabelledHostComponent {}

@Component({
    template: `
        <mona-button-group aria-label="Actions" [disabled]="groupDisabled()">
            <mona-dropdown-button text="Insert">
                <mona-dropdown-button-item label="Table" />
            </mona-dropdown-button>
            <mona-split-button text="Save">
                <mona-split-button-item label="Save as" />
            </mona-split-button>
        </mona-button-group>
    `,
    imports: [
        ButtonGroupComponent,
        DropdownButtonComponent,
        DropdownButtonItemComponent,
        SplitButtonComponent,
        SplitButtonItemComponent
    ]
})
class MembersHostComponent {
    public readonly groupDisabled = signal(false);
}

describe("button group behavior", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("the selection policy holds for bindings as well as clicks", () => {
        let fixture: ComponentFixture<SelectedHostComponent>;
        let host: SelectedHostComponent;

        beforeEach(() => {
            fixture = TestBed.createComponent(SelectedHostComponent);
            host = fixture.componentInstance;
        });

        it("keeps the first of two initially selected buttons in single", async () => {
            host.a.set(true);
            host.b.set(true);
            await settle(fixture);

            expect(host.a()).toBe(true);
            expect(host.b()).toBe(false);
        });

        it("keeps the newest when a parent selects another", async () => {
            host.a.set(true);
            await settle(fixture);

            host.b.set(true);
            await settle(fixture);

            expect(host.a()).toBe(false);
            expect(host.b()).toBe(true);
        });

        it("keeps the first going from multiple to single", async () => {
            host.selection.set("multiple");
            host.a.set(true);
            host.b.set(true);
            await settle(fixture);
            expect(host.b()).toBe(true);

            host.selection.set("single");
            await settle(fixture);

            expect(host.a()).toBe(true);
            expect(host.b()).toBe(false);
        });

        it("lets a multiple group hold both", async () => {
            host.selection.set("multiple");
            host.a.set(true);
            host.b.set(true);
            await settle(fixture);

            expect(pressed(fixture).slice(0, 2)).toEqual(["true", "true"]);
        });

        it("brings the button back when a parent clears it and allowEmpty is false", async () => {
            host.allowEmpty.set(false);
            host.a.set(true);
            await settle(fixture);

            host.a.set(false);
            await settle(fixture);

            expect(host.a()).toBe(true);
        });

        it("clears when allowEmpty is true", async () => {
            host.a.set(true);
            await settle(fixture);

            host.a.set(false);
            await settle(fixture);

            expect(host.a()).toBe(false);
        });

        it("doesn't choose a first button for allowEmpty", async () => {
            host.allowEmpty.set(false);
            await settle(fixture);

            expect(host.a()).toBe(false);
            expect(host.b()).toBe(false);
        });

        it("doesn't force a selection on a multiple group", async () => {
            host.selection.set("multiple");
            host.allowEmpty.set(false);
            host.a.set(true);
            await settle(fixture);

            host.a.set(false);
            await settle(fixture);

            expect(host.a()).toBe(false);
        });
    });

    describe("with no value in use", () => {
        @Component({
            template: `
                <mona-button-group aria-label="Align" selection="multiple">
                    <button monaButton value="left" [selected]="true">Left</button>
                    <button monaButton>Right</button>
                </mona-button-group>
            `,
            imports: [ButtonDirective, ButtonGroupComponent]
        })
        class UnsetHostComponent {}

        it("leaves a button's own selected alone", async () => {
            const fixture = TestBed.createComponent(UnsetHostComponent);
            await settle(fixture);

            expect(pressed(fixture)).toEqual(["true", "false"]);
        });

        it("doesn't start writing a value when no button has one", async () => {
            const fixture = TestBed.createComponent(SelectedHostComponent);
            await settle(fixture);
            const group = fixture.debugElement.children[0].componentInstance as ButtonGroupComponent;

            clickNth(fixture, 0);
            await settle(fixture);

            expect(group.value()).toBeUndefined();
        });
    });

    describe("buttonClick", () => {
        let fixture: ComponentFixture<SelectedHostComponent>;
        let host: SelectedHostComponent;

        beforeEach(async () => {
            fixture = TestBed.createComponent(SelectedHostComponent);
            host = fixture.componentInstance;
            await settle(fixture);
        });

        it("says which button, with the selection already applied", async () => {
            clickNth(fixture, 0);

            expect(host.clicks.length).toBe(1);
            expect(host.clicks[0].button.textContent?.trim()).toBe("A");
            expect(host.clicks[0].selected).toBe(true);
        });

        it("fires for a button that isn't toggleable", () => {
            clickNth(fixture, 2);

            expect(host.clicks.map(click => click.button.textContent?.trim())).toEqual(["Action"]);
            expect(host.clicks[0].selected).toBe(false);
        });

        it("fires once per click", () => {
            clickNth(fixture, 0);
            clickNth(fixture, 1);

            expect(host.clicks.length).toBe(2);
        });
    });

    it("doesn't report a dropdown or split button's own buttons", async () => {
        @Component({
            template: `
                <mona-button-group aria-label="Actions" (buttonClick)="clicks = clicks + 1">
                    <mona-split-button text="Save" />
                </mona-button-group>
            `,
            imports: [ButtonGroupComponent, SplitButtonComponent]
        })
        class SplitHostComponent {
            public clicks = 0;
        }
        const fixture = TestBed.createComponent(SplitHostComponent);
        await settle(fixture);

        clickNth(fixture, 0);

        expect(fixture.componentInstance.clicks).toBe(0);
    });

    describe("value", () => {
        let fixture: ComponentFixture<ValueHostComponent>;
        let host: ValueHostComponent;

        beforeEach(() => {
            fixture = TestBed.createComponent(ValueHostComponent);
            host = fixture.componentInstance;
        });

        it("selects the button holding it", async () => {
            host.value.set("center");
            await settle(fixture);

            expect(pressed(fixture).slice(0, 3)).toEqual(["false", "true", "false"]);
        });

        it("writes the clicked button's value in single", async () => {
            await settle(fixture);

            clickNth(fixture, 2);
            await settle(fixture);

            expect(host.value()).toBe("right");
        });

        it("moves with a new value", async () => {
            host.value.set("left");
            await settle(fixture);

            host.value.set("right");
            await settle(fixture);

            expect(pressed(fixture).slice(0, 3)).toEqual(["false", "false", "true"]);
        });

        it("writes null when the selected button is clicked again", async () => {
            host.value.set("left");
            await settle(fixture);

            clickNth(fixture, 0);
            await settle(fixture);

            expect(host.value()).toBeNull();
        });

        it("null clears the group, and undefined leaves it alone", async () => {
            host.value.set("left");
            await settle(fixture);
            host.value.set(null);
            await settle(fixture);
            expect(pressed(fixture).slice(0, 3)).toEqual(["false", "false", "false"]);

            clickNth(fixture, 3);
            await settle(fixture);
            host.value.set(undefined);
            await settle(fixture);
            expect(pressed(fixture)[3]).toBe("true");
        });

        it("holds an array in multiple", async () => {
            host.selection.set("multiple");
            host.value.set(["left", "right"]);
            await settle(fixture);
            expect(pressed(fixture).slice(0, 3)).toEqual(["true", "false", "true"]);

            clickNth(fixture, 1);
            await settle(fixture);
            expect(host.value()).toEqual(["left", "center", "right"]);

            clickNth(fixture, 0);
            await settle(fixture);
            expect(host.value()).toEqual(["center", "right"]);
        });

        it("reads a single value in multiple", async () => {
            host.selection.set("multiple");
            host.value.set("left");
            await settle(fixture);

            expect(pressed(fixture).slice(0, 3)).toEqual(["true", "false", "false"]);
        });

        it("keeps a value whose button hasn't loaded", async () => {
            host.selection.set("multiple");
            host.options.set(["left", "center"]);
            host.value.set(["right", "left"]);
            await settle(fixture);

            clickNth(fixture, 1);
            await settle(fixture);
            expect(host.value()).toEqual(["right", "left", "center"]);

            host.options.set(["left", "center", "right"]);
            await settle(fixture);
            expect(pressed(fixture).slice(0, 3)).toEqual(["true", "true", "true"]);
        });

        it("doesn't overwrite a value that arrives before its button", async () => {
            host.options.set([]);
            host.value.set("right");
            await settle(fixture);
            expect(host.value()).toBe("right");

            host.options.set(["left", "right"]);
            await settle(fixture);

            expect(pressed(fixture)[1]).toBe("true");
            expect(host.value()).toBe("right");
        });

        it("a button with no value, or one that isn't toggleable, takes no part", async () => {
            host.selection.set("multiple");
            host.value.set(["action"]);
            await settle(fixture);
            const action = fixture.debugElement
                .queryAll(By.directive(ButtonDirective))
                .map(button => button.injector.get(ButtonDirective))[4];
            expect(action.selected()).toBe(false);

            clickNth(fixture, 3);
            await settle(fixture);
            expect(host.value()).toEqual(["action"]);
        });

        it("keeps a value of 0, which isn't empty", async () => {
            @Component({
                template: `
                    <mona-button-group aria-label="Count" selection="single" [(value)]="value">
                        <button monaButton [value]="0">None</button>
                        <button monaButton [value]="1">One</button>
                    </mona-button-group>
                `,
                imports: [ButtonDirective, ButtonGroupComponent]
            })
            class NumberHostComponent {
                public readonly value = signal<number | readonly number[] | null | undefined>(1);
            }
            const other = TestBed.createComponent(NumberHostComponent);
            await settle(other);

            clickNth(other, 0);
            await settle(other);

            expect(other.componentInstance.value()).toBe(0);
            expect(pressed(other)).toEqual(["true", "false"]);
        });

        it("narrows the value going from multiple to single", async () => {
            host.selection.set("multiple");
            host.value.set(["left", "right"]);
            await settle(fixture);

            host.selection.set("single");
            await settle(fixture);

            expect(host.value()).toBe("left");
            expect(pressed(fixture).slice(0, 3)).toEqual(["true", "false", "false"]);
        });

        it("reports the value in buttonClick", async () => {
            await settle(fixture);

            clickNth(fixture, 1);

            expect(host.clicks[0].value).toBe("center");
        });

        it("touches on a change and on focus leaving, not on moving inside", async () => {
            host.value.set("left");
            await settle(fixture);
            const buttons: HTMLButtonElement[] = [
                ...fixture.nativeElement.querySelectorAll("mona-button-group button")
            ];

            clickNth(fixture, 1);
            expect(host.touches).toBe(1);

            buttons[1].dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: buttons[2] }));
            expect(host.touches).toBe(1);

            buttons[1].dispatchEvent(
                new FocusEvent("focusout", {
                    bubbles: true,
                    relatedTarget: fixture.nativeElement.querySelector("#after")
                })
            );
            expect(host.touches).toBe(2);
        });

        describe("read-only", () => {
            beforeEach(async () => {
                host.value.set("left");
                host.isReadonly.set(true);
                await settle(fixture);
            });

            it("doesn't change the value or the selection", async () => {
                clickNth(fixture, 1);
                await settle(fixture);

                expect(host.value()).toBe("left");
                expect(pressed(fixture).slice(0, 2)).toEqual(["true", "false"]);
                expect(host.touches).toBe(0);
            });

            it("keeps the buttons focusable, and says they can't be changed", () => {
                const buttons: HTMLButtonElement[] = [
                    ...fixture.nativeElement.querySelectorAll("mona-button-group button")
                ];

                expect(buttons[0].disabled).toBe(false);
                expect(buttons[0].getAttribute("aria-disabled")).toBe("true");
            });

            it("leaves action buttons working", () => {
                const buttons: HTMLButtonElement[] = [
                    ...fixture.nativeElement.querySelectorAll("mona-button-group button")
                ];
                clickNth(fixture, 4);

                expect(buttons[4].getAttribute("aria-disabled")).toBeNull();
                expect(host.clicks.map(click => click.button)).toEqual([buttons[4]]);
            });
        });

        it("doesn't change while disabled", async () => {
            host.value.set("left");
            host.isDisabled.set(true);
            await settle(fixture);

            clickNth(fixture, 1);
            await settle(fixture);

            expect(host.value()).toBe("left");
            expect(host.clicks).toEqual([]);
        });

        it("focus() goes to the selected button, or the first", async () => {
            await settle(fixture);
            const group = fixture.debugElement.children[0].componentInstance as ButtonGroupComponent;
            const buttons: HTMLButtonElement[] = [
                ...fixture.nativeElement.querySelectorAll("mona-button-group button")
            ];
            document.body.appendChild(fixture.nativeElement);

            group.focus();
            expect(document.activeElement).toBe(buttons[0]);

            host.value.set("right");
            await settle(fixture);
            group.focus();
            expect(document.activeElement).toBe(buttons[2]);

            fixture.nativeElement.remove();
        });

        it("has no axe violations", async () => {
            host.value.set("left");
            await settle(fixture);

            const result = await axe.run(fixture.nativeElement, {
                rules: { "color-contrast": { enabled: false }, region: { enabled: false } }
            });
            expect(result.violations.map(violation => violation.id)).toEqual([]);
        });
    });

    describe("signal forms", () => {
        let fixture: ComponentFixture<FormHostComponent>;
        let host: FormHostComponent;

        beforeEach(async () => {
            fixture = TestBed.createComponent(FormHostComponent);
            host = fixture.componentInstance;
            await settle(fixture);
        });

        it("shows the field's value, and writes back", async () => {
            expect(pressed(fixture)).toEqual(["true", "false"]);

            clickNth(fixture, 1);
            await settle(fixture);

            expect(host.form.align().value()).toBe("right");
            expect(host.form.align().touched()).toBe(true);
        });

        it("resets through null", async () => {
            host.form.align().value.set(null);
            await settle(fixture);

            expect(pressed(fixture)).toEqual(["false", "false"]);
        });

        it("resets through null even when allowEmpty is false", async () => {
            @Component({
                template: `
                    <mona-button-group
                        aria-label="Align"
                        selection="single"
                        [allowEmpty]="false"
                        [formField]="form.align">
                        <button monaButton value="left">Left</button>
                    </mona-button-group>
                `,
                imports: [ButtonDirective, ButtonGroupComponent, FormField]
            })
            class ResetHostComponent {
                readonly #model = signal<{ align: string | null }>({ align: "left" });
                public readonly form = form(this.#model);
            }
            const other = TestBed.createComponent(ResetHostComponent);
            await settle(other);

            other.componentInstance.form.align().value.set(null);
            await settle(other);

            expect(pressed(other)).toEqual(["false"]);
            expect(other.componentInstance.form.align().value()).toBeNull();
        });

        it("a read-only field stays", async () => {
            host.fieldReadonly.set(true);
            await settle(fixture);

            clickNth(fixture, 1);
            await settle(fixture);

            expect(host.form.align().value()).toBe("left");
        });

        it("a disabled field disables the buttons", async () => {
            host.fieldDisabled.set(true);
            await settle(fixture);

            const button = fixture.nativeElement.querySelector("mona-button-group button") as HTMLButtonElement;
            expect(button.disabled).toBe(true);
        });
    });

    describe("invalid", () => {
        @Component({
            template: `<mona-button-group aria-label="Align" [invalid]="true" [touched]="touched()" />`,
            imports: [ButtonGroupComponent]
        })
        class InvalidHostComponent {
            public readonly touched = signal(false);
        }

        it("shows only once touched", async () => {
            const fixture = TestBed.createComponent(InvalidHostComponent);
            await settle(fixture);
            const group = fixture.nativeElement.querySelector("mona-button-group") as HTMLElement;
            expect(group.hasAttribute("aria-invalid")).toBe(false);

            fixture.componentInstance.touched.set(true);
            await settle(fixture);

            expect(group.getAttribute("aria-invalid")).toBe("true");
            expect(group.getAttribute("data-invalid")).toBe("true");
        });
    });

    describe("names", () => {
        it("a mona-label names the group, and focus goes to its button", async () => {
            const fixture = TestBed.createComponent(LabelledHostComponent);
            document.body.appendChild(fixture.nativeElement);
            await settle(fixture);
            const group = fixture.nativeElement.querySelector("mona-button-group") as HTMLElement;

            expect(group.getAttribute("aria-labelledby")).toBeTruthy();
            expect(group.hasAttribute("aria-label")).toBe(false);

            fixture.nativeElement.remove();
        });

        it("an empty aria-label falls back to the default name", async () => {
            @Component({
                template: `<mona-button-group aria-label="" />`,
                imports: [ButtonGroupComponent]
            })
            class EmptyHostComponent {}
            const fixture = TestBed.createComponent(EmptyHostComponent);
            await settle(fixture);

            expect(fixture.nativeElement.querySelector("mona-button-group").getAttribute("aria-label")).toBe(
                "Button group"
            );
        });
    });

    describe("members follow a disabled group", () => {
        it.each([
            ["dropdown", "mona-dropdown-button"],
            ["split", "mona-split-button"]
        ])("closes the %s button's open menu", async (_name, selector) => {
            const fixture = TestBed.createComponent(MembersHostComponent);
            await settle(fixture);
            const member = fixture.debugElement.query(
                debugElement => debugElement.nativeElement.tagName?.toLowerCase() === selector
            ).componentInstance as { popupMenuRef: () => { closeMenu: () => void } | undefined };
            const close = vi.spyOn(member.popupMenuRef() as { closeMenu: () => void }, "closeMenu");

            fixture.componentInstance.groupDisabled.set(true);
            await settle(fixture);

            expect(close).toHaveBeenCalled();
        });
    });
});
