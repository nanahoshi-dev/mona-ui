import { ChangeDetectionStrategy, Component } from "@angular/core";
import { InputDemoComponent } from "../../../demo/components/input-demo/input-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-input-doc",
    imports: [InputDemoComponent, MarkdownDocComponent],
    templateUrl: "./input-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class InputDocComponent {}
