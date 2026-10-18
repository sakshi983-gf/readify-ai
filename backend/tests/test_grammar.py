import unittest
from backend.services.grammar_service import grammar_service

class TestGrammarService(unittest.TestCase):
    def test_clean_text(self):
        text = "This is a clean and well written sentence."
        res = grammar_service.check_text(text)
        self.assertEqual(res['error_count'], 0)
        self.assertEqual(res['corrected_text'], text)

    def test_spelling_error(self):
        text = "She has an awsome idea for the sciense project."
        res = grammar_service.check_text(text)
        self.assertGreaterEqual(res['error_count'], 1)
        error_words = [e['matched_text'].lower() for e in res['errors']]
        self.assertTrue('awsome' in error_words or 'sciense' in error_words)

    def test_repeated_words(self):
        text = "The the student was reading carefully."
        res = grammar_service.check_text(text)
        self.assertTrue(any(e['rule'] == 'REPEATED_WORD' for e in res['errors']))

    def test_capitalization(self):
        text = "i believe this is important. next sentence should start capital."
        res = grammar_service.check_text(text)
        self.assertTrue(any('I' in e['replacements'] for e in res['errors']))

    def test_article_usage(self):
        text = "She ate a apple for breakfast and bought an car."
        res = grammar_service.check_text(text)
        self.assertTrue(any(e['rule'] == 'ARTICLE_A_AN' for e in res['errors']))

    def test_subject_verb_agreement(self):
        text = "He go to the library every morning."
        res = grammar_service.check_text(text)
        self.assertTrue(any(e['rule'] == 'SUBJECT_VERB_AGREEMENT' for e in res['errors']))

    def test_apply_corrections(self):
        text = "i went to school."
        res = grammar_service.check_text(text)
        self.assertEqual(res['corrected_text'], "I went to school.")

if __name__ == '__main__':
    unittest.main()
