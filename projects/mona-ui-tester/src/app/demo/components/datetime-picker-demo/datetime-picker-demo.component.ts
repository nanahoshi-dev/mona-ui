import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from "@angular/core";
import { disabled, form, FormField, maxDate, minDate, readonly, required } from "@angular/forms/signals";
import { LucideBadgeQuestionMark, LucideBriefcaseBusiness, LucideDynamicIcon, LucideTentTree } from "@lucide/angular";
import {
    CalendarDecadeCellTemplateDirective,
    CalendarMonthCellTemplateDirective,
    CalendarYearCellTemplateDirective
} from "@nanahoshi/mona-ui/calendar";
import type { PreventableEvent } from "@nanahoshi/mona-ui/common";
import { DateInputPrefixTemplateDirective } from "@nanahoshi/mona-ui/date-input";
import { DateTimePickerComponent } from "@nanahoshi/mona-ui/datetime-picker";
import { DateTime } from "luxon";
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
    selector: "app-datetime-picker-demo",
    templateUrl: "./datetime-picker-demo.component.html",
    imports: [DemoContainerComponent, NgComponentOutlet]
})
export class DateTimePickerDemoComponent extends AbstractDemoComponent<DateTimePickerComponent> {
    readonly #injector = createFeatureInjector({
        decadeCellTemplate: calendarDecadeCellTemplateFeatureConfig(),
        monthCellTemplate: calendarMonthCellTemplateFeatureConfig(),
        prefixTemplate: {
            active: false,
            description: `Enable prefix template for the date time picker .`,
            name: "Prefix Template"
        },
        preventClose: {
            active: false,
            description: `The "close" event is fired when the popup is about to close.`,
            name: "Prevent Close"
        },
        preventOpen: {
            active: false,
            description: `The "open" event is fired when the popup is about to open.`,
            name: "Prevent Open"
        },
        yearCellTemplate: calendarYearCellTemplateFeatureConfig()
    });
    protected readonly DateTimePickerWrapperComponent = DateTimePickerWrapperComponent;
    protected readonly config = signal<ComponentConfig<DateTimePickerComponent>>({
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
            placeholder: {
                type: "string",
                value: "Select a date..."
            },
            popupClass: {
                type: "string",
                value: ""
            },
            popupHeight: {
                type: "number",
                nullable: true,
                min: 0,
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
            readonlyInput: {
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
            },
            weekNumber: {
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
    imports: [
        DateTimePickerComponent,
        CalendarDecadeCellTemplateDirective,
        CalendarMonthCellTemplateDirective,
        CalendarYearCellTemplateDirective,
        DateInputPrefixTemplateDirective,
        LucideDynamicIcon,
        FormField
    ],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
        @let featureData = features();
        <span>Selected Date: {{ formValueText() }}</span>
        <mona-datetime-picker
            [disabledDates]="disabledDates()"
            [firstDay]="firstDay()"
            [formField]="form.value"
            [format]="format()"
            [hourFormat]="hourFormat()"
            [hourStep]="hourStep()"
            [minuteStep]="minuteStep()"
            [placeholder]="placeholder()"
            [popupClass]="popupClass()"
            [popupHeight]="popupHeight()"
            [popupWidth]="popupWidth()"
            [readonlyInput]="readonlyInput()"
            [rounded]="rounded()"
            [secondStep]="secondStep()"
            [showClearButton]="showClearButton()"
            [showSeconds]="showSeconds()"
            [size]="size()"
            [weekNumber]="weekNumber()"
            (close)="onPopupClose($event)"
            (open)="onPopupOpen($event)">
            @if (featureData && featureData["decadeCellTemplate"].active) {
                <ng-template monaCalendarDecadeCellTemplate let-year>
                    <span class="text-violet-700 underline">{{ year }}</span>
                </ng-template>
            }
            @if (featureData && featureData["monthCellTemplate"].active) {
                <ng-template monaCalendarMonthCellTemplate let-day let-date="date">
                    <span [class.text-amber-600]="day % 5 === 0" [class.text-indigo-500]="day % 2 !== 0">
                        {{ day }}
                    </span>
                </ng-template>
            }
            @if (featureData && featureData["prefixTemplate"].active) {
                <ng-template monaDateInputPrefixTemplate>
                    <svg
                        [lucideIcon]="prefixIcon()"
                        [size]="16"
                        class="h-full aspect-square flex items-center justify-center"></svg>
                </ng-template>
            }
            @if (featureData && featureData["yearCellTemplate"].active) {
                <ng-template monaCalendarYearCellTemplate let-month let-text="text">
                    <span
                        >{{ text }} /
                        <span class="text-fuchsia-500">{{ month }}</span>
                    </span>
                </ng-template>
            }
        </mona-datetime-picker>
    `
})
class DateTimePickerWrapperComponent implements ComponentInputsAsSignal<DateTimePickerComponent> {
    readonly #formModel = signal<DateTimePickerFormModel>({ value: DateTime.now().plus({ day: 20 }).toJSDate() });
    protected readonly features = inject(FeatureConfigHandler).data;
    protected readonly form = form(this.#formModel, schema => {
        disabled(schema.value, { when: () => this.disabled() });
        maxDate(schema.value, () => this.max());
        minDate(schema.value, () => this.min());
        readonly(schema.value, { when: () => this.readonly() });
        required(schema.value, { when: () => this.required() });
    });
    protected readonly formValueText = computed(() => {
        const value = this.form.value().value();
        const format = this.format();
        return value ? DateTime.fromJSDate(value).toFormat(format) : "";
    });
    protected readonly prefixIcon = computed(() => {
        const value = this.form.value().value();
        if (!value) {
            return LucideBadgeQuestionMark;
        }
        const isWeekend = DateTime.fromJSDate(value).weekday === 6 || DateTime.fromJSDate(value).weekday === 7;
        return isWeekend ? LucideTentTree : LucideBriefcaseBusiness;
    });
    public readonly disabled = input<ReturnType<DateTimePickerComponent["disabled"]>>(false);
    public readonly disabledDates = input<ReturnType<DateTimePickerComponent["disabledDates"]>>([]);
    public readonly firstDay = input<ReturnType<DateTimePickerComponent["firstDay"]>>("monday");
    public readonly format = input<ReturnType<DateTimePickerComponent["format"]>>("dd/MM/yyyy");
    public readonly hourFormat = input<ReturnType<DateTimePickerComponent["hourFormat"]>>("24");
    public readonly hourStep = input<ReturnType<DateTimePickerComponent["hourStep"]>>(1);
    public readonly max = input<Date | undefined, unknown>(undefined, {
        transform: value => (value instanceof Date ? value : undefined)
    });
    public readonly min = input<Date | undefined, unknown>(undefined, {
        transform: value => (value instanceof Date ? value : undefined)
    });
    public readonly minuteStep = input<ReturnType<DateTimePickerComponent["minuteStep"]>>(1);
    public readonly placeholder = input<ReturnType<DateTimePickerComponent["placeholder"]>>("Select a date...");
    public readonly popupClass = input<ReturnType<DateTimePickerComponent["popupClass"]>>("");
    public readonly popupHeight = input<ReturnType<DateTimePickerComponent["popupHeight"]>>(null);
    public readonly popupWidth = input<ReturnType<DateTimePickerComponent["popupWidth"]>>(null);
    public readonly readonly = input<ReturnType<DateTimePickerComponent["readonly"]>>(false);
    public readonly readonlyInput = input<ReturnType<DateTimePickerComponent["readonlyInput"]>>(false);
    public readonly required = input<ReturnType<DateTimePickerComponent["required"]>>(false);
    public readonly rounded = input<ReturnType<DateTimePickerComponent["rounded"]>>("medium");
    public readonly secondStep = input<ReturnType<DateTimePickerComponent["secondStep"]>>(1);
    public readonly showClearButton = input<ReturnType<DateTimePickerComponent["showClearButton"]>>(false);
    public readonly showSeconds = input<ReturnType<DateTimePickerComponent["showSeconds"]>>(false);
    public readonly size = input<ReturnType<DateTimePickerComponent["size"]>>("medium");
    public readonly weekNumber = input<ReturnType<DateTimePickerComponent["weekNumber"]>>(false);

    protected onPopupClose(event: PreventableEvent) {
        const preventClose = this.features()["preventClose"].active;
        if (preventClose) {
            event.preventDefault();
            console.log("Date time picker popup prevented from closing");
        }
    }
    protected onPopupOpen(event: PreventableEvent) {
        const preventOpen = this.features()["preventOpen"].active;
        if (preventOpen) {
            event.preventDefault();
            console.log("Date time picker popup prevented from opening");
        }
    }
}

interface DateTimePickerFormModel {
    value: Date | null;
}
