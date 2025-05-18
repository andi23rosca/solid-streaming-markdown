import type { EditResult } from "@t/index";
import type { Pos } from "./types/node";
import type {
	Node,
	LinkNode,
	CodeNode,
	HeadingNode,
	ListNode,
	CodeBlockNode,
	TableNode,
	TableCellNode,
	RefDefNode,
	CustomBlockNode,
	HtmlBlockNode,
	CustomInlineNode,
} from "./commonmark/node";

// Base AST node interface with common properties
export interface BaseASTNode {
	id: number;
	type: string;
	literal: string | null;
	sourcepos?: [number, number][];
	children: ASTNode[];
}

// Specific node type interfaces
export interface LinkASTNode extends BaseASTNode {
	type: "link" | "image";
	destination: string | null;
	title: string | null;
	extendedAutolink: boolean;
}

export interface CodeASTNode extends BaseASTNode {
	type: "code";
	tickCount: number;
}

export interface HeadingASTNode extends BaseASTNode {
	type: "heading";
	level: number;
	headingType: "atx" | "setext";
}

export interface ListASTNode extends BaseASTNode {
	type: "list" | "item";
	listData: {
		type: "bullet" | "ordered";
		start: number;
		tight: boolean;
		delimiter: string;
	} | null;
}

export interface CodeBlockASTNode extends BaseASTNode {
	type: "codeBlock";
	isFenced: boolean;
	fenceChar: string | null;
	fenceLength: number;
	fenceOffset: number;
	info: string | null;
	infoPadding: number;
}

export interface TableASTNode extends BaseASTNode {
	type: "table";
	columns: {
		align: "left" | "right" | "center" | null;
	}[];
}

export interface TableCellASTNode extends BaseASTNode {
	type: "tableCell";
	startIdx: number;
	endIdx: number;
	paddingLeft: number;
	paddingRight: number;
	ignored: boolean;
}

export interface RefDefASTNode extends BaseASTNode {
	type: "refDef";
	title: string;
	dest: string;
	label: string;
}

export interface CustomBlockASTNode extends BaseASTNode {
	type: "customBlock";
	syntaxLength: number;
	offset: number;
	info: string;
}

export interface HtmlBlockASTNode extends BaseASTNode {
	type: "htmlBlock";
	htmlBlockType: number;
}

export interface CustomInlineASTNode extends BaseASTNode {
	type: "customInline";
	info: string;
}

// Union type of all possible AST nodes
export type ASTNode =
	| BaseASTNode
	| LinkASTNode
	| CodeASTNode
	| HeadingASTNode
	| ListASTNode
	| CodeBlockASTNode
	| TableASTNode
	| TableCellASTNode
	| RefDefASTNode
	| CustomBlockASTNode
	| HtmlBlockASTNode
	| CustomInlineASTNode;

export interface ASTResult {
	addedNodes: ASTNode[];
	removedRange?: {
		id: [number, number];
		line: [number, number];
	};
}

