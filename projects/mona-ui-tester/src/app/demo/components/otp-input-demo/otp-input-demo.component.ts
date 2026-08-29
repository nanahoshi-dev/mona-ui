import { NgComponentOutlet } from "@angular/common";
import { Component, computed, effect, inject, input, model, signal } from "@angular/core";
import { disabled, form, FormField, readonly, required } from "@angular/forms/signals";
import { LucideHeart } from "@lucide/angular";
import { OtpInputComponent, OtpInputSeparatorTemplateDirective } from "@nanahoshi/mona-ui/otp-input";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { deriveInputConfig } from "../../utils/deriveInputConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

const SEPARATOR_TEMPLATE_CODE = `<ng-template monaOtpInputSeparatorTemplate>
    <svg lucideHeart [size]="12" [color]="'red'"></svg>
</ng-template>`;

@Component({
    selector: "app-otp-input-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./otp-input-demo.component.html"
})
export class OtpInputDemoComponent extends AbstractDemoComponent<OtpInputComponent> {
    readonly #injector = createFeatureInjector({
        separatorTemplate: {
            code: SEPARATOR_TEMPLATE_CODE,
            name: "Separator Template",
            description: "The template to use for the separator rendered between OTP groups.",
            active: false
        }
    });
    protected readonly config = computed<ComponentConfig<OtpInputComponent>>(() => ({
        inputs: deriveInputConfig<OtpInputComponent>(this.metadata(), {
            // invalid/touched are written by the FormField directive via [formField] below;
            // Angular forbids binding them directly, so exclude them rather than expose a dead control.
            invalid: undefined,
            touched: undefined,
            groupLength: {
                max: 6,
                min: 1,
                nullable: true,
                type: "number",
                value: null
            },
            // The demo curates a length of 6 instead of the library's default of 4.
            length: {
                max: 12,
                min: 1,
                type: "number",
                value: 6
            },
            rounded: {
                defaultValue: "medium",
                type: "dropdown",
                value: ["none", "small", "medium", "large", "full"]
            },
            // The demo curates a "-" separator instead of the library's "" default.
            separator: {
                type: "string",
                value: "-"
            },
            size: {
                defaultValue: "medium",
                type: "dropdown",
                value: ["small", "medium", "large"]
            },
            type: {
                defaultValue: "number",
                type: "dropdown",
                value: ["number", "text", "password"]
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
                [ariaLabel]="ariaLabel()"
                [groupLength]="groupLength()"
                [length]="length()"
                [placeholder]="placeholder()"
                [rounded]="rounded()"
                [separator]="separator()"
                [size]="size()"
                [spacing]="spacing()"
                [type]="type()"
                [formField]="form.code"
                [class]="userClass()"
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
    protected readonly displayedValue = computed(() => {
        const val = this.form.code().value();
        if (this.type() === "password") {
            return "•".repeat(val.length);
        }
        return val || "(empty)";
    });
    protected readonly features = inject(FeatureConfigHandler).data;
    protected readonly form = form(this.#formModel, schema => {
        disabled(schema.code, { when: () => this.disabled() });
        readonly(schema.code, { when: () => this.readonly() });
        required(schema.code, { when: () => this.required() });
    });
    protected readonly isComplete = computed(() => {
        return this.form.code().value().length === this.length();
    });

    public readonly ariaLabel = input("Verification code");
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
    public readonly userClass = input<ReturnType<OtpInputComponent["userClass"]>>("");
    public readonly value = model("");

    public constructor() {
        effect(() => {
            this.form.code().value.set(this.value());
        });
    }

    protected onComplete(_value: string): void {
        // completion handler
    }
}

interface OtpDemoFormModel {
    code: string;
}
