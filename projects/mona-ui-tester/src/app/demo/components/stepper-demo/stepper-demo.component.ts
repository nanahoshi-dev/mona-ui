import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, input, model, signal } from "@angular/core";
import {
    LucideCheck,
    LucideCreditCard,
    LucideFileSearchCorner,
    LucideMapPinHouse,
    LucideShoppingCart,
    LucideTruck
} from "@lucide/angular";
import {
    StepperComponent,
    StepperIndicatorTemplateDirective,
    StepperLabelTemplateDirective,
    StepperStepTemplateDirective
} from "@nanahoshi/mona-ui/stepper";
import { RandomColorPipe } from "../../pipes/random-color.pipe";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-stepper-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./stepper-demo.component.html"
})
export class StepperDemoComponent extends AbstractDemoComponent<StepperComponent> {
    readonly #injector = createFeatureInjector({
        indicatorTemplate: {
            active: false,
            name: "Indicator Template",
            description: "Use a custom template for the step indicator."
        },
        labelTemplate: {
            active: false,
            name: "Label Template",
            description: "Use a custom template for the step label."
        },
        stepTemplate: {
            active: false,
            name: "Step Template",
            description: "Use a custom template for the step content."
        }
    });
    protected readonly config = signal<ComponentConfig<StepperComponent>>({
        inputs: {
            linear: {
                type: "boolean",
                value: true
            },
            orientation: {
                type: "dropdown",
                value: ["horizontal", "vertical"],
                defaultValue: "horizontal"
            },
            rounded: {
                type: "dropdown",
                value: ["small", "medium", "large", "full", "none"],
                defaultValue: "full"
            },
            step: {
                type: "number",
                value: 0,
                min: 0,
                max: 5
            },
            steps: {
                type: "iterable",
                value: [
                    { label: "Cart" },
                    { label: "Address" },
                    { label: "Shipping" },
                    { label: "Payment" },
                    { label: "Review" },
                    { label: "Complete" }
                ]
            }
        },
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("StepperComponent");
    protected readonly StepperWrapperComponent = StepperWrapperComponent;
}

@Component({
    imports: [
        StepperComponent,
        StepperIndicatorTemplateDirective,
        StepperLabelTemplateDirective,
        StepperStepTemplateDirective,
        RandomColorPipe,
        LucideCheck,
        LucideShoppingCart,
        LucideMapPinHouse,
        LucideTruck,
        LucideCreditCard,
        LucideFileSearchCorner
    ],
    template: `
        @let featureData = features();
        <mona-stepper
            [linear]="linear()"
            [orientation]="orientation()"
            [rounded]="rounded()"
            [step]="step()"
            (stepChange)="onStepChange($event)"
            [steps]="steps()">
            @if (featureData["indicatorTemplate"].active) {
                <ng-template
                    monaStepperIndicatorTemplate
                    let-dataItem
                    let-active="active"
                    let-index="index"
                    let-currentIndex="currentIndex">
                    @if (index < currentIndex || currentIndex === 5) {
                        <svg lucideCheck class="text-lime-300 font-bold" [size]="16"></svg>
                    } @else {
                        @switch (dataItem.label) {
                            @case ("Cart") {
                                <svg lucideShoppingCart class="font-bold" [size]="16"></svg>
                            }
                            @case ("Address") {
                                <svg lucideMapPinHouse class="font-bold" [size]="16"></svg>
                            }
                            @case ("Shipping") {
                                <svg lucideTruck class="font-bold" [size]="16"></svg>
                            }
                            @case ("Payment") {
                                <svg lucideCreditCard class="font-bold" [size]="16"></svg>
                            }
                            @case ("Review") {
                                <svg lucideFileSearchCorner class="font-bold" [size]="16"></svg>
                            }
                            @case ("Complete") {
                                <svg lucideCheck class="font-bold" [size]="16"></svg>
                            }
                        }
                    }
                </ng-template>
            }
            @if (featureData["labelTemplate"].active) {
                <ng-template
                    monaStepperLabelTemplate
                    let-dataItem
                    let-active="active"
                    let-index="index"
                    let-currentIndex="currentIndex">
                    <div class="flex items-center">
                        @if (index < currentIndex || currentIndex === 5) {
                            <span class="text-lime-600 font-bold">{{ dataItem.label }}</span>
                        } @else {
                            {{ dataItem.label }}
                        }
                    </div>
                </ng-template>
            }
            @if (featureData["stepTemplate"].active) {
                <ng-template monaStepperStepTemplate let-step let-index="index" let-active="active">
                    @let icon = active ? "✦" : "✧";
                    @let color = active ? ("" | randomColor) : "";
                    @let marginClass = orientation() === "vertical" ? "-ml-0.75" : "-mt-5";
                    <span
                        class="text-[3em] {{ marginClass }} h-16 flex items-center justify-center"
                        [style.color]="color">
                        {{ icon }}
                    </span>
                </ng-template>
            }
        </mona-stepper>
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    host: {
        class: "w-full flex items-center justify-center",
        "[style.height.px]": "orientation() === 'vertical' ? 500 : undefined"
    }
})
export class StepperWrapperComponent implements ComponentInputsAsSignal<StepperComponent> {
    protected readonly features = inject(FeatureConfigHandler).data;
    public readonly linear = input<ReturnType<StepperComponent["linear"]>>(true);
    public readonly orientation = input<ReturnType<StepperComponent["orientation"]>>("horizontal");
    public readonly rounded = input<ReturnType<StepperComponent["rounded"]>>("full");
    public readonly step = model<ReturnType<StepperComponent["step"]>>(1);
    public readonly steps = input<ReturnType<StepperComponent["steps"]>>([]);

    protected onStepChange(step: number) {
        console.log(`Step changed to ${step}`);
    }
}
