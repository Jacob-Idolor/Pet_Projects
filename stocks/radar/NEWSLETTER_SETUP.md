# StocksWatch Notes — provider-ready email flow

Status: prepared, not connected. No signup form, list, sender or automated email
has been created. No email has been sent. Provider selection is still needed.

## Audience promise

Name: StocksWatch Notes.
Promise: occasional research workflows, source-checking tips and resource updates
for technically minded readers of the AI infrastructure desk. Avoid a daily
delivery promise. The site's automated daily snapshot is a separate feature.

Sample landing-page copy:

> Build a research process you can revisit.
> Get occasional practical notes on sources, assumptions and AI infrastructure
> research, plus updates about StocksWatch resources. No daily market alerts or
> personalized investment advice.

The free kit remains available without signup. Product delivery must not silently
subscribe a buyer to marketing. Provide a separate, optional newsletter opt-in.

## Intended signup journey

1. Resource page links to a clearly labeled newsletter page.
2. Explain content, cadence, provider, privacy and unsubscribe before submission.
3. Ask only for email. Any marketing checkbox is unchecked by default.
4. Submit to the selected provider's hosted form or documented endpoint. Use its
   spam controls and validation; never put a private API token in browser code.
5. Show "Check your inbox to confirm" after accepted submission, not "Subscribed."
6. Provider sends a confirmation message to the submitted address.
7. Only confirmation activates the subscription. Confirmation failure or expiry
   shows a recovery route through the provider.
8. Send the welcome note after confirmation. Include a working unsubscribe link.

Public UI states: idle; invalid email; sending; confirmation requested; already
subscribed (provider-safe response); network/provider error; confirmation expired;
confirmed; unsubscribed. Do not retain the email in localStorage or analytics events.

## Copy prepared for the selected provider

### Consent wording to adapt after provider selection

"Email me StocksWatch Notes: research workflows, resource updates and occasional
product announcements. I can unsubscribe at any time."

Place a privacy link beside this text. State the actual provider and verified
sender in the final disclosure. Do not insert a guessed business address or an
unverified `brief@...` mailbox.

### Confirmation email draft

Subject: Confirm your StocksWatch Notes subscription

You requested occasional notes from StocksWatch about research workflows and
resources. Confirm using the provider's confirmation button. If you did not request
this, you can ignore this message and you will not be added to the newsletter.

[Provider-generated confirmation action; never hardcode a token.]

### Welcome email draft

Subject: Start with one question and one source

Welcome to StocksWatch Notes.

The free Research Kit is available at the published research-kit page. Start with
one company and one question. Record the source, reporting period and units beside
each material claim. If a document does not establish an answer, leave the gap visible.

These notes cover research methods and resources, not stock picks or personalized
financial advice. Expect occasional updates, not a daily inbox commitment.

[Use the verified sender identity and provider-generated unsubscribe/footer.]

## Connection checklist

- Service/account selected and owner can access it.
- Sender mailbox and domain spelling verified; provider-required DNS configured
  only with explicit account/DNS authorization.
- Actual sender identity and required mailing/contact details supplied by owner.
- Privacy page names the actual provider and relevant data handling.
- Double opt-in and unsubscribe behavior verified with a consenting test address.
- Invalid input, errors, retries and expired confirmation handled accessibly.
- Free kit works without giving an address; unsubscribing does not break downloads.
- No addresses, confirmation tokens or subscriber IDs in analytics events or Git.
- No bulk import, live marketing send or recurring automation until explicitly requested.

## Measurement

Separate signup intent, provider acceptance and confirmed subscriptions. A clicked
button is not a subscriber. Aggregate counts can come from the provider; do not
build a subscriber database merely for reporting. Define retention and deletion
settings against the selected provider before collecting addresses.
