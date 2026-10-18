import os
import json
import unittest
import tempfile
from backend.app import create_app
from backend.config import Config

class TestAPIEndpoints(unittest.TestCase):
    def setUp(self):
        # Create temporary database file for isolated testing
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

    def test_health_check(self):
        response = self.client.get('/api/health')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['status'], 'healthy')

    def test_analyze_empty_text(self):
        response = self.client.post('/api/analyze', json={'text': ''})
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertFalse(data['success'])

    def test_analyze_valid_passage(self):
        passage = (
            "Reading comprehension is a critical skill for academic and personal success. "
            "When students read regularly, they encounter diverse vocabulary and varied sentence structures. "
            "This active engagement enhances analytical thinking and memory retention. "
            "Furthermore, consistent practice helps readers summarize complex ideas accurately. "
            "Digital learning platforms provide immediate guidance to support this growth."
        )
        response = self.client.post('/api/analyze', json={'text': passage, 'title': 'Reading Practice'})
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data['success'])
        self.assertIn('id', data['data'])
        self.assertIn('questions', data['data'])
        self.assertEqual(len(data['data']['questions']), 5)
        self.assertIn('grammar', data['data'])
        self.assertIn('readability', data['data'])

        # Test submit quiz answers on this analysis record
        history_id = data['data']['id']
        answers = {"1": "A", "2": "B", "3": "C", "4": "D", "5": "A"}
        submit_res = self.client.post('/api/submit-answers', json={
            'history_id': history_id,
            'answers': answers
        })
        self.assertEqual(submit_res.status_code, 200)
        submit_data = submit_res.get_json()
        self.assertTrue(submit_data['success'])
        self.assertIn('comprehension_score', submit_data['data'])
        self.assertIn('overall_score', submit_data['data'])
        self.assertIn('breakdown', submit_data['data'])

        # Test history retrieval
        history_res = self.client.get('/api/history')
        self.assertEqual(history_res.status_code, 200)
        history_data = history_res.get_json()
        self.assertGreaterEqual(history_data['count'], 1)

        # Test dashboard metrics
        dash_res = self.client.get('/api/dashboard')
        self.assertEqual(dash_res.status_code, 200)
        dash_data = dash_res.get_json()
        self.assertIn('overview', dash_data['data'])
        self.assertGreaterEqual(dash_data['data']['overview']['total_analyzed'], 1)

        # Test delete single record
        del_res = self.client.delete(f'/api/history/{history_id}')
        self.assertEqual(del_res.status_code, 200)

if __name__ == '__main__':
    unittest.main()
