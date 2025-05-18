<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=solid-streaming-markdown&background=tiles&project=%20" alt="solid-streaming-markdown" />
</p>

# solid-streaming-markdown

Parse markdown streamed by LLMs incrementally, render it with fancy animations (like ChatGPT).


## Goals:
 - [x] Parse markdown chunks incrementally (no full re-parse when there are changes)
 - [x] Append new text nodes separately so they can be individually animated (aka why the html is a `span` soup)
 - [x] Fine-grained re-rendering so nodes with no changes don't re-mount
   - Prevents fade-in animations from being triggered constantly while nodes have new text added
   - Lets users select text that has been streamed in without losing the selection every time there's a new change
 - [ ] Optimistic parsing of constructs to minimize visual artifacts (e.g. assume `*some text` should be emphasized)


## Quick start

Install it:

```bash
npm i solid-streaming-markdown
# or
yarn add solid-streaming-markdown
# or
pnpm add solid-streaming-markdown
```

Use it:

```tsx
import solid-streaming-markdown from 'solid-streaming-markdown'
```


## Parser forked from `toastmark`

Special thanks to the tui developers: https://github.com/nhn/tui.editor
The incremental parser is a fork of `toastmark`