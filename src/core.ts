import type { Pos } from "@t/node";
import { ToastMark } from "./toastmark/toastmark";
import {
	type ASTNode,
	type ASTResult,
	createAST,
	type DocASTNode,
} from "./toastmark/ast";
import { createStore, produce } from "solid-js/store";
import type { ParserOptions } from "@t/parser";

/**
 * Creates a streaming markdown parser that can be used to render markdown
 * incrementally.
 *
 * @param initialMarkdown - The initial markdown to parse.
 * @param options - The options to pass to the parser.
 * @returns A streaming markdown parser.
 *
 * @example
 * ```ts
 * const parser = createSolidStreamingMarkdown("# Hello");
 * parser.append(", world!");
 * parser.append("\nHow's it going?");
 * ```
 */
export const createSolidStreamingMarkdown = (
	initialMarkdown = "",
	options: Partial<ParserOptions> = {},
) => {
	let parser = new ToastMark("", { extendedAutolinks: true, ...options });
	const appendPositions: Pos[] = [];

	const [doc, setDoc] = createStore<DocASTNode>({
		type: "document",
		id: 0,
		literal: null,
		children: [],
	});

	const morphNode = (oldNode: ASTNode, newNode: ASTNode) => {
		const children = oldNode.children;
		Object.assign(oldNode, newNode);
		oldNode.children = children;

		for (let i = 0; i < children.length; i++) {
			const oldChild = children[i];
			const newChild = newNode.children[i];

			if (oldChild && !newChild) {
				oldNode.children.splice(i, oldNode.children.length - i);
				break;
			}
			if (!oldChild && newChild) {
				oldNode.children.push(newChild);
				break;
			}
			if (!oldChild || !newChild) {
				continue;
			}

			morphNode(oldChild, newChild);
		}

		const remaining = newNode.children.slice(oldNode.children.length);
		oldNode.children.push(...remaining);
	};

	const updateDoc = (astResults: ASTResult[]) => {
		setDoc(
			produce((doc) => {
				for (const result of astResults) {
					if (!doc.children.length || !result.removedRange) {
						doc.children.push(...result.addedNodes);
						continue;
					}

					const [start] = result.removedRange.id;

					const toRemoveStart = doc.children.findIndex((c) => c.id === start);
					if (toRemoveStart === -1) {
						doc.children.push(...result.addedNodes);
						continue;
					}

					const toRemove = doc.children.slice(toRemoveStart);
					const toChange = result.addedNodes;

					for (let i = 0; i < toRemove.length; i++) {
						const toRemoveNode = toRemove[i];
						const toChangeNode = toChange[i];
						if (!toRemoveNode && toChangeNode) {
							doc.children[toRemoveStart + i] = toChangeNode;
							continue;
						}
						if (toRemoveNode && !toChangeNode) {
							doc.children.splice(toRemoveStart + i, 1);
							continue;
						}
						if (!toRemoveNode || !toChangeNode) {
							continue;
						}

						morphNode(toRemoveNode, toChangeNode);
					}

					const remaining = toChange.slice(toRemove.length);
					doc.children.push(...remaining);
				}
			}),
		);
	};

	const append = (markdown: string) => {
		const lastPosition = [
			parser.lineTexts.length,
			(parser.lineTexts[parser.lineTexts.length - 1]?.length || 0) + 1,
		] as Pos;
		appendPositions.push(lastPosition);
		const diff = parser.editMarkdown(lastPosition, lastPosition, markdown);
		const astResults = createAST(diff, appendPositions);
		updateDoc(astResults);
		// console.log(doc);
		return astResults;
	};

	append(initialMarkdown);

	const unsafe = {
		parser,
		setDoc,
	};

	return {
		/**
		 * Resets the markdown streaming parser to a clean slate.
		 *
		 * Useful when you want to reuse the instance but have to
		 * render a new markdown doc instead of appending to an existing one.
		 *
		 * @example `reset()`
		 */
		reset: () => {
			parser = new ToastMark("", { extendedAutolinks: true });
			appendPositions.length = 0;
			unsafe.parser = parser;
			setDoc({
				type: "document",
				id: 0,
				literal: null,
				children: [],
			});
		},
		/**
		 * Main function for adding streamed markdown to the parser and
		 * triggering incremental compilations
		 *
		 * @returns The result of the incremental compilation as a list of nodes
		 * to delete and nodes to append. Ignore unless you know you need it.
		 *
		 * @example `append("# Some chunk of markdown")`
		 */
		append,
		/**
		 * The markdown document root.
		 *
		 * Stored as a solid-js store so be careful with destructuring / reactivity.
		 */
		doc,

		/**
		 * Exposes the internal parser and setter for the doc store.
		 * Only use if you know what you're doing.
		 *
		 * See the `append` and `updateDoc` functions in the source code (in `core.ts`)
		 * for reference on how to parse and transform diffs into a markdown tree.
		 *
		 * With access to the `parser` and `setDoc` you can implement any custom flow instead of
		 * the default one.
		 */
		unsafe,
	};
};
