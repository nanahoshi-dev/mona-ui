import { ChangeDetectionStrategy, Component } from "@angular/core";
import { WindowDemoComponent } from "../../../demo/components/window-demo/window-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-window-doc",
    imports: [WindowDemoComponent, MarkdownDocComponent],
    templateUrl: "./window-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class WindowDocComponent {}
