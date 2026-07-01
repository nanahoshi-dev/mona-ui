import { ChangeDetectionStrategy, Component } from "@angular/core";
import { MenubarDemoComponent } from "../../../demo/components/menubar-demo/menubar-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-menubar-doc",
    imports: [MenubarDemoComponent, MarkdownDocComponent],
    templateUrl: "./menubar-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenubarDocComponent {}
