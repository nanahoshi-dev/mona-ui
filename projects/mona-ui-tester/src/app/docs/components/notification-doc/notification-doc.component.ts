import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { NotificationDemoComponent } from "../../../demo/components/notification-demo/notification-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-notification-doc",
    imports: [ApiSectionComponent, NotificationDemoComponent, MarkdownDocComponent],
    templateUrl: "./notification-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationDocComponent {}
