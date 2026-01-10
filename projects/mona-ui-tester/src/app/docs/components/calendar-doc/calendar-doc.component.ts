import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CalendarDemoComponent } from "../../../demo/components/calendar-demo/calendar-demo.component";
import { CodeViewerComponent } from "../../../demo/components/code-viewer/code-viewer.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-calendar-doc",
    imports: [CodeViewerComponent, SectionComponent, CalendarDemoComponent],
    templateUrl: "./calendar-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarDocComponent {
    protected readonly importCode = `
        import { CalendarComponent } from "mona-ui";
    `;
}
