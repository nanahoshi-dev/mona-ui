import { Component, computed, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import { typeTokens } from "../../api-text";

/** A type's text as code, with each exported name in it linking to that name's page. */
@Component({
    selector: "app-api-type",
    imports: [RouterLink],
    templateUrl: "./api-type.component.html"
})
export class ApiTypeComponent {
    protected readonly tokens = computed(() => typeTokens(this.text(), this.links(), this.self()));
    /** Exported names, with the entry point of each. */
    public readonly links = input<Readonly<Record<string, string>>>({});
    /** The symbol whose page this is, which doesn't link to itself. */
    public readonly self = input<string>();
    public readonly text = input.required<string>();
}
