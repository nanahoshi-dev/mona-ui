import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { SwitchDemoComponent } from "../../../demo/components/switch-demo/switch-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-switch-doc",
    imports: [ApiSectionComponent, SwitchDemoComponent, MarkdownDocComponent],
    templateUrl: "./switch-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SwitchDocComponent {}
