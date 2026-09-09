import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, input, model, signal } from "@angular/core";
import { disabled, form, FormField, readonly, required } from "@angular/forms/signals";
import { DateTime } from "luxon";
import {
    CalendarComponent,
    CalendarDecadeCellTemplateDirective,
    CalendarMonthCellTemplateDirective,
    CalendarYearCellTemplateDirective
} from "@nanahoshi/mona-ui/calendar";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { deriveInputConfig } from "../../utils/deriveInputConfig";
import {
    calendarDecadeCellTemplateFeatureConfig,
    calendarMonthCellTemplateFeatureConfig,
    calendarYearCellTemplateFeatureConfig
} from "../../utils/dateInputFeatureConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

const DECADE_CELL_TEMPLATE_CODE = `<ng-template monaCalendarDecadeCellTemplate let-year>
    <span class="text-amber-700 italic">{{ year }}</span>
</ng-template>`;

const MONTH_CELL_TEMPLATE_CODE = `<ng-template monaCalendarMonthCellTemplate let-day let-date="date">
    <span [class.text-violet-600]="day % 2 === 0" [class.text-blue-500]="day % 2 !== 0">
        {{ day }}
    </span>
</ng-template>`;

const YEAR_CELL_TEMPLATE_CODE = `<ng-template monaCalendarYearCellTemplate let-month let-text="text">
    <span
        >{{ text }} |
        <span class="text-green-500">{{ month }}</span>
    </span>
</ng-template>`;

@Component({
    selector: "app-calendar-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./calendar-demo.component.html"
})
export class CalendarDemoComponent extends AbstractDemoComponent<CalendarComponent> {
    readonly #injector = createFeatureInjector({
        decadeCellTemplate: { ...calendarDecadeCellTemplateFeatureConfig(), code: DECADE_CELL_TEMPLATE_CODE },
        monthCellTemplate: { ...calendarMonthCellTemplateFeatureConfig(), code: MONTH_CELL_TEMPLATE_CODE },
        yearCellTemplate: { ...calendarYearCellTemplateFeatureConfig(), code: YEAR_CELL_TEMPLATE_CODE }
    });
    protected readonly config = computed<ComponentConfig<CalendarComponent>>(() => ({
        inputs: deriveInputConfig<CalendarComponent>(this.metadata(), {
            disabledDates: {
                type: "dropdown",
                value: [[DateTime.now().minus({ day: 2 }).toJSDate()], (date: Date) => date.getDay() === 0],
                defaultValue: null,
                clearable: true
            },
            firstDay: {
                type: "dropdown",
                value: ["sunday", "monday"],
                defaultValue: "monday"
            },
            // invalid/touched are written by the FormField directive via [formField] below;
            // Angular forbids binding them directly, so exclude them rather than expose a dead control.
            invalid: undefined,
            touched: undefined,
            maxDate: {
                type: "dropdown",
                value: [DateTime.now().plus({ day: 5 }).toJSDate()],
                defaultValue: null,
                clearable: true
            },
            minDate: {
                type: "dropdown",
                value: [DateTime.now().minus({ day: 10 }).toJSDate()],
                defaultValue: null,
                clearable: true
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
            userClass: {
                alias: "class",
                type: "string",
                value: ""
            }
        }),
        featureHandler: this.#injector.get(FeatureConfigHandler)
    }));
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("CalendarComponent");
    protected readonly CalendarWrapperComponent = CalendarWrapperComponent;
}

@Component({
    imports: [
        CalendarComponent,
        CalendarMonthCellTemplateDirective,
        CalendarYearCellTemplateDirective,
        CalendarDecadeCellTemplateDirective,
        FormField
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        @let featureData = features();
        <span>Date: {{ formValueText() }}</span>
        <mona-calendar
            [disabledDates]="disabledDates()"
            [formField]="form.date"
            [firstDay]="firstDay()"
            [maxDate]="maxDate()"
            [minDate]="minDate()"
            [rounded]="rounded()"
            [selection]="selection()"
            [weekNumber]="weekNumber()"
            [class]="userClass()">
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
    `
})
export class CalendarWrapperComponent implements ComponentInputsAsSignal<CalendarComponent> {
    readonly #formModel = signal<CalendarFormModel>({ date: null });
    protected readonly features = inject(FeatureConfigHandler).data;
    protected readonly form = form(this.#formModel, schema => {
        disabled(schema.date, { when: () => this.disabled() });
        readonly(schema.date, { when: () => this.readonly() });
        required(schema.date, { when: () => this.required() });
    });
    protected readonly formValueText = computed(() => {
        const value = this.form.date().value();
        const valueList = Array.isArray(value) ? value : [value];
        return valueList
            .filter((v): v is Date => v != null)
            .map(v => DateTime.fromJSDate(v).toFormat("yyyy-MM-dd HH:mm:ss"))
            .join(", ");
    });
    public readonly disabled = model<ReturnType<CalendarComponent["disabled"]>>(false);
    public readonly disabledDates = input<ReturnType<CalendarComponent["disabledDates"]>>([]);
    public readonly firstDay = input<ReturnType<CalendarComponent["firstDay"]>>("monday");
    public readonly maxDate = input<ReturnType<CalendarComponent["maxDate"]>>(null);
    public readonly minDate = input<ReturnType<CalendarComponent["minDate"]>>(null);
    public readonly readonly = input<ReturnType<CalendarComponent["readonly"]>>(false);
    public readonly required = input<ReturnType<CalendarComponent["required"]>>(false);
    public readonly rounded = input<ReturnType<CalendarComponent["rounded"]>>("none");
    public readonly selection = input<ReturnType<CalendarComponent["selection"]>>("single");
    public readonly userClass = input<ReturnType<CalendarComponent["userClass"]>>("");
    public readonly weekNumber = input<ReturnType<CalendarComponent["weekNumber"]>>(false);
}

interface CalendarFormModel {
    date: Date | Date[] | null;
}
