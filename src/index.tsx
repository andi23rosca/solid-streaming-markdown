import type { Component } from "solid-js";
import type { DocASTNode } from "./toastmark/ast";
import { ASTNodeRenderer } from "./components/ASTRenderers";
import { createIncrementalParser } from "./core";

export const createSolidStreamingMarkdown = (initialMarkdown = "") => {
	const parser = createIncrementalParser(initialMarkdown);
	return parser;
};

export const SolidStreamingMarkdown: Component<{ doc: DocASTNode }> = (
	props,
) => <ASTNodeRenderer node={props.doc} />;
