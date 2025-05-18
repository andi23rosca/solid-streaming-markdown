import { createSolidStreamingMarkdown, SolidStreamingMarkdown } from "../src";
import README from "../README.md?raw";

const p = createSolidStreamingMarkdown(README);

const toStream = README;

async function stream() {
	p.reset();
	const to = toStream.length;

	const image = 161;
	const chunk = toStream.slice(0, image);
	p.append(chunk);
	await new Promise((resolve) => setTimeout(resolve, 30));

	for (let i = image; i < to; i += 3) {
		const chunk = toStream.slice(i, i + 3);
		await new Promise((resolve) => setTimeout(resolve, 30));
		p.append(chunk);
	}
}

const TreeView = () => {
	return (
		<div class="markdown-tree-view">
			<button class="stream-btn" type="button" onClick={() => stream()}>
				Stream this page
			</button>
			{/* <h1>Markdown Tree View</h1> */}
			<div class="markdown-content">
				<SolidStreamingMarkdown
					doc={p.doc}
					options={{
						defaultClasses: true,
					}}
				/>
			</div>
		</div>
	);
};

export default TreeView;
