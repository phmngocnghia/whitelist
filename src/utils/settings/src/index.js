import { getItems, setItems, onChangeItems } from "utils/platform";

const defaults = {
  blockPages: false,
  blockOthers: false,
  whitelist: ["google.com", "github.com", "npmjs.com"],
};

export function defaultSettings() {
  return defaults;
}

export function loadSettings(callback) {
  getItems(defaultSettings(), callback);
}

export function saveSettings(settings, callback) {
  setItems(settings, callback);
}

export function onChangeSettings(callback) {
  onChangeItems(callback);
}
