import { ChangeDetectionStrategy, Component, computed, inject, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
import { filter, map, startWith } from "rxjs";
import { PageService } from "../../services/page.service";

@Component({
    selector: "app-page-navigation",
    imports: [],
    templateUrl: "./page-navigation.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageNavigationComponent {
    readonly #pageService = inject(PageService);
    readonly #route = inject(ActivatedRoute);
    readonly #router = inject(Router);
    readonly #url = toSignal(
        this.#router.events.pipe(
            filter(e => e instanceof NavigationEnd),
            map(() => this.#router.url),
            startWith(this.#router.url)
        ),
        { requireSync: true }
    );
    protected readonly activeFragment = signal<string>("");
    protected readonly currentRoute = computed(() => {
        const fullPath = this.#url();
        const fragmentIndex = fullPath.indexOf("#");
        if (fragmentIndex > -1) {
            return fullPath.substring(0, fragmentIndex);
        }
        return fullPath;
    });
    protected readonly sections = this.#pageService.sections;

    public constructor() {
        this.#route.fragment.subscribe(f => {
            this.activeFragment.set(f ?? "");
        });
    }
}
