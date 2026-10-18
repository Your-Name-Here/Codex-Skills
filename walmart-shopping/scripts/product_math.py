#!/usr/bin/env python3
"""Small deterministic helpers for Walmart product comparisons and package counts."""

import argparse
from decimal import Decimal, ROUND_CEILING

UNITS = {
    "oz": ("mass", Decimal("1")),
    "lb": ("mass", Decimal("16")),
    "g": ("mass", Decimal("0.03527396195")),
    "kg": ("mass", Decimal("35.27396195")),
    "fl-oz": ("volume", Decimal("1")),
    "cup": ("volume", Decimal("8")),
    "pint": ("volume", Decimal("16")),
    "quart": ("volume", Decimal("32")),
    "gallon": ("volume", Decimal("128")),
    "count": ("count", Decimal("1")),
    "each": ("count", Decimal("1")),
}


def unit_price(price: Decimal, amount: Decimal, unit: str) -> Decimal:
    """Return price per base unit (oz, fl-oz, or count), rejecting bad quantities."""
    if price < 0 or amount <= 0:
        raise ValueError("price must be nonnegative and amount must be positive")
    try:
        _, factor = UNITS[unit.lower()]
    except KeyError as exc:
        raise ValueError(f"unsupported unit: {unit}") from exc
    return price / (amount * factor)


def compare_dimension(unit_a: str, unit_b: str) -> bool:
    """Whether units can be compared on the same normalized basis."""
    try:
        return UNITS[unit_a.lower()][0] == UNITS[unit_b.lower()][0]
    except KeyError:
        return False


def package_count(needed: Decimal, package_size: Decimal) -> int:
    """Whole packages required to meet a positive amount without underbuying."""
    if needed < 0 or package_size <= 0:
        raise ValueError("needed must be nonnegative and package size must be positive")
    return int((needed / package_size).to_integral_value(rounding=ROUND_CEILING))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    price_parser = sub.add_parser("unit-price", help="normalize a product price")
    price_parser.add_argument("price", type=Decimal)
    price_parser.add_argument("amount", type=Decimal)
    price_parser.add_argument("unit", choices=sorted(UNITS))
    package_parser = sub.add_parser("packages", help="round a required quantity up to whole packs")
    package_parser.add_argument("needed", type=Decimal)
    package_parser.add_argument("package_size", type=Decimal)
    args = parser.parse_args()
    if args.command == "unit-price":
        print(f"{unit_price(args.price, args.amount, args.unit):.6f} per base unit")
    else:
        print(package_count(args.needed, args.package_size))


if __name__ == "__main__":
    main()
