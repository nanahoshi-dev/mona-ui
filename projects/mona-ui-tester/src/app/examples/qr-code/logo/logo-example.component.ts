import { Component } from "@angular/core";
import { QrCodeComponent, type QrCodeOverlay } from "@nanahoshi/mona-ui/qr-code";

const LOGO_SVG =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#4338ca"/>` +
    `<path d="M32 10 37.6 26.4 54 32 37.6 37.6 32 54 26.4 37.6 10 32 26.4 26.4Z" fill="#fff"/></svg>`;

@Component({
    selector: "app-qr-code-logo-example",
    imports: [QrCodeComponent],
    templateUrl: "./logo-example.component.html"
})
export class QrCodeLogoExampleComponent {
    protected readonly logo: QrCodeOverlay = {
        size: 0.22,
        src: `data:image/svg+xml,${encodeURIComponent(LOGO_SVG)}`,
        type: "image"
    };
}
