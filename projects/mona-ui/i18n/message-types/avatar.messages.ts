/**
 * The avatar group's count of the avatars it doesn't show.
 */
export interface MonaAvatarMessages {
    /** Name of the item that stands for the avatars past `max`, such as "3 more". It shows the count as "+3". */
    moreLabel(count: number): string;
}
