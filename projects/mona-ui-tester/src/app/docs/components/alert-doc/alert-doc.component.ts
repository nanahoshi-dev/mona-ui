import { Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { AlertDemoComponent } from "../../../demo/components/alert-demo/alert-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-alert-doc",
    imports: [ApiSectionComponent, AlertDemoComponent, MarkdownDocComponent],
    templateUrl: "./alert-doc.component.html"
})
export class AlertDocComponent {}
