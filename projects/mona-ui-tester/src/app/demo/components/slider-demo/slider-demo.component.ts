import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { SliderComponent } from "mona-ui";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-slider-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./slider-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SliderDemoComponent extends AbstractDemoComponent<SliderComponent> {
    protected readonly config = signal<ComponentConfig<SliderComponent>>({
        code: ``,
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
            showLabels: {
                type: "boolean",
                value: true
            },
            showTicks: {
                type: "boolean",
                value: true
            },
            step: {
                type: "number",
                value: 4
            },
            tickStep: {
                type: "number",
                value: 1
            }
        },
        outputs: {}
    });
    protected readonly metadata = this.getMetadata("SliderComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([]);
    protected readonly SliderWrapperComponent = SliderWrapperComponent;
}

@Component({
    imports: [SliderComponent, FormsModule],
    template: `
        <mona-slider
            [disabled]="disabled()"
            [labelPosition]="labelPosition()"
            [labelStep]="labelStep()"
            [max]="max()"
            [min]="min()"
            [orientation]="orientation()"
            [showLabels]="showLabels()"
            [showTicks]="showTicks()"
            [step]="step()"
            [tickStep]="tickStep()"
            [ngModel]="value()"
            (ngModelChange)="onValueChange($event)"
            style="width: 400px;"
            class="!w-100"></mona-slider>
    `
})
export class SliderWrapperComponent implements ComponentInputsAsSignal<SliderComponent> {
    protected readonly value = signal(0);
    public readonly disabled = input(false);
    public readonly labelPosition = input<ReturnType<SliderComponent["labelPosition"]>>("after");
    public readonly labelStep = input(1);
    public readonly max = input(23);
    public readonly min = input(0);
    public readonly orientation = input<ReturnType<SliderComponent["orientation"]>>("horizontal");
    public readonly showLabels = input(false);
    public readonly showTicks = input(false);
    public readonly step = input(1);
    public readonly tickStep = input(1);

    public onValueChange(value: number): void {
        console.log("Slider value changed:", value);
        this.value.set(value);
    }
}
