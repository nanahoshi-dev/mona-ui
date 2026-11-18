import { Component, signal } from "@angular/core";
import { AutoCompleteComponent } from "@nanahoshi/mona-ui/auto-complete";
import { ComboBoxComponent } from "@nanahoshi/mona-ui/combo-box";
import { DropdownListComponent } from "@nanahoshi/mona-ui/dropdown-list";
import { LabelDirective } from "@nanahoshi/mona-ui/label";
import { MultiSelectComponent } from "@nanahoshi/mona-ui/multi-select";

/** Dropdown fields in a scroll box, for the check that a popup opened as focus scrolls its field in stays open. */
@Component({
    imports: [AutoCompleteComponent, ComboBoxComponent, DropdownListComponent, LabelDirective, MultiSelectComponent],
    templateUrl: "./popup-scroll-fixture.component.html"
})
export class PopupScrollFixtureComponent {
    protected readonly comboBoxDayId = signal<number | null>(7);
    protected readonly countries = ["Argentina", "Canada", "Chile", "Germany", "Japan", "Kenya", "Mexico", "Norway"];
    protected readonly country = signal<string | null>(null);
    protected readonly dayId = signal<number | null>(7);
    protected readonly dayIds = signal<number[]>([6, 7]);
    // Long enough for the list to scroll to the selected day when it opens.
    protected readonly days = [
        { id: 1, name: "Monday" },
        { id: 2, name: "Tuesday" },
        { id: 3, name: "Wednesday" },
        { id: 4, name: "Thursday" },
        { id: 5, name: "Friday" },
        { id: 6, name: "Saturday" },
        { id: 7, name: "Sunday" }
    ];
}
