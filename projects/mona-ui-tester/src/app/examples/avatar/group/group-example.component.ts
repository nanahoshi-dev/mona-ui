import { Component } from "@angular/core";
import { AvatarComponent, AvatarGroupComponent } from "@nanahoshi/mona-ui/avatar";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";

interface Member {
    /** A theme color, which the avatar fills with. */
    readonly background: string;
    /** The text color the theme pairs with that color. */
    readonly foreground: string;
    readonly initials: string;
    readonly name: string;
}

@Component({
    selector: "app-avatar-group-example",
    imports: [AvatarComponent, AvatarGroupComponent, ButtonDirective],
    templateUrl: "./group-example.component.html"
})
export class AvatarGroupExampleComponent {
    protected readonly members: readonly Member[] = [
        {
            background: "var(--color-primary)",
            foreground: "var(--color-primary-foreground)",
            initials: "JS",
            name: "Jane Smith"
        },
        {
            background: "var(--color-info)",
            foreground: "var(--color-info-foreground)",
            initials: "AK",
            name: "Arjun Kumar"
        },
        {
            background: "var(--color-success)",
            foreground: "var(--color-success-foreground)",
            initials: "ML",
            name: "Mei Lin"
        },
        {
            background: "var(--color-warning)",
            foreground: "var(--color-warning-foreground)",
            initials: "TO",
            name: "Tunde Okafor"
        },
        {
            background: "var(--color-error)",
            foreground: "var(--color-error-foreground)",
            initials: "SR",
            name: "Sofia Rossi"
        },
        {
            background: "var(--color-secondary)",
            foreground: "var(--color-secondary-foreground)",
            initials: "LB",
            name: "Lukas Bauer"
        }
    ];
}
