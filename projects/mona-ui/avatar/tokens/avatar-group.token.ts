import { InjectionToken, type Signal } from "@angular/core";

/** What an avatar asks the group it's in: whether it's past the group's `max`, and so hidden. */
export interface AvatarGroupContext {
    isCollapsed(avatar: unknown): Signal<boolean>;
}

/** @hidden Provided by `mona-avatar-group` for the avatars inside it. */
export const AVATAR_GROUP = new InjectionToken<AvatarGroupContext>("MONA_AVATAR_GROUP");
