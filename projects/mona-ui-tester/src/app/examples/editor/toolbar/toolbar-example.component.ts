import { Component, signal } from "@angular/core";
import { EditorComponent, type EditorSettings } from "@nanahoshi/mona-ui/editor";

@Component({
    selector: "app-editor-toolbar-example",
    imports: [EditorComponent],
    templateUrl: "./toolbar-example.component.html"
})
export class EditorToolbarExampleComponent {
    protected readonly comment = signal("");
    protected readonly settings: Partial<EditorSettings> = {
        alignment: false,
        fontColor: false,
        fontFamily: false,
        fontHighlight: false,
        fontSize: false,
        headings: false,
        horizontalRule: false,
        image: false,
        indent: false,
        subscript: false,
        superscript: false,
        table: false
    };
}
