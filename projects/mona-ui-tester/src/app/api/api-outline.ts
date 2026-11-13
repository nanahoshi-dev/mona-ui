import { DestroyRef, effect, inject, signal, untracked } from "@angular/core";
import type { SectionItem } from "../layout/models/SectionItem";
import { PageService } from "../layout/services/page.service";

export interface OutlineHeading {
    readonly id: string;
    readonly title: string;
}

function sectionItem(heading: OutlineHeading, depth: number, parentId: string | null): SectionItem {
    return { depth: signal(depth), header: signal(heading.title), id: signal(heading.id), parentId: signal(parentId) };
}

/**
 * Keeps the page's table of contents in step with the headings a reference page renders: the first is the page's
 * title, and the rest are its sections. Call it from a component's constructor.
 */
export function syncPageOutline(headings: () => readonly OutlineHeading[]): void {
    const pageService = inject(PageService);
    let registered: readonly SectionItem[] = [];
    const replace = (items: readonly SectionItem[]): void => {
        registered.forEach(item => pageService.removeSection(item));
        registered = items;
        pageService.setSections(items);
    };

    effect(() => {
        const [title, ...sections] = headings();
        untracked(() =>
            replace(
                title
                    ? [sectionItem(title, 0, null), ...sections.map(section => sectionItem(section, 1, title.id))]
                    : []
            )
        );
    });
    inject(DestroyRef).onDestroy(() => replace([]));
}
