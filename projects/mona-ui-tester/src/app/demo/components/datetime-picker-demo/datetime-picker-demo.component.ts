import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, input, model, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { DateTime } from "luxon";
import { DateTimePickerComponent } from "mona-ui";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-datetime-picker-demo",
    templateUrl: "./datetime-picker-demo.component.html",
    imports: [DemoContainerComponent, NgComponentOutlet],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DateTimePickerDemoComponent extends AbstractDemoComponent<DateTimePickerComponent> {
    readonly #injector = createFeatureInjector({});
    protected readonly DateTimePickerWrapperComponent = DateTimePickerWrapperComponent;
    protected readonly config = signal<ComponentConfig<DateTimePickerComponent>>({
        code: ``,
        inputs: {
            disabled: {
                type: "boolean",
                value: false
            },
            disabledDates: {
                type: "iterable",
                value: []
            },
            firstDay: {
                type: "dropdown",
                value: ["sunday", "monday"],
                defaultValue: "monday"
            },
            format: {
                type: "string",
                value: "dd/MM/yyyy HH:mm:ss"
            },
            hourFormat: {
                type: "dropdown",
                value: ["12", "24"],
                defaultValue: "24"
            },
            hourStep: {
                type: "number",
                value: 1,
                min: 1,
                max: 24
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
            minuteStep: {
                type: "number",
                value: 1,
                min: 1,
                max: 60
            },
            readonly: {
                type: "boolean",
                value: false
            },
            required: {
                type: "boolean",
                value: false
            },
            rounded: {
                type: "dropdown",
                value: ["none", "small", "medium", "large"],
                defaultValue: "medium"
            },
            secondStep: {
                type: "number",
                value: 1,
                min: 1,
                max: 60
            },
            showClearButton: {
                type: "boolean",
                value: false
            },
            showSeconds: {
                type: "boolean",
                value: false
            },
            size: {
                type: "dropdown",
                value: ["small", "medium", "large"],
                defaultValue: "medium"
            }
        },
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("DateTimePickerComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([]);
}

@Component({
    imports: [DateTimePickerComponent, ReactiveFormsModule],
    template: `
        <span>Selected Date: {{ formValueText() }}</span>
        <form [formGroup]="formGroup">
            <mona-datetime-picker
                [disabled]="disabled()"
                [disabledDates]="disabledDates()"
                [firstDay]="firstDay()"
                [formControl]="formGroup.controls.value"
                [format]="format()"
                [hourFormat]="hourFormat()"
                [hourStep]="hourStep()"
                [minuteStep]="minuteStep()"
                [max]="max()"
                [min]="min()"
                [readonly]="readonly()"
                [required]="required()"
                [rounded]="rounded()"
                [secondStep]="secondStep()"
                [showClearButton]="showClearButton()"
                [showSeconds]="showSeconds()"
                [size]="size()"></mona-datetime-picker>
        </form>
    `
})
class DateTimePickerWrapperComponent implements ComponentInputsAsSignal<DateTimePickerComponent> {
    readonly #formGroup = new FormGroup({
        value: new FormControl<Date | null>(DateTime.now().plus({ day: 20 }).toJSDate())
    });
    readonly #formValue = toSignal(this.#formGroup.controls.value.valueChanges);
    protected readonly features = inject(FeatureConfigHandler).data;
    protected readonly formGroup = this.#formGroup;
    protected readonly formValueText = computed(() => {
        const value = this.#formValue();
        const format = this.format();
        return value ? DateTime.fromJSDate(value).toFormat(format) : "";
    });
    public readonly disabled = model<ReturnType<DateTimePickerComponent["disabled"]>>(false);
    public readonly disabledDates = input<ReturnType<DateTimePickerComponent["disabledDates"]>>([]);
    public readonly firstDay = input<ReturnType<DateTimePickerComponent["firstDay"]>>("monday");
    public readonly format = input<ReturnType<DateTimePickerComponent["format"]>>("dd/MM/yyyy");
    public readonly hourFormat = input<ReturnType<DateTimePickerComponent["hourFormat"]>>("24");
    public readonly hourStep = input<ReturnType<DateTimePickerComponent["hourStep"]>>(1);
    public readonly max = input<ReturnType<DateTimePickerComponent["max"]>>(null);
    public readonly min = input<ReturnType<DateTimePickerComponent["min"]>>(null);
    public readonly minuteStep = input<ReturnType<DateTimePickerComponent["minuteStep"]>>(1);
    public readonly readonly = input<ReturnType<DateTimePickerComponent["readonly"]>>(false);
    public readonly required = input<ReturnType<DateTimePickerComponent["required"]>>(false);
    public readonly rounded = input<ReturnType<DateTimePickerComponent["rounded"]>>("medium");
    public readonly secondStep = input<ReturnType<DateTimePickerComponent["secondStep"]>>(1);
    public readonly showClearButton = input<ReturnType<DateTimePickerComponent["showClearButton"]>>(false);
    public readonly showSeconds = input<ReturnType<DateTimePickerComponent["showSeconds"]>>(false);
    public readonly size = input<ReturnType<DateTimePickerComponent["size"]>>("medium");
}
