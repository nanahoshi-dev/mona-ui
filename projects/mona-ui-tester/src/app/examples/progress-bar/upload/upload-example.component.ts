import { Component, DestroyRef, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { ProgressBarComponent } from "@nanahoshi/mona-ui/progress-bar";
import { interval, map, take } from "rxjs";

@Component({
    selector: "app-progress-bar-upload-example",
    imports: [ButtonDirective, ProgressBarComponent],
    templateUrl: "./upload-example.component.html"
})
export class ProgressBarUploadExampleComponent {
    readonly #destroyRef = inject(DestroyRef);
    protected readonly progress = signal(0);
    protected readonly uploading = signal(false);

    protected color = (percent: number): string => (percent >= 100 ? "#15803d" : "#4338ca");

    protected upload(): void {
        this.progress.set(0);
        this.uploading.set(true);
        // Stands in for upload progress events from a server.
        interval(200)
            .pipe(
                take(20),
                map(tick => (tick + 1) * 5),
                takeUntilDestroyed(this.#destroyRef)
            )
            .subscribe({
                complete: () => this.uploading.set(false),
                next: percent => this.progress.set(percent)
            });
    }
}
