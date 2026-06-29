import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ScrollViewDemoComponent } from "../../../demo/components/scroll-view-demo/scroll-view-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-scroll-view-doc",
    imports: [ScrollViewDemoComponent, MarkdownDocComponent],
    templateUrl: "./scroll-view-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScrollViewDocComponent {}
