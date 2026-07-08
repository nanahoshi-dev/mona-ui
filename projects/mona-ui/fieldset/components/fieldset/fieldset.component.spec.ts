import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";

import { FieldsetComponent } from "./fieldset.component";
import { FieldsetLegendTemplateDirective } from "../../directives/fieldset-legend-template.directive";

describe("FieldsetComponent", () => {
    let component: FieldsetComponent;
    let fixture: ComponentFixture<FieldsetComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [FieldsetComponent]
        });
        fixture = TestBed.createComponent(FieldsetComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    function getFieldset(targetFixture: ComponentFixture<unknown>): HTMLFieldSetElement {
        return targetFixture.nativeElement.querySelector("fieldset");
    }

    describe("legend visibility", () => {
        it("should not render a <legend> when no legend text or template is provided", () => {
            fixture.detectChanges();

            const legend = getFieldset(fixture).querySelector("legend");

            expect(legend).toBeNull();
        });

        it("should render a <legend> with the legend text when only `legend` is provided", () => {
            fixture.componentRef.setInput("legend", "Personal information");
            fixture.detectChanges();

            const legend = getFieldset(fixture).querySelector("legend");

            expect(legend).not.toBeNull();
            expect(legend?.querySelector("span")?.textContent?.trim()).toBe("Personal information");
        });
    });

    describe("rounded variant", () => {
        it("should apply the rounded class to the rendered <fieldset>", () => {
            fixture.componentRef.setInput("rounded", "full");
            fixture.detectChanges();

            expect(getFieldset(fixture).className).toContain("rounded-full");
        });

        it("should apply the rounded class to the legend when visible", () => {
            fixture.componentRef.setInput("legend", "Section");
            fixture.componentRef.setInput("rounded", "large");
            fixture.detectChanges();

            const legend = getFieldset(fixture).querySelector("legend");

            expect(legend?.className).toContain("rounded-lg");
        });
    });

    describe("class merging", () => {
        it("should merge a user-provided class onto the rendered <fieldset>", () => {
            fixture.componentRef.setInput("class", "border-red-500");
            fixture.detectChanges();

            expect(getFieldset(fixture).className).toContain("border-red-500");
        });
    });

    describe("legend styling", () => {
        it("should apply the styled legend classes for a string legend", () => {
            fixture.componentRef.setInput("legend", "Billing");
            fixture.detectChanges();

            const legend = getFieldset(fixture).querySelector("legend");

            expect(legend?.className).toContain("bg-background-dark");
        });
    });

    describe("disabled", () => {
        it("should reflect the disabled attribute on the rendered <fieldset>", () => {
            fixture.componentRef.setInput("disabled", true);
            fixture.detectChanges();

            expect(getFieldset(fixture).disabled).toBe(true);
        });

        it("should apply the disabled visual classes when disabled is true", () => {
            fixture.componentRef.setInput("disabled", true);
            fixture.detectChanges();

            expect(getFieldset(fixture).className).toContain("opacity-50");
        });

        it("should leave the rendered <fieldset> enabled by default", () => {
            expect(getFieldset(fixture).disabled).toBe(false);
        });
    });

    describe("name", () => {
        it("should reflect the name attribute on the rendered <fieldset>", () => {
            fixture.componentRef.setInput("name", "billing-address");
            fixture.detectChanges();

            expect(getFieldset(fixture).getAttribute("name")).toBe("billing-address");
        });

        it("should not render a name attribute by default", () => {
            expect(getFieldset(fixture).hasAttribute("name")).toBe(false);
        });
    });
});

@Component({
    imports: [FieldsetComponent, FieldsetLegendTemplateDirective],
    template: `
        <mona-fieldset [legend]="'Ignored'">
            <ng-template monaFieldsetLegendTemplate>
                <span class="custom-legend">Custom</span>
            </ng-template>
        </mona-fieldset>
    `
})
class FieldsetLegendTemplateHostComponent {}

describe("FieldsetComponent with legend template", () => {
    let hostFixture: ComponentFixture<FieldsetLegendTemplateHostComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [FieldsetLegendTemplateHostComponent]
        });
        hostFixture = TestBed.createComponent(FieldsetLegendTemplateHostComponent);
        hostFixture.detectChanges();
    });

    it("should render the projected template and ignore the string legend", () => {
        const legend = hostFixture.nativeElement.querySelector("fieldset legend");

        expect(legend.querySelector(".custom-legend")?.textContent?.trim()).toBe("Custom");
        expect(legend.textContent).not.toContain("Ignored");
    });

    it("should not apply the string-legend styling classes when a template is used", () => {
        const legendEl: HTMLElement = hostFixture.nativeElement.querySelector("fieldset legend");

        expect(legendEl.className).not.toContain("bg-background-dark");
    });
});
