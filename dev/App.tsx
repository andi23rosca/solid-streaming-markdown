import { ToastMark } from "src/toastmark/toastmark";
import {
  createAST,
  type ASTNode,
  type ASTResult,
} from "src/toastmark/ast";
import { createStore, produce, reconcile } from "solid-js/store";
import type { Pos } from "src/toastmark/types/node";
import { ASTNodeRenderer } from "./components/ASTRenderers";
import { batch } from "solid-js";

// Helper function to compare nodes recursively
const areNodesEqual = (node1: ASTNode, node2: ASTNode): boolean => {
  if (!node1 || !node2) return false;
  if (node1.type !== node2.type) return false;
  if (node1.literal !== node2.literal) return false;
  if (node1.children?.length !== node2.children?.length) return false;

  if (node1.children && node2.children) {
    return node1.children.every((child1, index) => {
      const child2 = node2.children[index];
      return child2 ? areNodesEqual(child1, child2) : false;
    });
  }

  return true;
};

const createIncrementalParser = (initialMarkdown = "") => {
  const p = new ToastMark(initialMarkdown);

  const [doc, setDoc] = createStore<ASTNode>({
    type: "doc",
    id: 0,
    literal: null,
    children: [],
  });

  const updateDoc = (astResults: ASTResult[]) => {
    batch(() => {
      // console.log(astResults);
      for (const result of astResults) {
        const [start, end] = result.removedRange?.id || [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY];

        let oldChildIndex = 0;
        let addedNodesIndex = 0;
        for (const node of doc.children) {
          if (node.id < start) {
            oldChildIndex++;
            continue;
          }
          const newNode = result.addedNodes[addedNodesIndex];
          addedNodesIndex++;
          if (!newNode) {
            oldChildIndex++;
            continue;
          }
          if (node.id <= end) {
            setDoc("children", oldChildIndex, reconcile(newNode))
            oldChildIndex++;
            continue;
          }
          setDoc("children", oldChildIndex, newNode);
          oldChildIndex++;
        }

        if (addedNodesIndex < result.addedNodes.length) {
          setDoc("children", c => [...c, ...result.addedNodes.slice(addedNodesIndex)])
        }
      }
    })
  };

  const append = (markdown: string) => {
    const lastPosition = [
      p.lineTexts.length,
      (p.lineTexts[p.lineTexts.length - 1]?.length || 0) + 1,
    ] as Pos;
    const diff = p.editMarkdown(lastPosition, lastPosition, markdown);
    const astResults = createAST(diff);
    updateDoc(astResults);
    // console.log(doc);
    return astResults;
  };

  return {
    append,
    doc,
  };
};

const p = createIncrementalParser("# Markdown streaming\n");

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

// const toStream = "cool"

async function stream() {
  for (let i = 0; i < toStream.length; i += 10) {
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
