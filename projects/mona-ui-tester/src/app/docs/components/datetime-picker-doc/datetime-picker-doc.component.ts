import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CodeViewerComponent } from "../../../demo/components/code-viewer/code-viewer.component";
import { DateTimePickerDemoComponent } from "../../../demo/components/datetime-picker-demo/datetime-picker-demo.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-datetime-picker-doc",
    imports: [CodeViewerComponent, SectionComponent, DateTimePickerDemoComponent],
    templateUrl: "./datetime-picker-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DateTimePickerDocComponent {
    protected readonly importCode = `import { DateTimePickerComponent } from "mona-ui";`;
}
