# Brand emblem — the Allen Iverson clip

The header emblem (top-left, by the title) is the "AI" wink: **A**rtificial
**I**ntelligence *and* **A**llen **I**verson, "The Answer."

By default it shows a small animated basketball mark (inline SVG — no file needed).
To replace it with an actual highlight clip:

1. Save your clip as **`iverson.gif`** in this folder (`static/assets/iverson.gif`).
2. Reload the app. The gif fades in over the basketball automatically — no code
   change needed (the header `<img>` loads it and swaps itself in on success).

Notes:
- Keep it small/square-ish; it's displayed in a 54×54 rounded tile (cover-cropped).
  A short, looping, lightweight gif (a few hundred KB) looks best.
- Use a clip you have the right to use. NBA broadcast footage is copyrighted; this
  file is intentionally left for you to supply rather than bundled.
- `iverson.gif` is git-ignored by default so it won't bloat the repo.
