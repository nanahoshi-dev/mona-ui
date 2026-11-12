import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { DialogDemoComponent } from "../../../demo/components/dialog-demo/dialog-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-dialog-doc",
    imports: [ApiSectionComponent, DialogDemoComponent, MarkdownDocComponent],
    templateUrl: "./dialog-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogDocComponent {}
