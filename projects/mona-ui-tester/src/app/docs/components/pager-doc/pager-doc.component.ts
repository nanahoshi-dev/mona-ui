import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CodeViewerComponent } from "../../../demo/components/code-viewer/code-viewer.component";
import { PagerDemoComponent } from "../../../demo/components/pager-demo/pager-demo.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-pager-doc",
    imports: [CodeViewerComponent, SectionComponent, PagerDemoComponent],
    templateUrl: "./pager-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PagerDocComponent {
    protected readonly importCode = `
        import { PagerComponent } from "mona-ui";
    `;
}
