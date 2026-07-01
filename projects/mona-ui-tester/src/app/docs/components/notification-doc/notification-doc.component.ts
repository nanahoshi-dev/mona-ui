import { ChangeDetectionStrategy, Component } from "@angular/core";
import { NotificationDemoComponent } from "../../../demo/components/notification-demo/notification-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-notification-doc",
    imports: [NotificationDemoComponent, MarkdownDocComponent],
    templateUrl: "./notification-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationDocComponent {}
