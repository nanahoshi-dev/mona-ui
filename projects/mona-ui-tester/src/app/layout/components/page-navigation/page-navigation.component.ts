import { ChangeDetectionStrategy, Component, computed, inject } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
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
    protected readonly sections = this.#pageService.sections;
    protected readonly currentRoute = computed(() => {
        const fullPath = this.#router.url;
        const fragmentIndex = fullPath.indexOf("#");
        if (fragmentIndex > -1) {
            return fullPath.substring(0, fragmentIndex);
        }
        return fullPath;
    });

    public constructor() {
        console.log("PageNavigationComponent initialized", this.#router.url);
    }
}
