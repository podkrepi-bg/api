# Testing

## Testing Stripe

Install `stripe-cli` from <https://stripe.com/docs/stripe-cli>

In a first shell forward stripe webhook events to the locally running API

```shell
yarn stripe:listen-webhook
```

:information*source: When you start the listening process you'll be given an signing secret `whsec*....`. Place that secret in `.env.local` as:

```shell
STRIPE_SECRET_KEY=sk_test_.....
STRIPE_WEBHOOK_SECRET=whsec_.....
```

In a first shell start the API process

```shell
yarn dev
```

In a third shell trigger individual stripe events on demand

```shell
stripe trigger payment_intent.succeeded
```
