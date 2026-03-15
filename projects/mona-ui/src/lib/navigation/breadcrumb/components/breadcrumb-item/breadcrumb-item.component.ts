import { ChangeDetectionStrategy, Component, input, output, TemplateRef, viewChild } from "@angular/core";

@Component({
    selector: "mona-breadcrumb-item",
    templateUrl: "./breadcrumb-item.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BreadcrumbItemComponent {
    /**
     * @description Whether the breadcrumb item is disabled.
     * @default false
     */
    public readonly disabled = input(false);
    /**
     * @description Event emitted when the breadcrumb item is clicked.
     * @default undefined
     */
    public readonly itemClick = output();
    public readonly templateRef = viewChild.required(TemplateRef);
}
