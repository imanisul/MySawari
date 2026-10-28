import React from 'react';
import { StyleSheet, View, ActivityIndicator, Linking } from 'react-native';
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
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        <script>
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
        </script>
    </body>
    </html>
  `;

  const onMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.event === 'success') {
        onSuccess(data.data);
      } else if (data.event === 'failure') {
        onFailure(data.data);
      } else if (data.event === 'dismiss') {
        onClose();
      }
    } catch (e) {
      console.error('Failed to parse webview message', e);
      onFailure(e);
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
      url.startsWith('intent://')
    ) {
      Linking.canOpenURL(url).then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Linking.openURL(url).catch(() => {});
        }
      }).catch(() => {});
      return false;
    }

    return true;
  };

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: checkoutHtml, baseUrl: 'https://checkout.razorpay.com' }}
        onMessage={onMessage}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        style={{ flex: 1, backgroundColor: 'transparent' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
