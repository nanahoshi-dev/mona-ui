import { Component, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import axe from "axe-core";
import { beforeEach, describe, expect, it } from "vitest";
import { StepperComponent } from "../components/stepper/stepper.component";
import { StepperLabelTemplateDirective } from "../directives/stepper-label-template.directive";
import { StepperStepTemplateDirective } from "../directives/stepper-step-template.directive";
import type { StepOptions } from "../models/Step";
import type { StepSelectEvent } from "../models/StepSelectEvent";
import { stepperStepButtonThemeVariants, stepperStepIndicatorThemeVariants } from "../styles/stepper.styles";

@Component({
    template: `
        <button type="button" id="next" (click)="step.set(step() + 1)">Next</button>
        <mona-stepper
            [linear]="linear()"
            [orientation]="orientation()"
            [steps]="steps()"
            [(step)]="step"
            (stepSelect)="onSelect($event)" />
    `,
    imports: [StepperComponent]
})
class HostComponent {
    public readonly events: StepSelectEvent[] = [];
    public readonly linear = signal(true);
    public readonly orientation = signal<"horizontal" | "vertical">("horizontal");
    public readonly step = signal(0);
    public readonly steps = signal<readonly StepOptions[]>([
        { label: "A" },
        { label: "B" },
        { label: "C" },
        { label: "D" }
    ]);
    public veto = false;

    public onSelect(event: StepSelectEvent): void {
        this.events.push(event);
        if (this.veto) {
            event.preventDefault();
        }
    }
}

@Component({
    template: `
        <mona-stepper [linear]="false" [steps]="steps" [(step)]="step">
            <ng-template monaStepperStepTemplate let-state="state" let-invalid="invalid">
                <span class="custom-step">{{ state }}:{{ invalid }}</span>
            </ng-template>
        </mona-stepper>
    `,
    imports: [StepperComponent, StepperStepTemplateDirective]
})
class StepTemplateHostComponent {
    public readonly step = signal(0);
    public readonly steps: readonly StepOptions[] = [{ label: "A", invalid: true }, { label: "B" }, { label: "C" }];
}

@Component({
    template: `
        <mona-stepper [linear]="false" [steps]="steps" [(step)]="step">
            <ng-template monaStepperLabelTemplate let-step>
                <span class="plain-label">{{ step.label }}</span>
                <input class="label-input" [attr.aria-label]="step.label + ' note'" />
            </ng-template>
        </mona-stepper>
    `,
    imports: [StepperComponent, StepperLabelTemplateDirective]
})
class LabelControlHostComponent {
    public readonly step = signal(0);
    public readonly steps: readonly StepOptions[] = [{ label: "A" }, { label: "B" }];
}

async function settle<T>(fixture: ComponentFixture<T>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

function stepButtons<T>(fixture: ComponentFixture<T>): HTMLButtonElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll("li button"));
}

function press(element: Element, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
    const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key, ...init });
    element.dispatchEvent(event);
    return event;
}

