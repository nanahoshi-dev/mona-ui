import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { RadioButtonDemoComponent } from "../../../demo/components/radio-button-demo/radio-button-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-radio-button-doc",
    imports: [ApiSectionComponent, RadioButtonDemoComponent, MarkdownDocComponent],
    templateUrl: "./radio-button-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RadioButtonDocComponent {}
