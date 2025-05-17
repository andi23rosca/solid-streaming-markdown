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

// AST Node Renderers
const AstNodeChildren = (props: { node: ASTNode }): JSX.Element => {
  return (
    <For each={props.node.children}>
      {(child) => <ASTNodeRenderer node={child} />}
    </For>
  );
};

const ASTNodeRenderer = (props: { node: ASTNode }): JSX.Element => {
  const { node } = props;

  return (
    <Switch fallback={<span class="markdown-unknown">{node.literal}</span>}>
      <Match when={node.type === "doc"}>
        <div class="markdown-doc">
          <AstNodeChildren node={node} />
        </div>
      </Match>

      <Match when={node.type === "heading" && (node as HeadingASTNode)}>
        {(node) => {
          return (
            <Dynamic
              component={`h${node().level}`}
              class={`markdown-heading h${node().level}`}
            >
              <AstNodeChildren node={node()} />
            </Dynamic>
          );
        }}
      </Match>

      <Match when={node.type === "paragraph"}>
        <p class="markdown-paragraph">
          <AstNodeChildren node={node} />
        </p>
      </Match>

      <Match when={node.type === "text"}>
        <span class="markdown-text">{node.literal}</span>
      </Match>

      <Match when={node.type === "strong"}>
        <strong class="markdown-strong">
          <AstNodeChildren node={node} />
        </strong>
      </Match>

      <Match when={node.type === "emph"}>
        <em class="markdown-emph">
          <AstNodeChildren node={node} />
        </em>
      </Match>

      <Match when={node.type === "code"}>
        <code class="markdown-code">{node.literal}</code>
      </Match>

      <Match when={node.type === "link" && (node as LinkASTNode)}>
        {(node) => {
          return (
            <a href={node().destination || "#"} class="markdown-link">
              <AstNodeChildren node={node()} />
            </a>
          );
        }}
      </Match>

      <Match when={node.type === "image" && (node as LinkASTNode)}>
        {(node) => {
          return (
            <img
              src={node().destination || ""}
              alt={node().literal || ""}
              class="markdown-image"
            />
          );
        }}
      </Match>

      <Match when={node.type === "list" && (node as ListASTNode)}>
        {(node) => {
          return (
            <Dynamic
              component={node().listData?.type === "ordered" ? "ol" : "ul"}
              class={`markdown-list ${node().listData?.type || "bullet"}`}
            >
              <AstNodeChildren node={node()} />
            </Dynamic>
          );
        }}
      </Match>

      <Match when={node.type === "item"}>
        <li class="markdown-item">
          <AstNodeChildren node={node} />
        </li>
      </Match>

      <Match when={node.type === "codeBlock" && (node as CodeBlockASTNode)}>
        {(node) => {
          return (
            <pre class="markdown-code-block">
              <code class={`language-${node().info || ""}`}>
                {node().literal}
              </code>
            </pre>
          );
        }}
      </Match>

      <Match when={node.type === "blockQuote"}>
        <blockquote class="markdown-blockquote">
          <AstNodeChildren node={node} />
        </blockquote>
      </Match>

      <Match when={node.type === "thematicBreak"}>
        <hr class="markdown-thematic-break" />
      </Match>

      <Match when={node.type === "htmlBlock"}>
        <div class="markdown-html-block" innerHTML={node.literal || ""} />
      </Match>

      <Match when={node.type === "customBlock" && (node as CustomBlockASTNode)}>
        {(node) => {
          return (
            <div class={`markdown-custom-block ${node().info}`}>
              {node().literal}
            </div>
          );
        }}
      </Match>

      <Match
        when={node.type === "customInline" && (node as CustomInlineASTNode)}
      >
        {(node) => {
          return (
            <span class={`markdown-custom-inline ${node().info}`}>
              {node().literal}
            </span>
          );
        }}
      </Match>
    </Switch>
  );
};

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
