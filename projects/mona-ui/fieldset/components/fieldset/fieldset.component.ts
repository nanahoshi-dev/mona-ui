import { NgTemplateOutlet } from "@angular/common";
import { booleanAttribute, Component, computed, contentChild, inject, input, TemplateRef } from "@angular/core";
import { MONA_FIELDSET_DISABLED } from "@nanahoshi/mona-ui/internal";
import { twMerge } from "tailwind-merge";
import { FieldsetLegendTemplateDirective } from "../../directives/fieldset-legend-template.directive";
import {
    fieldsetBaseThemeVariants,
    fieldsetLegendThemeVariants,
    fieldsetThemeVariants,
    FieldsetVariantInput,
    FieldsetVariantProps
} from "../../styles/fieldset.styles";

@Component({
    selector: "mona-fieldset",
    templateUrl: "./fieldset.component.html",
    imports: [NgTemplateOutlet],
    providers: [{ provide: MONA_FIELDSET_DISABLED, useFactory: () => inject(FieldsetComponent).effectiveDisabled }],
    host: {
        "[class]": "baseClass()"
    }
})
export class FieldsetComponent implements FieldsetVariantInput {
    readonly #parentDisabled = inject(MONA_FIELDSET_DISABLED, { optional: true, skipSelf: true });
    protected readonly baseClass = computed(() => {
        return fieldsetBaseThemeVariants();
    });
    protected readonly fieldsetClass = computed(() => {
        const rounded = this.rounded();
        const disabled = this.disabled();
        const userClass = this.userClass();
        return twMerge(fieldsetThemeVariants({ rounded, disabled }), userClass);
    });
    protected readonly legendClass = computed(() => {
        const rounded = this.rounded();
        const hasTemplate = !!this.legendTemplate();
        return fieldsetLegendThemeVariants({ hasTemplate, rounded });
    });
    protected readonly legendTemplate = contentChild(FieldsetLegendTemplateDirective, { read: TemplateRef });
    protected readonly legendVisible = computed(() => {
        return !!this.legend() || !!this.legendTemplate();
    });

    /**
     * @description Whether the fieldset and the Mona UI form controls inside it are disabled, including nested fieldsets.
     * Reflected as the native `disabled` attribute on the rendered `<fieldset>`, which also covers native controls.
     * A signal form field inside stays enabled in the form model, so its validation keeps running.
     * @default false
     */
    public readonly disabled = input(false, { transform: booleanAttribute });

    /**
     * @internal
     */
    public readonly effectiveDisabled = computed(() => this.disabled() || (this.#parentDisabled?.() ?? false));

    /**
     * @description The legend text of the fieldset. Shown in the top border as a labelled notch.
     * Ignored when `monaFieldsetLegendTemplate` is provided.
     * @default ""
     */
    public readonly legend = input("");

    /**
     * @description The `name` attribute reflected onto the rendered `<fieldset>` element.
     * @default undefined
     */
    public readonly name = input<string | undefined>(undefined);

    /**
     * @description Border-radius preset applied to the fieldset and its legend.
     * @default "medium"
     */
    public readonly rounded = input<FieldsetVariantProps["rounded"]>("medium");

    /**
     * @description Additional CSS classes merged onto the rendered `<fieldset>` element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input("", { alias: "class" });
}
