import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { DatePickerDemoComponent } from "../../../demo/components/date-picker-demo/date-picker-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-date-picker-doc",
    imports: [ApiSectionComponent, DatePickerDemoComponent, MarkdownDocComponent],
    templateUrl: "./date-picker-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DatePickerDocComponent {}
