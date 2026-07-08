export const cycleThroughMatchedItems = <T>(
    items: Iterable<T>,
    activeItem: T | null, // highlighted or selected item
    predicate: (item: T) => boolean
): T | null => {
    const matchedItems = Array.from(items).filter(predicate);

    if (matchedItems.length === 0) {
        return null;
    }

    const currentIndex = activeItem ? matchedItems.indexOf(activeItem) : -1;
    const nextIndex = (currentIndex + 1) % matchedItems.length;
    return matchedItems[nextIndex];
};
