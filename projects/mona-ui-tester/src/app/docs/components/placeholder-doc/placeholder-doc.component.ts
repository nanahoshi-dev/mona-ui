import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CodeViewerComponent } from "../../../demo/components/code-viewer/code-viewer.component";
import { SectionComponent } from "../../../layout/components/section/section.component";
import { PlaceholderDemoComponent } from "../../../demo/components/placeholder-demo/placeholder-demo.component";

@Component({
    selector: "app-placeholder-doc",
    imports: [CodeViewerComponent, SectionComponent, PlaceholderDemoComponent],
    templateUrl: "./placeholder-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlaceholderDocComponent {
    protected readonly importCode = `import { PlaceholderComponent } from "mona-ui";`;
}
