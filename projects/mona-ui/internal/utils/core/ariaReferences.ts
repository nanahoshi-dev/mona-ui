const tokensOf = (element: Element, attribute: string): string[] =>
    (element.getAttribute(attribute) ?? "").split(/\s+/).filter(token => token !== "");

/**
 * Adds `id` to an id-list attribute such as `aria-describedby`, keeping the ids already there.
 */
export const addAriaReference = (element: Element, attribute: string, id: string): void => {
    const tokens = tokensOf(element, attribute);
    if (!tokens.includes(id)) {
        element.setAttribute(attribute, [...tokens, id].join(" "));
    }
};

/**
 * Removes `id` from an id-list attribute, and the attribute itself once it holds no ids.
 */
export const removeAriaReference = (element: Element, attribute: string, id: string): void => {
    const tokens = tokensOf(element, attribute).filter(token => token !== id);
    if (tokens.length) {
        element.setAttribute(attribute, tokens.join(" "));
    } else {
        element.removeAttribute(attribute);
    }
};
