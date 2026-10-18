# Navigation and session state

Use the computer-use/browser tool available in the current session. Inspect its own documentation first; names and APIs vary by runtime. Prefer accessible labels and visible page state. Use screenshots when the page's accessible state omits needed context. Re-read state after each interaction and reacquire controls after navigation.

On the observed Walmart home page, the header exposed a search combobox, an account control, a cart button, and a “Pickup or delivery?” store control. The header identified a signed-in account and a selected Supercenter. Do not infer the selected fulfillment mode from this home-page label alone; inspect the product or cart page's selected control.

The tested search interaction used the visible Search combobox and Search button. A first attempt to type after an interrupted field interaction duplicated text; clear or select the existing value before typing. Verify the query on the resulting results heading and URL. Do not retry if the page may already have navigated.

Product page navigation exposed a store button, fulfillment choices, and pickup estimate. The cart showed its selected fulfillment and store separately. Use these visible states as the source of truth.

If the page is loading, shows a dialog, or has stale controls, inspect the fresh page before proceeding. Dismiss a blocking non-binding promotional dialog only when its close control is visible. Never choose a different store or fulfillment option as a recovery tactic.
