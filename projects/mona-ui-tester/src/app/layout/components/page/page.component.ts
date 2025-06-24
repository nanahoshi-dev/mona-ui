import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { PageService } from "../../services/page.service";
import { PageNavigationComponent } from "../page-navigation/page-navigation.component";
import { SidebarComponent } from "../sidebar/sidebar.component";

@Component({
    selector: "app-page",
    imports: [RouterOutlet, SidebarComponent, PageNavigationComponent],
    templateUrl: "./page.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [PageService]
})
export class PageComponent {}
