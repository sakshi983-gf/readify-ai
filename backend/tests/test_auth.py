import os
import unittest
import tempfile
from backend.app import create_app
from backend.config import Config
from backend.database.db import get_user_by_email

class TestAuthEndpoints(unittest.TestCase):
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

    def test_demo_users_seeded(self):
        # Demo student seeded automatically on db init
        student = get_user_by_email('student@readify.edu', db_path=self.temp_db)
        self.assertIsNotNone(student)
        self.assertEqual(student['role'], 'student')

        # Demo admin seeded
        admin = get_user_by_email('admin@readify.edu', db_path=self.temp_db)
        self.assertIsNotNone(admin)
        self.assertEqual(admin['role'], 'admin')

    def test_login_demo_student_success(self):
        res = self.client.post('/api/auth/login', json={
            'email': 'student@readify.edu',
            'password': 'DemoStudent123!'
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertIn('token', data['data'])
        self.assertEqual(data['data']['user']['email'], 'student@readify.edu')

    def test_login_invalid_password(self):
        res = self.client.post('/api/auth/login', json={
            'email': 'student@readify.edu',
            'password': 'WrongPassword123!'
        })
        self.assertEqual(res.status_code, 401)
        data = res.get_json()
        self.assertFalse(data['success'])

    def test_register_new_student(self):
        res = self.client.post('/api/auth/register', json={
            'name': 'Alex Rivera',
            'email': 'alex@readify.edu',
            'password': 'StrongPassword2025!',
            'grade_level': 'College Freshman',
            'target_focus': 'Academic Writing'
        })
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertIn('token', data['data'])
        self.assertEqual(data['data']['user']['name'], 'Alex Rivera')

    def test_get_me_authenticated(self):
        login_res = self.client.post('/api/auth/login', json={
            'email': 'student@readify.edu',
            'password': 'DemoStudent123!'
        })
        token = login_res.get_json()['data']['token']

        me_res = self.client.get('/api/auth/me', headers={'Authorization': f'Bearer {token}'})
        self.assertEqual(me_res.status_code, 200)
        me_data = me_res.get_json()
        self.assertTrue(me_data['success'])
        self.assertEqual(me_data['data']['email'], 'student@readify.edu')

    def test_logout(self):
        login_res = self.client.post('/api/auth/login', json={
            'email': 'student@readify.edu',
            'password': 'DemoStudent123!'
        })
        token = login_res.get_json()['data']['token']

        logout_res = self.client.post('/api/auth/logout', headers={'Authorization': f'Bearer {token}'})
        self.assertEqual(logout_res.status_code, 200)

        # After logout, me request should be unauthenticated
        me_res = self.client.get('/api/auth/me', headers={'Authorization': f'Bearer {token}'})
        self.assertEqual(me_res.status_code, 401)

if __name__ == '__main__':
    unittest.main()
