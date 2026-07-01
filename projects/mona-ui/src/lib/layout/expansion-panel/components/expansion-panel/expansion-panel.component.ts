import { NgTemplateOutlet } from "@angular/common";
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    contentChild,
    contentChildren,
    inject,
    input,
    model,
    TemplateRef
} from "@angular/core";
import { LucideMinus, LucidePlus } from "@lucide/angular";
import { ExpansionPanelActionsTemplateDirective } from "../../directives/expansion-panel-actions-template.directive";
import { ExpansionPanelTitleTemplateDirective } from "../../directives/expansion-panel-title-template.directive";
import { ThemeService } from "../../../../theme/services/theme.service";
import {
    expansionPanelBaseThemeVariants,
    expansionPanelContentThemeVariants,
    expansionPanelHeaderThemeVariants,
    expansionPanelHeaderTitleThemeVariants,
    expansionPanelIconContainerThemeVariants,
    ExpansionPanelVariantInput,
    ExpansionPanelVariantProps
} from "../../styles/expansion-panel.styles";
import { ExpansionPanelIconTemplateDirective } from "../../directives/expansion-panel-icon-template.directive";
import { createElementControlId } from "../../../../utils/createElementControlId";
import { twMerge } from "tailwind-merge";

@Component({
    selector: "mona-expansion-panel",
    templateUrl: "./expansion-panel.component.html",
    styles: ``,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgTemplateOutlet, LucideMinus, LucidePlus],
    host: {
        "[class]": "baseClass()"
    }
})
export class ExpansionPanelComponent implements ExpansionPanelVariantInput {
    readonly #themeService = inject(ThemeService);
    protected readonly actionsTemplateList = contentChildren(ExpansionPanelActionsTemplateDirective, {
        read: TemplateRef
    });
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        const variantClass = expansionPanelBaseThemeVariants(theme)({ rounded });
        return twMerge(variantClass, this.userClass());
    });
    protected readonly contentClass = computed(() => {
        const theme = this.#themeService.theme();
        const expanded = this.expanded();
        return expansionPanelContentThemeVariants(theme)({ expanded });
    });
    protected readonly contentId = createElementControlId();
    protected readonly headerClass = computed(() => {
        const theme = this.#themeService.theme();
        const collapsed = !this.expanded();
        const disabled = this.disabled();
        return expansionPanelHeaderThemeVariants(theme)({ collapsed, disabled });
    });
    protected readonly headerTitleClass = computed(() => {
        const theme = this.#themeService.theme();
        return expansionPanelHeaderTitleThemeVariants(theme)();
    });
    protected readonly iconContainerClass = computed(() => {
        const theme = this.#themeService.theme();
        const hasTemplate = !!this.iconTemplate();
        return expansionPanelIconContainerThemeVariants(theme)({ hasTemplate });
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
