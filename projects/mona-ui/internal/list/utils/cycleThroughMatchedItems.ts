/**
 * Finds the item typeahead moves to: the next matching item after the active one, wrapping around. With
 * `keepActive` (a buffer longer than one character), an active item that still matches stays active, so typing
 * "ap" on Apple doesn't move on to Apricot.
 */
export const cycleThroughMatchedItems = <T>(
    items: Iterable<T>,
    activeItem: T | null, // highlighted or selected item
    predicate: (item: T) => boolean,
    keepActive: boolean = false
): T | null => {
    const matchedItems = Array.from(items).filter(predicate);

    if (matchedItems.length === 0) {
        return null;
    }

    const currentIndex = activeItem ? matchedItems.indexOf(activeItem) : -1;
    if (keepActive && currentIndex !== -1) {
        return matchedItems[currentIndex];
    }
    const nextIndex = (currentIndex + 1) % matchedItems.length;
    return matchedItems[nextIndex];
};
