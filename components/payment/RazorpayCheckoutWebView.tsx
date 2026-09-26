import React from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
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
  themeColor = '#000000',
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
          body { margin: 0; padding: 0; background-color: #f8f9fa; display: flex; justify-content: center; align-items: center; height: 100vh; }
          .loader { border: 4px solid #f3f3f3; border-top: 4px solid ${themeColor}; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
    </head>
    <body>
        <div class="loader"></div>
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        <script>
            var options = {
                "key": ${jsString(razorpayKey)},
                "amount": ${jsString(String(amount))},
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
            
            // Auto open the modal
            setTimeout(() => {
              rzp1.open();
            }, 500);
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

  return (
    <View style={styles.container}>
      <WebView
        source={{ html: checkoutHtml }}
        onMessage={onMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={themeColor} />
          </View>
        )}
        style={{ flex: 1, backgroundColor: 'transparent' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  }
});
