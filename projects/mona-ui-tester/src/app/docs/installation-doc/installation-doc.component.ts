import { ChangeDetectionStrategy, Component } from "@angular/core";
import { MarkdownDocComponent } from "../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-installation-doc",
    imports: [MarkdownDocComponent],
    templateUrl: "./installation-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class InstallationDocComponent {}
