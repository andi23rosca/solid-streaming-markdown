import { ToastMark } from "src/toastmark/toastmark";
import { createAST, type ASTNode, type ASTResult } from "src/toastmark/ast";
import { createStore, produce, reconcile } from "solid-js/store";
import type { Pos } from "src/toastmark/types/node";
import { ASTNodeRenderer } from "./components/ASTRenderers";

const createIncrementalParser = (initialMarkdown = "") => {
	const p = new ToastMark(initialMarkdown);
	const appendPositions: Pos[] = [];

	const [doc, setDoc] = createStore<ASTNode>({
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
			p.lineTexts.length,
			(p.lineTexts[p.lineTexts.length - 1]?.length || 0) + 1,
		] as Pos;
		appendPositions.push(lastPosition);
		const diff = p.editMarkdown(lastPosition, lastPosition, markdown);
		const astResults = createAST(diff, appendPositions);
		updateDoc(astResults);
		// console.log(doc);
		return astResults;
	};

	append(initialMarkdown);

	return {
		append,
		doc,
		setDoc,
	};
};

const p = createIncrementalParser("Cool ");

const toStream = `
# Welcome to Markdown Demo

This is a **bold** demonstration of _markdown_ formatting capabilities.

You can create soft breaks in Markdown by adding two spaces at the end of a line.
This creates a line break without starting a new paragraph.
It's useful for formatting poetry, addresses, or any content where you want to maintain
a specific line structure without the extra spacing that comes with paragraphs.

Soft breaks are particularly helpful when you need to control the visual flow of text
while keeping it all within a single semantic paragraph element.
This makes your content both visually appealing and semantically correct for screen readers
and other accessibility tools that might be used to navigate your markdown content.



## Features

* Lists are easy to create
* And they help organize information
* **Bold** and _italic_ text can be combined for _**emphasis**_

### Links and More

Check out [Solid.js](https://www.solidjs.com/) for more information about the framework.

> Blockquotes provide a nice way to highlight important information
> or to quote someone famous.

Code can be included inline with \`backticks\` or in blocks:

\`\`\`js
function hello() {
  console.log("Hello, markdown!");
}
\`\`\`
`;

async function stream() {
	const to = toStream.length;
	for (let i = 0; i < to; i += 10) {
		const chunk = toStream.slice(i, i + 10);
		await new Promise((resolve) => setTimeout(resolve, 100));
		p.append(chunk);
		// console.log(JSON.stringify(p.doc, null, 2));
	}
}

const TreeView = () => {
	return (
		<div class="markdown-tree-view">
			<button type="button" onClick={() => stream()}>
				Stream
			</button>
			{/* <h1>Markdown Tree View</h1> */}
			<div class="markdown-content">
				<ASTNodeRenderer node={p.doc} />
			</div>
		</div>
	);
};

export default TreeView;
