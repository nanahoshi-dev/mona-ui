import { Pipe, type PipeTransform } from "@angular/core";
import type { ComponentPropertyMetadata } from "../models/ComponentMetadata";

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
        const rawValue = input[propertyType];
        if (typeof rawValue === "string") {
            // A Windows line ending is one break, not two, which would start a new paragraph in a description.
            return rawValue.replace(/\r\n?/g, "\n");
        }
        return rawValue === undefined ? "" : String(rawValue);
    }
}
