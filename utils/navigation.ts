import type { useRouter } from 'expo-router';

type Router = ReturnType<typeof useRouter>;

/** Back to the real previous screen; if there is none (deep link, notification, reset stack) go Home instead of doing nothing. */
export function safeBack(router: Router) {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}
