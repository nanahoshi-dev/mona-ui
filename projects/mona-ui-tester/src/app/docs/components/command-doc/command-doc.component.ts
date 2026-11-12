import { Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { CommandDemoComponent } from "../../../demo/components/command-demo/command-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-command-doc",
    imports: [ApiSectionComponent, CommandDemoComponent, MarkdownDocComponent],
    templateUrl: "./command-doc.component.html"
})
export class CommandDocComponent {}
