import { InjectionToken } from "@angular/core";
import type { Signal } from "@angular/core";
import type { ButtonDirective } from "../directives/button.directive";

/**
 * A component whose own buttons join the `mona-button-group` it is placed in, such as a dropdown or split button.
 * Those buttons follow the group's look, size, rounding and disabled state, but they aren't toggleable and take no
 * part in the group's selection.
 */
export interface ButtonGroupMember {
    /**
     * The component's buttons that join the group.
     */
    readonly groupButtons: Signal<readonly ButtonDirective[]>;
}

/**
 * Provided by a component that implements {@link ButtonGroupMember}, so a `mona-button-group` can find it among its
 * content children.
 */
export const BUTTON_GROUP_MEMBER = new InjectionToken<ButtonGroupMember>("BUTTON_GROUP_MEMBER");
