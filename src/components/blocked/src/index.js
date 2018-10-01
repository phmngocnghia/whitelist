import { autobind } from "core-decorators";
import { uniq } from "lodash";
import React, { Component, PropTypes, createRef } from "react";
import { Icon } from "react-mdl";
import { t } from "utils/i18n";
import { dbWhiteList } from "../../../db";
import { updateTab } from "../../../platform/chrome/utils/platform";
import { loadSettings, saveSettings } from "../../../utils/settings";
import { HotKeys } from "react-hotkeys";
import hotkeys from "hotkeys-js";

import _styles from "./index.scss";

export default class Blocked extends Component {
  static propTypes = {
    href: PropTypes.string.isRequired,
    hostname: PropTypes.string.isRequired,
  };

  state = {
    whitelist: [],
  };

  constructor() {
    super();

    loadSettings((settings) => {
      const whitelist = [...settings.whitelist, ...dbWhiteList];

      this.state = whitelist;

      this.setState({
        whitelist,
      });
    });
  }

  continue(setAllow = true) {
    const searchParams = new URLSearchParams(location.search);

    const { href, hostname } = this.props;

    const url = new URL(href.replace(/\/$/, ""));

    if (setAllow) {
      url.searchParams.set("allow", true);
    }
    const tabId = searchParams.get("tabId");

    window.chrome.tabs.update(Number(tabId), { url: url.toString() });
  }

  whiteListPage(withParams) {
    const { href } = this.props;
    const url = new URL(href.replace("www.", ""));

    const { hostname, pathname, search } = url;
    let regex;
    if (withParams) {
      regex = (hostname + pathname).replace(/\/$/, "") + search + "*";
    } else {
      regex = (hostname + pathname).replace(/\/$/, "") + "*";
    }

    const newWhiteList = uniq([...this.state.whitelist, regex]);

    saveSettings(
      {
        whitelist: newWhiteList,
      },
      (err) => {
        this.continue(false);
      }
    );
  }

  @autobind
  whitelistDomain() {
    const { href } = this.props;
    const url = new URL(href.replace("www.", ""));

    const { hostname } = url;
    const regex = hostname.replace(/\/$/, "") + "*";

    saveSettings(
      {
        whitelist: uniq([...this.state.whitelist, regex]),
      },
      (err) => {
        this.continue(false);
      }
    );
  }

  componentWillUnmount() {
    hotkeys.unbind("1");
    hotkeys.unbind("2");
    hotkeys.unbind("3");
  }

  componentDidMount() {
    hotkeys("1", this.whitelistDomain);
    hotkeys("2", this.whiteListPage.bind(this, false));
    hotkeys("3", this.whiteListPage.bind(this, true));
    hotkeys("5", () => this.continue(false));
    hotkeys("5", this.continue.bind(this, true));
  }

  render() {
    const { href, hostname } = this.props;

    return (
      <div className="app-blocked">
        <p className="app-blocked__info">
          <Icon name="lock" />
          {t("msg_blocked_page_label")}
        </p>
        <p className="app-blocked__href">{href}</p>
        <p className="app-blocked__instructions">
          {t("msg_blocked_instructions_label", hostname)}
        </p>

        <div className="app-blocked__btnContainer">
          <button onClick={this.whitelistDomain}>
            <b>[1]</b> whitelist domain
          </button>
          <button onClick={this.whiteListPage.bind(this, false)}>
            <b>[2]</b> whitelist page (all params)
          </button>
          <button onClick={this.whiteListPage.bind(this, true)}>
            <b>[3]</b> whitelist page (params)
          </button>
          <button onClick={() => this.continue(false)}>
            <b>[4]</b> try
          </button>
          <button autoFocus={true} onClick={this.continue.bind(this, true)}>
            <b>[5]</b> continue
          </button>
        </div>
      </div>
    );
  }
}
