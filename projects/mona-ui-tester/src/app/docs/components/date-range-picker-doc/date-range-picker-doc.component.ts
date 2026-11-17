import { Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { DateRangePickerDemoComponent } from "../../../demo/components/date-range-picker-demo/date-range-picker-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-date-range-picker-doc",
    imports: [ApiSectionComponent, DateRangePickerDemoComponent, MarkdownDocComponent],
    templateUrl: "./date-range-picker-doc.component.html"
})
export class DateRangePickerDocComponent {}
