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

const p = createIncrementalParser("");

const toStream = `
# Markdown Syntax Showcase

## Text Formatting

This is a demonstration of basic text formatting:
- **Bold text** using double asterisks
- *Italic text* using single asterisks
- ***Bold and italic*** combined
- ~~Strikethrough~~ using double tildes
- \`inline code\` using backticks

## Headings

# H1 Heading
## H2 Heading
### H3 Heading
#### H4 Heading
##### H5 Heading
###### H6 Heading

## Lists

### Unordered Lists
* Item 1
* Item 2
  * Nested item 2.1
  * Nested item 2.2
* Item 3

### Ordered Lists
1. First item
2. Second item
   1. Nested item 2.1
   2. Nested item 2.2
3. Third item

### Task Lists
- [x] Completed task
- [ ] Pending task
- [ ] Another task

## Links and Images

[Regular link](https://example.com)
![Image alt text](https://via.placeholder.com/150)

## Blockquotes

> Single line blockquote
>
> Multi-line blockquote
> > Nested blockquote

## Code Blocks

\`\`\`javascript
function example() {
  console.log("Syntax highlighting");
  return true;
}
\`\`\`

\`\`\`python
def example():
    print("Python syntax")
    return True
\`\`\`

## Tables

| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |

| Left-aligned | Center-aligned | Right-aligned |
|:-------------|:--------------:|--------------:|
| Left         | Center         | Right         |
| Text         | Text           | Text          |

## Horizontal Rules

---

***

___

## Footnotes

Here's a sentence with a footnote. [^1]

[^1]: This is the footnote.

## Definition Lists

Term
: Definition 1
: Definition 2

## Escaping Characters

\\\* Asterisk
\\\` Backtick
\\\# Hash

## Line Breaks

First line
Second line (with two spaces at end)

First line
Second line (with backslash)

## HTML Support

<div style="color: blue">
  This is <b>HTML</b> content
</div>

## Math Equations (if supported)

Inline math: $E = mc^2$

Block math:
$$
\\frac{n!}{k!(n-k)!} = \\binom{n}{k}
$$
`;

async function stream() {
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
				<ASTNodeRenderer node={p.doc} />
			</div>
		</div>
	);
};

export default TreeView;
