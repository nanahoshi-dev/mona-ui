import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CodeViewerComponent } from "../../../demo/components/code-viewer/code-viewer.component";
import { TimePickerDemoComponent } from "../../../demo/components/time-picker-demo/time-picker-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-time-picker-doc",
    imports: [CodeViewerComponent, MarkdownDocComponent, SectionComponent, TimePickerDemoComponent],
    templateUrl: "./time-picker-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimePickerDocComponent {
    protected readonly importCode = `import { TimePickerComponent } from "mona-ui/time-picker";`;
}
