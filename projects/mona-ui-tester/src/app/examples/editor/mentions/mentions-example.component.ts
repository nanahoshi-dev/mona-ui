import { Component, computed, signal } from "@angular/core";
import { EditorComponent, type EditorMention, type EditorMentionSearch } from "@nanahoshi/mona-ui/editor";
import { FormFieldComponent } from "@nanahoshi/mona-ui/form-field";

const TEAM: readonly EditorMention[] = [
    { id: "u1", label: "Ana Lima" },
    { id: "u2", label: "Bo Chen" },
    { id: "u3", label: "Chidi Okafor" },
    { id: "u4", label: "Dana Weiss" },
    { id: "u5", label: "Emre Kaya" },
    { id: "u6", label: "Fatima Zahra" },
    { id: "u7", label: "Giulia Rossi" },
    { id: "u8", label: "Hana Sato" }
];

@Component({
    selector: "app-editor-mentions-example",
    imports: [EditorComponent, FormFieldComponent],
    templateUrl: "./mentions-example.component.html"
})
export class EditorMentionsExampleComponent {
    protected readonly comment = signal(
        '<p>Thanks <span data-type="mention" data-id="u2" data-label="Bo Chen">@Bo Chen</span> for the review.</p>'
    );

    /** Who the comment mentions, from the `data-id` of each mention in its HTML. */
    protected readonly mentioned = computed(() => {
        const ids = new Set(Array.from(this.comment().matchAll(/data-id="([^"]*)"/gu), match => match[1]));
        return TEAM.filter(person => ids.has(person.id)).map(person => person.label);
    });

    /** A search can return a promise or an observable too, such as a request to the server. */
    protected readonly search: EditorMentionSearch = query => {
        const text = query.toLocaleLowerCase();
        return TEAM.filter(person => person.label.toLocaleLowerCase().includes(text)).slice(0, 6);
    };
}
