import { Component, DestroyRef, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { SpinnerService } from "@nanahoshi/mona-ui/spinner";
import { map, timer } from "rxjs";

@Component({
    selector: "app-spinner-track-example",
    imports: [ButtonDirective],
    templateUrl: "./track-example.component.html"
})
export class SpinnerTrackExampleComponent {
    readonly #destroyRef = inject(DestroyRef);
    readonly #spinnerService = inject(SpinnerService);
    protected readonly status = signal("Not loaded");

    protected load(panel: HTMLElement): void {
        this.status.set("Loading…");
        // Stands in for an HTTP request that answers with a record count.
        const request = timer(3000).pipe(map(() => 128));
        this.#spinnerService
            .track(request, { cancellable: true, target: panel, text: "Downloading report…" })
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe({
                complete: () => this.status.update(status => (status === "Loading…" ? "Cancelled" : status)),
                next: count => this.status.set(`Loaded ${count} records`)
            });
    }
}
