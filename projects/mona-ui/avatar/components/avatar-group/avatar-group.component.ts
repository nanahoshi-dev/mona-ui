import { Component, computed, contentChildren, inject, input, numberAttribute, type Signal } from "@angular/core";
import { classInputToClass, type ClassInputType } from "@nanahoshi/mona-ui/common";
import { formatNumber, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { twMerge } from "tailwind-merge";
import { AVATAR_DEFAULT_MESSAGES } from "../../i18n/avatar.default-messages";
import { AVATAR_GROUP_MORE_CLASSES, avatarGroupThemeVariants } from "../../styles/avatar-group.styles";
import { AVATAR_GROUP } from "../../tokens/avatar-group.token";
import { AvatarComponent } from "../avatar/avatar.component";

/**
 * Stacks `mona-avatar`s in an overlapping row, such as the members of a project. Past `max`, the rest collapse into one
 * item that counts them, as in "+3".
 */
@Component({
    selector: "mona-avatar-group",
    templateUrl: "./avatar-group.component.html",
    providers: [{ provide: AVATAR_GROUP, useExisting: AvatarGroupComponent }],
    host: {
        "[attr.aria-label]": "ariaLabel() || null",
        "[attr.role]": "'group'",
        "[class]": "baseClass()",
        "[style.--mona-avatar-group-overlap]": "overlap()"
    }
})
export class AvatarGroupComponent {
    readonly #i18n = inject(MonaI18nService);

    protected readonly avatars = contentChildren(AvatarComponent);
    protected readonly baseClass = computed(() => twMerge(avatarGroupThemeVariants(), this.userClass()));
    protected readonly collapsedCount = computed(() => {
        const max = this.max();
        return max == null ? 0 : Math.max(0, this.avatars().length - max);
    });
    protected readonly messages = this.#i18n.componentMessages("avatar", AVATAR_DEFAULT_MESSAGES);
    protected readonly moreClass = AVATAR_GROUP_MORE_CLASSES;
    /** The count looks like the avatars it stands for: their size, shape and border. */
    protected readonly moreStyles = computed(() => {
        const first = this.avatars()[0];
        const height = first?.height() ?? "64px";
        return {
            borderRadius: first?.borderRadius() ?? "0",
            borderWidth: first?.borderWidth() ?? "1px",
            fontSize: `calc(${height} * 0.36)`,
            height,
            width: first?.width() ?? "64px"
        };
    });
    protected readonly moreText = computed(() =>
        formatNumber(this.collapsedCount(), this.#i18n.localeId(), { signDisplay: "always" })
    );
    protected readonly overlap = computed(() => `calc(${this.avatars()[0]?.width() ?? "64px"} * -0.25)`);

    /**
     * @description Accessible name of the group, such as "Project members". The group is read as one, with each avatar's
     * name inside it.
     * @default ""
     */
    public readonly ariaLabel = input("", { alias: "aria-label" });

    /**
     * @description How many avatars to show. The rest collapse into one item that counts them, named such as "3 more".
     * Without it, every avatar shows.
     * @default null
     */
    public readonly max = input<number | null, number | string | null | undefined>(null, {
        transform: value => (value == null || value === "" ? null : Math.max(0, Math.floor(numberAttribute(value))))
    });

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string, ClassInputType>("", {
        alias: "class",
        transform: value => classInputToClass(value)
    });

    /**
     * Whether an avatar is past `max`, and so hidden.
     * @hidden
     */
    public isCollapsed(avatar: unknown): Signal<boolean> {
        return computed(() => {
            const max = this.max();
            return max != null && this.avatars().indexOf(avatar as AvatarComponent) >= max;
        });
    }
}
