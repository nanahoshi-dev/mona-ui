/**
 * The id a heading gets from its text, without what makes it unique on a page. The page and the search index both use
 * it, so a search result's link lands on its heading. Keep this file free of Angular imports, for the same reason as
 * `docs-manifest.ts`.
 */
export function slugifyHeading(text: string): string {
    const slug = text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");

    return slug.length > 0 ? slug : "section";
}

/** The ids of a page's headings, in order: a repeated heading gets a number, starting from 2. */
export function createUniqueHeadingId(text: string, existingIds: Set<string>): string {
    const baseId = slugifyHeading(text);
    let candidateId = baseId;
    let suffix = 2;

    while (existingIds.has(candidateId)) {
        candidateId = `${baseId}-${suffix}`;
        suffix++;
    }

    existingIds.add(candidateId);
    return candidateId;
}
