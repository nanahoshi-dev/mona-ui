import { NgTemplateOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, contentChild, inject, input, TemplateRef } from "@angular/core";
import { FieldsetLegendTemplateDirective } from "../../directives/fieldset-legend-template.directive";
import {
    fieldsetBaseThemeVariants,
    fieldsetLegendThemeVariants,
    fieldsetThemeVariants,
    FieldsetVariantInput,
    FieldsetVariantProps
} from "../../styles/fieldset.styles";
import { ThemeService } from "../../../../theme/services/theme.service";
import { twMerge } from "tailwind-merge";

@Component({
    selector: "mona-fieldset",
    templateUrl: "./fieldset.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgTemplateOutlet],
    host: {
        "[class]": "baseClass()"
    }
})
export class FieldsetComponent implements FieldsetVariantInput {
    readonly #themeService = inject(ThemeService);
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const variantClass = fieldsetBaseThemeVariants(theme)();
        const userClass = this.userClass();
        return twMerge(variantClass, userClass);
    });
    protected readonly fieldsetClass = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        return fieldsetThemeVariants(theme)({ rounded });
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
     * @description The legend text of the fieldset. Shown in the top border as a labelled notch.
     * Ignored when `monaFieldsetLegendTemplate` is provided.
     * @default ""
     */
    public readonly legend = input("");

    /**
     * @description Border-radius preset applied to the fieldset and its legend.
     * @default "medium"
     */
    public readonly rounded = input<FieldsetVariantProps["rounded"]>("medium");

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input("", { alias: "class" });
}
