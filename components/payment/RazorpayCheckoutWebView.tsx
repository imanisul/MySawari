import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Linking, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

interface RazorpayCheckoutWebViewProps {
  orderId: string;
  amount: number;
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
  razorpayKey: string;
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
  
  // Encoded as real JS literals (not interpolated into quotes) so a name/description containing a
  // quote or backslash (e.g. an apostrophe in a customer's name) can never break the generated script.
  const jsString = (v: string | undefined) => JSON.stringify(v || '');
  const insets = useSafeAreaInsets();

  // Checkout must show up within a reasonable time: if Razorpay's page never reports it opened (no network,
  // blocked script), the customer gets an error and a way back instead of a screen that waits forever.
  const opened = useRef(false);
  const failed = useRef(false);
  const fail = (message: string) => {
    if (failed.current || opened.current) return;
    failed.current = true;
    onFailure({ description: message });
  };
  useEffect(() => {
    const t = setTimeout(() => fail('The secure payment page is taking too long to open. Please check your connection and try again.'), 25000);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const checkoutHtml = `
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
            window.onerror = function (msg) { post({ event: 'failure', data: { description: 'Could not open the payment page. Please try again.' } }); };
        </script>
        <script src="https://checkout.razorpay.com/v1/checkout.js" onerror="post({ event: 'failure', data: { description: 'Could not load the secure payment page. Please check your connection and try again.' } })"></script>
        <script>
            if (typeof Razorpay === 'undefined') { throw new Error('no razorpay'); }
            var options = {
                "key": ${jsString(razorpayKey)},
                "amount": ${Number(amount) || 0},
                "currency": ${jsString(currency)},
                "name": ${jsString(name)},
                "description": ${jsString(description)},
                "image": ${jsString(image)},
                "order_id": ${jsString(orderId)},
                "handler": function (response){
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      event: 'success',
                      data: response
                    }));
                },
                "prefill": {
                    "name": ${jsString(prefill?.name)},
                    "email": ${jsString(prefill?.email)},
                    "contact": ${jsString(prefill?.contact)}
                },
                "theme": {
                    "color": ${jsString(themeColor)}
                },
                "modal": {
                    "ondismiss": function(){
                        window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'dismiss' }));
                    }
                }
            };
            
            var rzp1 = new Razorpay(options);
            
            rzp1.on('payment.failed', function (response){
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  event: 'failure',
                  data: response.error
                }));
            });
            
            try {
              rzp1.open();
            } catch(e) {
              setTimeout(function(){ rzp1.open(); }, 100);
            }
            post({ event: 'opened' });
        </script>
    </body>
    </html>
  `;

  const onMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.event === 'opened') {
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
          originWhitelist={['*']}
          source={{ html: checkoutHtml, baseUrl: 'https://checkout.razorpay.com' }}
          onMessage={onMessage}
          onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={false}
          javaScriptCanOpenWindowsAutomatically
          onError={() => fail('Could not open the payment page. Please check your connection and try again.')}
          onHttpError={() => fail('Could not open the payment page. Please try again.')}
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
