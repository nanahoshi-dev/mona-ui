import { Component, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { CircularProgressBarComponent } from "@nanahoshi/mona-ui/circular-progress-bar";
import { CircularProgressBarLabelTemplateDirective } from "@nanahoshi/mona-ui/circular-progress-bar";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProgressBarComponent } from "../components/progress-bar/progress-bar.component";
import { ProgressBarLabelTemplateDirective } from "../directives/progress-bar-label-template.directive";

@Component({
    imports: [CircularProgressBarComponent, ProgressBarComponent],
    template: `
        <span id="progress-name">Upload</span>
        <mona-progress-bar aria-labelledby="progress-name" [value]="10" />
        <mona-circular-progress-bar aria-labelledby="progress-name" [value]="10" />
    `
})
class LabelledByHostComponent {}

@Component({
    imports: [
        CircularProgressBarComponent,
        CircularProgressBarLabelTemplateDirective,
        ProgressBarComponent,
        ProgressBarLabelTemplateDirective
    ],
    template: `
        <mona-progress-bar [value]="value()">
            <ng-template monaProgressBarLabelTemplate let-value let-percent="percent">
                <span class="custom">{{ value.toFixed(1) }}/{{ percent.toFixed(0) }}</span>
            </ng-template>
        </mona-progress-bar>
        <mona-circular-progress-bar [value]="value()">
            <ng-template monaCircularProgressBarLabelTemplate let-value let-percent="percent">
                <span class="custom">{{ value.toFixed(1) }}/{{ percent.toFixed(0) }}</span>
            </ng-template>
        </mona-circular-progress-bar>
    `
})
class TemplateHostComponent {
    public readonly value = signal(150);
}

