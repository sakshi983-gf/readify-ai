import os
import unittest
import tempfile
from backend.app import create_app
from backend.config import Config

class TestCoachEndpoints(unittest.TestCase):
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

    def test_coach_diagnostic_authenticated(self):
        # Login demo student
        login_res = self.client.post('/api/auth/login', json={
            'email': 'student@readify.edu',
            'password': 'DemoStudent123!'
        })
        token = login_res.get_json()['data']['token']

        res = self.client.get('/api/coach/diagnostic', headers={'Authorization': f'Bearer {token}'})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        
        diagnostic = data['data']
        self.assertIn('overall_mastery', diagnostic)
        self.assertIn('overall_status', diagnostic)
        self.assertIn('category_mastery', diagnostic)
        self.assertIn('weak_categories', diagnostic)
        self.assertIn('priority_actions', diagnostic)
        self.assertIn('topic_guides', diagnostic)

        # Check weak categories list structure
        if diagnostic['weak_categories']:
            first_weak = diagnostic['weak_categories'][0]
            self.assertIn('category', first_weak)
            self.assertIn('accuracy', first_weak)

if __name__ == '__main__':
    unittest.main()
