import { Component, signal } from "@angular/core";
import { RIPPLE_OPTIONS, RippleDirective } from "@nanahoshi/mona-ui/ripple";

interface Destination {
    readonly description: string;
    readonly name: string;
}

@Component({
    selector: "app-ripple-custom-element-example",
    imports: [RippleDirective],
    // Turns ripples on for this example only. An application turns them on everywhere with provideRipple().
    providers: [{ provide: RIPPLE_OPTIONS, useValue: { enabled: true } }],
    templateUrl: "./custom-element-example.component.html"
})
export class RippleCustomElementExampleComponent {
    protected readonly destinations: readonly Destination[] = [
        { name: "Projects", description: "Everything your team is working on." },
        { name: "Reports", description: "Weekly numbers and trends." },
        { name: "Settings", description: "Members, billing and integrations." }
    ];
    protected readonly opened = signal("none");
}
