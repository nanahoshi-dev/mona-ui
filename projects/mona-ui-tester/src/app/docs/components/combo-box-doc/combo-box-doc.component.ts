import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { ComboBoxDemoComponent } from "../../../demo/components/combo-box-demo/combo-box-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-combo-box-doc",
    imports: [ApiSectionComponent, ComboBoxDemoComponent, MarkdownDocComponent],
    templateUrl: "./combo-box-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ComboBoxDocComponent {}
