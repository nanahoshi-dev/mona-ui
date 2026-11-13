import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { WindowDemoComponent } from "../../../demo/components/window-demo/window-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-window-doc",
    imports: [ApiSectionComponent, WindowDemoComponent, MarkdownDocComponent],
    templateUrl: "./window-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class WindowDocComponent {}
