import { Pipe, PipeTransform } from "@angular/core";
import { from } from "@mirei/ts-collections";

@Pipe({
    name: "monaSlice"
})
export class SlicePipe implements PipeTransform {
    public transform<T>(value: Iterable<T>, start: number, end: number): T[] {
        return from(value)
            .skip(start)
            .take(end - start)
            .toArray();
    }
}
