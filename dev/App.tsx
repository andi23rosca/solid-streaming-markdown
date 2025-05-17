import { ToastMark } from "src/toastmark/toastmark";
import {
  createAST,
  type HeadingASTNode,
  type ASTNode,
  type ASTResult,
  type ListASTNode,
  type CustomBlockASTNode,
  type CustomInlineASTNode,
  type CodeBlockASTNode,
  type LinkASTNode,
} from "src/toastmark/ast";
import { createStore, produce } from "solid-js/store";
import { Dynamic, render } from "solid-js/web";
import { type JSX, For, Show, Switch, Match } from "solid-js";
import type { Pos } from "src/toastmark/types/node";
import { ASTNodeRenderer } from "./components/ASTRenderers";

const createIncrementalParser = (initialMarkdown = "") => {
  const p = new ToastMark(initialMarkdown);

  const [doc, setDoc] = createStore<ASTNode>({
    type: "doc",
    id: 0,
    literal: null,
    children: [],
  });

  const updateDoc = (astResults: ASTResult[]) => {
    setDoc(
      produce((doc) => {
        for (const result of astResults) {
          // Handle removed nodes
          if (result.removedRange) {
            const [startId, endId] = result.removedRange.id;
            const startIndex = doc.children.findIndex(
              (child) => child.id === startId,
            );
            const endIndex = doc.children.findIndex(
              (child) => child.id === endId,
            );

            if (startIndex !== -1 && endIndex !== -1) {
              doc.children.splice(startIndex, endIndex - startIndex + 1);
            }
          }

          // Handle added nodes
          if (result.addedNodes.length > 0) {
            // If we have a removedRange, insert at that position
            if (result.removedRange) {
              const startIndex = doc.children.findIndex(
                (child) => child.id === result.removedRange?.id[0],
              );
              if (startIndex !== -1) {
                doc.children.splice(startIndex, 0, ...result.addedNodes);
              } else {
                doc.children.push(...result.addedNodes);
              }
            } else {
              // Otherwise append to the end
              doc.children.push(...result.addedNodes);
            }
          }
        }
      }),
    );
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
  for (let i = 0; i < toStream.length; i += 30) {
    const chunk = toStream.slice(i, i + 30);
    await new Promise((resolve) => setTimeout(resolve, 100));
    p.append(chunk);
  }
  // console.log(JSON.stringify(store.ast, null, 2));
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