describe.each([
    ["mona-progress-bar", ProgressBarComponent],
    ["mona-circular-progress-bar", CircularProgressBarComponent]
] as const)("%s behavior", (selector, type) => {
    let fixture: ComponentFixture<ProgressBarComponent | CircularProgressBarComponent>;
    let host: HTMLElement;

    const set = (inputs: Record<string, unknown>): void => {
        for (const [name, value] of Object.entries(inputs)) {
            fixture.componentRef.setInput(name, value);
        }
        fixture.detectChanges();
    };
    const label = (): string => {
        // The bar draws its label on both of its layers, so each one reads the same.
        const element = host.querySelector("span") ?? host.querySelector("div[class*='label']");
        return (element?.textContent ?? "").trim();
    };

    beforeEach(() => {
        vi.spyOn(console, "warn").mockImplementation(() => undefined);
        fixture = TestBed.createComponent<ProgressBarComponent | CircularProgressBarComponent>(type);
        host = fixture.nativeElement;
        fixture.detectChanges();
    });

    afterEach(() => {
        fixture.destroy();
        vi.restoreAllMocks();
    });

    describe("name", () => {
        it("falls back to a localized name", () => {
            expect(host.getAttribute("aria-label")).toBe("Progress");
            TestBed.inject(MonaI18nService).use({
                direction: "ltr",
                id: "de-DE",
                messages: { progressBar: { label: "Fortschritt" } }
            });
            fixture.detectChanges();
            expect(host.getAttribute("aria-label")).toBe("Fortschritt");
        });

        it("prefers the consumer's", () => {
            set({ "aria-label": "Upload" });
            expect(host.getAttribute("aria-label")).toBe("Upload");
        });
    });

    describe("values", () => {
        it.each([
            [150, 0, 100, 100],
            [-5, 0, 100, 0],
            [Number.NaN, 0, 100, 0],
            [Number.POSITIVE_INFINITY, 0, 100, 0],
            [40, 0, 100, 40],
            [5, 10, 20, 10]
        ])("reports value %d in [%d, %d] as %d", (value, min, max, now) => {
            set({ max, min, value });
            expect(host.getAttribute("aria-valuenow")).toBe(String(now));
            expect(host.getAttribute("aria-valuemin")).toBe(String(min));
            expect(host.getAttribute("aria-valuemax")).toBe(String(max));
        });

        it("reports nothing for an inverted range, and warns", () => {
            set({ max: 0, min: 10, value: 5 });
            expect(host.hasAttribute("aria-valuenow")).toBe(false);
            expect(host.hasAttribute("aria-valuemin")).toBe(false);
            expect(host.hasAttribute("aria-valuemax")).toBe(false);
            expect(console.warn).toHaveBeenCalledWith(expect.stringContaining(`${selector}: [10, 0]`));
        });

        it("doesn't warn about a valid range", () => {
            set({ max: 10, min: 0, value: 50 });
            expect(console.warn).not.toHaveBeenCalled();
        });

        it("doesn't warn about a range it isn't using", () => {
            set({ indeterminate: true, max: 0, min: 10 });
            expect(console.warn).not.toHaveBeenCalled();
        });

        it("reports nothing while indeterminate, and doesn't mark itself busy", () => {
            set({ indeterminate: true, value: 40 });
            expect(host.hasAttribute("aria-valuenow")).toBe(false);
            expect(host.hasAttribute("aria-valuemin")).toBe(false);
            expect(host.hasAttribute("aria-valuemax")).toBe(false);
            expect(host.hasAttribute("aria-busy")).toBe(false);
        });

        it("passes value text through", () => {
            set({ "aria-valuetext": "Almost", value: 40 });
            expect(host.getAttribute("aria-valuetext")).toBe("Almost");
        });
    });

    describe("label", () => {
        it("has a percent sign", () => {
            set({ value: 40 });
            expect(label()).toBe("40%");
        });

        it("is a percentage of a custom range", () => {
            set({ max: 3, value: 1 });
            expect(label()).toBe("33.33%");
        });

        it.each([
            ["de-DE", /^33,33\s%$/],
            ["tr-TR", /^%33,33$/],
            ["ar-EG", /٣٣٫٣٣/]
        ])("follows the locale in %s", (id, expected) => {
            TestBed.inject(MonaI18nService).use({ direction: "ltr", id, messages: {} });
            set({ max: 3, value: 1 });
            expect(label()).toMatch(expected);
        });

        it("doesn't group digits", () => {
            set({ max: 1, min: 0, value: 1 });
            expect(label()).toBe("100%");
        });
    });

    describe("templates", () => {
        it("gets its raw value and percent, typed", () => {
            const templated = TestBed.createComponent(TemplateHostComponent);
            templated.detectChanges();
            const custom = templated.nativeElement.querySelector(`${selector} .custom`) as HTMLElement;
            expect(custom.textContent).toBe("150.0/100");
            templated.destroy();
        });
    });

    describe("motion", () => {
        it("stops its endless animation under reduced motion", () => {
            const css = Array.from(document.querySelectorAll("style"), style => style.textContent).join("\n");
            expect(css).toMatch(
                /prefers-reduced-motion:\s*reduce\)\s*\{\s*\.indeterminate[^{]*\{\s*animation:\s*\S*(none|fade)/
            );
        });
    });

    describe("axe", () => {
        const rules = { rules: { "color-contrast": { enabled: false } } };

        it("passes with no input at all", async () => {
            expect((await axe.run(host, rules)).violations).toEqual([]);
        });

        it("passes while indeterminate", async () => {
            set({ indeterminate: true });
            expect((await axe.run(host, rules)).violations).toEqual([]);
        });

        it.each([Number.NaN, Number.POSITIVE_INFINITY, 150, -5])("passes with a value of %d", async value => {
            set({ value });
            expect((await axe.run(host, rules)).violations).toEqual([]);
        });

        it("passes with a range the wrong way round", async () => {
            set({ max: 0, min: 10 });
            expect((await axe.run(host, rules)).violations).toEqual([]);
        });

        it("lets aria-labelledby name it", async () => {
            const labelled = TestBed.createComponent(LabelledByHostComponent);
            labelled.detectChanges();
            const element = labelled.nativeElement.querySelector(selector) as HTMLElement;
            expect(element.getAttribute("aria-labelledby")).toBe("progress-name");
            expect((await axe.run(labelled.nativeElement, rules)).violations).toEqual([]);
            labelled.destroy();
        });
    });
});

describe("mona-progress-bar specifics", () => {
    let fixture: ComponentFixture<ProgressBarComponent>;
    let host: HTMLElement;

    beforeEach(() => {
        fixture = TestBed.createComponent(ProgressBarComponent);
        host = fixture.nativeElement;
        fixture.componentRef.setInput("value", 40);
        fixture.detectChanges();
    });

    afterEach(() => fixture.destroy());

    it("doesn't let color override the disabled fill", () => {
        fixture.componentRef.setInput("color", "red");
        fixture.detectChanges();
        const fill = host.querySelector("[data-prev='true']") as HTMLElement;
        expect(fill.style.backgroundColor).toBe("red");
        fixture.componentRef.setInput("disabled", true);
        fixture.detectChanges();
        expect(fill.style.backgroundColor).toBe("");
    });

    it("still takes a color function", () => {
        fixture.componentRef.setInput("color", (percent: number) => (percent > 30 ? "red" : "blue"));
        fixture.detectChanges();
        expect((host.querySelector("[data-prev='true']") as HTMLElement).style.backgroundColor).toBe("red");
    });

    it("tells fill from track in forced colors", () => {
        const fill = host.querySelector("[data-prev='true']") as HTMLElement;
        expect(host.classList.contains("forced-colors:border-[CanvasText]")).toBe(true);
        expect(fill.classList.contains("data-[prev='true']:forced-colors:bg-[Highlight]!")).toBe(true);
        expect(fill.classList.contains("data-[prev='true']:forced-color-adjust-none")).toBe(true);
    });
});

describe("mona-circular-progress-bar specifics", () => {
    let fixture: ComponentFixture<CircularProgressBarComponent>;
    let host: HTMLElement;

    const circle = (): SVGCircleElement => host.querySelector("circle:not([data-stroke-trail])") as SVGCircleElement;

    beforeEach(() => {
        fixture = TestBed.createComponent(CircularProgressBarComponent);
        host = fixture.nativeElement;
        fixture.detectChanges();
    });

    afterEach(() => fixture.destroy());

    it("fits its stroke in the box", () => {
        fixture.componentRef.setInput("size", 100);
        fixture.componentRef.setInput("thickness", 6);
        fixture.detectChanges();
        expect(circle().getAttribute("r")).toBe("47");
        expect(Number(circle().getAttribute("stroke-dasharray"))).toBeCloseTo(2 * Math.PI * 47);
    });

    it("never has a negative radius or dash", () => {
        fixture.componentRef.setInput("size", 10);
        fixture.componentRef.setInput("thickness", 20);
        fixture.detectChanges();
        expect(circle().getAttribute("r")).toBe("0");
        expect(circle().getAttribute("stroke-dasharray")).toBe("0");
    });

    it("can hide its label", () => {
        expect(host.querySelector(".mona-circular-progress-bar-label")).not.toBeNull();
        fixture.componentRef.setInput("labelVisible", false);
        fixture.detectChanges();
        expect(host.querySelector(".mona-circular-progress-bar-label")).toBeNull();
    });

    it("has no label while indeterminate", () => {
        fixture.componentRef.setInput("indeterminate", true);
        fixture.detectChanges();
        expect(host.querySelector(".mona-circular-progress-bar-label")).toBeNull();
    });

    it("says whether it's disabled, as the bar does", () => {
        expect(host.getAttribute("data-disabled")).toBe("false");
        fixture.componentRef.setInput("disabled", true);
        fixture.detectChanges();
        expect(host.getAttribute("data-disabled")).toBe("true");
    });

    it("puts the theme's motion on the arc, not the host", () => {
        expect(host.classList.contains("[&_svg_circle]:duration-(--mona-motion-fast)")).toBe(true);
        expect(host.classList.contains("[&_svg_circle]:ease-in")).toBe(true);
        expect(host.classList.contains("duration-(--mona-motion-fast)")).toBe(false);
    });
});
