import { ChangeDetectionStrategy, Component } from "@angular/core";
import { DialogDemoComponent } from "../../../demo/components/dialog-demo/dialog-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-dialog-doc",
    imports: [DialogDemoComponent, MarkdownDocComponent],
    templateUrl: "./dialog-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogDocComponent {}
