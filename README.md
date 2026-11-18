# IRONFORM

A black and steel gym and running tracker with planned recovery days. The browser app stores workouts locally; a small Vercel Function and private Blob store power an optional daily wallpaper feed.

## Local preview

From this folder, run `npm ci`, then `npm run dev` and open http://localhost:4173. Node.js 24 or newer is recommended. Refresh after editing files. For the private wallpaper API, copy `.env.example` to `.env.local` and add the token for your private Vercel Blob store. The dev server loads that file automatically.

Run `npm test` for the streak, calendar, reward and backup checks.

## iPhone wallpaper

The header phone icon opens **Wallpaper and Shortcut**. The image is 1179 × 2556 for iPhone 16, with a solid black background and a centered grid containing only dots. Thirty-day months use a complete 5-column × 6-row grid. Other months use seven columns. Day 1 starts on the bottom row, days fill left to right, and later rows build upward; any shorter top row is centered. There are no dates, text, statistics, branding, gradients or legends on the wallpaper. It has exactly one dot per day of the current month: green training, red missed past days, hollow steel-blue recovery, an open current day until logged, and muted future days. Monthly consistency includes training and planned recovery across elapsed days; an unlogged today stays open until midnight. It can differ from the app's pre-tracking neutral calendar days because the wallpaper shows every past day of the month.

PNG generation runs after saved entry changes. Download PNG or share the image from the panel. Enabling daily wallpaper creates an independent read key and write key in this browser; only date/status pairs and the saved time zone go to the private Blob store. Notes, duration and distance are never sent. Edits, deletion, Undo and imports update the feed, with retry on reconnect. Workouts remain local; this is not cross-device workout syncing.

Use **Copy Shortcut URL** after the first successful sync. Treat it as private: anyone holding that URL can see the rendered wallpaper. The URL cannot update the feed. Disconnect requires the separate write key and invalidates the read URL. The image endpoint renders fresh PNGs on demand with `Cache-Control: private, no-store`; month/day rollover works with the app closed using the saved time zone. No scheduled Vercel job is needed. Keep logging in the same browser where the feed was enabled.

In iPhone Shortcuts, create **IRONFORM Wallpaper** with **URL** (the private link), **Get Contents of URL** (GET), optionally **Get Images from Input**, then **Set Wallpaper Photo**. Select a photo Lock Screen and disable **Show Preview** and **Crop to Subject** if shown. Run once while unlocked to grant permissions. Create a **Time of Day → Daily → Run Immediately** automation that runs this shortcut, preferably after the usual workout. The website cannot change iOS wallpaper itself; the wallpaper changes when the Shortcut runs. Full instructions are also in the app.

`npm test` covers image dimensions, day counts, leap years, date rollover, state colours and privacy filtering. `node --env-file=.env.local tests/verify-wallpaper-feed.mjs` checks the actual private store with disposable sample records. Set `WALLPAPER_TEST_ORIGIN` to a deployed origin to run those same API checks remotely; this never reads actual user feeds.

## Data

Workout history stays in this browser's local storage under `afterglow.v1` (the original key is retained for compatibility). IRONFORM accepts existing Afterglow backups. Export and import JSON from **Data & backups**. Each browser, device and origin has separate history. Export before moving from localhost to a hosted domain, or clearing browser data. There is no account or sync service.

One gym entry and one run entry are allowed per local calendar date. Either makes the day active; doing both still earns one streak day and growth step. A recovery day is mutually exclusive with training. Up to two recovery days per Monday–Sunday week, and at most two consecutively, can extend an existing consistency streak. Recovery never starts a streak and never earns training totals or garden growth. The calendar distinguishes green training dots, hollow steel-blue recovery rings, and muted red missed days. The weekly rhythm panel shows training and recovery counts.

An unlogged today leaves yesterday's streak open. A missed completed day breaks it. Edits recalculate stats and rewards. Existing workout-only history and version 1 backups remain compatible; recovery entries use `type: "rest"` with optional notes and no duration or distance.

The Today screen includes the full motivational heading, streak card, quick workout buttons, consistency calendar, garden preview, totals and wallpaper card. Run and Recovery can be logged with one tap from Today. Gym opens a compact workout picker with preset splits and a Log button. Additional exercises, duration, distance and notes are available under Add details. The separate weekly panel remains removed. Detailed totals live in Progress, and rewards live in Growth. The consistency calendar is the entry-management interface; there are no recent-session or training-history lists. Tap a date to reopen its saved details and notes automatically. Saved gym entries offer Change workout, while existing notes and exercise names are visible immediately. Switching activities in the day editor preserves unsaved drafts for that day. If gym and running are both logged, switch between the marked activity buttons to view each entry. Unlogged dates offer Gym, Run and Recovery. A dedicated Delete button beneath Save removes the selected entry immediately. Removed entries are grouped behind an Undo action, available until dismissed. The pending undo group survives refresh in the same browser tab through session storage. Undo restores valid entries without overwriting newly logged workouts or violating recovery rules.

## Production hosting

Live site: https://ironform-rho.vercel.app

Vercel project: `vaibhav-webworlds-projects/ironform`, under the confirmed personal account `vaibhavkanda39@gmail.com`. The static directory is `dist`; `api/wallpaper.js` handles the private feed. Vercel installs locked dependencies with `npm ci`; no build command is needed. Private Blob store `ironform-wallpaper` is connected to this project. Its server credentials stay in Vercel environment variables and the ignored `.env.local`. Redeploy from this folder with `vercel deploy --prod --scope vaibhav-webworlds-projects --project ironform`.

The `.openai` file only records an unused, unpublished Sites draft created before the Vercel deployment preference was given. Local workout data is not uploaded during deployment. Export from localhost and import on the live site to transfer history.
