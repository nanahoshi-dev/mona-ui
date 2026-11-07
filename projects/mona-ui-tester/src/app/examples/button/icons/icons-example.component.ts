import { Component } from "@angular/core";
import { LucideDownload, LucideSettings } from "@lucide/angular";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";

@Component({
    selector: "app-button-icons-example",
    imports: [ButtonDirective, LucideDownload, LucideSettings],
    templateUrl: "./icons-example.component.html"
})
export class ButtonIconsExampleComponent {}
