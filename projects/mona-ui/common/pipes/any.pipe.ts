import { Pipe, PipeTransform } from "@angular/core";
import { any, Predicate } from "@mirei/ts-collections";

@Pipe({
    name: "monaAny"
})
export class AnyPipe implements PipeTransform {
    public transform<T>(sequence: Iterable<T> | null | undefined, predicate?: Predicate<T>): boolean {
        if (sequence == null) {
            return false;
        }
        if (!predicate) {
            return any(sequence);
        }
        return any(sequence, predicate);
    }
}
