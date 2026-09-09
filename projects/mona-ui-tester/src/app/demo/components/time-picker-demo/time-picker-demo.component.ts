import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from "@angular/core";
import { disabled, form, FormField, maxDate, minDate, readonly, required } from "@angular/forms/signals";
import { TimePickerComponent } from "@nanahoshi/mona-ui/time-picker";
import type { PreventableEvent } from "@nanahoshi/mona-ui/common";
import { DateTime } from "luxon";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { deriveInputConfig } from "../../utils/deriveInputConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-time-picker-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./time-picker-demo.component.html"
})
export class TimePickerDemoComponent extends AbstractDemoComponent<TimePickerComponent> {
    readonly #injector = createFeatureInjector({
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
        }
    });
    protected readonly TimePickerWrapperComponent = TimePickerWrapperComponent;
    protected readonly config = computed<ComponentConfig<TimePickerComponent>>(() => ({
        inputs: deriveInputConfig<TimePickerComponent>(this.metadata(), {
            hourFormat: {
                type: "dropdown",
                value: ["12", "24"],
                defaultValue: "24"
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
            popupHeight: {
                type: "number",
                nullable: true,
                min: 0,
                max: 500,
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
    protected readonly metadata = this.getMetadata("TimePickerComponent");
}

@Component({
    imports: [TimePickerComponent, FormField],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
        <span>Selected Time: {{ formValueText() }}</span>
        <mona-time-picker
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
            (close)="onPopupClose($event)"
            (open)="onPopupOpen($event)"
            [class]="'w-32 ' + userClass()">
        </mona-time-picker>
    `
})
class TimePickerWrapperComponent implements ComponentInputsAsSignal<TimePickerComponent> {
    readonly #formModel = signal<TimePickerFormModel>({ value: null });
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
        const hourMode = this.hourFormat();
        if (!value) {
            return "";
        }
        const dt = DateTime.fromJSDate(value);
        if (hourMode === "12") {
            return dt.toFormat(`${format} a`);
        }
        return dt.toFormat(format);
    });
    public readonly disabled = input<ReturnType<TimePickerComponent["disabled"]>>(false);
    public readonly format = input<ReturnType<TimePickerComponent["format"]>>("HH:mm");
    public readonly hourFormat = input<ReturnType<TimePickerComponent["hourFormat"]>>("24");
    public readonly hourStep = input<ReturnType<TimePickerComponent["hourStep"]>>(1);
    public readonly max = input<Date | undefined, unknown>(undefined, {
        transform: value => (value instanceof Date ? value : undefined)
    });
    public readonly min = input<Date | undefined, unknown>(undefined, {
        transform: value => (value instanceof Date ? value : undefined)
    });
    public readonly minuteStep = input<ReturnType<TimePickerComponent["minuteStep"]>>(1);
    public readonly placeholder = input<ReturnType<TimePickerComponent["placeholder"]>>("");
    public readonly popupClass = input<ReturnType<TimePickerComponent["popupClass"]>>("");
    public readonly popupHeight = input<ReturnType<TimePickerComponent["popupHeight"]>>(null);
    public readonly popupWidth = input<ReturnType<TimePickerComponent["popupWidth"]>>(null);
    public readonly readonly = input<ReturnType<TimePickerComponent["readonly"]>>(false);
    public readonly readonlyInput = input<ReturnType<TimePickerComponent["readonlyInput"]>>(false);
    public readonly required = input<ReturnType<TimePickerComponent["required"]>>(false);
    public readonly rounded = input<ReturnType<TimePickerComponent["rounded"]>>("medium");
    public readonly secondStep = input<ReturnType<TimePickerComponent["secondStep"]>>(1);
    public readonly showClearButton = input<ReturnType<TimePickerComponent["showClearButton"]>>(false);
    public readonly showSeconds = input<ReturnType<TimePickerComponent["showSeconds"]>>(false);
    public readonly size = input<ReturnType<TimePickerComponent["size"]>>("medium");
    public readonly userClass = input<ReturnType<TimePickerComponent["userClass"]>>("");

    protected onPopupClose(event: PreventableEvent) {
        const preventClose = this.features()["preventClose"].active;
        if (preventClose) {
            event.preventDefault();
            console.log("Time picker popup prevented from closing");
        }
    }
    protected onPopupOpen(event: PreventableEvent) {
        const preventOpen = this.features()["preventOpen"].active;
        if (preventOpen) {
            event.preventDefault();
            console.log("Time picker popup prevented from opening");
        }
    }
}

interface TimePickerFormModel {
    value: Date | null;
}
