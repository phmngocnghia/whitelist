import { parse } from "url";
import { compile } from "utils/glob";
import { onBeforeRequest, updateTab } from "utils/platform";
import { loadSettings, onChangeSettings } from "utils/settings";
import { dbWhiteList } from "./db";

import _template from "./background.html";
import { saveSettings } from "./utils/settings/src";
import { checkAlwaysAllowedPages } from "./utils/glob";
import { uniq } from "lodash";

const settings = {};

const removeGlobFactory = (glob: string) => () => {
  console.log({ glob });
};

let whiteListIndex = -1;
let isAllowedPage = true;

const redirect = (details) => {
  const { tabId, type, url } = details;
  const blockPages = settings.blockPages && type === "main_frame";
  const blockOthers = settings.blockOthers && type !== "main_frame";

  if (!blockPages && !blockOthers) {
    return;
  }

  const parsed = parse(url);
  isAllowedPage = checkAlwaysAllowedPages(parsed);
  console.log({ isAllowedPage, settings });

  if (isAllowedPage) {
    return;
  }

  whiteListIndex = settings.whitelist.findIndex((entry) => entry(parsed));

  if (whiteListIndex === -1) {
    if (blockPages && tabId) {
      updateTab(
        tabId,
        `blocked.html?details=${btoa(JSON.stringify(parsed))}&tabId=${tabId}`
      );
    }

    isWhiteListPage = false;
    if (blockPages || blockOthers) {
      return { cancel: true };
    }
  }
};

const reload = () => {
  loadSettings(({ blockPages, blockOthers, whitelist }) => {
    settings.blockPages = blockPages;
    settings.blockOthers = blockOthers;
    settings.rawWhiteList = uniq([...whitelist, ...dbWhiteList]);
    settings.whitelist = settings.rawWhiteList.map(compile);
  });
};

const init = () => {
  chrome.browserAction.onClicked.addListener((tabs) => {
    const blockPages = settings.blockPages;
    const blockOthers = settings.blockOthers;

    if (!blockPages && !blockOthers) return;
    if (whiteListIndex === -1 || isAllowedPage) return;

    console.log({ settings, whiteListIndex });
    settings.rawWhiteList.splice(whiteListIndex, 1);
    console.log({ settings });

    saveSettings(
      {
        whitelist: uniq(settings.rawWhiteList),
      },
      chrome.tabs.reload
    );
  });

  // Monitor every request.
  onBeforeRequest(redirect);

  // If settings change, reload.
  onChangeSettings(reload);

  // Load for the first time.
  reload();
};

/* ************************************************************************** */

window.addEventListener("load", init, true);
