import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { CalendarDemoComponent } from "../../../demo/components/calendar-demo/calendar-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-calendar-doc",
    imports: [ApiSectionComponent, CalendarDemoComponent, MarkdownDocComponent],
    templateUrl: "./calendar-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarDocComponent {}
