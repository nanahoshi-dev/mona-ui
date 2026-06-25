import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CheckboxDemoComponent } from "../../../demo/components/checkbox-demo/checkbox-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-checkbox-doc",
    imports: [CheckboxDemoComponent, MarkdownDocComponent],
    templateUrl: "./checkbox-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckboxDocComponent {}
