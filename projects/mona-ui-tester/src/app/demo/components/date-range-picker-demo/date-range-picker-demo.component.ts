import { NgComponentOutlet } from "@angular/common";
import { booleanAttribute, Component, computed, input, numberAttribute, signal } from "@angular/core";
import { disabled, form, FormField, readonly, required } from "@angular/forms/signals";
import {
    type DateRange,
    DateRangePickerComponent,
    type DateRangePreset,
    type DateRangePresetKey
} from "@nanahoshi/mona-ui/date-range-picker";
import { FormFieldComponent } from "@nanahoshi/mona-ui/form-field";
import { DateTime } from "luxon";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { deriveInputConfig } from "../../utils/deriveInputConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

type PresetList = readonly (DateRangePreset | DateRangePresetKey)[];

const PRESET_LISTS: readonly { text: string; value: PresetList }[] = [
    { text: "None", value: [] },
    { text: "Days and weeks", value: ["today", "yesterday", "last7Days", "thisWeek", "lastWeek"] },
    {
        text: "Reporting",
        value: ["today", "last7Days", "last30Days", "thisMonth", "lastMonth", "thisYear", "lastYear"]
    }
];

@Component({
    selector: "app-date-range-picker-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./date-range-picker-demo.component.html"
})
export class DateRangePickerDemoComponent extends AbstractDemoComponent<DateRangePickerComponent> {
    protected readonly config = computed<ComponentConfig<DateRangePickerComponent>>(() => ({
        inputs: deriveInputConfig<DateRangePickerComponent>(this.metadata(), {
            adaptiveMode: {
                type: "dropdown",
                value: ["none", "auto"],
                defaultValue: "none"
            },
            adaptiveTitle: {
                type: "string",
                value: ""
            },
            // The demo names the picker with a form field around it.
            ariaDescribedBy: undefined,
            ariaLabel: undefined,
            ariaLabelledBy: undefined,
            disabledDates: {
                type: "iterable",
                value: []
            },
            firstDay: {
                type: "dropdown",
                value: ["sunday", "monday"],
                defaultValue: null
            },
            // invalid/touched are written by the FormField directive via [formField] below;
            // Angular forbids binding them directly, so exclude them rather than expose a dead control.
            invalid: undefined,
            touched: undefined,
            maxDate: {
                type: "dropdown",
                value: [DateTime.now().plus({ months: 3 }).startOf("day").toJSDate()],
                defaultValue: null
            },
            minDate: {
                type: "dropdown",
                value: [DateTime.now().startOf("day").toJSDate()],
                defaultValue: null
            },
            months: {
                type: "number",
                min: 1,
                max: 4,
                value: 2
            },
            presets: {
                type: "customDropdown",
                value: PRESET_LISTS,
                textField: "text",
                valueField: "value",
                defaultValue: PRESET_LISTS[2].value
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
        })
    }));
    protected readonly metadata = this.getMetadata("DateRangePickerComponent");
    protected readonly wrapperComponent = DateRangePickerWrapperComponent;
}

@Component({
    imports: [DateRangePickerComponent, FormField, FormFieldComponent],
    template: `
        <mona-form-field label="Stay" [hint]="hint()">
            <mona-date-range-picker
                [adaptiveMode]="adaptiveMode()"
                [adaptiveTitle]="adaptiveTitle()"
                [class]="userClass()"
                [disabledDates]="disabledDates()"
                [endPlaceholder]="endPlaceholder()"
                [firstDay]="firstDay()"
                [format]="format()"
                [formField]="booking.stay"
                [maxDate]="maxDate()"
                [minDate]="minDate()"
                [months]="months()"
                [popupClass]="popupClass()"
                [popupHeight]="popupHeight()"
                [popupWidth]="popupWidth()"
                [presets]="presets()"
                [readonlyInput]="readonlyInput()"
                [rounded]="rounded()"
                [showClearButton]="showClearButton()"
                [size]="size()"
                [startPlaceholder]="startPlaceholder()"
                [weekNumber]="weekNumber()" />
        </mona-form-field>
    `,
    host: {
        class: "w-full max-w-md"
    }
})
class DateRangePickerWrapperComponent implements ComponentInputsAsSignal<DateRangePickerComponent> {
    readonly #model = signal<{ stay: DateRange | null }>({ stay: null });
    protected readonly booking = form(this.#model, path => {
        disabled(path.stay, { when: () => this.disabled() });
        readonly(path.stay, { when: () => this.readonly() });
        required(path.stay, { when: () => this.required() });
    });
    protected readonly hint = computed(() => {
        const stay = this.booking.stay().value();
        if (!stay?.start || !stay.end) {
            return "Pick the night you arrive, then the morning you leave.";
        }
        const nights = Math.round(DateTime.fromJSDate(stay.end).diff(DateTime.fromJSDate(stay.start), "days").days);
        return nights === 1 ? "1 night" : `${nights} nights`;
    });
    public readonly adaptiveMode = input<ReturnType<DateRangePickerComponent["adaptiveMode"]>>("none");
    public readonly adaptiveTitle = input("");
    public readonly disabled = input(false, { transform: booleanAttribute });
    public readonly disabledDates = input<ReturnType<DateRangePickerComponent["disabledDates"]>>([]);
    public readonly endPlaceholder = input<ReturnType<DateRangePickerComponent["endPlaceholder"]>>("");
    public readonly firstDay = input<ReturnType<DateRangePickerComponent["firstDay"]>>(null);
    public readonly format = input<ReturnType<DateRangePickerComponent["format"]>>(null);
    public readonly maxDate = input<Date | undefined, unknown>(undefined, {
        transform: value => (value instanceof Date ? value : undefined)
    });
    public readonly minDate = input<Date | undefined, unknown>(undefined, {
        transform: value => (value instanceof Date ? value : undefined)
    });
    public readonly months = input(2, { transform: (value: unknown) => numberAttribute(value, 2) });
    public readonly popupClass = input<ReturnType<DateRangePickerComponent["popupClass"]>>("");
    public readonly popupHeight = input<ReturnType<DateRangePickerComponent["popupHeight"]>>(null);
    public readonly popupWidth = input<ReturnType<DateRangePickerComponent["popupWidth"]>>(null);
    public readonly presets = input<PresetList>(PRESET_LISTS[2].value);
    public readonly readonly = input(false, { transform: booleanAttribute });
    public readonly readonlyInput = input(false, { transform: booleanAttribute });
    public readonly required = input(false, { transform: booleanAttribute });
    public readonly rounded = input<ReturnType<DateRangePickerComponent["rounded"]>>("medium");
    public readonly showClearButton = input(false, { transform: booleanAttribute });
    public readonly size = input<ReturnType<DateRangePickerComponent["size"]>>("medium");
    public readonly startPlaceholder = input<ReturnType<DateRangePickerComponent["startPlaceholder"]>>("");
    public readonly userClass = input<ReturnType<DateRangePickerComponent["userClass"]>>("");
    public readonly weekNumber = input(false, { transform: booleanAttribute });
}
