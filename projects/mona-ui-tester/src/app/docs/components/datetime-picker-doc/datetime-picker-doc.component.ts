import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { DateTimePickerDemoComponent } from "../../../demo/components/datetime-picker-demo/datetime-picker-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-datetime-picker-doc",
    imports: [ApiSectionComponent, DateTimePickerDemoComponent, MarkdownDocComponent],
    templateUrl: "./datetime-picker-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DateTimePickerDocComponent {}
