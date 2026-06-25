import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    ElementRef,
    computed,
    inject,
    input,
    signal
} from "@angular/core";
import { MarkdownComponent } from "ngx-markdown";
import type { SectionItem } from "../../models/SectionItem";
import { PageService } from "../../services/page.service";

@Component({
    selector: "app-markdown-doc",
    imports: [MarkdownComponent],
    template: `<markdown [src]="assetUrl()" (ready)="onReady()" class="block"></markdown>`,
    changeDetection: ChangeDetectionStrategy.OnPush
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

        let localRootId: string | null = null;
        const items: SectionItem[] = headings.map((el, i) => {
            const level = parseInt(el.tagName[1], 10);
            const text = el.textContent?.trim() ?? `heading-${i}`;
            const id = this.#slugify(text);
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

        this.#registeredItems.set(items);
        this.#pageService.setSections(items);
    }

    #slugify(text: string): string {
        return text
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/[\s_-]+/g, "-")
            .replace(/^-+|-+$/g, "");
    }
}
