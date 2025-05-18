import type { MdNode, MdNodeType } from "./node";

export type HTMLConvertor = (
	node: MdNode,
	context: Context,
	convertors?: HTMLConvertorMap,
) => HTMLToken | HTMLToken[] | null;

export type HTMLConvertorMap = Partial<
	Record<MdNodeType | string, HTMLConvertor>
>;

export interface RendererOptions {
	gfm: boolean;
	softbreak: string;
	nodeId: boolean;
	tagFilter: boolean;
	convertors?: HTMLConvertorMap;
}

export interface Context {
	entering: boolean;
	leaf: boolean;
	options: Omit<RendererOptions, "convertors">;
	getChildrenText: (node: MdNode) => string;
	skipChildren: () => void;
	origin?: () => ReturnType<HTMLConvertor>;
}

interface TagToken {
	tagName: string;
	outerNewLine?: boolean;
	innerNewLine?: boolean;
}

export interface OpenTagToken extends TagToken {
	type: "openTag";
	classNames?: string[];
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	attributes?: Record<string, any>;
	selfClose?: boolean;
}

export interface CloseTagToken extends TagToken {
	type: "closeTag";
}

export interface TextToken {
	type: "text";
	content: string;
}

export interface RawHTMLToken {
	type: "html";
	content: string;
	outerNewLine?: boolean;
}

export type HTMLToken = OpenTagToken | CloseTagToken | TextToken | RawHTMLToken;

export abstract class HTMLRenderer {
	// constructor(customOptions?: Partial<RendererOptions>);

	abstract getConvertors(): HTMLConvertorMap;

	abstract getOptions(): RendererOptions;

	abstract render(rootNode: MdNode): string;

	abstract renderHTMLNode(node: HTMLToken): void;
}
