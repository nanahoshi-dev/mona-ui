import { Component, signal } from "@angular/core";
import { CheckBoxComponent } from "@nanahoshi/mona-ui/check-box";
import { LabelComponent } from "@nanahoshi/mona-ui/label";
import { RadioButtonComponent, RadioGroupComponent } from "@nanahoshi/mona-ui/radio-button";
import { RIPPLE_OPTIONS } from "@nanahoshi/mona-ui/ripple";
import { type SegmentedOption, SegmentedComponent } from "@nanahoshi/mona-ui/segmented";
import { SwitchComponent } from "@nanahoshi/mona-ui/switch";

@Component({
    selector: "app-ripple-controls-example",
    imports: [
        CheckBoxComponent,
        LabelComponent,
        RadioButtonComponent,
        RadioGroupComponent,
        SegmentedComponent,
        SwitchComponent
    ],
    // Turns ripples on for this example only. An application turns them on everywhere with provideRipple().
    providers: [{ provide: RIPPLE_OPTIONS, useValue: { enabled: true } }],
    templateUrl: "./controls-example.component.html"
})
export class RippleControlsExampleComponent {
    protected readonly digest = signal("daily");
    protected readonly mentions = signal(false);
    protected readonly paused = signal(false);
    protected readonly replies = signal(true);
    protected readonly theme = signal("system");
    protected readonly themes: SegmentedOption<string>[] = [
        { label: "Light", value: "light" },
        { label: "Dark", value: "dark" },
        { label: "System", value: "system" }
    ];
}
