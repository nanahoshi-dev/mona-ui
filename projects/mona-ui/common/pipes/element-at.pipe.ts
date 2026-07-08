import { Pipe, PipeTransform } from "@angular/core";
import { elementAtOrDefault } from "@mirei/ts-collections";

@Pipe({
    name: "monaElementAt"
})
export class ElementAtPipe implements PipeTransform {
    public transform<T>(value: Iterable<T>, index: number): T | null {
        return elementAtOrDefault(value, index) ?? null;
    }
}