export function createAST(
	diff: EditResult[],
	appendPositions: Pos[] = [],
): ASTResult[] {
	return diff.map((result) => {
		const { nodes, removedNodeRange } = result;

		const processNode = (node: Node): ASTNode[] => {
			const baseNode: BaseASTNode = {
				id: node.id,
				type: node.type,
				literal: node.literal,
				sourcepos: node.sourcepos,
				children: [],
			};

			// Process children recursively
			let child = node.firstChild;
			while (child) {
				baseNode.children.push(...processNode(child));
				child = child.next;
			}

			// Split text nodes at append positions
			if (
				node.type === "text" &&
				node.literal &&
				node.sourcepos &&
				appendPositions.length > 0
			) {
				const [line, col] = node.sourcepos[0];
				const relevantPositions = appendPositions.filter(
					(pos) =>
						pos[0] === line &&
						pos[1] > col &&
						pos[1] < col + (node.literal?.length ?? 0),
				);

				if (relevantPositions.length > 0) {
					// Sort positions by column
					relevantPositions.sort((a, b) => a[1] - b[1]);

					// Split the text node into multiple nodes
					let lastCol = col;
					const splitNodes: ASTNode[] = [];
					let remainingText = node.literal;

					for (const pos of relevantPositions) {
						const splitIndex = pos[1] - col;
						const firstPart = remainingText.slice(0, splitIndex);
						const secondPart = remainingText.slice(splitIndex);

						if (firstPart) {
							splitNodes.push({
								...baseNode,
								id: node.id + splitNodes.length,
								literal: firstPart,
								sourcepos: [
									[line, lastCol],
									[line, pos[1] - 1],
								],
								children: [],
							});
						}

						lastCol = pos[1];
						remainingText = secondPart;
					}

					if (remainingText) {
						splitNodes.push({
							...baseNode,
							id: node.id + splitNodes.length,
							literal: remainingText,
							sourcepos: [
								[line, lastCol],
								[line, lastCol + remainingText.length - 1],
							],
							children: [],
						});
					}

					// If we have split nodes, return the first one
					if (splitNodes.length > 0) {
						return splitNodes;
					}
				}
			}

			// Add type-specific properties
			switch (node.type) {
				case "link":
				case "image": {
					const linkNode = node as LinkNode;
					const astNode: LinkASTNode = {
						...baseNode,
						type: node.type as "link" | "image",
						destination: linkNode.destination,
						title: linkNode.title,
						extendedAutolink: linkNode.extendedAutolink,
					};
					return [astNode];
				}
				case "code": {
					const codeNode = node as CodeNode;
					const astNode: CodeASTNode = {
						...baseNode,
						type: "code",
						tickCount: codeNode.tickCount,
					};
					return [astNode];
				}
				case "heading": {
					const headingNode = node as HeadingNode;
					const astNode: HeadingASTNode = {
						...baseNode,
						type: "heading",
						level: headingNode.level,
						headingType: headingNode.headingType,
					};
					return [astNode];
				}
				case "list":
				case "item": {
					const listNode = node as ListNode;
					const astNode: ListASTNode = {
						...baseNode,
						type: node.type as "list" | "item",
						listData: listNode.listData,
					};
					return [astNode];
				}
				case "codeBlock": {
					const codeBlockNode = node as CodeBlockNode;
					const astNode: CodeBlockASTNode = {
						...baseNode,
						type: "codeBlock",
						isFenced: codeBlockNode.isFenced,
						fenceChar: codeBlockNode.fenceChar,
						fenceLength: codeBlockNode.fenceLength,
						fenceOffset: codeBlockNode.fenceOffset,
						info: codeBlockNode.info,
						infoPadding: codeBlockNode.infoPadding,
					};
					return [astNode];
				}
				case "table": {
					const tableNode = node as TableNode;
					const astNode: TableASTNode = {
						...baseNode,
						type: "table",
						columns: tableNode.columns,
					};
					return [astNode];
				}
				case "tableCell": {
					const tableCellNode = node as TableCellNode;
					const astNode: TableCellASTNode = {
						...baseNode,
						type: "tableCell",
						startIdx: tableCellNode.startIdx,
						endIdx: tableCellNode.endIdx,
						paddingLeft: tableCellNode.paddingLeft,
						paddingRight: tableCellNode.paddingRight,
						ignored: tableCellNode.ignored,
					};
					return [astNode];
				}
				case "refDef": {
					const refDefNode = node as RefDefNode;
					const astNode: RefDefASTNode = {
						...baseNode,
						type: "refDef",
						title: refDefNode.title,
						dest: refDefNode.dest,
						label: refDefNode.label,
					};
					return [astNode];
				}
				case "customBlock": {
					const customBlockNode = node as CustomBlockNode;
					const astNode: CustomBlockASTNode = {
						...baseNode,
						type: "customBlock",
						syntaxLength: customBlockNode.syntaxLength,
						offset: customBlockNode.offset,
						info: customBlockNode.info,
					};
					return [astNode];
				}
				case "htmlBlock": {
					const htmlBlockNode = node as HtmlBlockNode;
					const astNode: HtmlBlockASTNode = {
						...baseNode,
						type: "htmlBlock",
						htmlBlockType: htmlBlockNode.htmlBlockType,
					};
					return [astNode];
				}
				case "customInline": {
					const customInlineNode = node as CustomInlineNode;
					const astNode: CustomInlineASTNode = {
						...baseNode,
						type: "customInline",
						info: customInlineNode.info,
					};
					return [astNode];
				}
				default:
					return [baseNode];
			}
		};

		return {
			addedNodes: nodes.flatMap(processNode),
			removedRange: removedNodeRange ?? undefined,
		};
	});
}
