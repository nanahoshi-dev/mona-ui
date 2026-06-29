import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CalendarDemoComponent } from "../../../demo/components/calendar-demo/calendar-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-calendar-doc",
    imports: [CalendarDemoComponent, MarkdownDocComponent],
    templateUrl: "./calendar-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarDocComponent {}
