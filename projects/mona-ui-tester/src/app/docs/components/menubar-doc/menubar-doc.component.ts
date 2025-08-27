import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CodeViewerComponent } from "../../../demo/components/code-viewer/code-viewer.component";
import { MenubarDemoComponent } from "../../../demo/components/menubar-demo/menubar-demo.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-menubar-doc",
    imports: [CodeViewerComponent, SectionComponent, MenubarDemoComponent],
    templateUrl: "./menubar-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenubarDocComponent {
    protected readonly importCode = `
        import { MenubarComponent, MenuComponent, MenuItemComponent } from "mona-ui";`;
}
