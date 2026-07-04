import { ChangeDetectionStrategy, Component } from "@angular/core";
import { TabsDemoComponent } from "../../../demo/components/tabs-demo/tabs-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-tabs-doc",
    imports: [TabsDemoComponent, MarkdownDocComponent],
    templateUrl: "./tabs-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabsDocComponent {}
