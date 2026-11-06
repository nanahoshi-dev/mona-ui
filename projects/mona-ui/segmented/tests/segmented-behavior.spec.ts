import { Component, signal, viewChild } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { form, FormField } from "@angular/forms/signals";
import axe from "axe-core";
import { beforeEach, describe, expect, it } from "vitest";
import { SegmentedComponent } from "../components/segmented/segmented.component";
import { SegmentedItemTemplateDirective } from "../directives/segmented-item-template.directive";
import type { SegmentedOption } from "../models/SegmentedOption";
import { segmentedIndicatorThemeVariants, segmentedOptionThemeVariants } from "../styles/segmented.styles";

async function settle<T>(fixture: ComponentFixture<T>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

const OPTIONS: readonly SegmentedOption<string>[] = [
    { label: "Day", value: "day" },
    { label: "Week", value: "week" },
    { label: "Month", value: "month" }
];

@Component({
    template: `
        <div [attr.dir]="dir()">
            <mona-segmented aria-label="Range" [name]="name()" [options]="options" [(value)]="value" />
        </div>
    `,
    imports: [SegmentedComponent]
})
class HostComponent {
    public readonly dir = signal<"ltr" | "rtl" | null>(null);
    public readonly name = signal("");
    public readonly options = OPTIONS;
    public readonly segmented = viewChild.required(SegmentedComponent);
    public readonly value = signal<string | null>("day");
}

@Component({
    template: `
        <mona-segmented aria-label="Range" [options]="options" [value]="'day'">
            <ng-template [monaSegmentedItemTemplate]="options" let-option let-selected="selected">
                <span class="custom">{{ option.value.toUpperCase() }}:{{ selected }}</span>
            </ng-template>
        </mona-segmented>
    `,
    imports: [SegmentedComponent, SegmentedItemTemplateDirective]
})
class TemplateHostComponent {
    public readonly options = OPTIONS;
}

@Component({
    template: `<mona-segmented aria-label="Range" [options]="options" [formField]="form.range" />`,
    imports: [FormField, SegmentedComponent]
})
class FormHostComponent {
    readonly #model = signal({ range: "day" as string | null });
    public readonly form = form(this.#model);
    public readonly options = OPTIONS;
}

describe("segmented behavior", () => {
    let fixture: ComponentFixture<HostComponent>;
    let host: HostComponent;

    const radios = (): HTMLInputElement[] => [...fixture.nativeElement.querySelectorAll("input[type='radio']")];
    const labels = (): HTMLLabelElement[] => [...fixture.nativeElement.querySelectorAll("label")];

    beforeEach(async () => {
        fixture = TestBed.createComponent(HostComponent);
        host = fixture.componentInstance;
        await settle(fixture);
    });

    describe("right to left", () => {
        it("anchors the indicator physically, since offsetLeft is measured from the left", () => {
            const classes = segmentedIndicatorThemeVariants({}).split(/\s+/);

            expect(classes).toContain("left-0");
            expect(classes).not.toContain("start-0");
        });

        it("measures again when only the direction changes", async () => {
            const selected = labels()[0];
            Object.defineProperty(selected, "offsetLeft", {
                get: () => (selected.closest("[dir='rtl']") ? 200 : 4)
            });
            host.value.set(null);
            await settle(fixture);
            host.value.set("day");
            await settle(fixture);
            const indicator = (): HTMLElement =>
                fixture.nativeElement.querySelector("mona-segmented > [aria-hidden='true']");
            expect(indicator().style.transform).toContain("translate3d(4px");

            host.dir.set("rtl");
            await settle(fixture);

            expect(indicator().style.transform).toContain("translate3d(200px");
        });

        it("renders it that way under dir=rtl", async () => {
            host.dir.set("rtl");
            await settle(fixture);
            const indicator = fixture.nativeElement.querySelector("[aria-hidden='true']") as HTMLElement;

            expect(indicator.classList.contains("left-0")).toBe(true);
        });
    });

    describe("the DOM follows value", () => {
        it("puts back a radio the browser checked when the value is written back", async () => {
            radios()[1].click();
            host.segmented().value.set("day");
            await settle(fixture);

            expect(radios().map(radio => radio.checked)).toEqual([true, false, false]);
        });

        it("checks a new value", async () => {
            host.value.set("month");
            await settle(fixture);

            expect(radios().map(radio => radio.checked)).toEqual([false, false, true]);
        });

        it("checks nothing for a value with no option", async () => {
            host.value.set("year");
            await settle(fixture);

            expect(radios().map(radio => radio.checked)).toEqual([false, false, false]);
        });
    });

    describe("name", () => {
        it("generates one", () => {
            expect(radios()[0].name).toBeTruthy();
            expect(new Set(radios().map(radio => radio.name)).size).toBe(1);
        });

        it("takes one for a native form", async () => {
            host.name.set("range");
            await settle(fixture);

            expect(radios().every(radio => radio.name === "range")).toBe(true);
        });

        it("takes the form field's", async () => {
            const other = TestBed.createComponent(FormHostComponent);
            await settle(other);
            const radio = other.nativeElement.querySelector("input[type='radio']") as HTMLInputElement;

            expect(radio.name).toContain("range");
        });
    });

    describe("before the indicator is measured", () => {
        it("marks the option once it has an indicator behind it", () => {
            expect(labels()[0].getAttribute("data-indicator")).toBe("true");
        });

        it("the option paints its own background until then", () => {
            expect(segmentedOptionThemeVariants({}).split(/\s+/)).toContain(
                "data-[selected='true']:not-data-[indicator]:bg-primary"
            );
        });

        it("nothing is marked with no selection", async () => {
            host.value.set(null);
            await settle(fixture);

            expect(labels()[0].hasAttribute("data-indicator")).toBe(false);
        });
    });

    describe("focus and forced colors", () => {
        it("has a solid outline around the whole option", () => {
            const classes = segmentedOptionThemeVariants({}).split(/\s+/);

            expect(classes).toContain("has-[input:focus-visible]:outline-2");
            expect(classes).toContain("has-[input:focus-visible]:outline-focus-indicator");
        });

        it("no longer has the faint ring", () => {
            expect(fixture.nativeElement.querySelector(".peer-focus-visible\\:ring-2")).toBeNull();
        });

        it("keeps a sign of the selected option in forced colors, which drop the background", () => {
            const classes = segmentedIndicatorThemeVariants({}).split(/\s+/);

            expect(classes).toContain("forced-colors:border-[Highlight]");
            expect(classes).toContain("border-transparent");
        });
    });

    describe("templates", () => {
        it("gives the template the option and its state", async () => {
            const other = TestBed.createComponent(TemplateHostComponent);
            await settle(other);
            const custom: HTMLElement[] = [...other.nativeElement.querySelectorAll(".custom")];

            expect(custom.map(item => item.textContent)).toEqual(["DAY:true", "WEEK:false", "MONTH:false"]);
        });
    });

    it("has no axe violations", async () => {
        const result = await axe.run(fixture.nativeElement, {
            rules: { "color-contrast": { enabled: false }, region: { enabled: false } }
        });

        expect(result.violations.map(violation => violation.id)).toEqual([]);
    });
});
