import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CodeViewerComponent } from "../../../demo/components/code-viewer/code-viewer.component";
import { MultiSelectDemoComponent } from "../../../demo/components/multi-select-demo/multi-select-demo.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-multi-select-doc",
    imports: [CodeViewerComponent, SectionComponent, MultiSelectDemoComponent],
    templateUrl: "./multi-select-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MultiSelectDocComponent {
    protected readonly importCode = `import { MultiSelectComponent } from "mona-ui";`;
}
