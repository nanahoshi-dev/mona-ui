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
        const rawValue = input[propertyType];
        if (typeof rawValue === "string") {
            return rawValue.replaceAll("\r", "\n") || "";
        }
        return rawValue === undefined ? "" : String(rawValue);
    }
}
