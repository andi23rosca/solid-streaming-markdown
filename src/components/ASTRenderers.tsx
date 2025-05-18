import {
	type JSX,
	For,
	type Component,
	createContext,
	useContext,
	type ParentComponent,
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
	heading: Component<{ node: HeadingASTNode }>;
	paragraph: Component<{ node: ASTNode }>;
	text: Component<{ node: ASTNode }>;
	strong: Component<{ node: ASTNode }>;
	emph: Component<{ node: ASTNode }>;
	code: Component<{ node: ASTNode }>;
	link: Component<{ node: LinkASTNode }>;
	image: Component<{ node: LinkASTNode }>;
	list: Component<{ node: ListASTNode }>;
	item: Component<{ node: ItemASTNode }>;
	codeBlock: Component<{ node: CodeBlockASTNode }>;
	blockQuote: Component<{ node: ASTNode }>;
	thematicBreak: Component<{ node: ASTNode }>;
	htmlBlock: Component<{ node: ASTNode }>;
	customBlock: Component<{ node: CustomBlockASTNode }>;
	table: Component<{ node: TableASTNode }>;
	tableHead: Component<{ node: ASTNode }>;
	tableBody: Component<{ node: ASTNode }>;
	tableRow: Component<{ node: ASTNode }>;
	tableCell: Component<{ node: TableCellASTNode }>;
	customInline: Component<{ node: CustomInlineASTNode }>;
	unknown: Component<{ node: ASTNode }>;
	softbreak: Component<{ node: ASTNode }>;
	tableDelimRow: Component<{ node: ASTNode }>;
	tableDelimCell: Component<{ node: ASTNode }>;
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
	heading: (props) => (
		<Dynamic
			component={`h${props.node.level}`}
			classList={getNodeClass(props.node)}
		>
			<SolidStreamingMarkdownChildren node={props.node} />
		</Dynamic>
	),
	paragraph: (props) => (
		<p classList={getNodeClass(props.node)}>
			<SolidStreamingMarkdownChildren node={props.node} />
		</p>
	),
	text: (props) => (
		<span classList={getNodeClass(props.node)}>{props.node.literal}</span>
	),
	strong: (props) => (
		<strong classList={getNodeClass(props.node)}>
			<SolidStreamingMarkdownChildren node={props.node} />
		</strong>
	),
	emph: (props) => (
		<em classList={getNodeClass(props.node)}>
			<SolidStreamingMarkdownChildren node={props.node} />
		</em>
	),
	code: (props) => (
		<code classList={getNodeClass(props.node)}>{props.node.literal}</code>
	),
	link: (props) => (
		<a
			href={props.node.destination || "#"}
			classList={getNodeClass(props.node)}
		>
			<SolidStreamingMarkdownChildren node={props.node} />
		</a>
	),
	image: (props) => (
		<img
			src={props.node.destination || ""}
			alt={props.node.literal || ""}
			classList={getNodeClass(props.node)}
		/>
	),
	list: (props) => (
		<Dynamic
			component={props.node.listData?.type === "ordered" ? "ol" : "ul"}
			classList={getNodeClass(props.node)}
		>
			<SolidStreamingMarkdownChildren node={props.node} />
		</Dynamic>
	),
	item: (props) => (
		<li classList={getNodeClass(props.node)}>
			{props.node.listData.task && (
				<input
					type="checkbox"
					checked={props.node.listData.checked}
					disabled
					class="markdown-task-checkbox"
				/>
			)}
			<SolidStreamingMarkdownChildren node={props.node} />
		</li>
	),
	codeBlock: (props) => (
		<pre classList={getNodeClass(props.node)}>
			<code class={`language-${props.node.info || ""}`}>
				{props.node.literal}
			</code>
		</pre>
	),
	blockQuote: (props) => (
		<blockquote classList={getNodeClass(props.node)}>
			<SolidStreamingMarkdownChildren node={props.node} />
		</blockquote>
	),
	thematicBreak: (props) => <hr classList={getNodeClass(props.node)} />,
	htmlBlock: (props) => (
		<div
			classList={getNodeClass(props.node)}
			innerHTML={props.node.literal || ""}
		/>
	),
	customBlock: (props) => (
		<div classList={getNodeClass(props.node)}>{props.node.literal}</div>
	),
	table: (props) => (
		<table classList={getNodeClass(props.node)}>
			<SolidStreamingMarkdownChildren node={props.node} />
		</table>
	),
	tableHead: (props) => (
		<thead classList={getNodeClass(props.node)}>
			<SolidStreamingMarkdownChildren node={props.node} />
		</thead>
	),
	tableBody: (props) => (
		<tbody classList={getNodeClass(props.node)}>
			<SolidStreamingMarkdownChildren node={props.node} />
		</tbody>
	),
	tableRow: (props) => (
		<tr classList={getNodeClass(props.node)}>
			<SolidStreamingMarkdownChildren node={props.node} />
		</tr>
	),
	tableCell: (props) => {
		// For now, we'll just render the cell without alignment
		// In a real implementation, we would need to access the parent table node
		// to get column alignment information
		return (
			<td classList={getNodeClass(props.node)}>
				<SolidStreamingMarkdownChildren node={props.node} />
			</td>
		);
	},
	customInline: (props) => (
		<span classList={getNodeClass(props.node)}>{props.node.literal}</span>
	),
	unknown: (props) => (
		<span classList={getNodeClass(props.node)}>{props.node.literal}</span>
	),
	softbreak: () => <br />,
	tableDelimRow: () => null,
	tableDelimCell: () => null,
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
		<Dynamic
			component={
				// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
				comp[props.node.type as keyof MarkdownRendererComponents] ||
				comp.unknown
			}
			node={props.node}
		/>
	);
};
