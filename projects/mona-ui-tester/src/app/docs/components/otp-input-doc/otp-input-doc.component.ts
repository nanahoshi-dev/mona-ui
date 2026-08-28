import { Component } from "@angular/core";
import { OtpInputDemoComponent } from "../../../demo/components/otp-input-demo/otp-input-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-otp-input-doc",
    imports: [OtpInputDemoComponent, MarkdownDocComponent],
    templateUrl: "./otp-input-doc.component.html"
})
export class OtpInputDocComponent {}
