import { Pipe, PipeTransform } from "@angular/core";
import { toArray } from "@mirei/ts-collections";

@Pipe({
    name: "toArray"
})
export class ToArrayPipe implements PipeTransform {
    public transform<T>(value: Iterable<T>): T[] {
        return toArray(value);
    }
}
