import { NgComponentOutlet } from "@angular/common";
import { Component, computed, inject, input, signal } from "@angular/core";
import { disabled, form, FormField, maxDate, minDate, readonly, required } from "@angular/forms/signals";
import { LucideBadgeQuestionMark, LucideBriefcaseBusiness, LucideDynamicIcon, LucideTentTree } from "@lucide/angular";
import {
    CalendarDecadeCellTemplateDirective,
    CalendarMonthCellTemplateDirective,
    CalendarYearCellTemplateDirective
} from "@nanahoshi/mona-ui/calendar";
import type { PreventableEvent } from "@nanahoshi/mona-ui/common";
import { DateInputPrefixTemplateDirective } from "@nanahoshi/mona-ui/date-input";
import { DatePickerComponent } from "@nanahoshi/mona-ui/date-picker";
import { DateTime } from "luxon";
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
    <span class="text-violet-700 underline">{{ year }}</span>
</ng-template>`;

const MONTH_CELL_TEMPLATE_CODE = `<ng-template monaCalendarMonthCellTemplate let-day let-date="date">
    <span [class.text-amber-600]="day % 5 === 0" [class.text-indigo-500]="day % 2 !== 0">
        {{ day }}
    </span>
</ng-template>`;

const YEAR_CELL_TEMPLATE_CODE = `<ng-template monaCalendarYearCellTemplate let-month let-text="text">
    <span
        >{{ text }} /
        <span class="text-fuchsia-500">{{ month }}</span>
    </span>
</ng-template>`;

const PREFIX_TEMPLATE_CODE = `<ng-template monaDateInputPrefixTemplate>
    <svg
        [lucideIcon]="prefixIcon()"
        [size]="16"
        class="h-full aspect-square flex items-center justify-center"></svg>
</ng-template>`;

@Component({
    selector: "app-date-picker-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./date-picker-demo.component.html"
})
export class DatePickerDemoComponent extends AbstractDemoComponent<DatePickerComponent> {
    readonly #injector = createFeatureInjector({
        decadeCellTemplate: { ...calendarDecadeCellTemplateFeatureConfig(), code: DECADE_CELL_TEMPLATE_CODE },
        monthCellTemplate: { ...calendarMonthCellTemplateFeatureConfig(), code: MONTH_CELL_TEMPLATE_CODE },
        prefixTemplate: {
            active: false,
            code: PREFIX_TEMPLATE_CODE,
            description: `Enable prefix template for the date picker .`,
            name: "Prefix Template"
        },
        preventClose: {
            active: false,
            description: `The "close" event is fired when the popup is about to close.`,
            name: "Prevent Close"
        },
        preventOpen: {
            active: false,
            code: ``,
            description: `The "open" event is fired when the popup is about to open.`,
            name: "Prevent Open"
        },
        yearCellTemplate: { ...calendarYearCellTemplateFeatureConfig(), code: YEAR_CELL_TEMPLATE_CODE }
    });
    protected readonly config = computed<ComponentConfig<DatePickerComponent>>(() => ({
        inputs: deriveInputConfig<DatePickerComponent>(this.metadata(), {
            disabledDates: {
                type: "iterable",
                value: []
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
            // The demo curates a starting placeholder instead of the library's empty default.
            placeholder: {
                type: "string",
                value: "Select a date..."
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
            rounded: {
                type: "dropdown",
                value: ["none", "small", "medium", "large", "full"],
                defaultValue: "medium"
            },
            size: {
                type: "dropdown",
                value: ["small", "medium", "large"],
                defaultValue: "medium"
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
    protected readonly metadata = this.getMetadata("DatePickerComponent");
    protected readonly DatePickerWrapperComponent = DatePickerWrapperComponent;
}

@Component({
    imports: [
        DatePickerComponent,
        CalendarDecadeCellTemplateDirective,
        CalendarMonthCellTemplateDirective,
        CalendarYearCellTemplateDirective,
        DateInputPrefixTemplateDirective,
        LucideDynamicIcon,
        FormField
    ],
    template: `
        @let featureData = features();
        <span>Selected Date: {{ formValueText() }}</span>
        <mona-date-picker
            [disabledDates]="disabledDates()"
            [firstDay]="firstDay()"
            [formField]="form.value"
            [format]="format()"
            [placeholder]="placeholder()"
            [popupClass]="popupClass()"
            [popupHeight]="popupHeight()"
            [popupWidth]="popupWidth()"
            [readonlyInput]="readonlyInput()"
            [rounded]="rounded()"
            [showClearButton]="showClearButton()"
            [size]="size()"
            [weekNumber]="weekNumber()"
            [class]="userClass()"
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
        </mona-date-picker>
    `
})
class DatePickerWrapperComponent implements ComponentInputsAsSignal<DatePickerComponent> {
    readonly #formModel = signal<DatePickerFormModel>({ value: null });
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
        return value ? DateTime.fromJSDate(value).toFormat("dd/MM/yyyy") : "";
    });
    protected readonly prefixIcon = computed(() => {
        const value = this.form.value().value();
        if (!value) {
            return LucideBadgeQuestionMark;
        }
        const isWeekend = DateTime.fromJSDate(value).weekday === 6 || DateTime.fromJSDate(value).weekday === 7;
        return isWeekend ? LucideTentTree : LucideBriefcaseBusiness;
    });
    public readonly disabled = input<ReturnType<DatePickerComponent["disabled"]>>(false);
    public readonly disabledDates = input<ReturnType<DatePickerComponent["disabledDates"]>>([]);
    public readonly firstDay = input<ReturnType<DatePickerComponent["firstDay"]>>("monday");
    public readonly format = input<ReturnType<DatePickerComponent["format"]>>("dd/MM/yyyy");
    public readonly max = input<Date | undefined, unknown>(undefined, {
        transform: value => (value instanceof Date ? value : undefined)
    });
    public readonly min = input<Date | undefined, unknown>(undefined, {
        transform: value => (value instanceof Date ? value : undefined)
    });
    public readonly placeholder = input<ReturnType<DatePickerComponent["placeholder"]>>("Select an option");
    public readonly popupClass = input<ReturnType<DatePickerComponent["popupClass"]>>("");
    public readonly popupHeight = input<ReturnType<DatePickerComponent["popupHeight"]>>(null);
    public readonly popupWidth = input<ReturnType<DatePickerComponent["popupWidth"]>>(null);
    public readonly readonly = input<ReturnType<DatePickerComponent["readonly"]>>(false);
    public readonly readonlyInput = input<ReturnType<DatePickerComponent["readonlyInput"]>>(false);
    public readonly required = input<ReturnType<DatePickerComponent["required"]>>(false);
    public readonly rounded = input<ReturnType<DatePickerComponent["rounded"]>>("none");
    public readonly showClearButton = input<ReturnType<DatePickerComponent["showClearButton"]>>(false);
    public readonly size = input<ReturnType<DatePickerComponent["size"]>>("medium");
    public readonly userClass = input<ReturnType<DatePickerComponent["userClass"]>>("");
    public readonly weekNumber = input<ReturnType<DatePickerComponent["weekNumber"]>>(false);

    protected onPopupClose(event: PreventableEvent) {
        const preventClose = this.features()["preventClose"].active;
        if (preventClose) {
            event.preventDefault();
            console.log("Date picker popup prevented from closing");
        }
    }
    protected onPopupOpen(event: PreventableEvent) {
        const preventOpen = this.features()["preventOpen"].active;
        if (preventOpen) {
            event.preventDefault();
            console.log("Date picker popup prevented from opening");
        }
    }
}

interface DatePickerFormModel {
    value: Date | null;
}
