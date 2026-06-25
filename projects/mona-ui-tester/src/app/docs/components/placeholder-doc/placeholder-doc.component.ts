import { ChangeDetectionStrategy, Component } from "@angular/core";
import { PlaceholderDemoComponent } from "../../../demo/components/placeholder-demo/placeholder-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-placeholder-doc",
    imports: [PlaceholderDemoComponent, MarkdownDocComponent],
    templateUrl: "./placeholder-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlaceholderDocComponent {}
