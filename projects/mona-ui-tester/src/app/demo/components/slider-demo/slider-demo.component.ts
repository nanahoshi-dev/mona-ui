import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, model, signal } from "@angular/core";
import { disabled, form, FormField } from "@angular/forms/signals";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { faMoon, faStar, faSun } from "@fortawesome/free-solid-svg-icons";
import { SliderComponent, SliderHandleTemplateDirective, SliderTickValueTemplateDirective } from "mona-ui/slider";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-slider-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./slider-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SliderDemoComponent extends AbstractDemoComponent<SliderComponent> {
    readonly #injector = createFeatureInjector({
        handleTemplate: {
            name: "Handle Template",
            description: "This template allows you to customize the handle displayed on the slider.",
            active: false
        },
        labelTemplate: {
            name: "Label Template",
            description: "This template allows you to customize the label displayed on the slider ticks.",
            active: false
        }
    });
    protected readonly config = signal<ComponentConfig<SliderComponent>>({
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
            },
            value: {
                type: "number",
                value: 4
            }
        },
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("SliderComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([]);
    protected readonly SliderWrapperComponent = SliderWrapperComponent;
}

@Component({
    imports: [
        SliderComponent,
        FormField,
        SliderTickValueTemplateDirective,
        FaIconComponent,
        SliderHandleTemplateDirective
    ],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
        @let featureData = features();
        <mona-slider
            [labelPosition]="labelPosition()"
            [labelStep]="labelStep()"
            [largeTickStep]="largeTickStep()"
            [maxValue]="maxValue()"
            [minValue]="minValue()"
            [orientation]="orientation()"
            [rounded]="rounded()"
            [selectionBackground]="selectionBackground()"
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
        </mona-slider>
    `
})
export class SliderWrapperComponent implements ComponentInputsAsSignal<SliderComponent> {
    readonly #formModel = signal<SliderFormModel>({ value: 4 });
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
    public readonly labelPosition = input<ReturnType<SliderComponent["labelPosition"]>>("after");
    public readonly labelStep = input(1);
    public readonly largeTickStep = input<ReturnType<SliderComponent["largeTickStep"]>>(null); // Large step can be null
    public readonly maxValue = input(23);
    public readonly minValue = input(0);
    public readonly orientation = input<ReturnType<SliderComponent["orientation"]>>("horizontal");
    public readonly rounded = input<ReturnType<SliderComponent["rounded"]>>("full");
    public readonly selectionBackground = input<ReturnType<SliderComponent["selectionBackground"]>>("transparent");
    public readonly showLabels = input(false);
    public readonly showTicks = input(false);
    public readonly smallTickStep = input(1);
    public readonly step = input(1);
    public readonly trackBackground = input<ReturnType<SliderComponent["trackBackground"]>>("transparent");
    public readonly trackSize = input<string | number>();
    public readonly value = model(0);

    public constructor() {
        effect(() => this.form.value().value.set(this.value()));
    }
}

interface SliderFormModel {
    value: number;
}
