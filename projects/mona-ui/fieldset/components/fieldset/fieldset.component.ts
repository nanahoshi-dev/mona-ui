import { NgTemplateOutlet } from "@angular/common";
import { Component, computed, contentChild, inject, input, TemplateRef } from "@angular/core";
import { ThemeService } from "@mirei/mona-ui/theme";
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
    host: {
        "[class]": "baseClass()"
    }
})
export class FieldsetComponent implements FieldsetVariantInput {
    readonly #themeService = inject(ThemeService);
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        return fieldsetBaseThemeVariants(theme)();
    });
    protected readonly fieldsetClass = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        const disabled = this.disabled();
        const userClass = this.userClass();
        return twMerge(fieldsetThemeVariants(theme)({ rounded, disabled }), userClass);
    });
    protected readonly legendClass = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        const hasTemplate = !!this.legendTemplate();
        return fieldsetLegendThemeVariants(theme)({ hasTemplate, rounded });
    });
    protected readonly legendTemplate = contentChild(FieldsetLegendTemplateDirective, { read: TemplateRef });
    protected readonly legendVisible = computed(() => {
        return !!this.legend() || !!this.legendTemplate();
    });

    /**
     * @description Whether the fieldset and its projected form controls are disabled.
     * Reflected as the native `disabled` attribute on the rendered `<fieldset>`.
     * @default false
     */
    public readonly disabled = input(false);

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
