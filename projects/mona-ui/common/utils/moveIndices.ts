/**
 * Moves the items at `indices` by `offset` positions, keeping their relative order. Returns a copy of the array
 * unchanged when the offset is 0 or not an integer, or when any index is not an integer, is out of bounds, or would
 * move out of bounds. Duplicate indices count once.
 */
export function moveIndices<T>(array: T[], indices: number[], offset: number): T[] {
    if (offset === 0 || indices.length === 0 || !Number.isInteger(offset)) {
        return [...array];
    }
    indices = [...new Set(indices)];

    // Validate indices are integers within bounds
    if (indices.some(i => !Number.isInteger(i) || i < 0 || i >= array.length)) {
        return [...array];
    }

    // Check if any index would go out of bounds after the move
    for (const index of indices) {
        const newIndex = index + offset;
        if (newIndex < 0 || newIndex >= array.length) {
            return [...array];
        }
    }

    // Create a copy of the array
    const result = [...array];

    // Sort indices based on movement direction to avoid conflicts
    const sortedIndices = [...indices].sort((a, b) => (offset > 0 ? b - a : a - b));

    // Move each item to its new position
    for (const index of sortedIndices) {
        const item = result[index];
        const newIndex = index + offset;

        // Remove item from current position
        result.splice(index, 1);

        // Insert at new position
        result.splice(newIndex, 0, item);
    }
    return result;
}
