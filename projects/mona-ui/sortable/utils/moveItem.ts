/**
 * A copy of `items` with the item at `from` moved to `to`, the index it has afterwards. Use it to apply a move that a
 * list reports by index, such as a reordered tab. Indexes out of range are clamped; the array isn't changed.
 */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
    const result = [...items];
    if (result.length === 0) {
        return result;
    }
    const last = result.length - 1;
    const start = Math.min(Math.max(Math.trunc(from), 0), last);
    const end = Math.min(Math.max(Math.trunc(to), 0), last);
    const [moved] = result.splice(start, 1);
    result.splice(end, 0, moved);
    return result;
}
