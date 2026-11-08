import { Component } from "@angular/core";
import { LucideBell, LucideCreditCard, LucideDynamicIcon, LucideUser } from "@lucide/angular";
import {
    TabComponent,
    TabContentTemplateDirective,
    TabsComponent,
    TabTitleTemplateDirective
} from "@nanahoshi/mona-ui/tabs";

@Component({
    selector: "app-tabs-vertical-example",
    imports: [LucideDynamicIcon, TabComponent, TabContentTemplateDirective, TabsComponent, TabTitleTemplateDirective],
    templateUrl: "./vertical-example.component.html"
})
export class TabsVerticalExampleComponent {
    protected readonly sections = [
        { description: "Your name, photo and time zone.", icon: LucideUser, title: "Profile" },
        { description: "Which emails and alerts you get.", icon: LucideBell, title: "Notifications" },
        { description: "Your plan, invoices and payment method.", icon: LucideCreditCard, title: "Billing" }
    ];
}
