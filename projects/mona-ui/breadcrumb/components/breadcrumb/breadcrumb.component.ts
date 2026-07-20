import { NgTemplateOutlet } from "@angular/common";
import { Component, computed, contentChild, contentChildren, inject, input, TemplateRef } from "@angular/core";
import { LucideChevronRight } from "@lucide/angular";
import { twMerge } from "tailwind-merge";
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
    host: {
        role: "navigation",
        "[attr.aria-label]": "ariaLabel()"
    }
})
export class BreadcrumbComponent implements BreadcrumbVariantInput {
    protected readonly itemComponents = contentChildren(BreadcrumbItemComponent);
    protected readonly currentItemClass = computed(() => {
        return breadcrumbCurrentItemThemeVariants();
    });
    protected readonly listClass = computed(() => {
        const disabled = this.disabled();
        const userClass = this.userClass();
        const variantClass = breadcrumbListThemeVariants({ disabled });
        return twMerge(variantClass, userClass);
    });
    protected readonly separatorTemplate = contentChild(BreadcrumbSeparatorTemplateDirective, {
        read: TemplateRef
    });

    /**
     * @description Accessible name for the breadcrumb navigation landmark.
     * Override when multiple breadcrumb components appear on the same page.
     * @default "Breadcrumb"
     */
    public readonly ariaLabel = input("Breadcrumb", { alias: "aria-label" });

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
