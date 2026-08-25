import { Project, SyntaxKind, Node, ClassDeclaration } from "ts-morph";
import type { ClassMemberTypes } from "ts-morph";

// Mirrors classes.memberTypes from eslint.config.mjs — keep in sync manually.
const ORDER: string[] = [
    "signature",
    "#private-static-readonly-field",
    "#private-static-field",
    "#private-instance-readonly-field",
    "#private-readonly-field",
    "#private-instance-field",
    "#private-field",
    "private-static-readonly-field",
    "private-instance-readonly-field",
    "private-readonly-field",
    "private-instance-field",
    "protected-static-readonly-field",
    "protected-instance-readonly-field",
    "protected-readonly-field",
    "protected-instance-field",
    "public-static-readonly-field",
    "public-instance-readonly-field",
    "public-readonly-field",
    "public-instance-field",
    "private-static-field",
    "protected-static-field",
    "public-static-field",
    "private-decorated-field",
    "protected-decorated-field",
    "public-decorated-field",
    "protected-abstract-field",
    "public-abstract-field",
    "public-constructor",
    "protected-constructor",
    "private-constructor",
    "private-static-method",
    "protected-static-method",
    "public-static-method",
    "public-instance-method",
    "protected-instance-method",
    "private-instance-method",
    "protected-abstract-method",
    "public-abstract-method"
];

function getNodeType(member: ClassMemberTypes): string | null {
    if (Node.isConstructorDeclaration(member)) return "constructor";
    if (Node.isMethodDeclaration(member)) return "method";
    if (Node.isGetAccessorDeclaration(member)) return "get";
    if (Node.isSetAccessorDeclaration(member)) return "set";
    if (Node.isPropertyDeclaration(member)) {
        const initializer = member.getInitializer();
        const isFn =
            initializer &&
            (Node.isFunctionExpression(initializer) || Node.isArrowFunction(initializer));
        if (isFn) return "method";
        return member.isReadonly() ? "readonly-field" : "field";
    }
    if (Node.isClassStaticBlockDeclaration(member)) return "static-initialization";
    return null;
}

function getAccessibility(member: ClassMemberTypes): string {
    const nameNode = (member as unknown as { getNameNode?: () => Node }).getNameNode?.();
    if (nameNode && Node.isPrivateIdentifier(nameNode)) return "#private";
    const hasModifier = (member as unknown as { hasModifier?: (k: SyntaxKind) => boolean }).hasModifier;
    if (typeof hasModifier === "function") {
        if (hasModifier(SyntaxKind.PrivateKeyword)) return "private";
        if (hasModifier(SyntaxKind.ProtectedKeyword)) return "protected";
        if (hasModifier(SyntaxKind.PublicKeyword)) return "public";
    }
    return "public";
}

function isStatic(member: ClassMemberTypes): boolean {
    const hasModifier = (member as unknown as { hasModifier?: (k: SyntaxKind) => boolean }).hasModifier;
    return typeof hasModifier === "function" ? hasModifier(SyntaxKind.StaticKeyword) : false;
}

function getMemberGroups(member: ClassMemberTypes): string[] {
    const type = getNodeType(member);
    if (type == null) return [];
    const scope = isStatic(member) ? "static" : "instance";
    const accessibility = getAccessibility(member);
    const groups: string[] = [];

    if (type !== "readonly-signature" && type !== "signature" && type !== "static-initialization") {
        if (type !== "constructor") {
            groups.push(`${accessibility}-${scope}-${type}`);
            groups.push(`${scope}-${type}`);
            if (type === "readonly-field") {
                groups.push(`${accessibility}-${scope}-field`);
                groups.push(`${scope}-field`);
            }
        }
        groups.push(`${accessibility}-${type}`);
        if (type === "readonly-field") {
            groups.push(`${accessibility}-field`);
        }
    }
    groups.push(type);
    if (type === "readonly-signature") groups.push("signature");
    else if (type === "readonly-field") groups.push("field");
    return groups;
}

function getRank(member: ClassMemberTypes): number {
    const groups = getMemberGroups(member);
    for (const group of groups) {
        const idx = ORDER.indexOf(group);
        if (idx !== -1) return idx;
    }
    return -1;
}

function getMemberName(member: ClassMemberTypes): string {
    if (Node.isConstructorDeclaration(member)) return "constructor";
    const nameNode = (member as unknown as { getNameNode?: () => Node | undefined }).getNameNode?.();
    if (nameNode) {
        const text = nameNode.getText();
        if (Node.isPrivateIdentifier(nameNode)) return text.slice(1);
        return text.replace(/^["']|["']$/g, "");
    }
    return "";
}

function reorderClass(classDecl: ClassDeclaration): boolean {
    const members = classDecl.getMembers();
    if (members.length < 2) return false;

    const ranks = members.map(m => getRank(m));
    const names = members.map(m => getMemberName(m));

    const rankedIdx = members.map((_, i) => i).filter(i => ranks[i] !== -1);
    const sortedRankedIdx = [...rankedIdx].sort((a, b) => {
        if (ranks[a] !== ranks[b]) return ranks[a] - ranks[b];
        if (names[a] < names[b]) return -1;
        if (names[a] > names[b]) return 1;
        return a - b;
    });

    const alreadyOrdered = rankedIdx.every((idx, pos) => idx === sortedRankedIdx[pos]);
    if (alreadyOrdered) return false;

    const units = members.map(m => m.getFullText());

    const newUnits = [...units];
    for (let slot = 0; slot < rankedIdx.length; slot++) {
        const targetOriginalIdx = rankedIdx[slot];
        const sourceOriginalIdx = sortedRankedIdx[slot];
        newUnits[targetOriginalIdx] = units[sourceOriginalIdx];
    }

    const first = members[0];
    const last = members[members.length - 1];
    const start = first.getFullStart();
    const end = last.getEnd();

    const sourceFile = classDecl.getSourceFile();
    sourceFile.replaceText([start, end], newUnits.join(""));
    return true;
}

const files = process.argv.slice(2);
if (files.length === 0) {
    console.error("usage: tsx reorder-members.ts <file1> <file2> ...");
    process.exit(1);
}

const project = new Project({
    tsConfigFilePath: "P:/Repositories/nanahoshi-dev/mona-ui/tsconfig.json",
    skipAddingFilesFromTsConfig: true
});

let changedCount = 0;
for (const filePath of files) {
    const sourceFile = project.addSourceFileAtPath(filePath);
    let fileChanged = false;
    for (let pass = 0; pass < 8; pass++) {
        const classDecls = sourceFile.getDescendantsOfKind(SyntaxKind.ClassDeclaration);
        let changedThisPass = false;
        for (const classDecl of classDecls) {
            if (reorderClass(classDecl)) {
                changedThisPass = true;
                fileChanged = true;
                break;
            }
        }
        if (!changedThisPass) break;
    }
    if (fileChanged) {
        changedCount++;
        console.log("changed:", filePath);
    }
}

project.saveSync();
console.log(`Done. ${changedCount} file(s) changed.`);
