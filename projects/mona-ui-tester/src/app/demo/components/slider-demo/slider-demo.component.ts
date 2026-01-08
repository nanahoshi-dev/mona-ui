import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { faMoon, faStar, faSun } from "@fortawesome/free-solid-svg-icons";
import { SliderComponent, SliderHandleTemplateDirective, SliderTickValueTemplateDirective } from "mona-ui";
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
            code: `
                <ng-template monaSliderHandleTemplate let-value>
                    <fa-icon [icon]="starIcon" style="color: darkgoldenrod;"></fa-icon>
                </ng-template>
            `,
            name: "Handle Template",
            description: "This template allows you to customize the handle displayed on the slider.",
            active: false
        },
        labelTemplate: {
            code: `
                <ng-template monaSliderTickValueTemplate let-value>
                    @if (value < 8 || value > 20) {
                        <fa-icon [icon]="moonIcon" style="color: mediumpurple;"></fa-icon>
                    } @else {
                        <fa-icon [icon]="sunIcon" style="color: #fafd0f;"></fa-icon>
                    }
                </ng-template>
            `,
            name: "Label Template",
            description: "This template allows you to customize the label displayed on the slider ticks.",
            active: false
        }
    });
    protected readonly config = signal<ComponentConfig<SliderComponent>>({
        code: `
            <mona-slider
                [disabled]="disabled()"
                [labelPosition]="labelPosition()"
                [labelStep]="labelStep()"
                [largeTickStep]="largeTickStep()"
                [max]="max()"
                [min]="min()"
                [orientation]="orientation()"
                [ranged]="ranged()"
                [showLabels]="showLabels()"
                [showTicks]="showTicks()"
                [smallTickStep]="smallTickStep()"
                [step]="step()"
                [ngModel]="value()"
                (ngModelChange)="onValueChange($event)">
                <ng-template monaSliderTickValueTemplate let-value>
                    @if (value < 8 || value > 20) {
                        <fa-icon [icon]="moonIcon" style="color: mediumpurple;"></fa-icon>
                    } @else {
                        <fa-icon [icon]="sunIcon" style="color: #fafd0f;"></fa-icon>
                    }
                </ng-template>
            </mona-slider>
        `,
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
            max: {
                type: "number",
                value: 23
            },
            min: {
                type: "number",
                value: 0
            },
            orientation: {
                type: "dropdown",
                value: ["horizontal", "vertical"],
                defaultValue: "horizontal"
            },
            ranged: {
                type: "boolean",
                value: false
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
        FormsModule,
        SliderTickValueTemplateDirective,
        FaIconComponent,
        SliderHandleTemplateDirective
    ],
    template: `
        @let featureData = features();
        <mona-slider
            [disabled]="disabled()"
            [labelPosition]="labelPosition()"
            [labelStep]="labelStep()"
            [largeTickStep]="largeTickStep()"
            [max]="max()"
            [min]="min()"
            [orientation]="orientation()"
            [ranged]="ranged()"
            [rounded]="rounded()"
            [selectionBackground]="selectionBackground()"
            [showLabels]="showLabels()"
            [showTicks]="showTicks()"
            [smallTickStep]="smallTickStep()"
            [step]="step()"
            [trackBackground]="trackBackground()"
            [trackSize]="trackSize()"
            [ngModel]="value()"
            (ngModelChange)="onValueChange($event)"
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
    protected readonly features = inject(FeatureConfigHandler).data;
    protected readonly moonIcon = faMoon;
    protected readonly size = computed(() =>
        this.orientation() === "horizontal" ? { width: "400px" } : { height: "400px" }
    );
    protected readonly starIcon = faStar;
    protected readonly sunIcon = faSun;
    protected readonly value = signal<number | [number, number]>(4);
    public readonly disabled = input(false);
    public readonly labelPosition = input<ReturnType<SliderComponent["labelPosition"]>>("after");
    public readonly labelStep = input(1);
    public readonly largeTickStep = input<ReturnType<SliderComponent["largeTickStep"]>>(null); // Large step can be null
    public readonly max = input(23);
    public readonly min = input(0);
    public readonly orientation = input<ReturnType<SliderComponent["orientation"]>>("horizontal");
    public readonly ranged = input(false);
    public readonly rounded = input<ReturnType<SliderComponent["rounded"]>>("full");
    public readonly selectionBackground = input<ReturnType<SliderComponent["selectionBackground"]>>("transparent");
    public readonly showLabels = input(false);
    public readonly showTicks = input(false);
    public readonly smallTickStep = input(1);
    public readonly step = input(1);
    public readonly trackBackground = input<ReturnType<SliderComponent["trackBackground"]>>("transparent");
    public readonly trackSize = input(null, {
        transform: (value: string | number | null) => {
            if (value == null || value === "") {
                return null;
            }
            if (typeof value === "number") {
                return `${value}px`;
            }
            const number = Number(value);
            return isNaN(number) ? value : `${number}px`;
        }
    });

    public onValueChange(value: number | [number, number]): void {
        console.log("Slider value changed:", value);
        this.value.set(value);
    }
}
