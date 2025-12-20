import { ChangeDetectionStrategy, Component } from "@angular/core";
import { AutoCompleteDemoComponent } from "../../../demo/components/auto-complete-demo/auto-complete-demo.component";
import { CodeViewerComponent } from "../../../demo/components/code-viewer/code-viewer.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-auto-complete-doc",
    imports: [CodeViewerComponent, SectionComponent, AutoCompleteDemoComponent],
    templateUrl: "./auto-complete-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AutoCompleteDocComponent {
    protected readonly importCode = `import { AutoCompleteComponent } from "mona-ui";`;
}
