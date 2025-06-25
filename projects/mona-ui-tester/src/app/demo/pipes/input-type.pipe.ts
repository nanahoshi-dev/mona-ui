import { Pipe, PipeTransform } from "@angular/core";
import { ComponentInputMetadata } from "../models/ComponentMetadata";

@Pipe({
    name: "inputProperty"
})
export class InputPropertyPipe implements PipeTransform {
    public transform(
        value: ComponentInputMetadata[],
        propertyName: string,
        propertyType: keyof ComponentInputMetadata
    ): string {
        if (!value || !propertyName) {
            return "";
        }
        const input = value.find(input => input.name === propertyName);
        if (!input) {
            return "";
        }
        return input[propertyType] || "";
    }
}
