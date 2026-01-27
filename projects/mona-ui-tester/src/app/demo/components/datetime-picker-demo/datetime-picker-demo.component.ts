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
            },
            showSeconds: {
                type: "boolean",
                value: false
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
                [formControl]="formGroup.controls.value"
                [format]="format()"
                [max]="max()"
                [min]="min()"
                [readonly]="readonly()"
                [showSeconds]="showSeconds()"></mona-datetime-picker>
        </form>
    `
})
class DateTimePickerWrapperComponent implements ComponentInputsAsSignal<DateTimePickerComponent> {
    readonly #formGroup = new FormGroup({
        value: new FormControl<Date | null>(null)
    });
    readonly #formValue = toSignal(this.#formGroup.controls.value.valueChanges);
    protected readonly features = inject(FeatureConfigHandler).data;
    protected readonly formGroup = this.#formGroup;
    protected readonly formValueText = computed(() => {
        const value = this.#formValue();
        return value ? DateTime.fromJSDate(value).toFormat("dd/MM/yyyy HH:mm:ss") : "";
    });
    public readonly disabled = model<ReturnType<DateTimePickerComponent["disabled"]>>(false);
    public readonly disabledDates = input<ReturnType<DateTimePickerComponent["disabledDates"]>>([]);
    public readonly format = input<ReturnType<DateTimePickerComponent["format"]>>("dd/MM/yyyy");
    public readonly max = input<ReturnType<DateTimePickerComponent["max"]>>(null);
    public readonly min = input<ReturnType<DateTimePickerComponent["min"]>>(null);
    public readonly readonly = input<ReturnType<DateTimePickerComponent["readonly"]>>(false);
    public readonly showSeconds = input<ReturnType<DateTimePickerComponent["showSeconds"]>>(false);
}
