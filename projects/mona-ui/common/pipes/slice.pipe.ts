import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
    name: "monaSlice"
})
export class SlicePipe implements PipeTransform {
    /**
     * Returns the elements from `start` up to, but not including, `end`, with the semantics of `Array.prototype.slice`:
     * negative indices count from the end, and an omitted `end` slices to the end. Returns an empty array for
     * `null` or `undefined`, such as the first value of the `async` pipe.
     */
    public transform<T>(value: Iterable<T> | null | undefined, start: number, end?: number): T[] {
        if (value == null) {
            return [];
        }
        return Array.from(value).slice(start, end);
    }
}
