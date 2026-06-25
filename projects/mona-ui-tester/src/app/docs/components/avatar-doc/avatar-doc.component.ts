import { ChangeDetectionStrategy, Component } from "@angular/core";
import { AvatarDemoComponent } from "../../../demo/components/avatar-demo/avatar-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-avatar-doc",
    imports: [AvatarDemoComponent, MarkdownDocComponent],
    templateUrl: "./avatar-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AvatarDocComponent {}
