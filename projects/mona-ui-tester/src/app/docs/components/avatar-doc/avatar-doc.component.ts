import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { AvatarDemoComponent } from "../../../demo/components/avatar-demo/avatar-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-avatar-doc",
    imports: [ApiSectionComponent, AvatarDemoComponent, MarkdownDocComponent],
    templateUrl: "./avatar-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AvatarDocComponent {}
