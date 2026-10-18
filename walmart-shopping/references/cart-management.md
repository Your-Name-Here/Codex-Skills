# Cart management

Before changing the cart, inspect and record its current item count, matching items and quantities, fulfillment grouping, and displayed totals. This prevents duplicate additions and unintended removal of existing items.

Use visible cart controls for add, remove, or quantity changes. After each change, inspect the cart and verify the exact line item and quantity. A click or toast alone is not proof that the cart changed. If the outcome is unclear, inspect current state before retrying; do not repeat an add blindly.

When checking for duplicates, compare the requested product against existing lines by product identity and package variant, not title substring alone. Preserve unrelated items. Before replacing an item, identify the existing line and proposed replacement to the user when ambiguity remains.

Read displayed subtotals and estimates from the cart. Keep item subtotal, shipping/other fees, taxes, and estimated total separate. Prices may change between pages or refreshes; report the latest displayed amount and note changes when relevant. Do not infer a final charge from an estimate.
