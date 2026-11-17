import { Component, signal } from "@angular/core";
import { form, FormField, validate } from "@angular/forms/signals";
import { LabelComponent } from "@nanahoshi/mona-ui/label";
import { QrCodeComponent, validateQrCodeValue } from "@nanahoshi/mona-ui/qr-code";
import { TextBoxComponent } from "@nanahoshi/mona-ui/text-box";

@Component({
    selector: "app-qr-code-validation-example",
    imports: [FormField, LabelComponent, QrCodeComponent, TextBoxComponent],
    templateUrl: "./validation-example.component.html"
})
export class QrCodeValidationExampleComponent {
    readonly #model = signal({ label: "Café Zürich, table 12" });
    // The label printer's scanner reads Latin-1 only, so the codes are stored without a UTF-8 header.
    protected readonly shelf = form(this.#model, path => {
        validate(path.label, ({ value }) => {
            const error = validateQrCodeValue(value(), { encoding: "iso-8859-1" });
            switch (error?.code) {
                case "unsupported-character":
                    return { kind: "qrCode", message: `The scanner can't read "${error.character}". Remove it.` };
                case "too-long":
                    return { kind: "qrCode", message: "This is too long for a QR code. Shorten it." };
                default:
                    return undefined;
            }
        });
    });
}
