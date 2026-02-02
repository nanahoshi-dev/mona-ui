import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, input, model, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { DateTime } from "luxon";
import {
    CalendarComponent,
    CalendarDecadeCellTemplateDirective,
    CalendarMonthCellTemplateDirective,
    CalendarYearCellTemplateDirective
} from "mona-ui";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import {
    calendarDecadeCellTemplateFeatureConfig,
    calendarMonthCellTemplateFeatureConfig,
    calendarYearCellTemplateFeatureConfig
} from "../../utils/dateInputFeatureConfig";
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
    readonly #injector = createFeatureInjector({
        decadeCellTemplate: calendarDecadeCellTemplateFeatureConfig(),
        monthCellTemplate: calendarMonthCellTemplateFeatureConfig(),
        yearCellTemplate: calendarYearCellTemplateFeatureConfig()
    });
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
            readonly: {
                type: "boolean",
                value: false
            },
            rounded: {
                type: "dropdown",
                value: ["none", "small", "medium", "large", "full"],
                defaultValue: "medium"
            },
            selection: {
                type: "dropdown",
                value: ["single", "multiple", "range"],
                defaultValue: "single"
            },
            weekNumber: {
                type: "boolean",
                value: false
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
    imports: [
        CalendarComponent,
        ReactiveFormsModule,
        CalendarMonthCellTemplateDirective,
        CalendarYearCellTemplateDirective,
        CalendarDecadeCellTemplateDirective
    ],
    template: `
        @let featureData = features();
        <span>{{ formValueText() }}</span>
        <form [formGroup]="formGroup">
            <mona-calendar
                [disabled]="disabled()"
                [disabledDates]="disabledDates()"
                [firstDay]="firstDay()"
                [formControl]="formGroup.controls.value"
                [max]="max()"
                [min]="min()"
                [readonly]="readonly()"
                [rounded]="rounded()"
                [selection]="selection()"
                [weekNumber]="weekNumber()">
                @if (featureData && featureData["decadeCellTemplate"].active) {
                    <ng-template monaCalendarDecadeCellTemplate let-year>
                        <span class="text-amber-700 italic">{{ year }}</span>
                    </ng-template>
                }
                @if (featureData && featureData["monthCellTemplate"].active) {
                    <ng-template monaCalendarMonthCellTemplate let-day let-date="date">
                        <span [class.text-violet-600]="day % 2 === 0" [class.text-blue-500]="day % 2 !== 0">
                            {{ day }}
                        </span>
                    </ng-template>
                }
                @if (featureData && featureData["yearCellTemplate"].active) {
                    <ng-template monaCalendarYearCellTemplate let-month let-text="text">
                        <span
                            >{{ text }} |
                            <span class="text-green-500">{{ month }}</span>
                        </span>
                    </ng-template>
                }
            </mona-calendar>
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
    public readonly disabled = model<ReturnType<CalendarComponent["disabled"]>>(false);
    public readonly disabledDates = input<ReturnType<CalendarComponent["disabledDates"]>>([]);
    public readonly firstDay = input<ReturnType<CalendarComponent["firstDay"]>>("monday");
    public readonly max = input<ReturnType<CalendarComponent["max"]>>(null);
    public readonly min = input<ReturnType<CalendarComponent["min"]>>(null);
    public readonly readonly = input<ReturnType<CalendarComponent["readonly"]>>(false);
    public readonly rounded = input<ReturnType<CalendarComponent["rounded"]>>("none");
    public readonly selection = input<ReturnType<CalendarComponent["selection"]>>("single");
    public readonly weekNumber = input<ReturnType<CalendarComponent["weekNumber"]>>(false);
}
