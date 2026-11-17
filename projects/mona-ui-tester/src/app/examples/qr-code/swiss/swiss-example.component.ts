import { Component } from "@angular/core";
import { QrCodeComponent, type QrCodeOverlay } from "@nanahoshi/mona-ui/qr-code";

/**
 * A Swiss QR-bill's payment data, one field a line, as the Swiss Implementation Guidelines lay it out. The creditor,
 * account and invoice are made up.
 */
const PAYMENT = [
    "SPC",
    "0200",
    "1",
    "CH5604835012345678009",
    "S",
    "Example Ltd",
    "Bundesplatz",
    "3",
    "3003",
    "Bern",
    "CH",
    ...Array<string>(7).fill(""),
    "120.00",
    "CHF",
    ...Array<string>(7).fill(""),
    "NON",
    "",
    "Invoice 2026-114",
    "EPD"
].join("\n");

@Component({
    selector: "app-qr-code-swiss-example",
    imports: [QrCodeComponent],
    templateUrl: "./swiss-example.component.html"
})
export class QrCodeSwissExampleComponent {
    protected readonly payment = PAYMENT;
    protected readonly swissCross: QrCodeOverlay = { type: "swiss" };
}
