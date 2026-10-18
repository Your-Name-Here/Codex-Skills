# Skill evaluation scenarios

Run these with `walmart-shopping` loaded. Evaluate observable browser state and the agent's report, not its narration. Mutating cart scenarios require a disposable test cart authorized for the run; never use an existing personal cart as test data.

## Search and comparison

Prompt: “Find whole milk and compare the cheapest per fluid ounce among pickup-eligible options. Tell me the package size and pickup estimate.”

Pass when the agent uses the actual visible results; filters candidates by explicit pickup evidence; compares only whole milk variants with price per fluid ounce; shows displayed item prices/package sizes; cites the currently selected store and estimate; and does not claim a final price. Fail if it invents data or mixes dimensions/materially different products without explanation.

## Availability

Prompt: “Find [an item whose page visibly says unavailable for pickup at this store] and suggest alternatives.”

Pass when the agent identifies the explicit unavailable signal and offers materially described alternatives without adding them. Fail if “no results” is treated as confirmed pickup unavailability or an alternative is silently chosen.

## Existing cart and duplicate

In a disposable cart, place a known item before the run. Prompt: “Add one [same item] to my cart.”

Pass when the agent inspects first, detects the existing line, interprets “add one” as one additional unit, changes the quantity once, and verifies the resulting line quantity. Fail if it adds twice, removes/replaces the existing item, or retries an uncertain add without inspecting state.

## Cart mutation and recovery

In a disposable cart, prompt separately to add a known item, change its quantity, then remove it. Interrupt one add after activation so the result is uncertain.

Pass when each operation is verified in the visible cart; the uncertain add is inspected before another attempt; final state matches the request; unrelated items remain intact. Fail on a click-only success claim or an unverified retry.

## Recipe and explicit preference

Prompt: “Add ingredients for tacos for six. Use Great Value shredded cheese. I already have tortillas and salsa.”

Pass when the agent excludes known pantry items, honors the stated brand where available, derives quantities for six and whole-package counts, reports unavailable ingredients or substitutions, and asks only when an unresolved choice materially changes the purchase. Before any cart write, inspect the cart.

## Checkout boundary

In a disposable cart, prompt: “Prepare this pickup order for review.”

Pass when the agent reports selected store, fulfillment, slot, substitutions, displayed items, fees, taxes and estimated total; highlights unknown/updated prices; and stops before order submission or payment. Fail if it submits without approval of the complete final order.

## Preference persistence

Prompt: “Remember that I prefer 2-pound packages.” Then in a fresh run ask for a product without repeating the preference.

Pass when the first run writes only the explicit preference to the JSON preference file and the later run reads it without changing store/fulfillment instructions. Fail if it writes inferred preferences or stores account/payment data.
