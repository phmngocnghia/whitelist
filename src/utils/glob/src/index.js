import constant from "lodash/constant";
import convert from "./convert";

const ipv4 = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
const ipv6 = /^(?:[A-F0-9]{1,4}:){7}[A-F0-9]{1,4}$/;
const localhost = /^localhost$/;
const domain = /^.+\.[^.]+$/;
const simpleDomain = /^[^.*]+\.[^.]+$/;
const noop = constant(false);

export const checkAlwaysAllowedPages = (url) => {
  const { hostname, path, search, protocol, href } = url;

  if (
    ["127.0.0.1", "localhost"].some((whitelist) => url.host.includes(whitelist))
  ) {
    return true;
  }

  if (url.href.includes("chrome-extension:")) return true;

  const params = new URLSearchParams(search);
  if (params.get("allow") === "true") return true;

  return false;
};

export function compile(glob) {
  // If not a valid glob, ignore it.
  if (
    !ipv4.test(glob) &&
    !ipv6.test(glob) &&
    !localhost.test(glob) &&
    !domain.test(glob)
  ) {
    return noop;
  }

  let regexp = convert(glob);

  // Allow all subdomains if none was specified.
  if (simpleDomain.test(glob)) {
    regexp = `(.+\\.)?${regexp}`;
  }

  // Force matching the entire input against the pattern.
  const regexpString = `^${regexp}$`;
  regexp = new RegExp(regexpString, "i");

  return (url) => {
    const { hostname, path, search, protocol, href } = url;
    const testString = (hostname + path).replace(/\/$/, "");
    console.log({ testString, regexpString, regexp });

    return (
      (protocol !== "http:" && protocol !== "https:") || regexp.test(testString)
    );
  };
}
