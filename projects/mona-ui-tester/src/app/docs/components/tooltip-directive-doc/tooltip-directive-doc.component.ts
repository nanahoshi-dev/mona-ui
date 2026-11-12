import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { TooltipDirectiveDemoComponent } from "../../../demo/components/tooltip-directive-demo/tooltip-directive-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-tooltip-directive-doc",
    imports: [ApiSectionComponent, TooltipDirectiveDemoComponent, MarkdownDocComponent],
    templateUrl: "./tooltip-directive-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TooltipDirectiveDocComponent {}