describe("mona-stepper behavior", () => {
    let fixture: ComponentFixture<HostComponent>;
    let host: HostComponent;

    async function setup(steps?: readonly StepOptions[], step?: number, linear?: boolean): Promise<void> {
        fixture = TestBed.createComponent(HostComponent);
        host = fixture.componentInstance;
        if (steps) {
            host.steps.set(steps);
        }
        if (step !== undefined) {
            host.step.set(step);
        }
        if (linear !== undefined) {
            host.linear.set(linear);
        }
        await settle(fixture);
    }

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HostComponent, LabelControlHostComponent, StepTemplateHostComponent]
        });
    });

    describe("focus", () => {
        it("doesn't take focus when it renders", async () => {
            const outside = document.createElement("button");
            document.body.appendChild(outside);
            outside.focus();
            await setup();
            expect(document.activeElement).toBe(outside);
            outside.remove();
        });

        it("leaves focus on the consumer's Next button when the step changes", async () => {
            await setup();
            const next = fixture.nativeElement.querySelector("#next") as HTMLButtonElement;
            next.focus();
            next.click();
            await settle(fixture);
            expect(host.step()).toBe(1);
            expect(document.activeElement).toBe(next);
        });

        it("moves focus with the arrows", async () => {
            await setup();
            const [first, second] = stepButtons(fixture);
            first.focus();
            press(first, "ArrowRight");
            expect(document.activeElement).toBe(second);
            await settle(fixture);
            expect(second.tabIndex).toBe(0);
            expect(first.tabIndex).toBe(-1);
        });

        it("moves real focus with a step template too", async () => {
            const custom = TestBed.createComponent(StepTemplateHostComponent);
            await settle(custom);
            const [first, second] = stepButtons(custom);
            first.focus();

            press(first, "ArrowRight");
            await settle(custom);

            expect(document.activeElement).toBe(second);
            expect(second.tabIndex).toBe(0);
        });

        it("gives a step template's button a focus style", () => {
            expect(stepperStepButtonThemeVariants().split(/\s+/)).toContain("focus-visible:outline-2");
        });

        it("makes the step the Tab stop when it gets focus by click", async () => {
            await setup(undefined, undefined, false);
            const buttons = stepButtons(fixture);
            buttons[2].focus();
            await settle(fixture);
            expect(buttons[2].tabIndex).toBe(0);
        });
    });

    describe("native buttons", () => {
        it("renders a real button for every step, with and without a template", async () => {
            await setup();
            expect(stepButtons(fixture).every(button => button.type === "button")).toBe(true);
            expect(stepButtons(fixture).length).toBe(4);

            const custom = TestBed.createComponent(StepTemplateHostComponent);
            await settle(custom);
            expect(stepButtons(custom).every(button => button.type === "button")).toBe(true);
            expect(custom.nativeElement.querySelector("[role='button']")).toBeNull();
        });

        it("leaves Enter and Space to the button's own click", async () => {
            await setup();
            const second = stepButtons(fixture)[1];
            expect(press(second, "Enter").defaultPrevented).toBe(false);
            expect(press(second, " ").defaultPrevented).toBe(false);
        });

        it("names the indicator from the label and hides the visible label", async () => {
            await setup();
            expect(stepButtons(fixture)[0].getAttribute("aria-label")).toBe("A");
        });
    });

    describe("list semantics and axe", () => {
        it("keeps the list items as list items", async () => {
            await setup();
            const items = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll("ol > li"));
            expect(items.length).toBe(4);
            expect(items.every(item => !item.hasAttribute("role"))).toBe(true);
        });

        it.each([
            ["the default stepper", undefined, 1],
            [
                "every state",
                [
                    { label: "A", completed: true },
                    { label: "B", invalid: true },
                    { label: "C", disabled: true },
                    { label: "D" }
                ],
                1
            ]
        ])("passes axe on %s", async (_name, steps, step) => {
            await setup(steps as readonly StepOptions[] | undefined, step);
            expect((await axe.run(fixture.nativeElement)).violations).toEqual([]);
        });

        it("passes axe with a step template", async () => {
            const custom = TestBed.createComponent(StepTemplateHostComponent);
            await settle(custom);
            expect((await axe.run(custom.nativeElement)).violations).toEqual([]);
        });
    });

    describe("descriptions", () => {
        function description(button: HTMLElement): string {
            const id = button.getAttribute("aria-describedby") ?? "";
            return document.getElementById(id)?.textContent?.replace(/\s+/g, " ").trim() ?? "";
        }

        it("says where the step is", async () => {
            await setup();
            expect(description(stepButtons(fixture)[1])).toBe("Step 2 of 4");
        });

        it("says when a step is completed or has errors", async () => {
            await setup([{ label: "A" }, { label: "B", invalid: true }, { label: "C" }], 2);
            const buttons = stepButtons(fixture);
            expect(description(buttons[0])).toBe("Step 1 of 3 Completed");
            expect(description(buttons[1])).toBe("Step 2 of 3 Completed Has errors");
            expect(description(buttons[2])).toBe("Step 3 of 3");
        });

        it("keeps the descriptions out of the page", async () => {
            await setup();
            const id = stepButtons(fixture)[0].getAttribute("aria-describedby") ?? "";
            expect(document.getElementById(id)?.closest("[hidden]")).not.toBeNull();
        });

        it("gives two steppers different ids", async () => {
            await setup();
            const other = TestBed.createComponent(HostComponent);
            await settle(other);
            expect(stepButtons(other)[0].getAttribute("aria-describedby")).not.toBe(
                stepButtons(fixture)[0].getAttribute("aria-describedby")
            );
        });
    });

    describe("linear stepping past a disabled step", () => {
        const withDisabled = [{ label: "A" }, { label: "B", disabled: true }, { label: "C" }];

        it("lets a click reach the step after it", async () => {
            await setup(withDisabled);
            stepButtons(fixture)[2].click();
            await settle(fixture);
            expect(host.step()).toBe(2);
        });

        it("doesn't lock the step after it", async () => {
            await setup(withDisabled);
            const buttons = stepButtons(fixture);
            expect(buttons[1].getAttribute("aria-disabled")).toBe("true");
            expect(buttons[2].hasAttribute("aria-disabled")).toBe(false);
        });

        it("lets the arrows and a click reach it, and come back", async () => {
            await setup(withDisabled);
            const buttons = stepButtons(fixture);
            buttons[0].focus();
            press(buttons[0], "ArrowRight");
            expect(document.activeElement).toBe(buttons[2]);

            buttons[2].click();
            await settle(fixture);
            expect(host.step()).toBe(2);

            press(buttons[2], "ArrowLeft");
            expect(document.activeElement).toBe(buttons[0]);
        });

        it("still locks steps further on", async () => {
            await setup([{ label: "A" }, { label: "B", disabled: true }, { label: "C" }, { label: "D" }]);
            const buttons = stepButtons(fixture);
            expect(buttons[3].getAttribute("aria-disabled")).toBe("true");
            buttons[3].click();
            await settle(fixture);
            expect(host.step()).toBe(0);
        });

        it("still skips the disabled step without the linear rule", async () => {
            await setup(withDisabled, 0, false);
            const buttons = stepButtons(fixture);
            press(buttons[0], "ArrowRight");
            expect(document.activeElement).toBe(buttons[2]);
        });
    });

    describe("Home and End", () => {
        it("stay on steps a linear stepper can reach", async () => {
            await setup(undefined, 1);
            const buttons = stepButtons(fixture);
            buttons[1].focus();

            press(buttons[1], "End");
            expect(document.activeElement).toBe(buttons[2]);

            press(buttons[2], "Home");
            expect(document.activeElement).toBe(buttons[0]);
        });

        it("don't land on a locked step", async () => {
            await setup(undefined, 2);
            const buttons = stepButtons(fixture);
            buttons[2].focus();
            press(buttons[2], "Home");
            expect(document.activeElement).toBe(buttons[1]);
            expect(buttons[1].hasAttribute("aria-disabled")).toBe(false);
        });

        it("go to the ends without the linear rule", async () => {
            await setup(undefined, 1, false);
            const buttons = stepButtons(fixture);
            press(buttons[1], "End");
            expect(document.activeElement).toBe(buttons[3]);
            press(buttons[3], "Home");
            expect(document.activeElement).toBe(buttons[0]);
        });

        it("prevent the page scrolling", async () => {
            await setup();
            expect(press(stepButtons(fixture)[0], "End").defaultPrevented).toBe(true);
        });
    });

    describe("stepSelect", () => {
        it("reports the step before it changes", async () => {
            await setup();
            stepButtons(fixture)[1].click();
            await settle(fixture);
            const [event] = host.events;
            expect(event.index).toBe(1);
            expect(event.previousIndex).toBe(0);
            expect(event.step.label).toBe("B");
            expect(event.type).toBe("stepSelect");
            expect(event.originalEvent?.type).toBe("click");
            expect(host.step()).toBe(1);
        });

        it("keeps the step when prevented, with no change to undo", async () => {
            await setup();
            host.veto = true;
            stepButtons(fixture)[1].click();
            await settle(fixture);
            expect(host.step()).toBe(0);
            expect(stepButtons(fixture)[0].getAttribute("aria-current")).toBe("step");
        });

        it("doesn't fire for the current step, a locked step or a disabled step", async () => {
            await setup([{ label: "A" }, { label: "B", disabled: true }, { label: "C" }, { label: "D" }]);
            const buttons = stepButtons(fixture);
            buttons[0].click();
            buttons[1].click();
            buttons[3].click();
            expect(host.events).toEqual([]);
        });

        it("doesn't fire when step is written from outside", async () => {
            await setup();
            host.step.set(2);
            await settle(fixture);
            expect(host.events).toEqual([]);
        });
    });

    describe("states", () => {
        function indicatorClasses(index: number): string[] {
            return stepButtons(fixture)[index].className.split(/\s+/);
        }

        it("separates current, completed, upcoming and disabled", async () => {
            await setup([{ label: "A" }, { label: "B" }, { label: "C" }, { label: "D", disabled: true }], 1);
            expect(indicatorClasses(0)).toContain("bg-primary");
            expect(indicatorClasses(0)).not.toContain("ring-2");
            expect(indicatorClasses(1)).toContain("ring-2");
            expect(indicatorClasses(2)).toContain("bg-surface-raised");
            expect(indicatorClasses(3)).toContain("border-dashed");
        });

        it("draws a check on a completed step, and the number otherwise", async () => {
            await setup(undefined, 1);
            const buttons = stepButtons(fixture);
            expect(buttons[0].querySelector("svg[lucideCheck]")).not.toBeNull();
            expect(buttons[0].textContent?.trim()).toBe("");
            expect(buttons[1].querySelector("svg")).toBeNull();
            expect(buttons[1].textContent?.trim()).toBe("2");
        });

        it("lets completed say otherwise in both directions", async () => {
            await setup([{ label: "A", completed: false }, { label: "B" }, { label: "C", completed: true }], 1);
            const buttons = stepButtons(fixture);
            expect(buttons[0].querySelector("svg[lucideCheck]")).toBeNull();
            expect(buttons[2].querySelector("svg[lucideCheck]")).not.toBeNull();
        });

        it("marks the current step with more than color, in its label too", async () => {
            await setup(undefined, 1);
            const labels = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll("li > span"));
            expect(labels[1].classList.contains("font-semibold")).toBe(true);
            expect(labels[0].classList.contains("font-semibold")).toBe(false);
        });

        it("draws an alert on a step with errors, whatever its state", async () => {
            await setup(
                [
                    { label: "A", invalid: true },
                    { label: "B", invalid: true },
                    { label: "C", invalid: true }
                ],
                1
            );
            const buttons = stepButtons(fixture);
            for (const button of buttons) {
                expect(button.querySelector("svg[lucideCircleAlert]")).not.toBeNull();
                expect(button.classList.contains("border-error")).toBe(true);
            }
            expect(buttons[0].querySelector("svg[lucideCheck]")).toBeNull();
        });

        it("gives templates the state and invalid", async () => {
            const custom = TestBed.createComponent(StepTemplateHostComponent);
            custom.componentInstance.step.set(1);
            await settle(custom);
            const texts = Array.from<HTMLElement>(custom.nativeElement.querySelectorAll(".custom-step")).map(
                element => element.textContent
            );
            expect(texts).toEqual(["completed:true", "current:false", "upcoming:false"]);
        });

        it("shows a disabled step as the current one if the step is written there", async () => {
            await setup([{ label: "A" }, { label: "B", disabled: true }], 1);
            expect(stepButtons(fixture)[1].getAttribute("aria-current")).toBe("step");
            expect(indicatorClasses(1)).toContain("ring-2");
        });

        it("uses a solid focus outline and no ring tied to focus", () => {
            const classes = stepperStepIndicatorThemeVariants({
                invalid: false,
                rounded: "full",
                state: "upcoming"
            }).split(/\s+/);
            expect(classes).toContain("focus-visible:outline-2");
            expect(classes).toContain("focus-visible:outline-focus-indicator");
            expect(classes).not.toContain("outline-none");
            expect(classes.some(name => name.includes("ring-focus-indicator"))).toBe(false);
            expect(classes).toContain("duration-(--mona-motion-standard)");
        });
    });

    describe("an out-of-range step", () => {
        function bar(): HTMLElement {
            return fixture.nativeElement.querySelector("[role='progressbar']");
        }

        it.each([
            [99, 3],
            [-5, 0],
            [1.7, 1],
            [Number.NaN, 0]
        ])("normalizes %s to %s, in the model and the progress bar", async (written, expected) => {
            await setup();
            host.step.set(written);
            await settle(fixture);
            expect(host.step()).toBe(expected);
            expect(bar().getAttribute("aria-valuenow")).toBe(String(expected));
        });

        it("says the step in words on the progress bar", async () => {
            await setup(undefined, 1);
            expect(bar().getAttribute("aria-valuetext")).toBe("Step 2 of 4");
        });

        it("has no text with no steps, and keeps the value for steps that arrive later", async () => {
            await setup([], 2);
            expect(bar().hasAttribute("aria-valuetext")).toBe(false);
            expect(host.step()).toBe(2);

            host.steps.set([{ label: "A" }, { label: "B" }, { label: "C" }]);
            await settle(fixture);
            expect(host.step()).toBe(2);
            expect(bar().getAttribute("aria-valuenow")).toBe("2");
        });

        it("normalizes when the steps shrink", async () => {
            await setup(undefined, 3);
            host.steps.set([{ label: "A" }, { label: "B" }]);
            await settle(fixture);
            expect(host.step()).toBe(1);
        });
    });

    describe("controls in templates", () => {
        it("keeps a projected control's keys and clicks", async () => {
            const custom = TestBed.createComponent(LabelControlHostComponent);
            await settle(custom);
            const inputs = custom.nativeElement.querySelectorAll(".label-input");
            const input = inputs[1] as HTMLInputElement;

            expect(press(input, "ArrowRight").defaultPrevented).toBe(false);
            expect(press(input, "Home").defaultPrevented).toBe(false);
            input.click();
            await settle(custom);
            expect(custom.componentInstance.step()).toBe(0);
        });

        it("still changes the step when the label's text is clicked", async () => {
            const custom = TestBed.createComponent(LabelControlHostComponent);
            await settle(custom);
            (custom.nativeElement.querySelectorAll(".plain-label")[1] as HTMLElement).click();
            await settle(custom);
            expect(custom.componentInstance.step()).toBe(1);
        });
    });

    describe("modified keys", () => {
        it.each([{ altKey: true }, { ctrlKey: true }, { metaKey: true }, { shiftKey: true }])(
            "leaves the arrow to the browser: %o",
            async modifier => {
                await setup();
                const first = stepButtons(fixture)[0];
                first.focus();
                expect(press(first, "ArrowRight", modifier).defaultPrevented).toBe(false);
                expect(document.activeElement).toBe(first);
            }
        );
    });

    describe("orientation and direction", () => {
        it("uses up and down when vertical", async () => {
            await setup();
            host.orientation.set("vertical");
            await settle(fixture);
            const buttons = stepButtons(fixture);
            press(buttons[0], "ArrowDown");
            expect(document.activeElement).toBe(buttons[1]);
            expect(press(buttons[0], "ArrowRight").defaultPrevented).toBe(false);
        });
    });
});
