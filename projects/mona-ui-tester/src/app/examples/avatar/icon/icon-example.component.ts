import { Component } from "@angular/core";
import { LucideUser, LucideUsers } from "@lucide/angular";
import { AvatarComponent } from "@nanahoshi/mona-ui/avatar";

@Component({
    selector: "app-avatar-icon-example",
    imports: [AvatarComponent, LucideUser, LucideUsers],
    templateUrl: "./icon-example.component.html"
})
export class AvatarIconExampleComponent {}
