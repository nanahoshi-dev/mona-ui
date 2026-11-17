import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { QrCodeDemoComponent } from "../../../demo/components/qr-code-demo/qr-code-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-qr-code-doc",
    imports: [ApiSectionComponent, MarkdownDocComponent, QrCodeDemoComponent],
    templateUrl: "./qr-code-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class QrCodeDocComponent {}
