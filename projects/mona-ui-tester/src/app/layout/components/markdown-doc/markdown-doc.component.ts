import { Component, DestroyRef, ElementRef, computed, inject, input, signal } from "@angular/core";
import { MarkdownComponent } from "ngx-markdown";
import type { SectionItem } from "../../models/SectionItem";
import { PageService } from "../../services/page.service";

@Component({
    selector: "app-markdown-doc",
    imports: [MarkdownComponent],
    template: `<markdown [src]="assetUrl()" (ready)="onReady()" class="block"></markdown>`
})
export class MarkdownDocComponent {
    readonly #destroyRef = inject(DestroyRef);
    readonly #elementRef = inject(ElementRef<HTMLElement>);
    readonly #pageService = inject(PageService);
    readonly #registeredItems = signal<SectionItem[]>([]);

    protected readonly assetUrl = computed(() => `/assets/${this.src()}`);
    /**
     * Overrides the parentId for top-level headings when this file has no H1.
     * Use when splitting docs into multiple files (e.g. an api.md that only has H2+).
     */
    public readonly parentSectionId = input<string | null>(null);

    /** Path relative to the assets root, e.g. "docs/button/intro.md" */
    public readonly src = input.required<string>();

    public constructor() {
        this.#destroyRef.onDestroy(() => {
            this.#registeredItems().forEach(item => this.#pageService.removeSection(item));
        });
    }

    protected onReady(): void {
        this.#registeredItems().forEach(item => this.#pageService.removeSection(item));

        const headings = Array.from(
            this.#elementRef.nativeElement.querySelectorAll("h1,h2,h3,h4,h5,h6")
        ) as HTMLHeadingElement[];
        headings.forEach(heading => heading.removeAttribute("id"));
        const ownerDocument = this.#elementRef.nativeElement.ownerDocument as Document;

        const existingIds = new Set(
            (Array.from(ownerDocument.querySelectorAll("[id]")) as HTMLElement[])
                .map(element => element.id)
                .filter(id => id.length > 0)
        );

        let localRootId: string | null = null;
        const items: SectionItem[] = headings.map((el, i) => {
            const level = parseInt(el.tagName[1], 10);
            const text = el.textContent?.trim() ?? `heading-${i}`;
            const id = this.#createUniqueId(text, existingIds);
            el.id = id;

            const isH1 = level === 1;
            if (isH1) localRootId = id;

            // Non-H1 headings: use the nearest H1 in this file, or fall back to
            // parentSectionId() for files that start at H2+ with no H1 of their own.
            const parentId = isH1 ? null : (localRootId ?? this.parentSectionId());

            return {
                depth: signal(level - 1),
                header: signal(text),
                id: signal(id),
                parentId: signal(parentId)
            };
        });

        this.#rewriteFragmentLinks();

        this.#registeredItems.set(items);
        this.#pageService.setSections(items);
    }

    #createUniqueId(text: string, existingIds: Set<string>): string {
        const baseId = this.#slugify(text);
        let candidateId = baseId;
        let suffix = 2;

        while (existingIds.has(candidateId)) {
            candidateId = `${baseId}-${suffix}`;
            suffix++;
        }

        existingIds.add(candidateId);
        return candidateId;
    }

    /**
     * Rewrites same-page anchor links (e.g. `<a href="#some-heading">`) to include the current
     * pathname. Without this, a bare `#fragment` href resolves against the document's `<base href>`
     * instead of the current route, navigating to the site root instead of staying on this page.
     */
    #rewriteFragmentLinks(): void {
        const pathname = this.#elementRef.nativeElement.ownerDocument.defaultView?.location.pathname ?? "";
        const fragmentLinks = Array.from(
            this.#elementRef.nativeElement.querySelectorAll('a[href^="#"]')
        ) as HTMLAnchorElement[];
        fragmentLinks.forEach(link => {
            const hash = link.getAttribute("href") ?? "";
            link.setAttribute("href", `${pathname}${hash}`);
        });
    }

    #slugify(text: string): string {
        const slug = text
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/[\s_-]+/g, "-")
            .replace(/^-+|-+$/g, "");

        return slug.length > 0 ? slug : "section";
    }
}
