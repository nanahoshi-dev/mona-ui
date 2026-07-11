import { NgTemplateOutlet } from "@angular/common";
import { Component, computed, contentChild, contentChildren, inject, input, model, TemplateRef } from "@angular/core";
import { LucideMinus, LucidePlus } from "@lucide/angular";
import { ThemeService } from "@nanahoshi/mona-ui/theme";
import { createElementControlId } from "@nanahoshi/mona-ui/internal";
import { twMerge } from "tailwind-merge";
import { ExpansionPanelActionsTemplateDirective } from "../../directives/expansion-panel-actions-template.directive";
import { ExpansionPanelIconTemplateDirective } from "../../directives/expansion-panel-icon-template.directive";
import { ExpansionPanelTitleTemplateDirective } from "../../directives/expansion-panel-title-template.directive";
import {
    EXPANSION_PANEL_STYLE_STRATEGY,
    ExpansionPanelVariantInput,
    ExpansionPanelVariantProps
} from "../../styles/expansion-panel.styles";

@Component({
    selector: "mona-expansion-panel",
    templateUrl: "./expansion-panel.component.html",
    styles: ``,
    imports: [NgTemplateOutlet, LucideMinus, LucidePlus],
    host: {
        "[class]": "baseClass()"
    }
})
export class ExpansionPanelComponent implements ExpansionPanelVariantInput {
    readonly #styleStrategy = inject(EXPANSION_PANEL_STYLE_STRATEGY);
    readonly #themeService = inject(ThemeService);
    protected readonly actionsTemplateList = contentChildren(ExpansionPanelActionsTemplateDirective, {
        read: TemplateRef
    });
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        const variantClass = this.#styleStrategy.resolve(theme).base({ rounded });
        return twMerge(variantClass, this.userClass());
    });
    protected readonly contentClass = computed(() => {
        const theme = this.#themeService.theme();
        const expanded = this.expanded();
        return this.#styleStrategy.resolve(theme).content({ expanded });
    });
    protected readonly contentId = createElementControlId();
    protected readonly headerClass = computed(() => {
        const theme = this.#themeService.theme();
        const collapsed = !this.expanded();
        const disabled = this.disabled();
        return this.#styleStrategy.resolve(theme).header({ collapsed, disabled });
    });
    protected readonly headerTitleClass = computed(() => {
        const theme = this.#themeService.theme();
        return this.#styleStrategy.resolve(theme).headerTitle();
    });
    protected readonly iconContainerClass = computed(() => {
        const theme = this.#themeService.theme();
        const hasTemplate = !!this.iconTemplate();
        return this.#styleStrategy.resolve(theme).iconContainer({ hasTemplate });
    });
    protected readonly iconTemplate = contentChild(ExpansionPanelIconTemplateDirective, { read: TemplateRef });
    protected readonly titleTemplate = contentChild(ExpansionPanelTitleTemplateDirective, { read: TemplateRef });

    /**
     * @description Disables header interaction, suppressing click and keyboard toggling.
     * @default false
     */
    public readonly disabled = input(false);

    /**
     * @description Sets whether the expansion panel is expanded or collapsed.
     * @default false
     */
    public readonly expanded = model(false);

    /**
     * @description Sets the border radius of the expansion panel.
     * @default "medium"
     */
    public readonly rounded = input<ExpansionPanelVariantProps["rounded"]>("medium");

    /**
     * @description Sets the title of the expansion panel.
     * @default ""
     */
    public readonly title = input("");

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input("");

    protected toggle(): void {
        if (this.disabled()) {
            return;
        }
        this.expanded.update(expanded => !expanded);
    }
}
