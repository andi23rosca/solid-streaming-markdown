import type { Component } from "solid-js";
import type { DocASTNode } from "./toastmark/ast";
import { ASTNodeRenderer } from "./components/ASTRenderers";
export { createSolidStreamingMarkdown } from "./core";

export const SolidStreamingMarkdown: Component<{ doc: DocASTNode }> = (
	props,
) => <ASTNodeRenderer node={props.doc} />;
