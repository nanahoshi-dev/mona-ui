import { NgTemplateOutlet } from "@angular/common";
import { Component, computed, contentChild, contentChildren, inject, input, TemplateRef } from "@angular/core";
import { LucideChevronRight } from "@lucide/angular";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { twMerge } from "tailwind-merge";
import { BreadcrumbItemDirective } from "../../directives/breadcrumb-item.directive";
import { BreadcrumbSeparatorTemplateDirective } from "../../directives/breadcrumb-separator-template.directive";
import { BREADCRUMB_DEFAULT_MESSAGES } from "../../i18n/breadcrumb.default-messages";
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
    host: {
        role: "navigation",
        "[attr.aria-label]": "ariaLabel() || messages().breadcrumb"
    }
})
export class BreadcrumbComponent implements BreadcrumbVariantInput {
    readonly #i18n = inject(MonaI18nService);
    protected readonly currentItemClass = computed(() => {
        return breadcrumbCurrentItemThemeVariants();
    });
    protected readonly itemComponents = contentChildren(BreadcrumbItemComponent);
    protected readonly listClass = computed(() => {
        const disabled = this.disabled();
        const userClass = this.userClass();
        const variantClass = breadcrumbListThemeVariants({ disabled });
        return twMerge(variantClass, userClass);
    });
    protected readonly messages = this.#i18n.componentMessages("breadcrumb", BREADCRUMB_DEFAULT_MESSAGES);
    protected readonly separatorTemplate = contentChild(BreadcrumbSeparatorTemplateDirective, {
        read: TemplateRef
    });

    /**
     * @description Accessible name for the breadcrumb navigation landmark.
     * Override when multiple breadcrumb components appear on the same page.
     * @default ""
     */
    public readonly ariaLabel = input<string>("", { alias: "aria-label" });

    /**
     * @description Renders the entire breadcrumb with reduced visual emphasis and removes pointer interaction from all items.
     * @default false
     */
    public readonly disabled = input(false);

    /**
     * @description Additional CSS classes merged onto the breadcrumb list via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string>("", { alias: "class" });

    protected onItemClick(item: BreadcrumbItemComponent): void {
        if (this.disabled() || item.disabled()) {
            return;
        }
        item.itemClick.emit();
    }
}
