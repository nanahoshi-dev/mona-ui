import { ChangeDetectionStrategy, Component } from "@angular/core";
import { TooltipDirectiveDemoComponent } from "../../../demo/components/tooltip-directive-demo/tooltip-directive-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-tooltip-directive-doc",
    imports: [TooltipDirectiveDemoComponent, MarkdownDocComponent],
    templateUrl: "./tooltip-directive-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TooltipDirectiveDocComponent {}
