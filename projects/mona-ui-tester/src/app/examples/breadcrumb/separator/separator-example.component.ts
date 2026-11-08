import { Component } from "@angular/core";
import { LucideSlash } from "@lucide/angular";
import {
    BreadcrumbComponent,
    BreadcrumbItemComponent,
    BreadcrumbSeparatorTemplateDirective
} from "@nanahoshi/mona-ui/breadcrumb";

@Component({
    selector: "app-breadcrumb-separator-example",
    imports: [BreadcrumbComponent, BreadcrumbItemComponent, BreadcrumbSeparatorTemplateDirective, LucideSlash],
    templateUrl: "./separator-example.component.html"
})
export class BreadcrumbSeparatorExampleComponent {}
