import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { MultiSelectDemoComponent } from "../../../demo/components/multi-select-demo/multi-select-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-multi-select-doc",
    imports: [ApiSectionComponent, MultiSelectDemoComponent, MarkdownDocComponent],
    templateUrl: "./multi-select-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MultiSelectDocComponent {}
