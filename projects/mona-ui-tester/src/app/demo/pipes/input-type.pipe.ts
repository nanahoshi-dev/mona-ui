import { Pipe, PipeTransform } from "@angular/core";
import { ComponentPropertyMetadata } from "../models/ComponentMetadata";

@Pipe({
    name: "inputProperty"
})
export class InputPropertyPipe implements PipeTransform {
    public transform(
        value: ComponentPropertyMetadata[],
        propertyName: string,
        propertyType: keyof ComponentPropertyMetadata
    ): string {
        if (!value || !propertyName) {
            return "";
        }
        const input = value.find(input => input.name === propertyName);
        if (!input) {
            return "";
        }
        return input[propertyType].replaceAll("\r", "\n") || "";
    }
}
