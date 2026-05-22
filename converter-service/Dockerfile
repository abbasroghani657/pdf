FROM python:3.11-slim

# Install system dependencies:
#   poppler-utils  → pdf2image (PDF→JPG, PDF→PPTX)
#   ghostscript    → PDF compression & repair
#   tesseract-ocr  → pytesseract OCR engine (base + English)
#   tesseract-ocr-urd → Urdu language pack
#   tesseract-ocr-ara → Arabic language pack
RUN apt-get update && apt-get install -y \
    poppler-utils \
    ghostscript \
    tesseract-ocr \
    tesseract-ocr-urd \
    tesseract-ocr-ara \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

EXPOSE 5000

CMD ["gunicorn", "--workers=4", "--timeout=300", "--bind=0.0.0.0:5000", "app:app"]
