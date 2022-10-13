# PAYPAL TEST WEBHOOK BRIEF

## Intro
Testing of paypal webhooks is not straightforward and there are two main options:
 - Using the simulated sandbox messages from https://developer.paypal.com/dashboard/webhooksSimulator - NOTE! These cannot be verified with against the official verify-webhook-signature endpoint.
 - Using the sandbox accounts with generating the events through the REST API or WebUI integration - NOTE! These must verify as they will be as in production.

For testing you need access to the sandbox account or the client_id/secret.

In both cases the web hook events cannot be received directly on the localhost and an intermediate public webhook listener tool can be used https://webhook.site to receive the messages. Then they can be copied locally and sent to localhost.

## Testing manually on localhost with local files
For ease of localhost testing the two main events are saved in this folder to replay manually to the local webhook. You can use these curl requests to send to local paypal/webhook.

Checkout Order Created - this message confirms the money are requested

```shell
curl -X 'POST' 'http://localhost:5010/api/v1/paypal/webhook' -H @"./apps/api/src/paypal/test-data/test.checkout.order.header.txt" -d @"./apps/api/src/paypal/test-data/test.checkout.order.json"
```

Payment Capture Completed - this one confirms the money are transfered

```shell
curl -X 'POST' 'http://localhost:5010/api/v1/paypal/webhook' -H @"./apps/api/src/paypal/test-data/test.payment.capture.header.txt" -d @"./apps/api/src/paypal/test-data/test.payment.capture.json"
```
# Additional Resources
## Generate Token from Sandbox
https://developer.paypal.com/api/rest/authentication/
## Testing verify request with curl
https://developer.paypal.com/docs/api/webhooks/v1/#verify-webhook-signature/ 
