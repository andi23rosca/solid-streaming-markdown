import {
	type JSX,
	For,
	Switch,
	Match,
	type Component,
	createContext,
	useContext,
	type ParentComponent,
	JSXElement,
	mergeProps,
} from "solid-js";
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
	DocASTNode,
} from "src/toastmark/ast";

export type MarkdownRendererComponents = {
	document: Component<{ node: DocASTNode }>;
};
export type MarkdownRendererOptions = Partial<{
	/**
	 * Whether to auto-generate default classes for each markdown node, e.g.: `<p class="md-paragraph" />`
	 * @default true
	 */
	defaultClasses?: boolean;
	/**
	 * The prefix to use for default classes if they're enabled, e.g.: `md-`
	 * @default "md-"
	 */
	classPrefix?: string;

	/**
	 * Custom components to use for rendering markdown nodes.
	 *
	 * @example
	 * ```ts
	 * components: {
	 *   heading: (props: { node: HeadingASTNode }) => <h1>{props.node.literal}</h1>,
	 * }
	 * ```
	 */
	components: Partial<MarkdownRendererComponents>;
}>;

const getNodeClass = (node: ASTNode) => {
	const { options } = useSolidStreamingMarkdownContext();
	const classPrefix = options.classPrefix || "md-";
	const defaultClasses = options.defaultClasses ?? true;
	return { [`${classPrefix}${node.type}`]: defaultClasses };
};

const defaultComponents: MarkdownRendererComponents = {
	document: (props) => (
		<div classList={getNodeClass(props.node)}>
			<SolidStreamingMarkdownChildren node={props.node} />
		</div>
	),
};

const MarkdownRendererContext = createContext({
	options: {
		components: {
			...defaultComponents,
		},
	} as MarkdownRendererOptions & {
		components: MarkdownRendererComponents;
	},
});

export const useSolidStreamingMarkdownContext = () =>
	useContext(MarkdownRendererContext);
export const SolidStreamingMarkdownContextProvider: ParentComponent<{
	options: MarkdownRendererOptions;
}> = (props) => {
	return (
		<MarkdownRendererContext.Provider
			value={{
				options: {
					...props.options,
					components: {
						...defaultComponents,
						...props.options.components,
					},
				},
			}}
		>
			{props.children}
		</MarkdownRendererContext.Provider>
	);
};

export const SolidStreamingMarkdownChildren = (props: {
	node: ASTNode;
}): JSX.Element => {
	return (
		<For each={props.node.children}>
			{(child) => <ASTNodeRenderer node={child} />}
		</For>
	);
};

export const ASTNodeRenderer = (props: { node: ASTNode }): JSX.Element => {
	const { options } = useSolidStreamingMarkdownContext();
	const comp = options.components;
	return (
		<Switch
			fallback={
				<span class="markdown-unknown" data-node={JSON.stringify(props.node)}>
					{props.node.literal}
				</span>
			}
		>
			<Match when={props.node.type === "doc"}>
				<Dynamic component={comp.document} node={props.node as DocASTNode} />
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
							<SolidStreamingMarkdownChildren node={node()} />
						</Dynamic>
					);
				}}
			</Match>

			<Match when={props.node.type === "paragraph"}>
				<p class="markdown-paragraph">
					<SolidStreamingMarkdownChildren node={props.node} />
				</p>
			</Match>

			<Match when={props.node.type === "text"}>
				<span class="markdown-text">{props.node.literal}</span>
			</Match>

			<Match when={props.node.type === "strong"}>
				<strong class="markdown-strong">
					<SolidStreamingMarkdownChildren node={props.node} />
				</strong>
			</Match>

			<Match when={props.node.type === "emph"}>
				<em class="markdown-emph">
					<SolidStreamingMarkdownChildren node={props.node} />
				</em>
			</Match>

			<Match when={props.node.type === "code"}>
				<code class="markdown-code">{props.node.literal}</code>
			</Match>

			<Match when={props.node.type === "link" && (props.node as LinkASTNode)}>
				{(node) => {
					return (
						<a href={node().destination || "#"} class="markdown-link">
							<SolidStreamingMarkdownChildren node={node()} />
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
							<SolidStreamingMarkdownChildren node={node()} />
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
							<SolidStreamingMarkdownChildren node={node()} />
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
					<SolidStreamingMarkdownChildren node={props.node} />
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
							<SolidStreamingMarkdownChildren node={node()} />
						</table>
					);
				}}
			</Match>

			<Match when={props.node.type === "tableHead"}>
				<thead class="markdown-table-head">
					<SolidStreamingMarkdownChildren node={props.node} />
				</thead>
			</Match>

			<Match when={props.node.type === "tableBody"}>
				<tbody class="markdown-table-body">
					<SolidStreamingMarkdownChildren node={props.node} />
				</tbody>
			</Match>

			<Match when={props.node.type === "tableRow"}>
				<tr class="markdown-table-row">
					<SolidStreamingMarkdownChildren node={props.node} />
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
							<SolidStreamingMarkdownChildren node={node()} />
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
