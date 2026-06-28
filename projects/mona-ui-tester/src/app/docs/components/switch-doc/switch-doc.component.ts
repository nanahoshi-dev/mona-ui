import { ChangeDetectionStrategy, Component } from "@angular/core";
import { SwitchDemoComponent } from "../../../demo/components/switch-demo/switch-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-switch-doc",
    imports: [SwitchDemoComponent, MarkdownDocComponent],
    templateUrl: "./switch-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SwitchDocComponent {}
