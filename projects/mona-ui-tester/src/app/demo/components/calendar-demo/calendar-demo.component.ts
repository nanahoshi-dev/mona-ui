import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, input, model, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { DateTime } from "luxon";
import { CalendarComponent } from "mona-ui";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { getFormValueText } from "../../utils/dropdownFeatureConfigs";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-calendar-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./calendar-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarDemoComponent extends AbstractDemoComponent<CalendarComponent> {
    readonly #injector = createFeatureInjector({});
    protected readonly config = signal<ComponentConfig<CalendarComponent>>({
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
            rounded: {
                type: "dropdown",
                value: ["none", "small", "medium", "large", "full"],
                defaultValue: "none"
            },
            selection: {
                type: "dropdown",
                value: ["single", "multiple", "range"],
                defaultValue: "single"
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
    protected readonly metadata = this.getMetadata("CalendarComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([]);
    protected readonly CalendarWrapperComponent = CalendarWrapperComponent;
}

@Component({
    imports: [CalendarComponent, ReactiveFormsModule],
    template: `
        <!--        @let featureData = features();-->
        <span>{{ formValueText() }}</span>
        <form [formGroup]="formGroup">
            <mona-calendar
                [disabled]="disabled()"
                [disabledDates]="disabledDates()"
                [firstDay]="firstDay()"
                [formControl]="formGroup.controls.value"
                [max]="max()"
                [min]="min()"
                [rounded]="rounded()"
                [selection]="selection()"
                [size]="size()"></mona-calendar>
        </form>
    `
})
export class CalendarWrapperComponent implements ComponentInputsAsSignal<CalendarComponent> {
    readonly #formGroup = new FormGroup({
        value: new FormControl<Date | Date[] | null>(null)
    });
    readonly #formValue = toSignal(this.#formGroup.controls.value.valueChanges);
    protected readonly features = inject(FeatureConfigHandler).data;
    protected readonly formGroup = this.#formGroup;
    protected readonly formValueText = computed(() => {
        const value = this.#formValue();
        const valueList = Array.isArray(value) ? value : [value];
        return valueList.map(v => (v ? DateTime.fromJSDate(v).toFormat("yyyy-MM-dd") : "null")).join(", ");
    });
    protected readonly selectedDate = model<DateTime | DateTime[]>(DateTime.now());
    public readonly disabled = model<ReturnType<CalendarComponent["disabled"]>>(false);
    public readonly disabledDates = input<ReturnType<CalendarComponent["disabledDates"]>>([]);
    public readonly firstDay = input<ReturnType<CalendarComponent["firstDay"]>>("monday");
    public readonly max = input<ReturnType<CalendarComponent["max"]>>(null);
    public readonly min = input<ReturnType<CalendarComponent["min"]>>(null);
    public readonly rounded = input<ReturnType<CalendarComponent["rounded"]>>("none");
    public readonly selection = input<ReturnType<CalendarComponent["selection"]>>("single");
    public readonly size = input<ReturnType<CalendarComponent["size"]>>("medium");
}
