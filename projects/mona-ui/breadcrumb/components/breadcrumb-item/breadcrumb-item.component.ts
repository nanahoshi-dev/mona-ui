import { Component, input, output, TemplateRef, viewChild } from "@angular/core";

@Component({
    selector: "mona-breadcrumb-item",
    templateUrl: "./breadcrumb-item.component.html"
})
export class BreadcrumbItemComponent {
    /**
     * @description Renders this item with reduced visual emphasis and removes pointer interaction.
     * Has no visual effect when the parent breadcrumb is also disabled.
     * @default false
     */
    public readonly disabled = input(false);
    /**
     * @description Emitted when the item is clicked or activated via keyboard.
     * Not emitted when this is the last (current-page) item or when the item is disabled.
     */
    public readonly itemClick = output();
    public readonly templateRef = viewChild.required(TemplateRef);
}
