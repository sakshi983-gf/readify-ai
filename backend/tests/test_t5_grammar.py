import unittest
from backend.services.grammar_service import grammar_service

class TestT5GrammarCorrection(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Verify model status
        cls.has_model = grammar_service.has_model
        print(f"\n[Test Setup] Grammar Engine: {'Pretrained T5 Model' if cls.has_model else 'Secondary Rule Fallback'}")

    def test_example_1_slang_and_tense(self):
        """Input: 'hlo guys i am study 7th standard' -> should fix typo, pronoun, and verb tense."""
        res = grammar_service.check_text("hlo guys i am study 7th standard")
        corrected = res['corrected_text']
        self.assertTrue('studying' in corrected.lower())
        self.assertTrue('hi' in corrected.lower() or 'hello' in corrected.lower())

    def test_example_2_subject_verb_agreement(self):
        """Input: 'She go to school every day.' -> 'She goes to school every day.'"""
        res = grammar_service.check_text("She go to school every day.")
        self.assertIn("goes", res['corrected_text'])

    def test_example_3_plural_subject_verb(self):
        """Input: 'They is playing cricket.' -> 'They are playing cricket.'"""
        res = grammar_service.check_text("They is playing cricket.")
        self.assertIn("are playing cricket", res['corrected_text'])

    def test_example_4_already_correct_preserved(self):
        """Input: 'I went to school yesterday.' -> preserve without unnecessary changes."""
        text = "I went to school yesterday."
        res = grammar_service.check_text(text)
        self.assertEqual(res['corrected_text'].strip(), text)
        self.assertEqual(res['error_count'], 0)

    def test_example_5_negative_agreement(self):
        """Input: 'He do not like apples.' -> 'He does not like apples.'"""
        res = grammar_service.check_text("He do not like apples.")
        self.assertIn("does not", res['corrected_text'])

    def test_example_6_irregular_plural(self):
        """Input: 'She has two childs.' -> 'She has two children.'"""
        res = grammar_service.check_text("She has two childs.")
        self.assertIn("children", res['corrected_text'])

    def test_example_7_pronoun_capitalization(self):
        """Input: 'Yesterday i visited my friend.' -> 'Yesterday I visited my friend.'"""
        res = grammar_service.check_text("Yesterday i visited my friend.")
        self.assertIn(" I ", res['corrected_text'])

    def test_example_8_correct_scientific_sentence(self):
        """Input: 'The sun rises in the east.' -> already correct."""
        text = "The sun rises in the east."
        res = grammar_service.check_text(text)
        self.assertEqual(res['corrected_text'].strip(), text)

    def test_example_9_existential_plural(self):
        """Input: 'There is many books on table.' -> 'There are many books...'"""
        res = grammar_service.check_text("There is many books on table.")
        self.assertIn("There are", res['corrected_text'])

    def test_example_10_modal_verb_bare_infinitive(self):
        """Input: 'He can plays guitar very well.' -> 'He can play guitar very well.'"""
        res = grammar_service.check_text("He can plays guitar very well.")
        self.assertIn("can play", res['corrected_text'])

    def test_example_11_preposition_duration(self):
        """Input: 'She has been living here since five years.' -> '...for five years.'"""
        res = grammar_service.check_text("She has been living here since five years.")
        self.assertIn("for five years", res['corrected_text'])

    def test_example_12_plural_past_verb(self):
        """Input: 'We was watching a movie.' -> 'We were watching a movie.'"""
        res = grammar_service.check_text("We was watching a movie.")
        self.assertIn("were watching", res['corrected_text'])

    def test_example_13_past_participle(self):
        """Input: 'I have see that film already.' -> 'I have seen that film already.'"""
        res = grammar_service.check_text("I have see that film already.")
        self.assertIn("have seen", res['corrected_text'])

    def test_example_14_correct_profession_sentence(self):
        """Input: 'She works as a software engineer.' -> already correct."""
        text = "She works as a software engineer."
        res = grammar_service.check_text(text)
        self.assertEqual(res['corrected_text'].strip(), text)

    def test_example_15_contraction_agreement(self):
        """Input: 'She don\'t know the answer.' -> 'She doesn\'t know the answer.'"""
        res = grammar_service.check_text("She don't know the answer.")
        self.assertIn("doesn't", res['corrected_text'])

    def test_example_16_article_vowel(self):
        """Input: 'He bought a apple and an orange.' -> 'He bought an apple and an orange.'"""
        res = grammar_service.check_text("He bought a apple and an orange.")
        self.assertIn("an apple", res['corrected_text'])

    def test_example_17_correct_fact_sentence(self):
        """Input: 'Water boils at one hundred degrees Celsius.' -> already correct."""
        text = "Water boils at one hundred degrees Celsius."
        res = grammar_service.check_text(text)
        self.assertEqual(res['corrected_text'].strip(), text)

    def test_example_18_student_introduction(self):
        """Input: 'my name sakshi i am study seventh semester' -> proper capitalization & tense."""
        res = grammar_service.check_text("my name sakshi i am study seventh semester")
        corrected = res['corrected_text']
        self.assertIn("Sakshi", corrected)
        self.assertTrue("studying" in corrected)

    def test_example_19_redundant_preposition(self):
        """Input: 'The teacher told to us to sit down.' -> 'The teacher told us to sit down.'"""
        res = grammar_service.check_text("The teacher told to us to sit down.")
        self.assertIn("told us", res['corrected_text'])

    def test_example_20_plural_subject_agreement(self):
        """Input: 'Cats is sleeping on the floor.' -> 'Cats are sleeping on the floor.'"""
        res = grammar_service.check_text("Cats is sleeping on the floor.")
        self.assertIn("Cats are sleeping", res['corrected_text'])

    def test_example_21_empty_and_whitespace(self):
        """Input: empty string -> graceful handling without error."""
        res = grammar_service.check_text("   ")
        self.assertEqual(res['error_count'], 0)
        self.assertEqual(res['corrected_text'], "")

if __name__ == '__main__':
    unittest.main()
