import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { PlaceholderDemoComponent } from "../../../demo/components/placeholder-demo/placeholder-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-placeholder-doc",
    imports: [ApiSectionComponent, PlaceholderDemoComponent, MarkdownDocComponent],
    templateUrl: "./placeholder-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlaceholderDocComponent {}
