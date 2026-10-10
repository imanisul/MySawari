// expo-secure-store has no web implementation (every call throws), which left the web build unable to
// make any backend request. Browsers have no keychain, so the session is kept in localStorage here.
function storage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export async function getItemAsync(key: string): Promise<string | null> {
  try {
    return storage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  try {
    storage()?.setItem(key, value);
  } catch {}
}

export async function deleteItemAsync(key: string): Promise<void> {
  try {
    storage()?.removeItem(key);
  } catch {}
}
