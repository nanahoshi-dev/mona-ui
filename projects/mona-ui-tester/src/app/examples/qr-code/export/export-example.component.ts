import { Component, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { QrCodeComponent, QrCodeExportError, type QrCodeExportFormat } from "@nanahoshi/mona-ui/qr-code";

@Component({
    selector: "app-qr-code-export-example",
    imports: [ButtonDirective, QrCodeComponent],
    templateUrl: "./export-example.component.html"
})
export class QrCodeExportExampleComponent {
    protected readonly formats: readonly QrCodeExportFormat[] = ["png", "svg", "pdf"];
    protected readonly status = signal("");

    protected async download(qrCode: QrCodeComponent, format: QrCodeExportFormat): Promise<void> {
        try {
            const { blob } = await qrCode.downloadQrCode({ fileName: "guest-wifi", format, size: 512 });
            this.status.set(`Saved guest-wifi.${format}, ${Math.ceil(blob.size / 1024)} KB.`);
        } catch (error) {
            this.status.set(error instanceof QrCodeExportError ? error.message : "The export failed.");
        }
    }
}
