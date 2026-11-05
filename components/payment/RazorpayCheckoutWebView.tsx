import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Linking, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

interface RazorpayCheckoutWebViewProps {
  /** Empty while the order is still being created: the page loads checkout.js meanwhile, then opens at once. */
  orderId?: string;
  amount?: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  themeColor?: string;
  razorpayKey?: string;
  onSuccess: (data: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
  onFailure: (error: any) => void;
  onClose: () => void;
}

export function RazorpayCheckoutWebView({
  orderId,
  amount,
  currency,
  name,
  description,
  image,
  prefill,
  themeColor = '#111A2B',
  razorpayKey,
  onSuccess,
  onFailure,
  onClose
}: RazorpayCheckoutWebViewProps) {
  
  const insets = useSafeAreaInsets();
  const webRef = useRef<WebView>(null);

  // Checkout must show up within a reasonable time once the order exists: if Razorpay's page never reports it
  // opened (no network, blocked script), the customer gets an error and a way back instead of waiting forever.
  const opened = useRef(false);
  const failed = useRef(false);
  const early = useRef<string | null>(null); // a load error before the order exists is reported once it does
  const [ready, setReady] = useState(false);
  const fail = (message: string) => {
    if (failed.current || opened.current) return;
    failed.current = true;
    onFailure({ description: message });
  };
  const loadFailed = (message: string) => {
    if (orderId) fail(message);
    else early.current = early.current || message;
  };

  useEffect(() => {
    if (!orderId || !ready) return;
    if (early.current) { fail(early.current); return; }
    const t = setTimeout(() => fail('The secure payment page is taking too long to open. Please check your connection and try again.'), 25000);
    const options = {
      key: razorpayKey || '',
      amount: Number(amount) || 0,
      currency,
      name,
      description,
      image: image || '',
      order_id: orderId,
      prefill: { name: prefill?.name || '', email: prefill?.email || '', contact: prefill?.contact || '' },
      theme: { color: themeColor },
    };
    webRef.current?.injectJavaScript(`window.startCheckout(${JSON.stringify(options)}); true;`);
    return () => clearTimeout(t);
  }, [orderId, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fixed page: it starts loading checkout.js as soon as this mounts (while the car is held and the order is
  // created), so the payment sheet only has to open, not download.
  const checkoutHtml = useRef(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>Razorpay Checkout</title>
        <style>
          html, body { margin: 0; padding: 0; background: transparent; overflow: hidden; }
        </style>
    </head>
    <body>
        <script>
            var post = function (m) { window.ReactNativeWebView.postMessage(JSON.stringify(m)); };
            var loadError = function (d) { post({ event: 'loaderror', data: { description: d } }); };
            window.onerror = function () { loadError('Could not open the payment page. Please try again.'); };
            var pending = null;
            function launch(options) {
                options.handler = function (response) { post({ event: 'success', data: response }); };
                options.modal = { ondismiss: function () { post({ event: 'dismiss' }); } };
                var rzp1 = new Razorpay(options);
                rzp1.on('payment.failed', function (response) { post({ event: 'failure', data: response.error }); });
                try { rzp1.open(); } catch (e) { setTimeout(function () { rzp1.open(); }, 100); }
                post({ event: 'opened' });
            }
            window.startCheckout = function (options) {
                if (typeof Razorpay === 'undefined') { pending = options; return; }
                launch(options);
            };
            post({ event: 'ready' });
        </script>
        <script src="https://checkout.razorpay.com/v1/checkout.js"
            onload="if (pending) launch(pending)"
            onerror="loadError('Could not load the secure payment page. Please check your connection and try again.')"></script>
    </body>
    </html>
  `).current;

  const onMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.event === 'ready') {
        setReady(true);
      } else if (data.event === 'loaderror') {
        loadFailed(data.data.description);
      } else if (data.event === 'opened') {
        opened.current = true;
      } else if (data.event === 'success') {
        onSuccess(data.data);
      } else if (data.event === 'failure') {
        onFailure(data.data);
      } else if (data.event === 'dismiss') {
        onClose();
      }
    } catch (e: any) {
      if (__DEV__) console.warn('Failed to parse webview message');
      fail('Something went wrong with the payment page. Please try again.');
    }
  };

  const handleShouldStartLoadWithRequest = (request: any) => {
    const { url } = request;
    if (!url) return true;

    // Handle UPI and banking application schemes
    if (
      url.startsWith('upi://') ||
      url.startsWith('phonepe://') ||
      url.startsWith('tez://') ||
      url.startsWith('paytmmp://') ||
      url.startsWith('bhim://') ||
      url.startsWith('credpay://') ||
      url.startsWith('whatsapp://')
    ) {
      Linking.openURL(url).catch(() => {});
      return false;
    }

    if (url.startsWith('intent://')) {
      if (Platform.OS === 'android') {
        try {
          const schemeMatch = url.match(/scheme=([^;]+)/);
          if (schemeMatch && schemeMatch[1]) {
            const rawUrl = url.split('#Intent')[0].replace('intent://', `${schemeMatch[1]}://`);
            Linking.openURL(rawUrl).catch(() => {
              Linking.openURL(url).catch(() => {});
            });
          } else {
            Linking.openURL(url).catch(() => {});
          }
        } catch {
          Linking.openURL(url).catch(() => {});
        }
      }
      return false;
    }

    return true;
  };

  return (
    // Edge-to-edge: keep checkout clear of the status bar and the navigation bar (3-button, gesture bar, iPhone home
    // indicator). The inset padding sits on the outer View: KeyboardAvoidingView overwrites its own paddingBottom
    // with the keyboard height (0 when closed), which used to hide the bottom of checkout behind the navigation bar.
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'android' ? 'padding' : undefined}>
        <WebView
          ref={webRef}
          originWhitelist={['*']}
          source={{ html: checkoutHtml, baseUrl: 'https://checkout.razorpay.com' }}
          onMessage={onMessage}
          onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={false}
          javaScriptCanOpenWindowsAutomatically
          onError={() => loadFailed('Could not open the payment page. Please check your connection and try again.')}
          onHttpError={() => loadFailed('Could not open the payment page. Please try again.')}
          style={{ flex: 1, backgroundColor: 'transparent' }}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
