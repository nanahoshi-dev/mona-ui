import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { LucideLoader } from "@lucide/angular";

@Component({
    selector: "mona-loading-indicator",
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
        svg {
            animation: spin 2s linear infinite;
        }
    `,
    imports: [LucideLoader],
    host: {
        class: "h-full flex items-center justify-center"
    }
})
export class LoadingIndicatorComponent {
    public readonly size = input(12);
}
