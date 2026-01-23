import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, input, model, signal } from "@angular/core";
import { mode } from "@mirei/ts-collections";
import { DateTime } from "luxon";
import { TimePickerComponent } from "mona-ui";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-time-picker-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./time-picker-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimePickerDemoComponent extends AbstractDemoComponent<TimePickerComponent> {
    readonly #injector = createFeatureInjector({});
    protected readonly TimePickerWrapperComponent = TimePickerWrapperComponent;
    protected readonly config = signal<ComponentConfig<TimePickerComponent>>({
        code: ``,
        inputs: {
            disabled: {
                type: "boolean",
                value: false
            },
            format: {
                type: "string",
                value: "HH:mm"
            },
            hourFormat: {
                type: "dropdown",
                value: ["12", "24"],
                defaultValue: "24"
            },
            max: {
                type: "dropdown",
                value: [DateTime.now().plus({ day: 5 }).toJSDate()],
                defaultValue: null
            },
            min: {
                type: "dropdown",
                value: [DateTime.now().minus({ day: 10 }).toJSDate()],
                defaultValue: null
            },
            popupHeight: {
                type: "number",
                nullable: true,
                min: 0,
                max: 500,
                value: null
            },
            popupWidth: {
                type: "number",
                nullable: true,
                min: 0,
                value: null
            },
            readonly: {
                type: "boolean",
                value: false
            },
            showSeconds: {
                type: "boolean",
                value: false
            }
        },
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("TimePickerComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([]);
}

@Component({
    imports: [TimePickerComponent],
    template: `
        <mona-time-picker
            [disabled]="disabled()"
            [format]="format()"
            [hourFormat]="hourFormat()"
            [max]="max()"
            [min]="min()"
            [popupHeight]="popupHeight()"
            [popupWidth]="popupWidth()"
            [readonly]="readonly()"
            [showSeconds]="showSeconds()"
            class="w-32">
        </mona-time-picker>
    `
})
class TimePickerWrapperComponent implements ComponentInputsAsSignal<TimePickerComponent> {
    protected readonly features = inject(FeatureConfigHandler).data;
    public readonly disabled = model<ReturnType<TimePickerComponent["disabled"]>>(false);
    public readonly format = input<ReturnType<TimePickerComponent["format"]>>("HH:mm");
    public readonly hourFormat = input<ReturnType<TimePickerComponent["hourFormat"]>>("24");
    public readonly max = input<ReturnType<TimePickerComponent["max"]>>(null);
    public readonly min = input<ReturnType<TimePickerComponent["min"]>>(null);
    public readonly popupHeight = input<ReturnType<TimePickerComponent["popupHeight"]>>(null);
    public readonly popupWidth = input<ReturnType<TimePickerComponent["popupWidth"]>>(null);
    public readonly readonly = input<ReturnType<TimePickerComponent["readonly"]>>(false);
    public readonly showSeconds = input<ReturnType<TimePickerComponent["showSeconds"]>>(false);
}
