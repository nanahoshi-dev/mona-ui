import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CodeViewerComponent } from "../../../demo/components/code-viewer/code-viewer.component";
import { ScrollViewDemoComponent } from "../../../demo/components/scroll-view-demo/scroll-view-demo.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-scroll-view-doc",
    imports: [CodeViewerComponent, SectionComponent, ScrollViewDemoComponent],
    templateUrl: "./scroll-view-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScrollViewDocComponent {
    protected readonly importCode = `import { ScrollViewComponent } from "mona-ui";`;
}
