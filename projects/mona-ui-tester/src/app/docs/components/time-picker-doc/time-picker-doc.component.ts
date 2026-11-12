import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { TimePickerDemoComponent } from "../../../demo/components/time-picker-demo/time-picker-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-time-picker-doc",
    imports: [ApiSectionComponent, TimePickerDemoComponent, MarkdownDocComponent],
    templateUrl: "./time-picker-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimePickerDocComponent {}
