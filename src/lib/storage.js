/**
 * localStorage that never throws.
 *
 * Private windows, storage-disabled browsers and full quotas all raise on
 * access rather than returning null, and a game that white-screens because it
 * could not save a streak is a worse game than one that quietly forgets. Every
 * call here fails soft.
 */

const PREFIX = "nubhub.";

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    /* nothing to do — it was never there */
  }
}

/**
 * Copy to clipboard, with a fallback for the browsers and insecure origins
 * where `navigator.clipboard` is missing. Returns whether it worked, so the
 * caller can toast honestly instead of claiming a copy that never happened.
 */
export async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the textarea trick */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
