import { ChangeDetectionStrategy, Component, input, output, TemplateRef, viewChild } from "@angular/core";

@Component({
    selector: "mona-breadcrumb-item",
    templateUrl: "./breadcrumb-item.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BreadcrumbItemComponent {
    public readonly disabled = input(false);
    public readonly itemClick = output();
    public readonly templateRef = viewChild.required(TemplateRef);
}
