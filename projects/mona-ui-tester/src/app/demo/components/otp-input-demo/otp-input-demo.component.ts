import { NgComponentOutlet } from "@angular/common";
import { Component, effect, inject, input, model, signal } from "@angular/core";
import { disabled, form, FormField, readonly, required } from "@angular/forms/signals";
import { LucideHeart } from "@lucide/angular";
import { OtpInputComponent, OtpInputSeparatorTemplateDirective } from "@nanahoshi/mona-ui/otp-input";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-otp-input-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./otp-input-demo.component.html"
})
export class OtpInputDemoComponent extends AbstractDemoComponent<OtpInputComponent> {
    readonly #injector = createFeatureInjector({
        separatorTemplate: {
            code: ``,
            name: "Separator Template",
            description: "The template to use for the separator between each slot.",
            active: false
        }
    });
    protected readonly config = signal<ComponentConfig<OtpInputComponent>>({
        inputs: {
            disabled: {
                type: "boolean",
                value: false
            },
            groupLength: {
                max: 6,
                min: 1,
                nullable: true,
                type: "number",
                value: null
            },
            length: {
                max: 12,
                min: 1,
                type: "number",
                value: 6
            },
            placeholder: {
                type: "string",
                value: ""
            },
            readonly: {
                type: "boolean",
                value: false
            },
            required: {
                type: "boolean",
                value: false
            },
            rounded: {
                defaultValue: "medium",
                type: "dropdown",
                value: ["none", "small", "medium", "large", "full"]
            },
            separator: {
                type: "string",
                value: "-"
            },
            size: {
                defaultValue: "medium",
                type: "dropdown",
                value: ["small", "medium", "large"]
            },
            spacing: {
                type: "boolean",
                value: true
            },
            type: {
                defaultValue: "number",
                type: "dropdown",
                value: ["number", "text", "password"]
            },
            value: {
                type: "string",
                value: ""
            }
        },
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("OtpInputComponent");
    protected readonly otpInputWrapperComponent = OtpInputWrapperComponent;
}

@Component({
    imports: [OtpInputComponent, FormField, OtpInputSeparatorTemplateDirective, LucideHeart],
    template: `
        @let featureData = features();
        <div class="flex flex-col items-center gap-4 w-full">
            <div class="flex items-center gap-4 text-sm">
                <span
                    >Value: <strong class="font-mono">{{ displayedValue() }}</strong></span
                >
                <span
                    >Length: <strong>{{ form.code().value().length }} / {{ length() }}</strong></span
                >
                <span
                    >Complete: <strong>{{ isComplete() ? "Yes" : "No" }}</strong></span
                >
            </div>
            <mona-otp-input
                [groupLength]="groupLength()"
                [length]="length()"
                [placeholder]="placeholder()"
                [rounded]="rounded()"
                [separator]="separator()"
                [size]="size()"
                [spacing]="spacing()"
                [type]="type()"
                [formField]="form.code"
                (complete)="onComplete($event)">
                @if (featureData["separatorTemplate"].active) {
                    <ng-template monaOtpInputSeparatorTemplate>
                        <svg lucideHeart [size]="12" [color]="'red'"></svg>
                    </ng-template>
                }
            </mona-otp-input>
        </div>
    `
})
export class OtpInputWrapperComponent implements ComponentInputsAsSignal<OtpInputComponent> {
    readonly #formModel = signal<OtpDemoFormModel>({ code: "" });
    protected readonly features = inject(FeatureConfigHandler).data;
    protected readonly form = form(this.#formModel, schema => {
        disabled(schema.code, { when: () => this.disabled() });
        readonly(schema.code, { when: () => this.readonly() });
        required(schema.code, { when: () => this.required() });
    });

    public readonly disabled = input(false);
    public readonly groupLength = input<number | number[] | null>(null);
    public readonly length = input(6);
    public readonly placeholder = input("");
    public readonly readonly = input(false);
    public readonly required = input(false);
    public readonly rounded = input<ReturnType<OtpInputComponent["rounded"]>>("medium");
    public readonly separator = input("-");
    public readonly size = input<ReturnType<OtpInputComponent["size"]>>("medium");
    public readonly spacing = input(true);
    public readonly type = input<ReturnType<OtpInputComponent["type"]>>("number");
    public readonly value = model("");

    public constructor() {
        effect(() => {
            this.form.code().value.set(this.value());
        });
    }

    protected displayedValue(): string {
        const val = this.form.code().value();
        if (this.type() === "password") {
            return "•".repeat(val.length);
        }
        return val || "(empty)";
    }

    protected isComplete(): boolean {
        return this.form.code().value().length === this.length();
    }

    protected onComplete(_value: string): void {
        // completion handler
    }
}

interface OtpDemoFormModel {
    code: string;
}
