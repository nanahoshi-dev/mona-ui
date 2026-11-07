import { Component } from "@angular/core";
import { CommandDemoComponent } from "../../../demo/components/command-demo/command-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-command-doc",
    imports: [CommandDemoComponent, MarkdownDocComponent],
    templateUrl: "./command-doc.component.html"
})
export class CommandDocComponent {}
