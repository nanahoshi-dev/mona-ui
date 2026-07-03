import { ChangeDetectionStrategy, Component } from "@angular/core";
import { AutoCompleteDemoComponent } from "../../../demo/components/auto-complete-demo/auto-complete-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-auto-complete-doc",
    imports: [AutoCompleteDemoComponent, MarkdownDocComponent],
    templateUrl: "./auto-complete-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AutoCompleteDocComponent {}
