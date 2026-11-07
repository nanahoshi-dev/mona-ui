import { Component, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { CheckBoxComponent } from "@nanahoshi/mona-ui/check-box";
import { FieldsetComponent } from "@nanahoshi/mona-ui/fieldset";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { OtpInputComponent } from "@nanahoshi/mona-ui/otp-input";
import { RadioButtonComponent, RadioGroupComponent } from "@nanahoshi/mona-ui/radio-button";
import { RatingComponent } from "@nanahoshi/mona-ui/rating";
import { SegmentedComponent, SegmentedItemTemplateDirective } from "@nanahoshi/mona-ui/segmented";
import { RangeSliderComponent, SliderComponent } from "@nanahoshi/mona-ui/slider";
import { SwitchComponent } from "@nanahoshi/mona-ui/switch";
import { TextBoxComponent } from "@nanahoshi/mona-ui/text-box";
import axe from "axe-core";
import { vi } from "vitest";
import { LabelComponent } from "../components/label/label.component";
import { LabelDirective } from "../directives/label.directive";

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

function nameFrom(element: Element): string {
    const ids = element.getAttribute("aria-labelledby")?.split(" ") ?? [];
    return ids.map(id => element.ownerDocument.getElementById(id)?.textContent?.trim()).join(" ");
}

const OPTIONS = [
    { label: "One", value: "a" },
    { label: "Two", value: "b" }
];

@Component({
    template: `
        <mona-label text="Wi-Fi"><mona-switch [(checked)]="on" /></mona-label>
        <mona-label text="Volume"><mona-slider /></mona-label>
        <mona-label text="Price"><mona-range-slider /></mona-label>
        <mona-label text="Stars"><mona-rating /></mona-label>
        <mona-label text="Size"><mona-segmented [options]="options" [(value)]="size" /></mona-label>
        <mona-label text="Season">
            <mona-radio-group [(value)]="season">
                <mona-radio-button label="Autumn" radioValue="autumn" />
                <mona-radio-button label="Winter" radioValue="winter" />
            </mona-radio-group>
        </mona-label>
        <mona-label text="PIN"><mona-otp-input /></mona-label>
    `,
    imports: [
        LabelComponent,
        OtpInputComponent,
        RadioButtonComponent,
        RadioGroupComponent,
        RangeSliderComponent,
        RatingComponent,
        SegmentedComponent,
        SliderComponent,
        SwitchComponent
    ]
})
class WrappedHostComponent {
    public readonly on = signal(false);
    public readonly options = OPTIONS;
    public readonly season = signal<unknown>("winter");
    public readonly size = signal<string | null>("b");
}

@Component({
    template: `
        <mona-label text="Wi-Fi" [for]="useTarget() ? switchRef : null" />
        <mona-switch #switchRef [(checked)]="on" />
        <mona-label text="Terms" [for]="checkRef" />
        <mona-check-box #checkRef [(checked)]="agreed" />
        <mona-label text="Autumn" [for]="radioRef" />
        <mona-radio-button #radioRef name="only" radioValue="autumn" [(value)]="radioValue" />
        <mona-label text="Volume" [for]="sliderRef" />
        <mona-slider #sliderRef />
        <mona-label text="Price" [for]="rangeRef" />
        <mona-range-slider #rangeRef />
        <mona-label text="Stars" [for]="ratingRef" />
        <mona-rating #ratingRef />
        <mona-label text="Size" [for]="segmentedRef" />
        <mona-segmented #segmentedRef [options]="options" />
        <mona-label text="Season" [for]="groupRef" />
        <mona-radio-group #groupRef>
            <mona-radio-button label="Winter" radioValue="winter" />
        </mona-radio-group>
        <mona-label text="PIN" [for]="otpRef" />
        <mona-otp-input #otpRef />
        <mona-label text="City" [for]="textRef" />
        <mona-text-box #textRef />
        <label id="native-caption" monaLabel [for]="directiveRef">Directive</label>
        <mona-slider #directiveRef />
    `,
    imports: [
        CheckBoxComponent,
        LabelComponent,
        LabelDirective,
        OtpInputComponent,
        RadioButtonComponent,
        RadioGroupComponent,
        RangeSliderComponent,
        RatingComponent,
        SegmentedComponent,
        SliderComponent,
        SwitchComponent,
        TextBoxComponent
    ]
})
class ForHostComponent {
    public readonly agreed = signal(false);
    public readonly on = signal(false);
    public readonly options = OPTIONS;
    public readonly radioValue = signal<unknown>(undefined);
    public readonly useTarget = signal(true);
}

@Component({
    template: `
        <mona-switch aria-label="Own" />
        <mona-slider aria-label="Own" />
        <mona-otp-input aria-label="Own" />
        <mona-otp-input aria-labelledby="elsewhere" aria-describedby="hint" inputId="pin" />
        <label for="pin">Own label</label>
        <mona-otp-input />
        <mona-otp-input [inputAttributes]="{ id: 'custom-id' }" />
        <mona-slider />
        <mona-label text="Own wins"><mona-slider aria-label="Own" /></mona-label>
        <mona-label text="Own text wins"><mona-check-box label="Agree" /></mona-label>
        <mona-label text="Own text wins too"><mona-radio-button label="Autumn" radioValue="autumn" /></mona-label>
        <mona-label [for]="projectedRef">Projected caption</mona-label>
        <mona-slider #projectedRef />
        <mona-label text="Explicit wins"><mona-switch aria-labelledby="elsewhere" /></mona-label>
        <span id="elsewhere">Elsewhere</span>
        <mona-otp-input inputId="only-native" />
        <label for="only-native">Only native</label>
    `,
    imports: [
        CheckBoxComponent,
        LabelComponent,
        OtpInputComponent,
        RadioButtonComponent,
        SliderComponent,
        SwitchComponent
    ]
})
class OwnNameHostComponent {}

@Component({
    template: `
        <mona-switch aria-label="Lights" offLabel="Off" onLabel="On" />
        <mona-range-slider aria-label="Budget" />
        <mona-range-slider aria-label-end="Most" aria-label-start="Least" />
        <mona-segmented aria-label="Icons" [options]="options">
            <ng-template monaSegmentedItemTemplate>
                <svg aria-hidden="true"></svg>
            </ng-template>
        </mona-segmented>
        <mona-segmented aria-label="Text" [options]="options" />
        <mona-fieldset aria-label="No legend" />
        <mona-fieldset aria-labelledby="elsewhere" />
        <span id="elsewhere">Elsewhere</span>
    `,
    imports: [
        FieldsetComponent,
        RangeSliderComponent,
        SegmentedComponent,
        SegmentedItemTemplateDirective,
        SwitchComponent
    ]
})
class NamingHostComponent {
    public readonly options = OPTIONS;
}

@Component({
    template: `
        <mona-label for="by-host" text="Wrong" />
        <mona-switch id="by-host" aria-label="Own" />
    `,
    imports: [LabelComponent, SwitchComponent]
})
class WrongForHostComponent {}

@Component({
    template: `
        <mona-label for="city" text="City" />
        <mona-text-box inputId="city" />
    `,
    imports: [LabelComponent, TextBoxComponent]
})
class RightForHostComponent {}

@Component({
    template: `<mona-label>Volume <mona-slider /></mona-label>`,
    imports: [LabelComponent, SliderComponent]
})
class ProjectedCaptionHostComponent {}

@Component({
    template: `<mona-segmented [options]="options" />`,
    imports: [SegmentedComponent]
})
class UnnamedSegmentedHostComponent {
    public readonly options = OPTIONS;
}

@Component({
    template: `
        <mona-label optional text="Nickname" />
        <mona-label optional optionalText="Not needed" text="Alias" />
    `,
    imports: [LabelComponent]
})
class OptionalHostComponent {}

describe("the label contract", () => {
    describe("a control wrapped in mona-label", () => {
        let fixture: ComponentFixture<WrappedHostComponent>;
        let root: HTMLElement;

        beforeEach(async () => {
            fixture = TestBed.createComponent(WrappedHostComponent);
            root = fixture.nativeElement;
            document.body.appendChild(root);
            await settle(fixture);
        });

        afterEach(() => {
            root.remove();
        });

        it.each([
            ["mona-switch", "Wi-Fi"],
            ["mona-slider [role=slider]", "Volume"],
            ["mona-range-slider", "Price"],
            ["mona-rating [role=slider]", "Stars"],
            ["mona-segmented", "Size"],
            ["mona-radio-group", "Season"],
            ["mona-otp-input input", "PIN"]
        ])("%s is named by the caption", (selector, caption) => {
            expect(nameFrom(root.querySelector(selector)!)).toBe(caption);
        });

        it("has no accessibility violations", async () => {
            expect(await axeViolations(root)).toEqual([]);
        });

        it("drops the generic names", () => {
            expect(root.querySelector("mona-slider [role=slider]")!.getAttribute("aria-label")).toBeNull();
            expect(root.querySelector("mona-otp-input input")!.getAttribute("aria-label")).toBeNull();
        });

        function caption(host: string): HTMLElement {
            return root.querySelector<HTMLElement>(`mona-label:has(${host}) label > span`)!;
        }

        it("toggles the switch when the caption is clicked, once", async () => {
            caption("mona-switch").click();
            await settle(fixture);
            expect(fixture.componentInstance.on()).toBe(true);
            expect(document.activeElement).toBe(root.querySelector("mona-switch"));
        });

        it("toggles the switch once when the switch itself is clicked", async () => {
            root.querySelector<HTMLElement>("mona-switch")!.click();
            await settle(fixture);
            expect(fixture.componentInstance.on()).toBe(true);
        });

        it("focuses the slider when the caption is clicked", () => {
            caption("mona-slider").click();
            expect(document.activeElement).toBe(root.querySelector("mona-slider [role=slider]"));
        });

        it("focuses the rating when the caption is clicked", () => {
            caption("mona-rating").click();
            expect(document.activeElement).toBe(root.querySelector("mona-rating [role=slider]"));
        });

        it("focuses the selected radio instead of choosing the first when the caption is clicked", async () => {
            caption("mona-radio-group").click();
            await settle(fixture);
            expect(fixture.componentInstance.season()).toBe("winter");
            expect(document.activeElement).toBe(root.querySelectorAll("mona-radio-group input")[1]);
        });

        it("focuses the selected option instead of choosing the first when the caption is clicked", async () => {
            caption("mona-segmented").click();
            await settle(fixture);
            expect(fixture.componentInstance.size()).toBe("b");
            expect(document.activeElement).toBe(root.querySelectorAll("mona-segmented input")[1]);
        });

        it("doesn't interfere with choosing an option inside the group", async () => {
            root.querySelector<HTMLInputElement>("mona-radio-group input")!.click();
            await settle(fixture);
            expect(fixture.componentInstance.season()).toBe("autumn");
        });
    });

    describe("a control a label points at through [for]", () => {
        let fixture: ComponentFixture<ForHostComponent>;
        let root: HTMLElement;

        beforeEach(async () => {
            fixture = TestBed.createComponent(ForHostComponent);
            root = fixture.nativeElement;
            document.body.appendChild(root);
            await settle(fixture);
        });

        afterEach(() => {
            root.remove();
        });

        it.each([
            ["mona-switch", "Wi-Fi"],
            ["mona-check-box input", "Terms"],
            ["mona-radio-button[name=only] input", "Autumn"],
            ["mona-slider [role=slider]", "Volume"],
            ["mona-range-slider", "Price"],
            ["mona-rating [role=slider]", "Stars"],
            ["mona-segmented", "Size"],
            ["mona-radio-group", "Season"],
            ["mona-otp-input input", "PIN"],
            ["mona-text-box input", "City"]
        ])("%s is named by the label", (selector, caption) => {
            expect(nameFrom(root.querySelector(selector)!)).toBe(caption);
        });

        it("has no accessibility violations", async () => {
            expect(await axeViolations(root)).toEqual([]);
        });

        it("names the control from label[monaLabel], keeping the label's own id", () => {
            const slider = root.querySelectorAll("mona-slider [role=slider]")[1];
            expect(slider.getAttribute("aria-labelledby")).toBe("native-caption");
        });

        it("stops naming the control when [for] moves away", async () => {
            fixture.componentInstance.useTarget.set(false);
            await settle(fixture);
            expect(root.querySelector("mona-switch")!.getAttribute("aria-labelledby")).toBeNull();
        });

        it("reads each range slider handle as the label and then the handle", () => {
            const handles = root.querySelectorAll("mona-range-slider [role=slider]");
            expect(nameFrom(handles[0])).toBe("Price ");
            expect(handles[0].getAttribute("aria-labelledby")).toContain(handles[0].id);
            expect(handles[1].getAttribute("aria-labelledby")).toContain(handles[1].id);
            expect(handles[0].getAttribute("aria-label")).toBe("Minimum value");
        });

        function label(text: string): HTMLElement {
            return Array.from(root.querySelectorAll<HTMLElement>("mona-label label")).find(
                element => element.textContent?.trim() === text
            )!;
        }

        it("toggles the switch on a click, as a native label would", async () => {
            label("Wi-Fi").click();
            await settle(fixture);
            expect(fixture.componentInstance.on()).toBe(true);
        });

        it("toggles the check box on a click", async () => {
            label("Terms").click();
            await settle(fixture);
            expect(fixture.componentInstance.agreed()).toBe(true);
        });

        it("selects the radio on a click", async () => {
            label("Autumn").click();
            await settle(fixture);
            expect(fixture.componentInstance.radioValue()).toBe("autumn");
        });

        it("focuses the slider without changing it", () => {
            label("Volume").click();
            expect(document.activeElement).toBe(root.querySelector("mona-slider [role=slider]"));
        });
    });

    describe("the control's own name", () => {
        let root: HTMLElement;

        beforeEach(async () => {
            const fixture = TestBed.createComponent(OwnNameHostComponent);
            root = fixture.nativeElement;
            document.body.appendChild(root);
            await settle(fixture);
        });

        afterEach(() => {
            root.remove();
        });

        it("reaches the OTP input through aria-label", () => {
            const otp = root.querySelector("mona-otp-input")!;
            expect(otp.querySelector("input")!.getAttribute("aria-label")).toBe("Own");
            expect(otp.getAttribute("aria-label")).toBeNull();
        });

        it("gives the OTP input aria-labelledby, aria-describedby and an id", () => {
            const input = root.querySelectorAll("mona-otp-input input")[1];
            expect(input.getAttribute("aria-labelledby")).toBe("elsewhere");
            expect(input.getAttribute("aria-describedby")).toBe("hint");
            expect(input.id).toBe("pin");
        });

        it("lets a native label for the OTP input replace the generic name", () => {
            const input = root.querySelector<HTMLInputElement>("#only-native")!;
            expect(input.labels?.length).toBe(1);
            expect(input.getAttribute("aria-label")).toBeNull();
        });

        it("keeps the generic names when nothing labels the control", () => {
            const inputs = root.querySelectorAll("mona-otp-input input");
            expect(inputs[2].getAttribute("aria-label")).toBe("Verification code");
            expect(inputs[2].id).not.toBe("");
            const sliders = root.querySelectorAll("mona-slider [role=slider]");
            expect(sliders[1].getAttribute("aria-label")).toBe("Slider value");
        });

        it("still honors an id in inputAttributes", () => {
            expect(root.querySelector("#custom-id")).not.toBeNull();
        });

        it("wins over a wrapping label when set with aria-label", () => {
            const slider = root.querySelector("mona-label mona-slider [role=slider]")!;
            expect(slider.getAttribute("aria-label")).toBe("Own");
            expect(slider.getAttribute("aria-labelledby")).toBeNull();
        });

        it("keeps the text of a check box or radio that renders its own label", () => {
            expect(root.querySelector("mona-label mona-check-box input")!.getAttribute("aria-labelledby")).toBeNull();
            expect(
                root.querySelector("mona-label mona-radio-button input")!.getAttribute("aria-labelledby")
            ).toBeNull();
        });

        it("names a [for] target from the whole label when there is no text input", () => {
            const sliders = root.querySelectorAll("mona-slider [role=slider]");
            expect(nameFrom(sliders[sliders.length - 1])).toBe("Projected caption");
        });

        it("wins over a wrapping label when set with aria-labelledby", () => {
            expect(root.querySelector("mona-label mona-switch")!.getAttribute("aria-labelledby")).toBe("elsewhere");
        });
    });

    describe("naming without a label", () => {
        let root: HTMLElement;

        beforeEach(async () => {
            const fixture = TestBed.createComponent(NamingHostComponent);
            root = fixture.nativeElement;
            await settle(fixture);
        });

        it("keeps the switch's on and off text out of its name", () => {
            const hidden = root.querySelectorAll("mona-switch > [aria-hidden='true']");
            expect(hidden.length).toBe(2);
            expect(hidden[1].textContent).toContain("Off");
        });

        it("makes a range slider a group named by aria-label", () => {
            const range = root.querySelector("mona-range-slider")!;
            expect(range.getAttribute("role")).toBe("group");
            expect(range.getAttribute("aria-label")).toBe("Budget");
            expect(range.querySelector("[role=slider]")!.getAttribute("aria-labelledby")).toBeNull();
        });

        it("keeps the custom handle names", () => {
            const handles = root.querySelectorAll("mona-range-slider")[1].querySelectorAll("[role=slider]");
            expect(handles[0].getAttribute("aria-label")).toBe("Least");
            expect(handles[1].getAttribute("aria-label")).toBe("Most");
        });

        it("names icon-only segmented options from their label", async () => {
            const inputs = root.querySelectorAll("mona-segmented input");
            expect(inputs[0].getAttribute("aria-label")).toBe("One");
            expect(inputs[1].getAttribute("aria-label")).toBe("Two");
            expect(await axeViolations(root.querySelector("mona-segmented")!)).toEqual([]);
        });

        it("leaves the visible text as the name of a plain segmented option", () => {
            expect(
                root.querySelectorAll("mona-segmented")[1].querySelector("input")!.getAttribute("aria-label")
            ).toBeNull();
        });

        it("names a fieldset without a legend", () => {
            const fieldsets = root.querySelectorAll("mona-fieldset");
            expect(fieldsets[0].querySelector("fieldset")!.getAttribute("aria-label")).toBe("No legend");
            expect(fieldsets[0].getAttribute("aria-label")).toBeNull();
            expect(fieldsets[1].querySelector("fieldset")!.getAttribute("aria-labelledby")).toBe("elsewhere");
            expect(fieldsets[1].getAttribute("aria-labelledby")).toBeNull();
        });
    });

    describe("development warnings", () => {
        let warn: ReturnType<typeof vi.spyOn>;

        beforeEach(() => {
            warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
        });

        afterEach(() => {
            vi.restoreAllMocks();
        });

        async function render<T>(component: new () => T): Promise<HTMLElement> {
            const fixture = TestBed.createComponent(component as never) as ComponentFixture<T>;
            const root: HTMLElement = fixture.nativeElement;
            document.body.appendChild(root);
            await settle(fixture);
            return root;
        }

        it("warns when a string for points at a control's host", async () => {
            const root = await render(WrongForHostComponent);
            expect(warn).toHaveBeenCalledWith(expect.stringContaining('for="by-host"'), expect.anything());
            root.remove();
        });

        it("stays quiet when a string for reaches a native input", async () => {
            const root = await render(RightForHostComponent);
            expect(warn).not.toHaveBeenCalled();
            root.remove();
        });

        it("warns when a wrapped control has only projected text to go by", async () => {
            const root = await render(ProjectedCaptionHostComponent);
            expect(warn).toHaveBeenCalledWith(expect.stringContaining("[Mona Label]"), expect.anything());
            root.remove();
        });

        it("warns about a segmented control without a name", async () => {
            const root = await render(UnnamedSegmentedHostComponent);
            expect(warn).toHaveBeenCalledWith(expect.stringContaining("[Mona Segmented]"), expect.anything());
            root.remove();
        });

        it("stays quiet about a wrapped segmented control", async () => {
            const root = await render(WrappedHostComponent);
            expect(warn).not.toHaveBeenCalled();
            root.remove();
        });
    });

    describe("the optional text", () => {
        let fixture: ComponentFixture<OptionalHostComponent>;
        let root: HTMLElement;

        beforeEach(async () => {
            fixture = TestBed.createComponent(OptionalHostComponent);
            root = fixture.nativeElement;
            await settle(fixture);
        });

        it("defaults to the English message", () => {
            expect(root.querySelector("mona-label")!.textContent).toContain("Optional");
        });

        it("follows the active locale", async () => {
            TestBed.inject(MonaI18nService).use({
                direction: "ltr",
                id: "fr-FR",
                messages: { label: { optional: "Facultatif" } }
            });
            await settle(fixture);
            expect(root.querySelector("mona-label")!.textContent).toContain("Facultatif");
        });

        it("gives way to optionalText", () => {
            expect(root.querySelectorAll("mona-label")[1].textContent).toContain("Not needed");
        });
    });
});
