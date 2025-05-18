import { render } from "solid-js/web";
import "./styles.css";
import "./gfm.css";

import App from "./App";

// biome-ignore lint/style/noNonNullAssertion: <explanation>
render(() => <App />, document.getElementById("root")!);
