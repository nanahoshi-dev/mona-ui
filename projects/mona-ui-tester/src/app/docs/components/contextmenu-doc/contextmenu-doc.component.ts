import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CodeViewerComponent } from "../../../demo/components/code-viewer/code-viewer.component";
import { ContextMenuDemoComponent } from "../../../demo/components/contextmenu-demo/contextmenu-demo.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-contextmenu-doc",
    imports: [CodeViewerComponent, SectionComponent, ContextMenuDemoComponent],
    templateUrl: "./contextmenu-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContextMenuDocComponent {
    protected readonly importCode = `import { ContextMenuModule } from "mona-ui";`;
}
