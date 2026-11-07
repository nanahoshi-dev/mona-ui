import { Component, signal } from "@angular/core";
import { EditorComponent } from "@nanahoshi/mona-ui/editor";

@Component({
    selector: "app-editor-basic-example",
    imports: [EditorComponent],
    templateUrl: "./basic-example.component.html"
})
export class EditorBasicExampleComponent {
    protected readonly notes = signal("<h2>Release notes</h2><p>The editor now keeps <strong>bold</strong> and <em>italic</em> text.</p>");
}
