import { ASTNodeRenderer } from "../src/components/ASTRenderers";
import { createSolidStreamingMarkdown, SolidStreamingMarkdown } from "../src";
import README from "../README.md?raw";

// const createIncrementalParser = (initialMarkdown = "") => {
// 	const p = new ToastMark(initialMarkdown, { extendedAutolinks: true });
// 	const appendPositions: Pos[] = [];

// 	const [doc, setDoc] = createStore<ASTNode>({
// 		type: "doc",
// 		id: 0,
// 		literal: null,
// 		children: [],
// 	});

// 	const morphNode = (oldNode: ASTNode, newNode: ASTNode) => {
// 		const children = oldNode.children;
// 		Object.assign(oldNode, newNode);
// 		oldNode.children = children;

// 		for (let i = 0; i < children.length; i++) {
// 			const oldChild = children[i];
// 			const newChild = newNode.children[i];

// 			if (oldChild && !newChild) {
// 				oldNode.children.splice(i, oldNode.children.length - i);
// 				break;
// 			}
// 			if (!oldChild && newChild) {
// 				oldNode.children.push(newChild);
// 				break;
// 			}
// 			if (!oldChild || !newChild) {
// 				continue;
// 			}

// 			morphNode(oldChild, newChild);
// 		}

// 		const remaining = newNode.children.slice(oldNode.children.length);
// 		oldNode.children.push(...remaining);
// 	};

// 	const updateDoc = (astResults: ASTResult[]) => {
// 		setDoc(
// 			produce((doc) => {
// 				for (const result of astResults) {
// 					if (!doc.children.length || !result.removedRange) {
// 						doc.children.push(...result.addedNodes);
// 						continue;
// 					}

// 					const [start] = result.removedRange.id;

// 					const toRemoveStart = doc.children.findIndex((c) => c.id === start);
// 					if (toRemoveStart === -1) {
// 						doc.children.push(...result.addedNodes);
// 						continue;
// 					}

// 					const toRemove = doc.children.slice(toRemoveStart);
// 					const toChange = result.addedNodes.slice(0, toRemove.length);

// 					for (let i = 0; i < toRemove.length; i++) {
// 						const toRemoveNode = toRemove[i];
// 						const toChangeNode = toChange[i];
// 						if (!toRemoveNode && toChangeNode) {
// 							doc.children[toRemoveStart + i] = toChangeNode;
// 							continue;
// 						}
// 						if (toRemoveNode && !toChangeNode) {
// 							doc.children.splice(toRemoveStart + i, 1);
// 							continue;
// 						}
// 						if (!toRemoveNode || !toChangeNode) {
// 							continue;
// 						}

// 						morphNode(toRemoveNode, toChangeNode);
// 					}

// 					const remaining = toChange.slice(toRemove.length);
// 					doc.children.push(...remaining);
// 				}
// 			}),
// 		);
// 	};

// 	const append = (markdown: string) => {
// 		const lastPosition = [
// 			p.lineTexts.length,
// 			(p.lineTexts[p.lineTexts.length - 1]?.length || 0) + 1,
// 		] as Pos;
// 		appendPositions.push(lastPosition);
// 		const diff = p.editMarkdown(lastPosition, lastPosition, markdown);
// 		const astResults = createAST(diff, appendPositions);
// 		updateDoc(astResults);
// 		// console.log(doc);
// 		return astResults;
// 	};

// 	append(initialMarkdown);

// 	return {
// 		append,
// 		doc,
// 		setDoc,
// 	};
// };

const p = createSolidStreamingMarkdown(README);
// console.log(README);

const toStream = README;

async function stream() {
	p.reset();
	const to = toStream.length;
	for (let i = 0; i < to; i += 3) {
		const chunk = toStream.slice(i, i + 3);
		await new Promise((resolve) => setTimeout(resolve, 30));
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
				<SolidStreamingMarkdown
					doc={p.doc}
					options={{ defaultClasses: true }}
				/>
			</div>
		</div>
	);
};

export default TreeView;
