import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { BreadcrumbDemoComponent } from "../../../demo/components/breadcrumb-demo/breadcrumb-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-breadcrumb-doc",
    imports: [ApiSectionComponent, BreadcrumbDemoComponent, MarkdownDocComponent],
    templateUrl: "./breadcrumb-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BreadcrumbDocComponent {}
