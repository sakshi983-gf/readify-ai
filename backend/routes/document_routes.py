"""
Document Ingestion & PDF Extraction API Routes (Module 16).
"""
import logging
from flask import Blueprint, request, jsonify
from backend.services.document_service import document_service

logger = logging.getLogger(__name__)

document_bp = Blueprint('document', __name__)

@document_bp.route('/document/extract', methods=['POST'])
def extract_document():
    """
    Extracts clean text and page structure from an uploaded PDF, TXT, or MD file.
    Accepts multipart/form-data with 'file'.
    """
    if 'file' not in request.files:
        return jsonify({
            'success': False,
            'error': 'No file uploaded. Please upload a PDF, TXT, or MD file.'
        }), 400

    uploaded_file = request.files['file']
    if not uploaded_file or not uploaded_file.filename:
        return jsonify({
            'success': False,
            'error': 'Uploaded file is empty or missing a valid filename.'
        }), 400

    filename = uploaded_file.filename
    try:
        file_bytes = uploaded_file.read()
        if not file_bytes:
            return jsonify({
                'success': False,
                'error': 'Uploaded file is 0 bytes.'
            }), 400

        result = document_service.extract_document(file_bytes, filename)
        return jsonify({
            'success': True,
            'data': result
        }), 200

    except ValueError as ve:
        logger.warning("Document extraction validation error for %s: %s", filename, ve)
        return jsonify({
            'success': False,
            'error': str(ve)
        }), 400
    except Exception as e:
        logger.error("Unexpected error extracting document %s: %s", filename, e, exc_info=True)
        return jsonify({
            'success': False,
            'error': f"Failed to extract document text: {str(e)}"
        }), 500
