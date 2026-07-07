import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CodeViewerComponent } from "../../../demo/components/code-viewer/code-viewer.component";
import { DatePickerDemoComponent } from "../../../demo/components/date-picker-demo/date-picker-demo.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-date-picker-doc",
    imports: [CodeViewerComponent, SectionComponent, DatePickerDemoComponent],
    templateUrl: "./date-picker-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DatePickerDocComponent {
    protected readonly importCode = `import { DatePickerComponent } from "mona-ui/date-picker";`;
}
