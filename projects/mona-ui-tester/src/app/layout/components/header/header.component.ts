import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { faHeart } from "@fortawesome/free-solid-svg-icons";

@Component({
    selector: "app-header",
    imports: [RouterLink, FaIconComponent],
    templateUrl: "./header.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {
    protected readonly logoIcon = faHeart;
}
