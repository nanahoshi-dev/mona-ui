// Generated from i18n/catalogs/en-US.messages.json by scripts/generate-locale-catalogs.ts. Do not edit.
// Edit the JSON file and run `npm run generate:locale-catalogs`.

import { formatNumber, type MonaFileUploadMessages } from "@nanahoshi/mona-ui/i18n";

function localizeNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return formatNumber(value, "en-US", options);
}

const PLURAL_RULES = new Intl.PluralRules("en-US");

function plural(
    category: Intl.LDMLPluralRule,
    forms: Partial<Record<Intl.LDMLPluralRule, () => string>> & { readonly other: () => string }
): string {
    return (forms[category] ?? forms.other)();
}

export const FILE_UPLOAD_DEFAULT_MESSAGES: MonaFileUploadMessages = {
    browse: "Browse files",
    browseFile: "Choose a file",
    cancel: (name: string) => `Cancel the upload of ${name}`,
    clear: "Clear",
    dropFile: "Drag a file here",
    dropFiles: "Drag files here",
    dropToAdd: "Drop to add",
    fileFailed: (name: string) => `${name} couldn't be uploaded.`,
    fileRejected: (name: string, reason: string) => `${name} wasn't added. ${reason}`,
    fileRemoved: (name: string) => `${name} removed.`,
    fileTypes: (types: string) => `File types: ${types}`,
    fileUploaded: (name: string) => `${name} uploaded.`,
    files: "Files",
    filesAdded: (count: number) =>
        plural(PLURAL_RULES.select(count), {
            one: () => `${localizeNumber(count)} file added.`,
            other: () => `${localizeNumber(count)} files added.`
        }),
    invalidType: "This file type isn't accepted.",
    maxFileSize: (size: string) => `Max. file size: ${size}`,
    maxFiles: (count: number) =>
        `Up to ${plural(PLURAL_RULES.select(count), { one: () => `${localizeNumber(count)} file`, other: () => `${localizeNumber(count)} files` })}`,
    readyToUpload: "Ready to upload",
    remove: (name: string) => `Remove ${name}`,
    retry: (name: string) => `Retry the upload of ${name}`,
    tooLarge: (size: string) => `The file is larger than ${size}.`,
    tooMany: (count: number) =>
        `No more than ${plural(PLURAL_RULES.select(count), { one: () => `${localizeNumber(count)} file`, other: () => `${localizeNumber(count)} files` })} can be added.`,
    tooSmall: (size: string) => `The file is smaller than ${size}.`,
    upload: "Upload",
    uploadFailed: "The upload failed.",
    uploaded: "Uploaded",
    uploading: "Uploading"
};
