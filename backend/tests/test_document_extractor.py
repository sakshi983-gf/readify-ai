"""
Unit tests for Intelligent Document & PDF Ingestion Service (Module 16).
"""
import io
import os
import sys
import unittest
from pathlib import Path

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.services.document_service import document_service
from backend.app import create_app
from backend.config import Config


class TestDocumentExtractor(unittest.TestCase):
    def setUp(self):
        self.app = create_app(Config)
        self.client = self.app.test_client()

    def test_extract_plain_text_file(self):
        sample_text = (
            "Artificial intelligence is transforming education worldwide. "
            "Students can now receive immediate feedback on grammar, sentence clarity, "
            "and pronunciation. This personalized approach accelerates reading mastery."
        )
        file_bytes = sample_text.encode("utf-8")
        result = document_service.extract_document(file_bytes, "reading_sample.txt")

        self.assertEqual(result["file_type"], "TXT")
        self.assertEqual(result["page_count"], 1)
        self.assertTrue(result["total_words"] > 20)
        self.assertIn("Artificial intelligence", result["full_text"])
        self.assertEqual(result["reading_time_minutes"], 1)

    def test_clean_text_dehyphenation(self):
        raw = "This is an in-\nteresting and sig-\n nificant obser-\nvation."
        cleaned = document_service._clean_text(raw)
        self.assertIn("interesting", cleaned)
        self.assertIn("significant", cleaned)
        self.assertIn("observation", cleaned)

    def test_extract_markdown_document(self):
        md_text = (
            "# Introduction to Modern Linguistics\n\n"
            "Linguistics is the scientific study of language. "
            "It encompasses the analysis of language form, language meaning, and language in context.\n\n"
            "## Phonetics and Phonology\n\n"
            "Phonetics deals with the physical production and perception of sounds."
        )
        file_bytes = md_text.encode("utf-8")
        result = document_service.extract_document(file_bytes, "linguistics.md")

        self.assertEqual(result["file_type"], "MD")
        self.assertTrue(result["total_words"] > 25)
        self.assertIn("Linguistics", result["full_text"])

    def test_extract_pdf_in_memory(self):
        # Generate an in-memory PDF with pypdf
        try:
            from pypdf import PdfWriter
            writer = PdfWriter()
            # Note: Blank page test or text page
            writer.add_blank_page(width=300, height=300)
            buf = io.BytesIO()
            writer.write(buf)
            pdf_bytes = buf.getvalue()

            # Empty blank page raises ValueError as expected for non-readable PDFs
            with self.assertRaises(ValueError):
                document_service.extract_document(pdf_bytes, "blank.pdf")
        except ImportError:
            self.skipTest("pypdf not available")

    def test_unsupported_file_extension(self):
        with self.assertRaises(ValueError):
            document_service.extract_document(b"fake data", "unsupported.exe")

    def test_extract_api_endpoint(self):
        content = b"Reading comprehension is a critical skill for academic success."
        data = {
            'file': (io.BytesIO(content), 'test_essay.txt')
        }
        res = self.client.post('/api/document/extract', data=data, content_type='multipart/form-data')
        self.assertEqual(res.status_code, 200)
        json_data = res.get_json()
        self.assertTrue(json_data['success'])
        self.assertEqual(json_data['data']['file_type'], 'TXT')
        self.assertIn('Reading comprehension', json_data['data']['full_text'])


if __name__ == "__main__":
    unittest.main()
