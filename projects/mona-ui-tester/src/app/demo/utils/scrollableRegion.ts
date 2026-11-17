/**
 * A code block or table that scrolls has to take keyboard focus, or its hidden part can't be read without a mouse.
 * This makes `element` a named, focusable region while its content overflows, and takes that away again once it fits,
 * so a short block doesn't add a tab stop. It re-checks when the element resizes or its content changes.
 *
 * @param element the element that scrolls
 * @param label what to call the region, read each time it's checked
 * @returns what stops watching the element
 */
export function watchScrollableRegion(element: HTMLElement, label: () => string): () => void {
    const sync = (): void => {
        if (element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight) {
            element.tabIndex = 0;
            element.setAttribute("role", "region");
            element.setAttribute("aria-label", label());
        } else {
            element.removeAttribute("tabindex");
            element.removeAttribute("role");
            element.removeAttribute("aria-label");
        }
    };
    sync();

    const view = element.ownerDocument.defaultView;
    if (view?.ResizeObserver == null || view.MutationObserver == null) {
        return () => undefined;
    }
    const resizeObserver = new view.ResizeObserver(sync);
    resizeObserver.observe(element);
    const mutationObserver = new view.MutationObserver(sync);
    mutationObserver.observe(element, { characterData: true, childList: true, subtree: true });
    return () => {
        resizeObserver.disconnect();
        mutationObserver.disconnect();
    };
}

const LANGUAGE_NAMES: Readonly<Record<string, string>> = {
    bash: "Shell",
    css: "CSS",
    html: "HTML",
    json: "JSON",
    scss: "SCSS",
    sh: "Shell",
    shell: "Shell",
    ts: "TypeScript",
    typescript: "TypeScript"
};

/** What a code block in `language` is called, such as "HTML code", or just "Code" when the language says nothing. */
export function codeRegionLabel(language: string | null | undefined): string {
    const name = language == null ? undefined : LANGUAGE_NAMES[language.toLowerCase()];
    return name == null ? "Code" : `${name} code`;
}

/** What a table that scrolls is called: the heading it sits under, such as "Anatomy table", or just "Table". */
export function tableRegionLabel(heading: string | null | undefined): string {
    const text = heading?.trim();
    return text ? `${text} table` : "Table";
}
