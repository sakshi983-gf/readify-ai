"""
Intelligent Document & PDF Ingestion Service (Module 16).
Extracts and normalizes clean English text from PDF, TXT, and Markdown documents
with multi-page navigation, reading time estimation, and artifact cleanup.
"""
import io
import re
import math
import logging
from typing import Dict, Any, List, Optional
from pathlib import Path

logger = logging.getLogger(__name__)

try:
    from pypdf import PdfReader
    PYPDF_AVAILABLE = True
except ImportError:
    PYPDF_AVAILABLE = False
    logger.warning("pypdf is not installed. PDF extraction will be unavailable.")


class DocumentService:
    def __init__(self):
        self.allowed_extensions = {".pdf", ".txt", ".md", ".text"}
        self.max_file_size = 20 * 1024 * 1024  # 20MB limit

    def extract_document(self, file_bytes: bytes, filename: str) -> Dict[str, Any]:
        """
        Extracts structured text and metadata from uploaded document bytes.
        """
        ext = Path(filename).suffix.lower()
        if ext not in self.allowed_extensions:
            raise ValueError(f"Unsupported file format '{ext}'. Supported formats: PDF, TXT, MD.")

        file_size = len(file_bytes)
        if file_size > self.max_file_size:
            raise ValueError("File exceeds maximum allowable size of 20MB.")

        if ext == ".pdf":
            return self._extract_pdf(file_bytes, filename)
        else:
            return self._extract_plain_text(file_bytes, filename, ext)

    def _extract_pdf(self, file_bytes: bytes, filename: str) -> Dict[str, Any]:
        """Extracts text and per-page content from PDF documents."""
        if not PYPDF_AVAILABLE:
            raise RuntimeError("PDF extraction engine is not available. Please install 'pypdf'.")

        stream = io.BytesIO(file_bytes)
        try:
            reader = PdfReader(stream)
        except Exception as e:
            logger.error("Failed to parse PDF %s: %s", filename, e)
            raise ValueError(f"Corrupt or password-protected PDF file: {str(e)}")

        num_pages = len(reader.pages)
        if num_pages == 0:
            raise ValueError("The provided PDF contains 0 pages.")

        pages_data: List[Dict[str, Any]] = []
        raw_full_text = []

        # Extract metadata if available
        meta = reader.metadata or {}
        doc_title = getattr(meta, "title", None) or Path(filename).stem
        doc_author = getattr(meta, "author", None) or "Unknown Author"

        for page_idx, page in enumerate(reader.pages):
            try:
                page_text = page.extract_text() or ""
            except Exception as e:
                logger.warning("Error extracting page %d in %s: %s", page_idx + 1, filename, e)
                page_text = ""

            clean_page_text = self._clean_text(page_text)
            page_words = len(re.findall(r"\b\w+\b", clean_page_text))
            page_chars = len(clean_page_text)

            pages_data.append({
                "page_number": page_idx + 1,
                "text": clean_page_text,
                "word_count": page_words,
                "char_count": page_chars
            })

            if clean_page_text:
                raw_full_text.append(clean_page_text)

        full_text = "\n\n".join(raw_full_text).strip()
        total_words = len(re.findall(r"\b\w+\b", full_text))
        total_chars = len(full_text)

        if total_words == 0:
            # Scanned or image-only PDF
            raise ValueError(
                "No readable English text could be extracted from this PDF. "
                "The file may contain scanned images or rasterized pages without embedded text."
            )

        reading_time = max(1, math.ceil(total_words / 200))

        return {
            "filename": filename,
            "file_type": "PDF",
            "file_size_bytes": len(file_bytes),
            "page_count": num_pages,
            "title": str(doc_title),
            "author": str(doc_author),
            "total_words": total_words,
            "total_chars": total_chars,
            "reading_time_minutes": reading_time,
            "pages": pages_data,
            "full_text": full_text
        }

    def _extract_plain_text(self, file_bytes: bytes, filename: str, ext: str) -> Dict[str, Any]:
        """Extracts text from UTF-8 / ASCII text and Markdown files."""
        # Try UTF-8, then UTF-8 with BOM, then Latin-1
        text = ""
        for encoding in ("utf-8", "utf-8-sig", "latin-1", "cp1252"):
            try:
                text = file_bytes.decode(encoding)
                break
            except (UnicodeDecodeError, LookupError):
                continue

        if not text:
            raise ValueError("Unable to decode document text with supported encodings.")

        clean_full_text = self._clean_text(text)
        words = re.findall(r"\b\w+\b", clean_full_text)
        total_words = len(words)
        total_chars = len(clean_full_text)

        if total_words == 0:
            raise ValueError("Document appears to be empty.")

        # For text files, partition into logical pages of ~350 words each for pagination
        words_list = clean_full_text.split()
        page_size = 350
        pages_data = []

        if len(words_list) <= page_size:
            pages_data.append({
                "page_number": 1,
                "text": clean_full_text,
                "word_count": total_words,
                "char_count": total_chars
            })
        else:
            current_page = 1
            for i in range(0, len(words_list), page_size):
                chunk = " ".join(words_list[i : i + page_size])
                pages_data.append({
                    "page_number": current_page,
                    "text": chunk,
                    "word_count": len(re.findall(r"\b\w+\b", chunk)),
                    "char_count": len(chunk)
                })
                current_page += 1

        reading_time = max(1, math.ceil(total_words / 200))

        return {
            "filename": filename,
            "file_type": ext.replace(".", "").upper(),
            "file_size_bytes": len(file_bytes),
            "page_count": len(pages_data),
            "title": Path(filename).stem.replace("_", " ").title(),
            "author": "Local Document",
            "total_words": total_words,
            "total_chars": total_chars,
            "reading_time_minutes": reading_time,
            "pages": pages_data,
            "full_text": clean_full_text
        }

    def _clean_text(self, text: str) -> str:
        """
        Normalizes OCR / PDF text artifacts:
        1. De-hyphenates words broken across line endings ('in-\nteresting' -> 'interesting')
        2. Normalizes non-breaking spaces and irregular unicode whitespaces
        3. Removes redundant page headers, footers, and page-count watermarks (e.g., 'Page 1 of 2 - ...')
        4. Isolates headings so they don't concatenate into run-on sentences with paragraph text
        5. Collapses excessive newlines while preserving paragraph splits
        """
        if not text:
            return ""

        # Normalize unicode spaces
        text = text.replace("\u00a0", " ").replace("\u200b", "")

        # Join hyphenated line breaks
        text = re.sub(r"([A-Za-z0-9]+)-\s*\n\s*([A-Za-z0-9]+)", r"\1\2", text)

        # Replace carriage returns
        text = text.replace("\r\n", "\n").replace("\r", "\n")

        # Strip multi-page footers and header watermarks
        text = re.sub(
            r"(?i)^\s*(?:page\s+\d+(?:\s*(?:of|/)\s*\d+)?(?:\s*[-–—|]\s*.*)?|[-–—|]\s*\d+\s*[-–—|]?|\d+\s*[-–—|]\s*.*)\s*$",
            "",
            text,
            flags=re.MULTILINE
        )
        # Also remove inline trailing 'Page X of Y...' if at the end of a block
        text = re.sub(r"(?i)\bpage\s+\d+\s+(?:of|/)\s+\d+\s*[-–—|]?\s*.*$", "", text)

        # Normalize spaces within lines
        raw_lines = [re.sub(r"[ \t]+", " ", line).strip() for line in text.split("\n")]
        lines = [l for l in raw_lines if l]

        paragraphs = []
        current_para = []

        for idx, line in enumerate(lines):
            # Detect standalone headings/titles without terminal punctuation
            is_heading = False
            if line and line[-1] not in ".?!:;,-":
                if len(line) <= 85 and len(line.split()) <= 10:
                    if idx + 1 < len(lines) and lines[idx+1] and lines[idx+1][0].isupper():
                        is_heading = True

            if is_heading:
                if current_para:
                    paragraphs.append(" ".join(current_para))
                    current_para = []
                paragraphs.append(line + ".")
            else:
                current_para.append(line)

        if current_para:
            paragraphs.append(" ".join(current_para))

        return "\n\n".join(paragraphs).strip()


document_service = DocumentService()
