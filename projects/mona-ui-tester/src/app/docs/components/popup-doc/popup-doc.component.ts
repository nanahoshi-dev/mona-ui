import { ChangeDetectionStrategy, Component } from "@angular/core";
import { PopupDemoComponent } from "../../../demo/components/popup-demo/popup-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-popup-doc",
    imports: [PopupDemoComponent, MarkdownDocComponent],
    templateUrl: "./popup-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PopupDocComponent {}
