import { Component, signal } from "@angular/core";
import { LabelComponent } from "@nanahoshi/mona-ui/label";
import { OtpInputComponent } from "@nanahoshi/mona-ui/otp-input";

@Component({
    selector: "app-otp-input-masked-example",
    imports: [LabelComponent, OtpInputComponent],
    templateUrl: "./masked-example.component.html"
})
export class OtpInputMaskedExampleComponent {
    protected readonly digit = /^[0-9]$/;
    protected readonly pin = signal("");
}
