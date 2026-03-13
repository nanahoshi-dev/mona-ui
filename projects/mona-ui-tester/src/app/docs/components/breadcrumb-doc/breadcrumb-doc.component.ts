import { ChangeDetectionStrategy, Component } from "@angular/core";
import { BreadcrumbDemoComponent } from "../../../demo/components/breadcrumb-demo/breadcrumb-demo.component";
import { CodeViewerComponent } from "../../../demo/components/code-viewer/code-viewer.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-breadcrumb-doc",
    imports: [CodeViewerComponent, SectionComponent, BreadcrumbDemoComponent],
    templateUrl: "./breadcrumb-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BreadcrumbDocComponent {
    protected readonly importCode = `import { BreadcrumbComponent } from "mona-ui";`;
}
