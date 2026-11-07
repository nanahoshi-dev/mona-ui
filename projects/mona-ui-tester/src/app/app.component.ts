import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterOutlet } from "@angular/router";
import { HeaderComponent } from "./layout/components/header/header.component";
import { SidebarService } from "./layout/services/sidebar.service";

@Component({
    selector: "app-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.scss"],
    imports: [CommonModule, FormsModule, HeaderComponent, RouterOutlet]
})
export class AppComponent {
    public readonly sidebarService = inject(SidebarService);
}
