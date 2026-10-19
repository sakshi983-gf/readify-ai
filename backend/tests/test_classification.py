import unittest
from backend.services.classification_service import classification_service

class TestClassificationService(unittest.TestCase):
    def test_all_11_categories_defined(self):
        categories = classification_service.CATEGORIES
        self.assertEqual(len(categories), 11)
        expected_keys = [
            'subject_verb_agreement',
            'verb_tense',
            'articles',
            'prepositions',
            'pronouns',
            'singular_plural',
            'word_order',
            'spelling',
            'punctuation',
            'capitalization',
            'sentence_structure'
        ]
        for key in expected_keys:
            self.assertIn(key, categories)

    def test_subject_verb_agreement(self):
        res = classification_service.classify_error('go', 'goes', 'She go to school')
        self.assertEqual(res['category'], 'subject_verb_agreement')
        self.assertGreaterEqual(res['confidence'], 0.8)

    def test_articles(self):
        res = classification_service.classify_error('a', 'an', 'I ate a apple')
        self.assertEqual(res['category'], 'articles')
        self.assertGreaterEqual(res['confidence'], 0.85)

    def test_prepositions(self):
        res = classification_service.classify_error('in Monday', 'on Monday', 'We meet in Monday')
        self.assertEqual(res['category'], 'prepositions')
        self.assertGreaterEqual(res['confidence'], 0.85)

    def test_pronouns(self):
        res = classification_service.classify_error('me', 'I', 'me went there')
        self.assertEqual(res['category'], 'pronouns')

    def test_singular_plural(self):
        res = classification_service.classify_error('two cat', 'two cats', 'I saw two cat')
        self.assertEqual(res['category'], 'singular_plural')

    def test_capitalization(self):
        res = classification_service.classify_error('paris', 'Paris', 'I love paris')
        self.assertEqual(res['category'], 'capitalization')
        self.assertGreaterEqual(res['confidence'], 0.95)

    def test_punctuation(self):
        res = classification_service.classify_error('.', '?', 'How are you.')
        self.assertEqual(res['category'], 'punctuation')

    def test_spelling(self):
        res = classification_service.classify_error('definately', 'definitely', 'This is definately good')
        self.assertEqual(res['category'], 'spelling')
        self.assertGreaterEqual(res['confidence'], 0.85)

    def test_review_flag_for_complex_changes(self):
        orig = "The reason why is because the committee failed to notice"
        corr = "Because the committee overlooked"
        res = classification_service.classify_error(orig, corr)
        self.assertEqual(res['category'], 'sentence_structure')
        self.assertTrue(res['requires_review'])

if __name__ == '__main__':
    unittest.main()
