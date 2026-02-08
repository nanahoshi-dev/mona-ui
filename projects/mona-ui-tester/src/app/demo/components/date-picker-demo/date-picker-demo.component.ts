import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, input, model, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { BadgeQuestionMark, BriefcaseBusiness, LucideAngularModule, TentTree } from "lucide-angular";
import { DateTime } from "luxon";
import {
    CalendarDecadeCellTemplateDirective,
    CalendarMonthCellTemplateDirective,
    CalendarYearCellTemplateDirective,
    DateInputPrefixTemplateDirective,
    DatePickerComponent,
    PreventableEvent
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
    selector: "app-date-picker-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./date-picker-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DatePickerDemoComponent extends AbstractDemoComponent<DatePickerComponent> {
    readonly #injector = createFeatureInjector({
        decadeCellTemplate: calendarDecadeCellTemplateFeatureConfig(),
        monthCellTemplate: calendarMonthCellTemplateFeatureConfig(),
        prefixTemplate: {
            code: ``,
            active: false,
            description: `Enable prefix template for the date picker .`,
            name: "Prefix Template"
        },
        preventClose: {
            active: false,
            code: ``,
            description: `The "close" event is fired when the popup is about to close.`,
            name: "Prevent Close"
        },
        preventOpen: {
            active: false,
            code: ``,
            description: `The "open" event is fired when the popup is about to open.`,
            name: "Prevent Open"
        },
        yearCellTemplate: calendarYearCellTemplateFeatureConfig()
    });
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
            firstDay: {
                type: "dropdown",
                value: ["sunday", "monday"],
                defaultValue: "monday"
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
                value: ["none", "small", "medium", "large", "full"],
                defaultValue: "medium"
            },
            showClearButton: {
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
    protected readonly metadata = this.getMetadata("DatePickerComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([]);
    protected readonly DatePickerWrapperComponent = DatePickerWrapperComponent;
}

@Component({
    imports: [
        DatePickerComponent,
        ReactiveFormsModule,
        CalendarDecadeCellTemplateDirective,
        CalendarMonthCellTemplateDirective,
        CalendarYearCellTemplateDirective,
        DateInputPrefixTemplateDirective,
        LucideAngularModule
    ],
    template: `
        @let featureData = features();
        <span>Selected Date: {{ formValueText() }}</span>
        <form [formGroup]="formGroup">
            <mona-date-picker
                [disabled]="disabled()"
                [disabledDates]="disabledDates()"
                [firstDay]="firstDay()"
                [formControl]="formGroup.controls.value"
                [format]="format()"
                [max]="max()"
                [min]="min()"
                [placeholder]="placeholder()"
                [popupClass]="popupClass()"
                [popupHeight]="popupHeight()"
                [popupWidth]="popupWidth()"
                [readonly]="readonly()"
                [readonlyInput]="readonlyInput()"
                [required]="required()"
                [rounded]="rounded()"
                [showClearButton]="showClearButton()"
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
                        <lucide-angular
                            [name]="prefixIcon()"
                            [size]="16"
                            class="h-full aspect-square flex items-center justify-center"></lucide-angular>
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
    protected readonly prefixIcon = computed(() => {
        const value = this.#formValue();
        if (!value) {
            return BadgeQuestionMark;
        }
        const isWeekend = DateTime.fromJSDate(value).weekday === 6 || DateTime.fromJSDate(value).weekday === 7;
        return isWeekend ? TentTree : BriefcaseBusiness;
    });
    public readonly disabled = model<ReturnType<DatePickerComponent["disabled"]>>(false);
    public readonly disabledDates = input<ReturnType<DatePickerComponent["disabledDates"]>>([]);
    public readonly firstDay = input<ReturnType<DatePickerComponent["firstDay"]>>("monday");
    public readonly format = input<ReturnType<DatePickerComponent["format"]>>("dd/MM/yyyy");
    public readonly max = input<ReturnType<DatePickerComponent["max"]>>();
    public readonly min = input<ReturnType<DatePickerComponent["min"]>>();
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
