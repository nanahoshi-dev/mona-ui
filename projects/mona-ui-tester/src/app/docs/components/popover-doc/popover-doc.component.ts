import { ChangeDetectionStrategy, Component } from "@angular/core";
import { PopoverDemoComponent } from "../../../demo/components/popover-demo/popover-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-popover-doc",
    imports: [PopoverDemoComponent, MarkdownDocComponent],
    templateUrl: "./popover-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PopoverDocComponent {}
