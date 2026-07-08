import { Injectable, signal } from "@angular/core";
import { Subject } from "rxjs";
import { ButtonDirective } from "../directives/button.directive";
import { ButtonVariantProps } from "../styles/button.styles";

@Injectable()
export class ButtonService {
    public readonly buttonClick$: Subject<[ButtonDirective, boolean]> = new Subject<[ButtonDirective, boolean]>();
    public readonly buttonSelect$: Subject<[ButtonDirective, boolean]> = new Subject<[ButtonDirective, boolean]>();
    public readonly groupDisabled = signal(false);
    public readonly groupLook = signal<ButtonVariantProps["look"] | undefined>(undefined);
    public readonly groupRounded = signal<ButtonVariantProps["rounded"] | undefined>(undefined);
    public readonly groupSize = signal<ButtonVariantProps["size"] | undefined>(undefined);
}
