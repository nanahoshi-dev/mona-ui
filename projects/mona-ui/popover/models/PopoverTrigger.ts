/**
 * @description The trigger event for showing/hiding a popover.
 * "click" toggles the popover on click, "hover" opens on pointer enter and
 * closes on pointer leave, and "none" disables automatic triggering so the
 * popover can only be controlled via its `open()`/`close()` methods.
 * Any other DOM event name is also accepted and used as-is to open the popover.
 */
export type PopoverTrigger = "click" | "hover" | "none" | (string & {});
