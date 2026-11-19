import { Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { KanbanDemoComponent } from "../../../demo/components/kanban-demo/kanban-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-kanban-doc",
    imports: [ApiSectionComponent, KanbanDemoComponent, MarkdownDocComponent],
    templateUrl: "./kanban-doc.component.html"
})
export class KanbanDocComponent {}
