import unittest
from decimal import Decimal
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from scripts.product_math import compare_dimension, package_count, unit_price


class ProductMathTests(unittest.TestCase):
    def test_normalizes_gallon_to_fluid_ounces(self):
        self.assertEqual(unit_price(Decimal("2.98"), Decimal("1"), "gallon"), Decimal("2.98") / Decimal("128"))

    def test_normalizes_pounds_to_ounces(self):
        self.assertEqual(unit_price(Decimal("8"), Decimal("2"), "lb"), Decimal("0.25"))

    def test_units_are_comparable_only_within_dimension(self):
        self.assertTrue(compare_dimension("gallon", "fl-oz"))
        self.assertTrue(compare_dimension("lb", "oz"))
        self.assertFalse(compare_dimension("fl-oz", "oz"))
        self.assertFalse(compare_dimension("count", "lb"))

    def test_package_quantity_rounds_up(self):
        self.assertEqual(package_count(Decimal("5"), Decimal("2")), 3)
        self.assertEqual(package_count(Decimal("4"), Decimal("2")), 2)
        self.assertEqual(package_count(Decimal("0"), Decimal("2")), 0)

    def test_rejects_invalid_amounts(self):
        with self.assertRaises(ValueError):
            unit_price(Decimal("1"), Decimal("0"), "oz")
        with self.assertRaises(ValueError):
            package_count(Decimal("2"), Decimal("0"))


if __name__ == "__main__":
    unittest.main()
