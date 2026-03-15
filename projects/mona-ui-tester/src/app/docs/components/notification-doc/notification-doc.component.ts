import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CodeViewerComponent } from "../../../demo/components/code-viewer/code-viewer.component";
import { NotificationDemoComponent } from "../../../demo/components/notification-demo/notification-demo.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-notification-doc",
    imports: [CodeViewerComponent, SectionComponent, NotificationDemoComponent],
    templateUrl: "./notification-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationDocComponent {
    protected readonly importCode = `import { DropdownListComponent } from "mona-ui";`;
}
