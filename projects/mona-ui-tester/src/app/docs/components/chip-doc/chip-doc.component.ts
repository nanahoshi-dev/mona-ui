import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ChipDemoComponent } from "../../../demo/components/chip-demo/chip-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-chip-doc",
    imports: [ChipDemoComponent, MarkdownDocComponent],
    templateUrl: "./chip-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChipDocComponent {}
