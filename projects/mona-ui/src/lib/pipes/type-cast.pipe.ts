import { Pipe, PipeTransform, Type } from "@angular/core";

@Pipe({
    name: "monaTypeCast"
})
export class TypeCastPipe implements PipeTransform {
    transform<S, T extends S>(value: S, type: Type<T>): T {
        return value as T;
    }
}
