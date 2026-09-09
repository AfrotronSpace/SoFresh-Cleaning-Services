# Documentation

Written 8 September 2026 from a full read of the codebase and both discovery
forms. Start wherever matches what you're doing.

| File | What it's for |
|---|---|
| [`../CLAUDE.md`](../CLAUDE.md) | **Read first.** Conventions, the five non-negotiable business rules, commands, and the gotchas that cost an hour each. Auto-loaded by Claude Code sessions. |
| [`STATUS.md`](STATUS.md) | What is built (route by route), what is left, and a suggested order for the next session. |
| [`FINDINGS.md`](FINDINGS.md) | 27 open defects with file:line references and suggested fixes, ranked S1–S4. Four are launch blockers. Also lists what was checked and found correct. |
| [`DEPLOYMENT.md`](DEPLOYMENT.md) | Railway + Cloudflare R2: the Dockerfile, the env-var matrix, database setup, R2 bucket and CORS setup, and the post-deploy checklist. |
| [`BUSINESS-RULES.md`](BUSINESS-RULES.md) | Every customer-facing promise traced to the form answer it came from. Consult before writing any copy that commits the business to something. |

Also in the repo root, written by the original build and still accurate:

- `README.md` — setup, notification behaviour, what was deliberately not built
- `SETUP-NOTES.md` — five decisions the client still needs to make
- `CLAUDE-CODE-PROMPT.md` — the original build brief

## Source documents

The two Afrotron discovery forms are the authority for all business content:

- **AFT-F-01** *Business Information* — identity, services, areas, contact,
  reviews, credentials
- **AFT-F-02** *How Your Business Works* — enquiry-to-booking process,
  quoting, payment, cancellation, on-the-day, standards, privacy, SEO

Both are summarised in `BUSINESS-RULES.md` with question references, so you
usually won't need the PDFs themselves.

## The short version

The site is substantially complete and well built — 34 routes, clean
typecheck, a production build that survives the database being down, sensible
snapshotting so history can't be rewritten, and honest copy that doesn't
overpromise. The design brief is met.

What stands between it and launch is a small number of concrete defects
(`FINDINGS.md` #1–#4), real photography and review text from the client, and
one feature still owed against the brief: **photo/video upload on the booking
form**, which AFT-F-02 I4 asked for explicitly and which the `Attachment`
model is already waiting for.
