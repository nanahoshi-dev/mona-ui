import { computed, Injectable, signal } from "@angular/core";
import type { Signal } from "@angular/core";
import { Subject } from "rxjs";
import type { ButtonDirective } from "../directives/button.directive";
import { ButtonVariantProps } from "../styles/button.styles";

/**
 * Coordinates a `mona-button-group` with its buttons: the group publishes its look, size, rounding, disabled state
 * and members here, and buttons report clicks and receive selection changes through it. It is public so the
 * button-group entry point can provide it; applications don't need to use it directly.
 *
 * @hidden
 */
@Injectable()
export class ButtonService {
    readonly #members = signal<Signal<readonly ButtonDirective[]> | null>(null);
    /**
     * A click on a toggleable member, with the member and whether it was selected before the click. The group
     * answers it by applying its selection rules through {@link buttonSelect$}.
     */
    public readonly buttonClick$: Subject<[ButtonDirective, boolean]> = new Subject<[ButtonDirective, boolean]>();
    /** A selection change the group applies to a member: the member and whether it is now selected. */
    public readonly buttonSelect$: Subject<[ButtonDirective, boolean]> = new Subject<[ButtonDirective, boolean]>();
    /** Whether the group is disabled. Members are disabled while it is `true`, whatever their own `disabled` input. */
    public readonly groupDisabled = signal(false);
    /** The group's `look`, which members use in place of their own while it is set. */
    public readonly groupLook = signal<ButtonVariantProps["look"] | undefined>(undefined);
    /** Whether the group is read-only. Toggleable members then report `aria-disabled` and keep their selection. */
    public readonly groupReadonly = signal(false);
    /** The group's `rounded`, which members use in place of their own while it is set. */
    public readonly groupRounded = signal<ButtonVariantProps["rounded"] | undefined>(undefined);
    /** The group's `size`, which members use in place of their own while it is set. */
    public readonly groupSize = signal<ButtonVariantProps["size"] | undefined>(undefined);
    /**
     * Every click on a member, toggleable or not, reported after the group has applied its selection.
     */
    public readonly memberClick$: Subject<[ButtonDirective, HTMLButtonElement]> = new Subject<
        [ButtonDirective, HTMLButtonElement]
    >();

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
