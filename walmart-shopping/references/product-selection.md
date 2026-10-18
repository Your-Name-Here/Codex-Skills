# Product selection

Start with the user's explicit requirements. Exclude candidates that violate material requirements, then consider pickup availability, comparable unit price, package size, brand preference, and other visible characteristics.

Compare normalized unit prices only when the products share the same dimension (mass, volume, or count) and the same meaningful product form. Do not compare fluid ounces with ounces by weight, or count units with weight units. `scripts/product_math.py` supports common US mass, volume, and count units; it does not decide whether two products are equivalent.

The lowest unit price is one factor, not an automatic winner. Account for the package total, requested brand, requested size, intended use, material attributes, and pickup eligibility. State when those factors change the ranking.
