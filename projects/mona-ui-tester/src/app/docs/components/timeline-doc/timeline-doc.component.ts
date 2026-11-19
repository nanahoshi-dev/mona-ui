import { Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { TimelineDemoComponent } from "../../../demo/components/timeline-demo/timeline-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-timeline-doc",
    imports: [ApiSectionComponent, TimelineDemoComponent, MarkdownDocComponent],
    templateUrl: "./timeline-doc.component.html"
})
export class TimelineDocComponent {}
