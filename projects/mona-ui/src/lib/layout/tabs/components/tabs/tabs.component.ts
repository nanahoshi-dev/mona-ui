import { NgTemplateOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, input, output } from "@angular/core";
import { TabCloseEvent } from "../../models/TabCloseEvent";
import { TabsService } from "../../services/tabs.service";
import { TabsVariantInput, TabsVariantProps } from "../../styles/tabs.styles";
import { TabListComponent } from "../tab-list/tab-list.component";

@Component({
    selector: "mona-tabs",
    templateUrl: "./tabs.component.html",
    styleUrls: ["./tabs.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgTemplateOutlet, TabListComponent],
    providers: [TabsService]
})
export class TabsComponent implements TabsVariantInput {
    readonly #tabsService = inject(TabsService);
    protected readonly tabList = this.#tabsService.tabList;
    public readonly closable = input(false);
    public readonly keepTabContent = input(false);
    public readonly rounded = input<TabsVariantProps["rounded"]>("medium");
    public readonly tabClose = output<TabCloseEvent>();
}
