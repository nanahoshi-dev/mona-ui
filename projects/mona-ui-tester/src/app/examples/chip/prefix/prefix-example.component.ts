import { Component } from "@angular/core";
import { LucideTag } from "@lucide/angular";
import { AvatarComponent } from "@nanahoshi/mona-ui/avatar";
import { ChipComponent, ChipPrefixTemplateDirective } from "@nanahoshi/mona-ui/chip";

@Component({
    selector: "app-chip-prefix-example",
    imports: [AvatarComponent, ChipComponent, ChipPrefixTemplateDirective, LucideTag],
    templateUrl: "./prefix-example.component.html"
})
export class ChipPrefixExampleComponent {}
