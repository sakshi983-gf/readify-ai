import os
import unittest
import tempfile
from backend.app import create_app
from backend.config import Config

class TestComprehensionGroundedEndpoints(unittest.TestCase):
    def setUp(self):
        self.db_fd, self.temp_db = tempfile.mkstemp(suffix='.db')
        
        class TestConfig(Config):
            TESTING = True
            DATABASE_PATH = self.temp_db

        self.app = create_app(TestConfig)
        self.client = self.app.test_client()

    def tearDown(self):
        os.close(self.db_fd)
        if os.path.exists(self.temp_db):
            os.remove(self.temp_db)

    def test_get_comprehension_passages(self):
        res = self.client.get('/api/comprehension/passages?topic=all&difficulty=all')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        passages = data['data']['passages']
        self.assertGreaterEqual(len(passages), 2)
        
        # Check passage attributes
        p = passages[0]
        self.assertIn('id', p)
        self.assertIn('title', p)
        self.assertIn('topic', p)
        self.assertIn('difficulty', p)
        self.assertIn('text', p)
        self.assertIn('questions', p)
        self.assertGreaterEqual(len(p['questions']), 3)

    def test_submit_comprehension_with_evidence(self):
        # Fetch first passage
        res = self.client.get('/api/comprehension/passages')
        passages = res.get_json()['data']['passages']
        p = passages[0]
        q1 = p['questions'][0]

        answers = {
            q1['id']: q1.get('correct_answer') or 'B'
        }

        submit_res = self.client.post('/api/comprehension/submit', json={
            'passage_id': p['id'],
            'answers': answers
        })
        self.assertEqual(submit_res.status_code, 200)
        sub_data = submit_res.get_json()
        self.assertTrue(sub_data['success'])
        self.assertIn('score_percentage', sub_data['data'])
        self.assertIn('breakdown', sub_data['data'])
        
        # Verify passage evidence citation exists in question breakdown
        q_result = sub_data['data']['breakdown'][0]
        self.assertIn('passage_evidence', q_result)
        self.assertTrue(len(q_result['passage_evidence']) > 5)

if __name__ == '__main__':
    unittest.main()
