import { DOCUMENT } from "@angular/common";
import { Component, DestroyRef, computed, effect, inject, signal } from "@angular/core";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
import { filter, fromEvent, map, startWith, Subscription } from "rxjs";
import { PageService } from "../../services/page.service";

@Component({
    selector: "app-page-navigation",
    imports: [],
    templateUrl: "./page-navigation.component.html"
})
export class PageNavigationComponent {
    readonly #document = inject(DOCUMENT);
    readonly #destroyRef = inject(DestroyRef);
    readonly #pageService = inject(PageService);
    readonly #route = inject(ActivatedRoute);
    readonly #router = inject(Router);
    #scrollSubscription: Subscription | null = null;
    readonly #url = toSignal(
        this.#router.events.pipe(
            filter(e => e instanceof NavigationEnd),
            map(() => this.#router.url),
            startWith(this.#router.url)
        ),
        { requireSync: true }
    );
    protected readonly activeSectionId = signal("");
    protected readonly currentRoute = computed(() => {
        const fullPath = this.#url();
        const fragmentIndex = fullPath.indexOf("#");
        if (fragmentIndex > -1) {
            return fullPath.substring(0, fragmentIndex);
        }
        return fullPath;
    });
    protected readonly sections = this.#pageService.sections;
    protected readonly visibleSections = computed(() =>
        Array.from(this.sections()).filter(section => section.parentId() != null)
    );

    public constructor() {
        this.#route.fragment
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(fragment => this.activeSectionId.set(fragment ?? ""));

        effect(() => {
            this.currentRoute();
            this.visibleSections();
            queueMicrotask(() => this.#bindScrollSpy());
        });

        this.#destroyRef.onDestroy(() => this.#scrollSubscription?.unsubscribe());
    }

    #bindScrollSpy(): void {
        this.#scrollSubscription?.unsubscribe();
        this.#scrollSubscription = null;

        const scrollContainer = this.#document.querySelector("[data-page-scroll-container]");
        if (!(scrollContainer instanceof HTMLElement)) {
            return;
        }

        const syncActiveSection = (): void => {
            const headings = this.visibleSections()
                .map(section => {
                    const element = this.#document.getElementById(section.id());
                    return element instanceof HTMLElement ? { id: section.id(), element } : null;
                })
                .filter(heading => heading != null);

            if (headings.length === 0) {
                return;
            }

            const containerTop = scrollContainer.getBoundingClientRect().top;
            const activationOffset = 96;
            let activeHeading = headings[0];
            for (const heading of headings) {
                if (heading.element.getBoundingClientRect().top - containerTop <= activationOffset) {
                    activeHeading = heading;
                }
            }

            this.activeSectionId.set(activeHeading.id);
        };

        syncActiveSection();
        this.#scrollSubscription = fromEvent(scrollContainer, "scroll").subscribe(() =>
            syncActiveSection()
        );
    }
}
