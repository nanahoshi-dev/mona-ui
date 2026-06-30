import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ContextMenuDemoComponent } from "../../../demo/components/contextmenu-demo/contextmenu-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-contextmenu-doc",
    imports: [ContextMenuDemoComponent, MarkdownDocComponent],
    templateUrl: "./contextmenu-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContextMenuDocComponent {}
