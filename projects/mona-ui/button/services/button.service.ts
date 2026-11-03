import { computed, Injectable, signal } from "@angular/core";
import type { Signal } from "@angular/core";
import { Subject } from "rxjs";
import type { ButtonDirective } from "../directives/button.directive";
import { ButtonVariantProps } from "../styles/button.styles";

@Injectable()
export class ButtonService {
    readonly #members = signal<Signal<readonly ButtonDirective[]> | null>(null);
    public readonly buttonClick$: Subject<[ButtonDirective, boolean]> = new Subject<[ButtonDirective, boolean]>();
    public readonly buttonSelect$: Subject<[ButtonDirective, boolean]> = new Subject<[ButtonDirective, boolean]>();
    public readonly groupDisabled = signal(false);
    public readonly groupLook = signal<ButtonVariantProps["look"] | undefined>(undefined);
    public readonly groupRounded = signal<ButtonVariantProps["rounded"] | undefined>(undefined);
    public readonly groupSize = signal<ButtonVariantProps["size"] | undefined>(undefined);

    /**
     * The buttons that belong to the group. Only these follow the group's look, size, rounding, disabled state and
     * selection; other buttons that can inject this service ignore it.
     */
    public readonly members = computed(() => this.#members()?.() ?? []);

    /**
     * Sets the source of the group's members, such as the group's `contentChildren(ButtonDirective)` query.
     */
    public setMembers(members: Signal<readonly ButtonDirective[]>): void {
        this.#members.set(members);
    }
}
