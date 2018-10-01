import React from "react";
import { render } from "react-dom";
import { browserHistory } from "react-router";
import App from "components/app";

import _template from "./blocked.html";

const init = () => {
  render(
    <App history={browserHistory} />,
    document.querySelector("#container")
  );
};

const error = (e) => {
  trackException(e.error);
};

/* ************************************************************************** */

window.addEventListener("load", init, true);
window.addEventListener("error", error, true);
