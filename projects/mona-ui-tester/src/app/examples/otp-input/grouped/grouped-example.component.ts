import { Component, signal } from "@angular/core";
import { LabelComponent } from "@nanahoshi/mona-ui/label";
import { OtpInputComponent } from "@nanahoshi/mona-ui/otp-input";

@Component({
    selector: "app-otp-input-grouped-example",
    imports: [LabelComponent, OtpInputComponent],
    templateUrl: "./grouped-example.component.html"
})
export class OtpInputGroupedExampleComponent {
    protected readonly code = signal("");
}
