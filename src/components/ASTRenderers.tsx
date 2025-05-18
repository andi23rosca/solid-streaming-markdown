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
	TableASTNode,
	TableCellASTNode,
	ItemASTNode,
} from "src/toastmark/ast";

export const AstNodeChildren = (props: { node: ASTNode }): JSX.Element => {
	return (
		<For each={props.node.children}>
			{(child) => <ASTNodeRenderer node={child} />}
		</For>
	);
};

export const ASTNodeRenderer = (props: { node: ASTNode }): JSX.Element => {
	return (
		<Switch
			fallback={
				<span class="markdown-unknown" data-node={JSON.stringify(props.node)}>
					{props.node.literal}
				</span>
			}
		>
			<Match when={props.node.type === "doc"}>
				<div class="markdown-doc">
					<AstNodeChildren node={props.node} />
				</div>
			</Match>

			<Match when={props.node.type === "softbreak"}>
				<br />
			</Match>

			<Match
				when={props.node.type === "heading" && (props.node as HeadingASTNode)}
			>
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

			<Match when={props.node.type === "paragraph"}>
				<p class="markdown-paragraph">
					<AstNodeChildren node={props.node} />
				</p>
			</Match>

			<Match when={props.node.type === "text"}>
				<span class="markdown-text">{props.node.literal}</span>
			</Match>

			<Match when={props.node.type === "strong"}>
				<strong class="markdown-strong">
					<AstNodeChildren node={props.node} />
				</strong>
			</Match>

			<Match when={props.node.type === "emph"}>
				<em class="markdown-emph">
					<AstNodeChildren node={props.node} />
				</em>
			</Match>

			<Match when={props.node.type === "code"}>
				<code class="markdown-code">{props.node.literal}</code>
			</Match>

			<Match when={props.node.type === "link" && (props.node as LinkASTNode)}>
				{(node) => {
					return (
						<a href={node().destination || "#"} class="markdown-link">
							<AstNodeChildren node={node()} />
						</a>
					);
				}}
			</Match>

			<Match when={props.node.type === "image" && (props.node as LinkASTNode)}>
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

			<Match when={props.node.type === "list" && (props.node as ListASTNode)}>
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

			<Match when={props.node.type === "item" && (props.node as ItemASTNode)}>
				{(node) => {
					return (
						<li class="markdown-item">
							{node().listData.task && (
								<input
									type="checkbox"
									checked={node().listData.checked}
									disabled
									class="markdown-task-checkbox"
								/>
							)}
							<AstNodeChildren node={node()} />
						</li>
					);
				}}
			</Match>

			<Match
				when={
					props.node.type === "codeBlock" && (props.node as CodeBlockASTNode)
				}
			>
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

			<Match when={props.node.type === "blockQuote"}>
				<blockquote class="markdown-blockquote">
					<AstNodeChildren node={props.node} />
				</blockquote>
			</Match>

			<Match when={props.node.type === "thematicBreak"}>
				<hr class="markdown-thematic-break" />
			</Match>

			<Match when={props.node.type === "htmlBlock"}>
				<div class="markdown-html-block" innerHTML={props.node.literal || ""} />
			</Match>

			<Match
				when={
					props.node.type === "customBlock" &&
					(props.node as CustomBlockASTNode)
				}
			>
				{(node) => {
					return (
						<div class={`markdown-custom-block ${node().info}`}>
							{node().literal}
						</div>
					);
				}}
			</Match>

			<Match when={props.node.type === "table" && (props.node as TableASTNode)}>
				{(node) => {
					return (
						<table class="markdown-table">
							<AstNodeChildren node={node()} />
						</table>
					);
				}}
			</Match>

			<Match when={props.node.type === "tableHead"}>
				<thead class="markdown-table-head">
					<AstNodeChildren node={props.node} />
				</thead>
			</Match>

			<Match when={props.node.type === "tableBody"}>
				<tbody class="markdown-table-body">
					<AstNodeChildren node={props.node} />
				</tbody>
			</Match>

			<Match when={props.node.type === "tableRow"}>
				<tr class="markdown-table-row">
					<AstNodeChildren node={props.node} />
				</tr>
			</Match>

			<Match
				when={
					props.node.type === "tableCell" && (props.node as TableCellASTNode)
				}
			>
				{(node) => {
					const getTag = () => "td"; // Default to td, we'll handle header cells differently
					const getTableNode = () => props.node as TableASTNode;
					const getColumnInfo = () => getTableNode().columns[node().startIdx];
					const getStyle = () => {
						const align = getColumnInfo()?.align;
						return align ? { textAlign: align } : undefined;
					};

					return (
						<Dynamic
							component={getTag()}
							class="markdown-table-cell"
							style={getStyle()}
						>
							<AstNodeChildren node={node()} />
						</Dynamic>
					);
				}}
			</Match>

			<Match when={props.node.type === "tableDelimRow"}>{null}</Match>

			<Match when={props.node.type === "tableDelimCell"}>{null}</Match>

			<Match
				when={
					props.node.type === "customInline" &&
					(props.node as CustomInlineASTNode)
				}
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
