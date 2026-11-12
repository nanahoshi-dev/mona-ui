import { Component, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import type { ApiSection } from "../../api-text";
import { ApiProseComponent } from "../api-prose/api-prose.component";
import { ApiTypeComponent } from "../api-type/api-type.component";

/** One section of a symbol's page, such as its inputs, with each member under its own anchor. */
@Component({
    selector: "app-api-member-section",
    imports: [ApiProseComponent, ApiTypeComponent, RouterLink],
    templateUrl: "./api-member-section.component.html",
    host: {
        class: "block mt-10"
    }
})
export class ApiMemberSectionComponent {
    /** Exported names, with the entry point of each. */
    public readonly links = input<Readonly<Record<string, string>>>({});
    public readonly section = input.required<ApiSection>();
    /** The symbol whose page this is. */
    public readonly self = input<string>();
}
