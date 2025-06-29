import { ChangeDetectionStrategy, Component } from "@angular/core";
import { AvatarDemoComponent } from "../../../demo/components/avatar-demo/avatar-demo.component";
import { CodeViewerComponent } from "../../../demo/components/code-viewer/code-viewer.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-avatar-doc",
    imports: [SectionComponent, AvatarDemoComponent, CodeViewerComponent],
    templateUrl: "./avatar-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AvatarDocComponent {
    protected readonly importCode = `
        import { AvatarComponent } from "mona-ui";
    `;
}
