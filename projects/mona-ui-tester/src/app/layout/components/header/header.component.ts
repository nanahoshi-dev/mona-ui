import { ChangeDetectionStrategy, Component, output } from "@angular/core";
import { RouterLink } from "@angular/router";
import { LucideMenu, LucideSparkles } from "@lucide/angular";

@Component({
    selector: "app-header",
    imports: [RouterLink, LucideSparkles, LucideMenu],
    templateUrl: "./header.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {
    public readonly menuToggle = output<void>();
}
