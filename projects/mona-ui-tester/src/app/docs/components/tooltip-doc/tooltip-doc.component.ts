import { ChangeDetectionStrategy, Component } from "@angular/core";
import { TooltipDemoComponent } from "../../../demo/components/tooltip-demo/tooltip-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-tooltip-doc",
    imports: [TooltipDemoComponent, MarkdownDocComponent],
    templateUrl: "./tooltip-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TooltipDocComponent {}
