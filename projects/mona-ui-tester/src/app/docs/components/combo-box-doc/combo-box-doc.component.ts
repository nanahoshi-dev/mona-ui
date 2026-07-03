import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ComboBoxDemoComponent } from "../../../demo/components/combo-box-demo/combo-box-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-combo-box-doc",
    imports: [ComboBoxDemoComponent, MarkdownDocComponent],
    templateUrl: "./combo-box-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ComboBoxDocComponent {}
