# Research kit demand test

Status: active. Owner reports posting on October 2, 2026. Post URL, destination
and responses have not yet been verified. No messages sent by the assistant.
New spending budget: $0.

Live readiness checked October 2, 2026: homepage, research kit, free Markdown
download, Workflow Pack preview and sample download all returned HTTP 200.
The kit links directly to the accessible Markdown file; no signup was needed to
retrieve it. The newsletter form targets Buttondown's stockwatch endpoint. The
preview contains no Stripe payment link. Subscription confirmation and inbox
delivery were not tested. The public sharing journey is ready for reader feedback.
Start date: October 2, 2026. Review date: October 16, 2026 (America/Los_Angeles).
Owner time budget: two hours total; this is a proposed cap, not a recurring task.

The owner confirmed there is no existing audience. Begin with one permitted
community feedback post, identifying
yourself as the creator. Avoid unsolicited bulk messages. Selecting a channel does
not authorize sending; agree the exact destination and text before publishing.

Candidate: r/SideProject for usability feedback. Treat only responses from people
who actually research stocks as target-reader demand evidence. Its official rules
page did not expose rule text during the October 2 check, so posting permission is
not yet verified: https://www.reddit.com/r/SideProject/about/rules/
Do not assume investing communities permit promotional links.

Prepared post title: “I built a free NBIS research kit. Is the workflow useful?”
The drafts below are retained for reference; the owner's actual post may differ.
Do not repost or send replies automatically.

## While feedback arrives

- Capture the post URL and current confirmed subscriber count as the baseline.
  Neither has been supplied yet; unknown values must not be recorded as zero.
- On the next manual check, record substantive replies in the tracker. Upvotes
  and general compliments do not count as evidence of a research problem.
- For vague praise, ask: “Which part would you actually use in your next research session?”
- For confusion, ask: “Where did you get stuck, and what were you expecting?”
- For a feature request, ask: “How do you handle that today?” before building it.
- If the post has no replies after a few days, check visibility and audience fit
  before changing the product. Avoid duplicate promotion or paid ads.
- Keep checkout and infrastructure development paused until the review. Fix
  confirmed broken links or usability blockers if readers encounter them.

These are manual next steps, not a scheduled monitoring service.

## Share once, learn before building

1. Choose up to ten people who already research individual stocks and welcome
   feedback requests, or one relevant community that permits sharing your own work.
2. Share the free kit using the draft below. Do not use the Stripe links.
3. Record anonymous reader labels and short paraphrases in the table below.
   Keep contact details and private correspondence out of Git.
4. Ask the price question only after hearing about their actual workflow.
5. At day 14, apply the decision rule. Do not build features based only on compliments.

## Initial sharing draft

I made a free kit for organizing NBIS research: questions, evidence and assumptions.
If you research individual stocks, I'd appreciate feedback after trying it:
https://stockswatch.cc/research-kit.html

What was hardest about your last research session, and did anything here help?
Educational resources, not investment advice. No signup required for the kit.

## Follow-up questions

- What do you currently use for that task?
- Which part of the kit did you actually try? What was missing or confusing?
- I'm considering a $19 pack with ten editable Markdown documents, including
  templates, guides and a fictional worked example. Would you buy that for this
  task, or keep using your current approach? Why?

Preview if requested: https://stockswatch.cc/workflow-pack.html
This is an interest check, not an order or preorder. Do not promise a launch date.

## Manual tracker

Use one row per person, without names or email addresses. A newsletter signup alone
does not count as willingness to pay. Record objections as carefully as interest.

| Reader label | Date/channel | Relevant research task | Tried kit? | Main feedback | Explicit interest at $19? | Objection/current alternative |
| --- | --- | --- | --- | --- | --- | --- |
| | | | | | | |

## Review after 14 days

- People directly reached: ___ (community impressions unknown unless measured).
- Substantive responses: ___; people who tried the kit: ___.
- Explicit interest at $19: ___; confirmed newsletter signups during period: ___.
- Strongest recurring problem: ___.
- Decision: continue testing / revise offer / pause / insufficient reach.

Five substantive responses and three explicit expressions of interest at $19 are
the working threshold for revisiting fulfillment. This small sample is not proof
of demand, and stated interest is not a sale. If the threshold is reached, decide
the smallest next test before resuming infrastructure work. If reach is too small,
mark the test inconclusive. No paid advertising to rescue this experiment.

## Costs still to verify

| Item | Known evidence | Next check |
| --- | --- | --- |
| AWS | September statement totals $21.65; service breakdown unknown | Owner sign-in, then inspect charges before proposing removals |
| Cloudflare | Existing Pages site and sandbox Worker/R2 | Read billing and usage; do not assume total cost is zero |
| Buttondown | Existing stockwatch newsletter | Check current plan, subscribers and actual invoice |
| Domain | stockswatch.cc is in use | Check renewal amount and date |

No services were cancelled and existing costs may continue. Delivery development
is paused; the local code and sandbox remain available.
