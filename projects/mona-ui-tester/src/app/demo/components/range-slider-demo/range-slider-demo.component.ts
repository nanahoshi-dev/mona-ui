import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from "@angular/core";
import { disabled, form, FormField } from "@angular/forms/signals";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { faMoon, faStar, faSun } from "@fortawesome/free-solid-svg-icons";
import {
    RangeSliderComponent,
    SliderHandleTemplateDirective,
    SliderTickValueTemplateDirective
} from "@nanahoshi/mona-ui/slider";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-range-slider-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./range-slider-demo.component.html"
})
export class RangeSliderDemoComponent extends AbstractDemoComponent<RangeSliderComponent> {
    readonly #injector = createFeatureInjector({
        handleTemplate: {
            name: "Handle Template",
            description: "This template allows you to customize the handles displayed on the range slider.",
            active: false
        },
        labelTemplate: {
            name: "Label Template",
            description: "This template allows you to customize the label displayed on the slider ticks.",
            active: false
        }
    });
    protected readonly RangeSliderWrapperComponent = RangeSliderWrapperComponent;
    protected readonly config = signal<ComponentConfig<RangeSliderComponent>>({
        inputs: {
            disabled: {
                type: "boolean",
                value: false
            },
            labelPosition: {
                type: "dropdown",
                value: ["before", "after"],
                defaultValue: "after"
            },
            labelStep: {
                type: "number",
                value: 1
            },
            largeTickStep: {
                type: "number",
                min: 1,
                nullable: true,
                value: null
            },
            maxValue: {
                type: "number",
                value: 23
            },
            minValue: {
                type: "number",
                value: 0
            },
            orientation: {
                type: "dropdown",
                value: ["horizontal", "vertical"],
                defaultValue: "horizontal"
            },
            rounded: {
                type: "dropdown",
                value: ["none", "small", "medium", "large", "full"],
                defaultValue: "full"
            },
            shiftMultiplier: {
                type: "number",
                value: 10
            },
            selectionBackground: {
                type: "color",
                value: "var(--color-primary)"
            },
            showLabels: {
                type: "boolean",
                value: true
            },
            showTicks: {
                type: "boolean",
                value: true
            },
            smallTickStep: {
                type: "number",
                value: 1
            },
            step: {
                type: "number",
                value: 4
            },
            trackBackground: {
                type: "color",
                value: "var(--color-background)"
            },
            trackSize: {
                type: "string",
                value: ""
            }
        },
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("RangeSliderComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([]);
}

@Component({
    imports: [
        RangeSliderComponent,
        FormField,
        SliderTickValueTemplateDirective,
        FaIconComponent,
        SliderHandleTemplateDirective
    ],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
        @let featureData = features();
        <div class="flex flex-col gap-4">
            <span>Range: {{ form.value().value()[0] }} - {{ form.value().value()[1] }}</span>
            <mona-range-slider
                [labelPosition]="labelPosition()"
                [labelStep]="labelStep()"
                [largeTickStep]="largeTickStep()"
                [maxValue]="maxValue()"
                [minValue]="minValue()"
                [orientation]="orientation()"
                [rounded]="rounded()"
                [selectionBackground]="selectionBackground()"
                [shiftMultiplier]="shiftMultiplier()"
                [showLabels]="showLabels()"
                [showTicks]="showTicks()"
                [smallTickStep]="smallTickStep()"
                [step]="step()"
                [trackBackground]="trackBackground()"
                [trackSize]="trackSize()"
                [formField]="$any(form.value)"
                [style]="size()">
                @if (featureData && featureData["labelTemplate"].active) {
                    <ng-template monaSliderTickValueTemplate let-value>
                        @if (value < 8 || value > 20) {
                            <fa-icon [icon]="moonIcon" style="color: mediumpurple;"></fa-icon>
                        } @else {
                            <fa-icon [icon]="sunIcon" style="color: #fafd0f;"></fa-icon>
                        }
                    </ng-template>
                }
                @if (featureData && featureData["handleTemplate"].active) {
                    <ng-template monaSliderHandleTemplate let-value>
                        <fa-icon [icon]="starIcon" style="color: darkgoldenrod;" [title]="value"></fa-icon>
                    </ng-template>
                }
            </mona-range-slider>
        </div>
    `
})
export class RangeSliderWrapperComponent implements ComponentInputsAsSignal<RangeSliderComponent> {
    readonly #formModel = signal<RangeSliderFormModel>({ value: [4, 16] });
    protected readonly features = inject(FeatureConfigHandler).data;
    protected readonly form = form(this.#formModel, schema => {
        disabled(schema.value, { when: () => this.disabled() });
    });
    protected readonly moonIcon = faMoon;
    protected readonly size = computed(() =>
        this.orientation() === "horizontal" ? { width: "400px" } : { height: "400px" }
    );
    protected readonly starIcon = faStar;
    protected readonly sunIcon = faSun;
    public readonly disabled = input(false);
    public readonly labelPosition = input<ReturnType<RangeSliderComponent["labelPosition"]>>("after");
    public readonly labelStep = input(1);
    public readonly largeTickStep = input<ReturnType<RangeSliderComponent["largeTickStep"]>>(null);
    public readonly maxValue = input(23);
    public readonly minValue = input(0);
    public readonly orientation = input<ReturnType<RangeSliderComponent["orientation"]>>("horizontal");
    public readonly rounded = input<ReturnType<RangeSliderComponent["rounded"]>>("full");
    public readonly selectionBackground = input<ReturnType<RangeSliderComponent["selectionBackground"]>>("transparent");
    public readonly shiftMultiplier = input(10);
    public readonly showLabels = input(false);
    public readonly showTicks = input(false);
    public readonly smallTickStep = input(1);
    public readonly step = input(1);
    public readonly trackBackground = input<ReturnType<RangeSliderComponent["trackBackground"]>>("transparent");
    public readonly trackSize = input<string | number>();
}

interface RangeSliderFormModel {
    value: [number, number];
}
