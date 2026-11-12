import { Component, computed, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import { SECTION_HUES } from "../../api-kind-hues";
import type { ApiSection } from "../../api-text";
import { ApiProseComponent } from "../api-prose/api-prose.component";
import { ApiTypeComponent } from "../api-type/api-type.component";

/**
 * One section of a symbol's page, such as its inputs, tinted with the section's hue: each member is a card under its
 * own anchor, with its type, flags and default, then what it does.
 */
@Component({
    selector: "app-api-member-section",
    imports: [ApiProseComponent, ApiTypeComponent, RouterLink],
    templateUrl: "./api-member-section.component.html",
    host: {
        class: "block mt-8",
        "[style.--api-kind]": "hue()"
    }
})
export class ApiMemberSectionComponent {
    protected readonly hue = computed(() => SECTION_HUES[this.section().kind]);
    /** Exported names, with the entry point of each. */
    public readonly links = input<Readonly<Record<string, string>>>({});
    public readonly section = input.required<ApiSection>();
    /** The symbol whose page this is. */
    public readonly self = input<string>();
}
