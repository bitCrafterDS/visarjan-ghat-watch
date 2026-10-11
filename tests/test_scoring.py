"""Run with:  python3 -m unittest discover tests"""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import scoring as S

DATA = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "bhopal_ghats_2023_2025.csv")


class SeverityTests(unittest.TestCase):
    def test_within_limit_is_zero(self):
        self.assertEqual(S.severity("Dissolved oxygen", 5.0), 0)
        self.assertEqual(S.severity("BOD", 3.0), 0)
        self.assertEqual(S.severity("pH", 6.5), 0)
        self.assertEqual(S.severity("pH", 8.5), 0)

    def test_any_breach_has_floor(self):
        self.assertGreaterEqual(S.severity("Dissolved oxygen", 4.9), S.FLOOR)
        self.assertGreaterEqual(S.severity("BOD", 3.1), S.FLOOR)
        self.assertGreaterEqual(S.severity("pH", 8.6), S.FLOOR)

    def test_extremes_reach_one(self):
        self.assertAlmostEqual(S.severity("Dissolved oxygen", 0), 1.0)
        self.assertAlmostEqual(S.severity("BOD", 12), 1.0)
        self.assertAlmostEqual(S.severity("BOD", 22), 1.0)
        self.assertAlmostEqual(S.severity("pH", 10.0), 1.0)

    def test_missing_is_never_scored(self):
        with self.assertRaises(ValueError):
            S.severity("BOD", None)


class DataTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.rows = S.load_rows(DATA)
        cls.by_site = S.group_by_site(cls.rows)

    def test_headline_matches_problem_statement(self):
        h = S.headline(self.rows)
        self.assertEqual((h["do_below"], h["do_tested"]), (42, 116))
        self.assertEqual((h["bod_above"], h["bod_tested"]), (100, 112))
        self.assertEqual(h["ghats"], 7)
        self.assertEqual(h["readings"], 1524)

    def test_bairagarh_zero_oxygen_four_times(self):
        m = S.site_metrics(self.by_site["Bairagarh (Sant Hirdaram) kund"])
        self.assertEqual(m["do_zero"], 4)

    def test_missing_not_counted_as_clean(self):
        # Bairagarh has missing readings, so fewer than 54 scored readings, and the gap is reported.
        rows = self.by_site["Bairagarh (Sant Hirdaram) kund"]
        m = S.site_metrics(rows)
        self.assertLess(m["scored_tested"], S.EXPECTED)
        missing_events, partial = S.site_gaps(rows)
        self.assertIn(("Durga", 2025), missing_events)
        self.assertTrue(partial)

    def test_blank_values_are_none(self):
        blanks = [r for r in self.rows if r["flag"] in ("not sampled", "*", "**")]
        self.assertTrue(blanks)
        self.assertTrue(all(r["value"] is None for r in blanks))

    def test_ranking_extremes_stable_in_every_view(self):
        ranks = {b: S.rank_sites({s: S.score_site(r, b) for s, r in self.by_site.items()}) for b in S.BASES}
        for b in S.BASES:
            self.assertEqual(ranks[b]["Bairagarh (Sant Hirdaram) kund"], 1, b)
            self.assertEqual(ranks[b]["Prempura ghat"], 7, b)


if __name__ == "__main__":
    unittest.main()
