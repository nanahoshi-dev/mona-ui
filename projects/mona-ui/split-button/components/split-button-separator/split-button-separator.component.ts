import { Component, forwardRef } from "@angular/core";
import { PopupMenuOrigin, PopupMenuSeparatorComponent, PopupMenuToken } from "@mirei/mona-ui/popup-menu";

@Component({
    selector: "mona-split-button-separator",
    template: "",
    providers: [
        {
            provide: PopupMenuToken,
            useExisting: forwardRef(() => SplitButtonSeparatorComponent)
        }
    ]
})
export class SplitButtonSeparatorComponent extends PopupMenuSeparatorComponent {
    public override readonly origin = PopupMenuOrigin.SplitButton;
}
