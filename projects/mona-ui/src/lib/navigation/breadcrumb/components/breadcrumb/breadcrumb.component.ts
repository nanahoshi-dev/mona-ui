import { NgTemplateOutlet } from "@angular/common";
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    contentChild,
    contentChildren,
    inject,
    input,
    TemplateRef
} from "@angular/core";
import { LucideChevronRight } from "@lucide/angular";
import { twMerge } from "tailwind-merge";
import { ThemeService } from "../../../../theme/services/theme.service";
import { BreadcrumbItemDirective } from "../../directives/breadcrumb-item.directive";
import { BreadcrumbSeparatorTemplateDirective } from "../../directives/breadcrumb-separator-template.directive";
import {
    breadcrumbCurrentItemThemeVariants,
    breadcrumbListThemeVariants,
    BreadcrumbVariantInput
} from "../../styles/breadcrumb.styles";
import { BreadcrumbItemComponent } from "../breadcrumb-item/breadcrumb-item.component";

@Component({
    selector: "mona-breadcrumb",
    templateUrl: "./breadcrumb.component.html",
    imports: [NgTemplateOutlet, BreadcrumbItemDirective, LucideChevronRight],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        role: "navigation",
        "[attr.aria-label]": "ariaLabel()"
    }
})
export class BreadcrumbComponent implements BreadcrumbVariantInput {
    readonly #themeService = inject(ThemeService);
    protected readonly itemComponents = contentChildren(BreadcrumbItemComponent);
    protected readonly currentItemClass = computed(() => {
        const theme = this.#themeService.theme();
        return breadcrumbCurrentItemThemeVariants(theme)();
    });
    protected readonly listClass = computed(() => {
        const theme = this.#themeService.theme();
        const disabled = this.disabled();
        const userClass = this.userClass();
        const variantClass = breadcrumbListThemeVariants(theme)({ disabled });
        return twMerge(variantClass, userClass);
    });
    protected readonly separatorTemplate = contentChild(BreadcrumbSeparatorTemplateDirective, {
        read: TemplateRef
    });

    /**
     * @description Sets the aria-label for the breadcrumb navigation landmark.
     * @default "Breadcrumb"
     */
    public readonly ariaLabel = input("Breadcrumb", { alias: "aria-label" });

    /**
     * @description Whether the entire breadcrumb component is disabled.
     * @default false
     */
    public readonly disabled = input(false);

    /**
     * @description Additional CSS classes merged onto the breadcrumb list element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string>("", { alias: "class" });

    protected onItemClick(item: BreadcrumbItemComponent): void {
        if (item.disabled()) {
            return;
        }
        item.itemClick.emit();
    }
}
