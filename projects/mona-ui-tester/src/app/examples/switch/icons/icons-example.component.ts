import { Component, signal } from "@angular/core";
import { LucideMoon, LucideSun, LucideVolume2, LucideVolumeX } from "@lucide/angular";
import { LabelComponent } from "@nanahoshi/mona-ui/label";
import {
    SwitchComponent,
    SwitchHandleContentTemplateDirective,
    SwitchOffLabelTemplateDirective,
    SwitchOnLabelTemplateDirective
} from "@nanahoshi/mona-ui/switch";

@Component({
    selector: "app-switch-icons-example",
    imports: [
        LabelComponent,
        LucideMoon,
        LucideSun,
        LucideVolume2,
        LucideVolumeX,
        SwitchComponent,
        SwitchHandleContentTemplateDirective,
        SwitchOffLabelTemplateDirective,
        SwitchOnLabelTemplateDirective
    ],
    templateUrl: "./icons-example.component.html"
})
export class SwitchIconsExampleComponent {
    protected readonly darkMode = signal(false);
    protected readonly sound = signal(true);
}
