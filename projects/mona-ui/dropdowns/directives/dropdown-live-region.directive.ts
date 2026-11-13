import { LiveAnnouncer } from "@angular/cdk/a11y";
import { Directive, effect, inject, untracked } from "@angular/core";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { ListService } from "@nanahoshi/mona-ui/internal/list";
import { DROPDOWNS_DEFAULT_MESSAGES } from "../i18n/dropdowns.default-messages";
import { DropdownService } from "../services/dropdown.service";

/**
 * Announces how many results a dropdown shows after its list is filtered, or after its items change, while the
 * popup is open ("3 results available", "No results found").
 *
 * The announcement goes through the CDK `LiveAnnouncer`, whose live region lives at the end of the document, so it
 * never becomes part of the combobox's content. The highlighted option isn't announced here:
 * `aria-activedescendant` already does that.
 * @hidden Exported for Mona UI's other entry points; applications don't need it.
 */
@Directive({
    selector: "[monaDropdownLiveRegion]"
})
export class DropdownLiveRegionDirective {
    readonly #dropdownService = inject(DropdownService);
    readonly #i18n = inject(MonaI18nService);
    readonly #listService = inject(ListService);
    readonly #liveAnnouncer = inject(LiveAnnouncer);
    readonly #messages = this.#i18n.componentMessages("dropdowns", DROPDOWNS_DEFAULT_MESSAGES);

    public constructor() {
        // What the list showed when it was last announced, or when the popup opened. Null while the popup is closed.
        let lastState: string | null = null;
        effect(() => {
            const expanded = this.#dropdownService.popupRef() !== null;
            const filterText = this.#listService.filterText();
            const count = this.#listService.viewItems().size();
            untracked(() => {
                if (!expanded) {
                    lastState = null;
                    return;
                }
                const state = `${filterText}\u0000${count}`;
                if (state === lastState) {
                    return;
                }
                const opening = lastState === null;
                lastState = state;
                // Opening the popup isn't news, unless the text that opened it already filtered the list (a combo
                // box or auto-complete opens on the first keystroke).
                if (opening && !filterText) {
                    return;
                }
                const messages = this.#messages();
                void this.#liveAnnouncer.announce(
                    count === 0 ? messages.noResultsFound : messages.resultsAvailable(count),
                    "polite"
                );
            });
        });
    }
}
