import { ChangeDetectionStrategy, Component, input, TemplateRef, viewChild } from "@angular/core";

@Component({
    selector: "mona-breadcrumb-item",
    imports: [],
    templateUrl: "./breadcrumb-item.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BreadcrumbItemComponent {
    public readonly disabled = input(false);
    public readonly templateRef = viewChild.required(TemplateRef);
}
