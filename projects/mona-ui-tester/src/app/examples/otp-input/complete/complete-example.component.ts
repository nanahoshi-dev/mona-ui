import { Component, signal } from "@angular/core";
import { LabelComponent } from "@nanahoshi/mona-ui/label";
import { OtpInputComponent } from "@nanahoshi/mona-ui/otp-input";

type VerificationStatus = "checking" | "idle" | "verified" | "wrong";

@Component({
    selector: "app-otp-input-complete-example",
    imports: [LabelComponent, OtpInputComponent],
    templateUrl: "./complete-example.component.html"
})
export class OtpInputCompleteExampleComponent {
    protected readonly code = signal("");
    protected readonly status = signal<VerificationStatus>("idle");

    /** Stands in for a server that accepts 123456. A wrong code is cleared, so typing the next one completes again. */
    protected verify(code: string): void {
        this.status.set("checking");
        setTimeout(() => {
            const verified = code === "123456";
            this.status.set(verified ? "verified" : "wrong");
            if (!verified) {
                this.code.set("");
            }
        }, 800);
    }
}
