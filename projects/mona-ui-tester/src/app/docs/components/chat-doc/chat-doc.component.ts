import { Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { ChatDemoComponent } from "../../../demo/components/chat-demo/chat-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-chat-doc",
    imports: [ApiSectionComponent, ChatDemoComponent, MarkdownDocComponent],
    templateUrl: "./chat-doc.component.html"
})
export class ChatDocComponent {}
