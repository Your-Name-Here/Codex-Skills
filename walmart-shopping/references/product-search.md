# Product search

Search using the site's visible search control and submit once. Confirm the resulting query, then inspect the result cards and, when needed, open a product page.

For each plausible result, record only details actually shown:

- Product title and brand
- Package quantity or size
- Current displayed item price and displayed unit price
- Pickup status or estimate for the currently selected store
- Characteristics relevant to the request, such as fat percentage, cut, flavor, or package form
- Any explicit low-stock, out-of-stock, or shipping-only signal

Treat absent information as unknown. A site-wide product listing is not proof of pickup eligibility; use the item's fulfillment signal. A pickup estimate describes the current store and can change. Distinguish weighted produce estimates from a guaranteed final charge.

If results are empty, report that the search returned no matching listings. Say “unavailable for pickup” only when the page explicitly identifies the item as unavailable for the selected store and pickup method. Otherwise report the displayed fulfillment evidence or that availability is unknown.

Compare price per unit only across compatible products and units. Walmart may show standardized prices such as cents per fluid ounce or cents per ounce. For additional calculations, use `python scripts/product_math.py --help`; inputs must come from observed product data. See [product-selection.md](product-selection.md) for equivalence rules.
