import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ButtonDemoComponent } from "../../../demo/components/button-demo/button-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-button-doc",
    imports: [ButtonDemoComponent, MarkdownDocComponent],
    templateUrl: "./button-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonDocComponent {}
