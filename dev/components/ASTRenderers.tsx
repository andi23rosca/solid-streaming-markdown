import { type JSX, For, Switch, Match } from "solid-js";
import { Dynamic } from "solid-js/web";
import type {
  ASTNode,
  HeadingASTNode,
  ListASTNode,
  CustomBlockASTNode,
  CustomInlineASTNode,
  CodeBlockASTNode,
  LinkASTNode,
} from "src/toastmark/ast";

export const AstNodeChildren = (props: { node: ASTNode }): JSX.Element => {
  return (
    <For each={props.node.children}>
      {(child) => <ASTNodeRenderer node={child} />}
    </For>
  );
};

export const ASTNodeRenderer = (props: { node: ASTNode }): JSX.Element => {
  const { node } = props;

  return (
    <Switch fallback={<span class="markdown-unknown" data-node={JSON.stringify(node)}>{node.literal}</span>}>
      <Match when={node.type === "doc"}>
        <div class="markdown-doc">
          <AstNodeChildren node={node} />
        </div>
      </Match>

      <Match when={node.type === "softbreak"}>
        <br />
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
