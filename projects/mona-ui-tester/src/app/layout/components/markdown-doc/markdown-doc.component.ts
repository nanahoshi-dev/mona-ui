import {
    ApplicationRef,
    Component,
    type ComponentRef,
    DestroyRef,
    ElementRef,
    EnvironmentInjector,
    Injector,
    computed,
    createComponent,
    inject,
    input,
    signal
} from "@angular/core";
import { Router } from "@angular/router";
import { MarkdownComponent } from "ngx-markdown";
import { createUniqueHeadingId } from "../../docs-heading-id";
import { routeInternalLink } from "../../internal-links";
import type { SectionItem } from "../../models/SectionItem";
import { ExampleComponent } from "../example/example.component";
import { PageService } from "../../services/page.service";

@Component({
    selector: "app-markdown-doc",
    imports: [MarkdownComponent],
    template: `<markdown [src]="assetUrl()" (ready)="onReady()" class="block"></markdown>`,
    host: {
        "(click)": "onClick($event)"
    }
})
export class MarkdownDocComponent {
    readonly #application = inject(ApplicationRef);
    readonly #destroyRef = inject(DestroyRef);
    readonly #elementRef = inject(ElementRef<HTMLElement>);
    readonly #environmentInjector = inject(EnvironmentInjector);
    readonly #injector = inject(Injector);
    readonly #pageService = inject(PageService);
    readonly #registeredItems = signal<SectionItem[]>([]);
    readonly #router = inject(Router);
    #examples: ComponentRef<ExampleComponent>[] = [];

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
            this.#destroyExamples();
            this.#registeredItems().forEach(item => this.#pageService.removeSection(item));
        });
    }

    /** A link to another page, such as a type's API reference, opens it without reloading the site. */
    protected onClick(event: MouseEvent): void {
        routeInternalLink(event, this.#router);
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
            const id = createUniqueHeadingId(text, existingIds);
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
        this.#mountExamples();

        this.#registeredItems.set(items);
        this.#pageService.setSections(items);
    }

    #destroyExamples(): void {
        this.#examples.forEach(example => example.destroy());
        this.#examples = [];
    }

    /**
     * A guide shows an example with a fenced block whose language is `example`, which keeps the markdown readable on
     * its own. Each block is replaced with the running example.
     */
    #mountExamples(): void {
        this.#destroyExamples();
        const blocks = Array.from(
            this.#elementRef.nativeElement.querySelectorAll("pre > code.language-example")
        ) as HTMLElement[];
        for (const block of blocks) {
            const host = (this.#elementRef.nativeElement.ownerDocument as Document).createElement("app-example");
            (block.parentElement as HTMLElement).replaceWith(host);
            const example = createComponent(ExampleComponent, {
                elementInjector: this.#injector,
                environmentInjector: this.#environmentInjector,
                hostElement: host
            });
            example.setInput("exampleId", (block.textContent ?? "").trim());
            this.#application.attachView(example.hostView);
            this.#examples.push(example);
        }
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
}
