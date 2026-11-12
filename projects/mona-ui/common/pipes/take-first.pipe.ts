import { Pipe, PipeTransform } from "@angular/core";
import { firstOrDefault } from "@mirei/ts-collections";

/** @hidden Exported for Mona UI's other entry points; applications don't need it. */
@Pipe({
    name: "monaTakeFirst"
})
export class TakeFirstPipe implements PipeTransform {
    public transform<T>(value: Iterable<T> | null | undefined): T | null {
        if (value == null) {
            return null;
        }
        return firstOrDefault(value);
    }
}
