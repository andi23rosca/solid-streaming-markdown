import type { Pos } from "@t/node";
import { ToastMark } from "./toastmark/toastmark";
import {
	type ASTNode,
	type ASTResult,
	createAST,
	type DocASTNode,
} from "./toastmark/ast";
import { createStore, produce } from "solid-js/store";

export const createIncrementalParser = (initialMarkdown = "") => {
	let parser = new ToastMark("", { extendedAutolinks: true });
	const appendPositions: Pos[] = [];

	const [doc, setDoc] = createStore<DocASTNode>({
		type: "doc",
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
					const toChange = result.addedNodes.slice(0, toRemove.length);

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

	return {
		reset: () => {
			parser = new ToastMark("", { extendedAutolinks: true });
			appendPositions.length = 0;
			setDoc({
				type: "doc",
				id: 0,
				literal: null,
				children: [],
			});
		},
		append,
		doc,
	};
};
