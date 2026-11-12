import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { PopupDemoComponent } from "../../../demo/components/popup-demo/popup-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-popup-doc",
    imports: [ApiSectionComponent, PopupDemoComponent, MarkdownDocComponent],
    templateUrl: "./popup-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PopupDocComponent {}
