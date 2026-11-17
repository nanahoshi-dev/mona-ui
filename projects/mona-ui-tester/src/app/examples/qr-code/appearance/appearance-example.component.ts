import { Component } from "@angular/core";
import { QrCodeComponent } from "@nanahoshi/mona-ui/qr-code";

@Component({
    selector: "app-qr-code-appearance-example",
    imports: [QrCodeComponent],
    templateUrl: "./appearance-example.component.html"
})
export class QrCodeAppearanceExampleComponent {
    protected readonly link = "https://nanahoshi.dev/mona-ui";
}
