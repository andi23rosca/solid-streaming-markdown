import type { MdNode, Pos } from "./node";

export interface RemovedNodeRange {
	id: [number, number];
	line: [number, number];
}

export interface EditResult {
	nodes: MdNode[];
	removedNodeRange: RemovedNodeRange | null;
}

export type EventName = "change";

export type EventHandlerMap = {
	[key in EventName]: (() => void)[];
};

export abstract class ToastMark {
	// constructor(contents?: string, options?: Partial<ParserOptions>);

	abstract lineTexts: string[];

	abstract editMarkdown(
		startPos: Pos,
		endPos: Pos,
		newText: string,
	): EditResult[];

	abstract getLineTexts(): string[];

	abstract getRootNode(): MdNode;

	abstract findNodeAtPosition(pos: Pos): MdNode | null;

	abstract findFirstNodeAtLine(line: number): MdNode | null;

	abstract on(eventName: EventName, callback: () => void): void;

	abstract off(eventName: EventName, callback: () => void): void;

	abstract findNodeById(id: number): MdNode | null;

	abstract removeAllNode(): void;
}
