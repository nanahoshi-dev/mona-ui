import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, input, model, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { DateTime } from "luxon";
import { DatePickerComponent } from "mona-ui";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-date-picker-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./date-picker-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DatePickerDemoComponent extends AbstractDemoComponent<DatePickerComponent> {
    readonly #injector = createFeatureInjector({});
    protected readonly config = signal<ComponentConfig<DatePickerComponent>>({
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
            format: {
                type: "string",
                value: "dd/MM/yyyy"
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
            readonly: {
                type: "boolean",
                value: false
            }
        },
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("DatePickerComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([]);
    protected readonly DatePickerWrapperComponent = DatePickerWrapperComponent;
}

@Component({
    imports: [DatePickerComponent, ReactiveFormsModule],
    template: `
        <span>Selected Date: {{ formValueText() }}</span>
        <form [formGroup]="formGroup">
            <mona-date-picker
                [disabled]="disabled()"
                [disabledDates]="disabledDates()"
                [formControl]="formGroup.controls.value"
                [format]="format()"
                [max]="max()"
                [min]="min()"
                [readonly]="readonly()">
            </mona-date-picker>
        </form>
    `
})
class DatePickerWrapperComponent implements ComponentInputsAsSignal<DatePickerComponent> {
    readonly #formGroup = new FormGroup({
        value: new FormControl<Date | null>(null)
    });
    readonly #formValue = toSignal(this.#formGroup.controls.value.valueChanges);
    protected readonly features = inject(FeatureConfigHandler).data;
    protected readonly formGroup = this.#formGroup;
    protected readonly formValueText = computed(() => {
        const value = this.#formValue();
        return value ? DateTime.fromJSDate(value).toFormat("dd/MM/yyyy") : "";
    });
    public readonly disabled = model<ReturnType<DatePickerComponent["disabled"]>>(false);
    public readonly disabledDates = input<ReturnType<DatePickerComponent["disabledDates"]>>([]);
    public readonly format = input<ReturnType<DatePickerComponent["format"]>>("dd/MM/yyyy");
    public readonly max = input<ReturnType<DatePickerComponent["max"]>>();
    public readonly min = input<ReturnType<DatePickerComponent["min"]>>();
    public readonly readonly = input<ReturnType<DatePickerComponent["readonly"]>>(false);
}
