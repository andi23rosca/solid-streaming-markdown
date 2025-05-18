import type {
	BlockMdNode,
	BlockNodeType,
	MdNode,
	MdNodeType,
	RefDefMdNode,
	Sourcepos,
} from "./node";

export type AutolinkParser = (content: string) => {
	url: string;
	text: string;
	range: [number, number];
}[];

export type CustomParser = (
	node: MdNode,
	context: { entering: boolean; options: ParserOptions },
) => void;
export type CustomParserMap = Partial<Record<MdNodeType, CustomParser>>;

type RefDefState = {
	id: number;
	destination: string;
	title: string;
	unlinked: boolean;
	sourcepos: Sourcepos;
};

export type RefMap = {
	[k: string]: RefDefState;
};

export type RefLinkCandidateMap = {
	[k: number]: {
		node: BlockMdNode;
		refLabel: string;
	};
};

export type RefDefCandidateMap = {
	[k: number]: RefDefMdNode;
};

export interface ParserOptions {
	smart: boolean;
	tagFilter: boolean;
	extendedAutolinks: boolean | AutolinkParser;
	disallowedHtmlBlockTags: string[];
	referenceDefinition: boolean;
	disallowDeepHeading: boolean;
	frontMatter: boolean;
	customParser: CustomParserMap | null;
}

export abstract class BlockParser {
	// constructor(options?: Partial<ParserOptions>);

	abstract advanceOffset(count: number, columns?: boolean): void;

	abstract advanceNextNonspace(): void;

	abstract findNextNonspace(): void;

	abstract addLine(): void;

	abstract addChild(tag: BlockNodeType, offset: number): BlockMdNode;

	abstract closeUnmatchedBlocks(): void;

	abstract finalize(block: BlockMdNode, lineNumber: number): void;

	abstract processInlines(block: BlockMdNode): void;

	abstract incorporateLine(ln: string): void;

	// The main parsing function.  Returns a parsed document AST.
	abstract parse(input: string, lineTexts?: string[]): MdNode;

	abstract partialParseStart(lineNumber: number, lines: string[]): MdNode;

	abstract partialParseExtends(lines: string[]): void;

	abstract partialParseFinish(): void;

	abstract setRefMaps(
		refMap: RefMap,
		refLinkCandidateMap: RefLinkCandidateMap,
		refDefCandidateMap: RefDefCandidateMap,
	): void;

	abstract clearRefMaps(): void;
}
