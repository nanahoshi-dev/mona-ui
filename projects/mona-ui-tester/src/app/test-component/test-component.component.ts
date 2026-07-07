import { Component, OnInit, ChangeDetectionStrategy } from "@angular/core";
import { PopupRef } from "mona-ui/popup";

@Component({
    selector: "app-test-component",
    templateUrl: "./test-component.component.html",
    styleUrls: ["./test-component.component.scss"],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: true
})
export class TestComponentComponent implements OnInit {
    public constructor(private readonly popupRef: PopupRef) {}

    public ngOnInit(): void {
        console.log(this.popupRef);
    }
}
