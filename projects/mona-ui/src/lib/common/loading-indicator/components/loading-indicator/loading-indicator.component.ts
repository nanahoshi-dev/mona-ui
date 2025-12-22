import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { Loader, LucideAngularModule } from "lucide-angular";

@Component({
    selector: "mona-loading-indicator",
    imports: [LucideAngularModule],
    templateUrl: "./loading-indicator.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    styles: `
        @keyframes spin {
            from {
                transform: rotate(0deg);
            }
            to {
                transform: rotate(360deg);
            }
        }
        lucide-angular {
            animation: spin 2s linear infinite;
        }
    `,
    host: {
        class: "h-full flex items-center justify-center aspect-square"
    }
})
export class LoadingIndicatorComponent {
    protected readonly icon = Loader;
    public readonly size = input(12);
}
