import { Component } from "@angular/core";
import { BadgeDirective, type BadgeVariantProps } from "@nanahoshi/mona-ui/badge";

interface Deployment {
    readonly environment: string;
    readonly look: BadgeVariantProps["look"];
    readonly status: string;
}

@Component({
    selector: "app-badge-status-example",
    imports: [BadgeDirective],
    templateUrl: "./status-example.component.html"
})
export class BadgeStatusExampleComponent {
    protected readonly deployments: readonly Deployment[] = [
        { environment: "Production", look: "success", status: "Live" },
        { environment: "Staging", look: "info", status: "Deploying" },
        { environment: "Preview", look: "warning", status: "Needs review" },
        { environment: "Nightly", look: "error", status: "Failed" },
        { environment: "Archive", look: "secondary", status: "Stopped" }
    ];
}
