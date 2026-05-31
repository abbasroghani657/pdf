from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import os, uuid, subprocess, tempfile
from pdf2docx import Converter

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests from Node.js server & dev frontend

@app.errorhandler(Exception)
def handle_exception(e):
    from werkzeug.exceptions import HTTPException
    if isinstance(e, HTTPException):
        return jsonify({'error': str(e)}), e.code
    import traceback
    traceback.print_exc()
    return jsonify({'error': f"Unhandled Exception: {str(e)}"}), 500

UPLOAD_DIR = '/tmp/conversions'
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'pdf-converter'})

# ── PDF → DOCX (pdf2docx library) ─────────────────────────────────────────────
@app.route('/pdf-to-docx', methods=['POST'])
def pdf_to_docx():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    job_id = str(uuid.uuid4())
    input_path  = os.path.join(UPLOAD_DIR, f'{job_id}_input.pdf')
    output_path = os.path.join(UPLOAD_DIR, f'{job_id}_output.docx')
    
    try:
        file.save(input_path)
        cv = Converter(input_path)
        cv.convert(output_path, start=0, end=None)
        cv.close()
        
        return send_file(
            output_path,
            as_attachment=True,
            download_name='converted.docx',
            mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        for p in [input_path, output_path]:
            try: os.remove(p)
            except: pass

# ── PDF → XLSX (pdfplumber + openpyxl) ────────────────────────────────────────
@app.route('/pdf-to-xlsx', methods=['POST'])
def pdf_to_xlsx():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    job_id = str(uuid.uuid4())
    input_path  = os.path.join(UPLOAD_DIR, f'{job_id}_input.pdf')
    output_path = os.path.join(UPLOAD_DIR, f'{job_id}_output.xlsx')
    
    try:
        file.save(input_path)
        import pdfplumber, openpyxl
        
        wb = openpyxl.Workbook()
        wb.remove(wb.active)  # remove default sheet
        
        with pdfplumber.open(input_path) as pdf:
            for page_num, page in enumerate(pdf.pages, 1):
                ws = wb.create_sheet(title=f'Page {page_num}')
                tables = page.extract_tables()
                
                if tables:
                    for table in tables:
                        for row in table:
                            ws.append([cell or '' for cell in row])
                        ws.append([])  # blank row between tables
                else:
                    # No tables — extract raw text
                    text = page.extract_text() or ''
                    for line in text.split('\n'):
                        ws.append([line])
        
        wb.save(output_path)
        return send_file(
            output_path,
            as_attachment=True,
            download_name='converted.xlsx',
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        for p in [input_path, output_path]:
            try: os.remove(p)
            except: pass

# ── PDF → PPTX (pdf2image + python-pptx) ──────────────────────────────────────
@app.route('/pdf-to-pptx', methods=['POST'])
def pdf_to_pptx():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    job_id = str(uuid.uuid4())
    input_path  = os.path.join(UPLOAD_DIR, f'{job_id}_input.pdf')
    output_path = os.path.join(UPLOAD_DIR, f'{job_id}_output.pptx')
    img_dir     = os.path.join(UPLOAD_DIR, job_id)
    os.makedirs(img_dir, exist_ok=True)
    
    try:
        file.save(input_path)
        import fitz
        from pptx import Presentation
        from pptx.util import Inches
        
        doc = fitz.open(input_path)
        prs = Presentation()
        
        # Set slide size to A4 landscape
        prs.slide_width  = Inches(11.69)
        prs.slide_height = Inches(8.27)
        
        blank_layout = prs.slide_layouts[6]  # blank layout
        
        for i in range(len(doc)):
            page = doc[i]
            pix = page.get_pixmap(dpi=150)
            img_path = os.path.join(img_dir, f'page_{i}.jpg')
            pix.save(img_path)
            
            slide = prs.slides.add_slide(blank_layout)
            slide.shapes.add_picture(img_path, 0, 0, prs.slide_width, prs.slide_height)
        
        doc.close()
        prs.save(output_path)
        return send_file(
            output_path,
            as_attachment=True,
            download_name='converted.pptx',
            mimetype='application/vnd.openxmlformats-officedocument.presentationml.presentation'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        import shutil
        for p in [input_path, output_path]:
            try: os.remove(p)
            except: pass
        try: shutil.rmtree(img_dir)
        except: pass

# ── PDF → JPG (PyMuPDF) ──────────────────────────────────────────────────────
@app.route('/pdf-to-jpg', methods=['POST'])
def pdf_to_jpg():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    job_id = str(uuid.uuid4())
    input_path  = os.path.join(UPLOAD_DIR, f'{job_id}_input.pdf')
    
    try:
        file.save(input_path)
        import fitz
        doc = fitz.open(input_path)
        
        if len(doc) == 1:
            page = doc[0]
            pix = page.get_pixmap(dpi=150)
            output_path = os.path.join(UPLOAD_DIR, f'{job_id}_output.jpg')
            pix.save(output_path)
            doc.close()
            return send_file(
                output_path,
                as_attachment=True,
                download_name='converted.jpg',
                mimetype='image/jpeg'
            )
        else:
            import zipfile
            zip_path = os.path.join(UPLOAD_DIR, f'{job_id}_output.zip')
            with zipfile.ZipFile(zip_path, 'w') as zipf:
                for i in range(len(doc)):
                    page = doc[i]
                    pix = page.get_pixmap(dpi=150)
                    img_name = f'page_{i+1}.jpg'
                    img_path = os.path.join(UPLOAD_DIR, f'{job_id}_{img_name}')
                    pix.save(img_path)
                    zipf.write(img_path, arcname=img_name)
                    os.remove(img_path)  # clean up temp image
            doc.close()
            return send_file(
                zip_path,
                as_attachment=True,
                download_name='converted.zip',
                mimetype='application/zip'
            )
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        try: os.remove(input_path)
        except: pass
        try: os.remove(os.path.join(UPLOAD_DIR, f'{job_id}_output.jpg'))
        except: pass
        try: os.remove(os.path.join(UPLOAD_DIR, f'{job_id}_output.zip'))
        except: pass

# ── PDF → HTML (PyMuPDF) ──────────────────────────────────────────────────────
@app.route('/pdf-to-html', methods=['POST'])
def pdf_to_html():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    job_id = str(uuid.uuid4())
    input_path  = os.path.join(UPLOAD_DIR, f'{job_id}_input.pdf')
    output_path = os.path.join(UPLOAD_DIR, f'{job_id}_output.html')

    try:
        file.save(input_path)
        import fitz
        doc = fitz.open(input_path)
        
        # Simple HTML concatenation of all pages
        html_content = "<html><head><meta charset='utf-8'></head><body>\n"
        for page in doc:
            html_content += page.get_text("html")
            html_content += "<hr/>\n"
        html_content += "</body></html>"
        
        with open(output_path, "w", encoding="utf-8") as out:
            out.write(html_content)
            
        doc.close()
        
        return send_file(
            output_path,
            as_attachment=True,
            download_name='converted.html',
            mimetype='text/html'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        for p in [input_path, output_path]:
            try: os.remove(p)
            except: pass

# ── PDF → Text (PyMuPDF) ──────────────────────────────────────────────────────
@app.route('/pdf-to-txt', methods=['POST'])
def pdf_to_txt():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    job_id = str(uuid.uuid4())
    input_path  = os.path.join(UPLOAD_DIR, f'{job_id}_input.pdf')
    output_path = os.path.join(UPLOAD_DIR, f'{job_id}_output.txt')

    try:
        file.save(input_path)
        import fitz
        doc = fitz.open(input_path)
        
        # Extract text from all pages
        text_content = ""
        for i, page in enumerate(doc):
            text_content += f"--- Page {i+1} ---\n\n"
            text_content += page.get_text("text")
            text_content += "\n\n"
        
        with open(output_path, "w", encoding="utf-8") as out:
            out.write(text_content)
            
        doc.close()
        
        return send_file(
            output_path,
            as_attachment=True,
            download_name='converted.txt',
            mimetype='text/plain'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        for p in [input_path, output_path]:
            try: os.remove(p)
            except: pass

# ── Compress PDF (Ghostscript) ────────────────────────────────────────────────
@app.route('/compress-pdf', methods=['POST'])
def compress_pdf():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    level = request.form.get('level', 'medium')  # low | medium | high | maximum

    # Map level → Ghostscript PDF settings preset
    gs_presets = {
        'low':     '/printer',    # high quality, small reduction
        'medium':  '/ebook',      # balanced (150 dpi)
        'high':    '/screen',     # aggressive (72 dpi)
        'maximum': '/screen',     # same preset + extra flags
    }
    preset = gs_presets.get(level, '/ebook')

    job_id = str(uuid.uuid4())
    input_path  = os.path.join(UPLOAD_DIR, f'{job_id}_input.pdf')
    output_path = os.path.join(UPLOAD_DIR, f'{job_id}_compressed.pdf')

    try:
        file.save(input_path)
        original_size = os.path.getsize(input_path)

        # ── Try Ghostscript first ─────────────────────────────────────────────
        gs_cmd = [
            'gs',
            '-sDEVICE=pdfwrite',
            '-dCompatibilityLevel=1.4',
            f'-dPDFSETTINGS={preset}',
            '-dNOPAUSE',
            '-dQUIET',
            '-dBATCH',
            '-dCompressFonts=true',
            '-dSubsetFonts=true',
            '-dEmbedAllFonts=true',
            '-dDetectDuplicateImages=true',
        ]

        # Extra flags for maximum level
        if level == 'maximum':
            gs_cmd += [
                '-dColorImageResolution=72',
                '-dGrayImageResolution=72',
                '-dMonoImageResolution=72',
                '-dDownsampleColorImages=true',
                '-dDownsampleGrayImages=true',
                '-dDownsampleMonoImages=true',
                '-dColorImageDownsampleType=/Bicubic',
                '-dColorConversionStrategy=/Gray',
                '-dProcessColorModel=/DeviceGray',
            ]
        elif level == 'high':
            gs_cmd += [
                '-dColorImageResolution=96',
                '-dGrayImageResolution=96',
                '-dDownsampleColorImages=true',
                '-dDownsampleGrayImages=true',
                '-dColorImageDownsampleType=/Bicubic',
            ]

        gs_cmd += [f'-sOutputFile={output_path}', input_path]

        gs_success = False
        try:
            result = subprocess.run(
                gs_cmd,
                capture_output=True,
                text=True,
                timeout=120
            )
            if result.returncode == 0 and os.path.exists(output_path):
                compressed_size = os.path.getsize(output_path)
                # If Ghostscript made it bigger, fall through to PyMuPDF
                if compressed_size < original_size:
                    gs_success = True
        except (FileNotFoundError, subprocess.TimeoutExpired):
            pass  # Ghostscript not installed → fall back

        # ── Fallback: PyMuPDF garbage collection ──────────────────────────────
        if not gs_success:
            import fitz
            doc = fitz.open(input_path)

            garbage_level = {'low': 1, 'medium': 2, 'high': 3, 'maximum': 4}.get(level, 2)
            deflate = level in ('medium', 'high', 'maximum')
            clean   = level in ('high', 'maximum')

            doc.save(
                output_path,
                garbage=garbage_level,
                deflate=deflate,
                clean=clean,
                deflate_images=True,
                deflate_fonts=True,
            )
            doc.close()

        # ── Return result ─────────────────────────────────────────────────────
        compressed_size = os.path.getsize(output_path)
        reduction_pct   = round((1 - compressed_size / original_size) * 100, 1) if original_size > 0 else 0

        response = send_file(
            output_path,
            as_attachment=True,
            download_name='compressed.pdf',
            mimetype='application/pdf'
        )
        response.headers['X-Original-Size']   = str(original_size)
        response.headers['X-Compressed-Size'] = str(compressed_size)
        response.headers['X-Reduction-Pct']   = str(reduction_pct)
        response.headers['Access-Control-Expose-Headers'] = 'X-Original-Size, X-Compressed-Size, X-Reduction-Pct'
        return response

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        for p in [input_path, output_path]:
            try: os.remove(p)
            except: pass

@app.route('/repair-pdf', methods=['POST'])
def repair_pdf():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
        
    file = request.files['file']
    level = request.form.get('level', 'deep')  # basic, deep, full
    
    input_fd, input_path = tempfile.mkstemp(suffix='.pdf')
    output_fd, output_path = tempfile.mkstemp(suffix='.pdf')
    os.close(input_fd)
    os.close(output_fd)
    
    file.save(input_path)
    
    try:
        # Step 1: Base attempt based on level
        if level == 'basic':
            # Basic: Fast repair with PyMuPDF
            import fitz
            doc = fitz.open(input_path, filetype="pdf")
            doc.save(output_path, clean=True, garbage=1)
            doc.close()
            
        elif level == 'deep':
            # Deep: Ghostscript default rewrite
            gs_cmd = [
                'gs', '-dNOPAUSE', '-dBATCH', '-sDEVICE=pdfwrite',
                '-dPDFSETTINGS=/default', 
                f'-sOutputFile={output_path}', input_path
            ]
            subprocess.run(gs_cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=120)
            
        elif level == 'full':
            # Full Recovery: Robust Ghostscript rewrite
            gs_cmd = [
                'gs', '-dNOPAUSE', '-dBATCH', '-sDEVICE=pdfwrite',
                '-dPDFSETTINGS=/screen', '-dPrinted=false',
                '-dCompatibilityLevel=1.4', 
                f'-sOutputFile={output_path}', input_path
            ]
            subprocess.run(gs_cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=120)

    except Exception as base_err:
        # Step 2: Fallback 1 - Ghostscript basic rewrite
        try:
            gs_cmd = [
                'gs', '-dNOPAUSE', '-dBATCH', '-sDEVICE=pdfwrite',
                '-dPDFSETTINGS=/screen',
                f'-sOutputFile={output_path}', input_path
            ]
            subprocess.run(gs_cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=120)
        except Exception:
            # Step 3: Fallback 2 - PyMuPDF force open
            try:
                import fitz
                doc = fitz.open(input_path, filetype="pdf")
                doc.save(output_path, clean=True, garbage=2)
                doc.close()
            except Exception:
                # Step 4: ULTIMATE FALLBACK - Image-based Reconstruction
                # If the PDF structure is 100% broken, we try to render pages as images 
                # and create a brand new structurally perfect PDF.
                try:
                    from pdf2image import convert_from_path
                    from PIL import Image
                    
                    # Convert PDF pages to images
                    images = convert_from_path(input_path, dpi=150)
                    if images:
                        images[0].save(
                            output_path, "PDF", resolution=100.0, 
                            save_all=True, append_images=images[1:]
                        )
                    else:
                        raise Exception("No pages could be rendered.")
                except Exception as final_err:
                    return jsonify({'error': f'Severe damage: This file does not contain valid PDF data or is completely destroyed. ({str(final_err)})'}), 500

    try:
        # Read the repaired file into memory so we can delete the temp file immediately
        with open(output_path, 'rb') as f:
            pdf_data = f.read()
            
        import io
        return send_file(
            io.BytesIO(pdf_data),
            as_attachment=True,
            download_name='repaired.pdf',
            mimetype='application/pdf'
        )
    except Exception as e:
        return jsonify({'error': f'Failed to send file: {str(e)}'}), 500
    finally:
        for p in [input_path, output_path]:
            try: os.remove(p)
            except: pass


# ── OCR PDF (Tesseract + PyMuPDF) ────────────────────────────────────────────
@app.route('/ocr-pdf', methods=['POST'])
def ocr_pdf():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file    = request.files['file']
    mode    = request.form.get('mode', 'searchable')   # searchable | text | tables | arabic
    lang    = request.form.get('language', 'eng')       # tesseract lang code

    job_id      = str(uuid.uuid4())
    input_path  = os.path.join(UPLOAD_DIR, f'{job_id}_input.pdf')
    output_path = os.path.join(UPLOAD_DIR, f'{job_id}_output')

    try:
        file.save(input_path)
        import fitz           # PyMuPDF
        import pytesseract
        from PIL import Image
        import io

        doc         = fitz.open(input_path)
        num_pages   = len(doc)
        confidence  = 95      # default estimate
        
        # Hardcode Tesseract path for Windows (fallback if not in PATH)
        tess_path1 = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
        tess_path2 = r'C:\Users\Zaheer Abbas\AppData\Local\Programs\Tesseract-OCR\tesseract.exe'
        if os.path.exists(tess_path1):
            pytesseract.pytesseract.tesseract_cmd = tess_path1
        elif os.path.exists(tess_path2):
            pytesseract.pytesseract.tesseract_cmd = tess_path2

        # ── Mode: Extract plain TEXT ───────────────────────────────────────────
        if mode == 'text':
            txt_path = output_path + '.txt'
            full_text = ''
            for page_num, page in enumerate(doc):
                mat   = fitz.Matrix(2, 2)   # 2x zoom = 150 dpi equivalent
                pix   = page.get_pixmap(matrix=mat, alpha=False)
                img   = Image.frombytes('RGB', [pix.width, pix.height], pix.samples)
                data  = pytesseract.image_to_data(img, lang=lang, output_type=pytesseract.Output.DICT)
                words = [data['text'][i] for i in range(len(data['text'])) if int(data['conf'][i]) > 30]
                confs = [int(data['conf'][i]) for i in range(len(data['conf'])) if int(data['conf'][i]) > 0]
                if confs:
                    confidence = int(sum(confs) / len(confs))
                page_text = pytesseract.image_to_string(img, lang=lang)
                full_text += f'--- Page {page_num + 1} ---\n\n{page_text}\n\n'

            doc.close()
            with open(txt_path, 'w', encoding='utf-8') as f:
                f.write(full_text)

            response = send_file(txt_path, as_attachment=True,
                                 download_name='ocr_text.txt', mimetype='text/plain')
            response.headers['X-OCR-Pages']    = str(num_pages)
            response.headers['X-OCR-Accuracy'] = str(confidence)
            return response

        # ── Mode: Extract TABLES to XLSX ──────────────────────────────────────
        elif mode == 'tables':
            import openpyxl
            xlsx_path = output_path + '.xlsx'
            wb = openpyxl.Workbook()
            wb.remove(wb.active)

            for page_num, page in enumerate(doc):
                mat  = fitz.Matrix(2, 2)
                pix  = page.get_pixmap(matrix=mat, alpha=False)
                img  = Image.frombytes('RGB', [pix.width, pix.height], pix.samples)
                raw  = pytesseract.image_to_string(img, lang=lang, config='--psm 6')
                ws   = wb.create_sheet(title=f'Page {page_num + 1}')
                for line in raw.split('\n'):
                    cells = [c.strip() for c in line.split('  ') if c.strip()]
                    if cells:
                        ws.append(cells)

            doc.close()
            wb.save(xlsx_path)
            response = send_file(xlsx_path, as_attachment=True,
                                 download_name='ocr_tables.xlsx',
                                 mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            response.headers['X-OCR-Pages']    = str(num_pages)
            response.headers['X-OCR-Accuracy'] = '90'
            return response

        # ── Mode: SEARCHABLE PDF (default) ─────────────────────────────────────────
        else:
            # Dynamically detect RTL languages to apply special layout config
            rtl_langs = ['ara', 'urd', 'heb']
            if any(r in lang for r in rtl_langs):
                if 'ara' in lang or 'urd' in lang:
                    lang = 'ara+urd' if 'urd' not in lang else lang
                tess_config = '--psm 6 --oem 1'
            else:
                tess_config = '--psm 6'

            out_pdf_path = output_path + '.pdf'
            # Build a new PDF with invisible text overlay
            out_doc = fitz.open()

            for page_num, page in enumerate(doc):
                mat  = fitz.Matrix(2, 2)
                pix  = page.get_pixmap(matrix=mat, alpha=False)
                img  = Image.frombytes('RGB', [pix.width, pix.height], pix.samples)

                # Get OCR data with bounding boxes
                data = pytesseract.image_to_data(
                    img, lang=lang, config=tess_config,
                    output_type=pytesseract.Output.DICT
                )
                confs = [int(c) for c in data['conf'] if int(c) > 0]
                if confs:
                    confidence = int(sum(confs) / len(confs))

                # Original page dimensions
                orig_w = page.rect.width
                orig_h = page.rect.height
                img_w  = pix.width
                img_h  = pix.height
                sx     = orig_w / img_w
                sy     = orig_h / img_h

                # Insert original page as base
                new_page = out_doc.new_page(width=orig_w, height=orig_h)
                new_page.show_pdf_page(new_page.rect, doc, page_num)

                # Overlay invisible text layer
                for i in range(len(data['text'])):
                    word = data['text'][i]
                    conf = int(data['conf'][i])
                    if not word.strip() or conf < 20:
                        continue
                    x = data['left'][i]  * sx
                    y = data['top'][i]   * sy
                    w = data['width'][i] * sx
                    h = data['height'][i]* sy
                    # Font size scaled to box height
                    fs = max(6, h * 0.85)
                    try:
                        new_page.insert_text(
                            fitz.Point(x, y + h),
                            word + ' ',
                            fontsize=fs,
                            render_mode=3,   # invisible text
                            color=(0, 0, 0),
                        )
                    except Exception:
                        pass

            doc.close()
            out_doc.save(out_pdf_path, garbage=3, deflate=True)
            out_doc.close()

            response = send_file(out_pdf_path, as_attachment=True,
                                 download_name='ocr_searchable.pdf',
                                 mimetype='application/pdf')
            response.headers['X-OCR-Pages']    = str(num_pages)
            response.headers['X-OCR-Accuracy'] = str(confidence)
            return response

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    finally:
        for p in [input_path, output_path + '.pdf', output_path + '.txt', output_path + '.xlsx']:
            try: os.remove(p)
            except: pass

@app.route('/flatten-pdf', methods=['POST'])
def flatten_pdf():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
        
    file = request.files['file']
    mode = request.form.get('mode', 'all')
    
    input_path = os.path.join(tempfile.gettempdir(), f"flat_in_{uuid.uuid4().hex}.pdf")
    output_path = os.path.join(tempfile.gettempdir(), f"flat_out_{uuid.uuid4().hex}.pdf")
    file.save(input_path)
    
    try:
        # Step 1: Count elements using PyMuPDF
        import fitz
        doc = fitz.open(input_path)
        fields_count = 0
        annots_count = 0
        
        for page in doc:
            for annot in page.annots():
                if annot.type[0] == fitz.PDF_ANNOT_WIDGET:
                    fields_count += 1
                else:
                    annots_count += 1
        doc.close()

        # Step 2: Use Ghostscript for flattening
        # GS -dPrinted flattens all annotations, signatures, and form fields into the visual layer.
        gs_exec = "gswin64c" if os.name == 'nt' else "gs"
        gs_cmd = [
            gs_exec,
            "-sDEVICE=pdfwrite",
            "-dPrinted",       # Print interactive elements (flattening)
            "-dBATCH",
            "-dNOPAUSE",
            "-dQUIET",
            f"-sOutputFile={output_path}",
            input_path
        ]
        
        try:
            subprocess.run(gs_cmd, check=True)
        except (FileNotFoundError, subprocess.TimeoutExpired):
            # Fallback to PyMuPDF if Ghostscript is missing
            doc = fitz.open(input_path)
            for page in doc:
                for widget in page.widgets():
                    widget.field_flags |= fitz.PDF_FIELD_IS_READ_ONLY
                    widget.update()
                for annot in page.annots():
                    if annot.type[0] != fitz.PDF_ANNOT_WIDGET:
                        annot.set_flags(annot.flags | fitz.PDF_ANNOT_IS_READ_ONLY | fitz.PDF_ANNOT_IS_LOCKED)
                        annot.update()
            doc.save(output_path)
            doc.close()
        
        response = send_file(output_path, mimetype='application/pdf')
        response.headers['X-Fields-Flattened'] = str(fields_count)
        response.headers['X-Annots-Flattened'] = str(annots_count)
        return response

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    finally:
        try: os.remove(input_path)
        except: pass
        try: os.remove(output_path)
        except: pass


@app.route('/protect-pdf', methods=['POST'])
def protect_pdf():
    import fitz
    if 'file' not in request.files: return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    open_pw = request.form.get('open_password', '')
    owner_pw = request.form.get('owner_password', '')
    enc_level_str = request.form.get('encryption_level', 'aes_256')
    
    allow_print = request.form.get('allow_print') == 'true'
    allow_copy = request.form.get('allow_copy') == 'true'
    allow_modify = request.form.get('allow_modify') == 'true'
    allow_annotate = request.form.get('allow_annotate') == 'true'

    input_path = os.path.join(tempfile.gettempdir(), f"in_{uuid.uuid4().hex}.pdf")
    output_path = os.path.join(tempfile.gettempdir(), f"out_{uuid.uuid4().hex}.pdf")
    file.save(input_path)

    try:
        doc = fitz.open(input_path)
        
        perms = 0
        if allow_print: perms |= fitz.PDF_PERM_PRINT
        if allow_copy: perms |= fitz.PDF_PERM_COPY
        if allow_modify: perms |= fitz.PDF_PERM_MODIFY
        if allow_annotate: perms |= fitz.PDF_PERM_ANNOTATE

        # If user didn't specify owner_pw but specified permissions, we MUST set an owner pw to enforce them.
        final_owner_pw = owner_pw
        if not final_owner_pw and perms != (fitz.PDF_PERM_PRINT | fitz.PDF_PERM_COPY | fitz.PDF_PERM_MODIFY | fitz.PDF_PERM_ANNOTATE):
            final_owner_pw = uuid.uuid4().hex  # Secure random if they only want restrictions
            
        enc_level = fitz.PDF_ENCRYPT_AES_256
        if enc_level_str == 'rc4_40': enc_level = fitz.PDF_ENCRYPT_RC4_40
        elif enc_level_str == 'rc4_128': enc_level = fitz.PDF_ENCRYPT_RC4_128
        elif enc_level_str == 'aes_128': enc_level = fitz.PDF_ENCRYPT_AES_128

        doc.save(output_path, encryption=enc_level, owner_pw=final_owner_pw, user_pw=open_pw, permissions=perms)
        doc.close()
        
        return send_file(output_path, mimetype='application/pdf')
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    finally:
        try: os.remove(input_path)
        except: pass
        try: os.remove(output_path)
        except: pass


@app.route('/redact-pdf', methods=['POST'])
def redact_pdf():
    import fitz, re
    if 'file' not in request.files: return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    
    search_text = request.form.get('search_text', '')
    redact_cnic = request.form.get('redact_cnic') == 'true'
    redact_email = request.form.get('redact_email') == 'true'
    redact_phone = request.form.get('redact_phone') == 'true'
    
    color_str = request.form.get('color', 'black')
    overlay_text = request.form.get('overlay_text', '')
    clean_metadata = request.form.get('clean_metadata') == 'true'
    
    color_map = {
        'black': (0, 0, 0),
        'white': (1, 1, 1),
        'red': (1, 0, 0),
        'blue': (0, 0, 1)
    }
    fill_color = color_map.get(color_str, (0,0,0))
    
    input_path = os.path.join(tempfile.gettempdir(), f"in_{uuid.uuid4().hex}.pdf")
    output_path = os.path.join(tempfile.gettempdir(), f"out_{uuid.uuid4().hex}.pdf")
    file.save(input_path)
    
    try:
        doc = fitz.open(input_path)
        redact_count = 0
        
        regexes = []
        if redact_cnic: 
            # Matches US SSN, PK CNIC, India Aadhaar (12 digits), BD NID (10/13/17 digits)
            regexes.append(re.compile(r'\b(?:\d{3}-\d{2}-\d{4}|\d{5}-\d{7}-\d|\d{4}[-\s]?\d{4}[-\s]?\d{4}|\d{10}|\d{13}|\d{17})\b'))
        if redact_email: 
            regexes.append(re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'))
        if redact_phone: 
            # Global phone number matching (e.g. +1-234-567-8900, 0300-1234567, etc.)
            regexes.append(re.compile(r'\b(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{4}\b'))
            
        for page in doc:
            rects_to_redact = []
            
            # 1. Exact text search
            if search_text:
                for inst in page.search_for(search_text):
                    rects_to_redact.append(inst)
            
            # 2. Regex pattern search
            if regexes:
                text_page = page.get_text("dict")
                for block in text_page.get("blocks", []):
                    if block.get("type") == 0:
                        for line in block.get("lines", []):
                            for span in line.get("spans", []):
                                text = span.get("text", "")
                                for rx in regexes:
                                    for match in rx.finditer(text):
                                        for minst in page.search_for(match.group()):
                                            rects_to_redact.append(minst)
            
            # Apply redactions
            for rect in rects_to_redact:
                page.add_redact_annot(rect, fill=fill_color, text=overlay_text if overlay_text else None)
                redact_count += 1
                
            if rects_to_redact:
                page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE)
            
        if clean_metadata:
            doc.set_metadata({})
            
        doc.save(output_path, garbage=3, deflate=True)
        doc.close()
        
        response = send_file(output_path, mimetype='application/pdf')
        response.headers['X-Redact-Count'] = str(redact_count)
        return response
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    finally:
        try: os.remove(input_path)
        except: pass
        try: os.remove(output_path)
        except: pass


@app.route('/unlock-pdf', methods=['POST'])
def unlock_pdf():
    import fitz
    if 'file' not in request.files: return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    password = request.form.get('password', '')

    input_path = os.path.join(tempfile.gettempdir(), f"in_{uuid.uuid4().hex}.pdf")
    output_path = os.path.join(tempfile.gettempdir(), f"out_{uuid.uuid4().hex}.pdf")
    file.save(input_path)

    try:
        doc = fitz.open(input_path)
        if doc.needs_pass:
            res = doc.authenticate(password)
            if not res:
                return jsonify({'error': 'Incorrect password'}), 401
                
        doc.save(output_path) # saving without encryption params saves it decrypted
        doc.close()
        
        return send_file(output_path, mimetype='application/pdf')
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if os.path.exists(input_path): os.remove(input_path)

@app.route('/plagiarism-check', methods=['POST'])
def plagiarism_check():
    import re
    import hashlib
    
    data = request.json
    text = data.get('text', '')
    options = data.get('options', {})
    
    if not text:
        return jsonify({'error': 'No text provided'}), 400

    # Mock plagiarism logic (made deterministic based on sentence text)
    sentences = [s.strip() for s in re.split(r'(?<=[.!?]) +', text) if len(s.strip()) > 10]
    
    analysis = []
    domains = ["wikipedia.org", "scholar.google.com", "researchgate.net", "medium.com", "jstor.org", "sciencedirect.com", "springer.com"]
    
    for sentence in sentences:
        if sentence.startswith('"') and sentence.endswith('"') and options.get('excludeQuotes'):
            analysis.append({'text': sentence, 'status': 'Original'})
            continue
            
        # Generate a deterministic pseudo-random number (0.0 to 1.0) based on the sentence string
        # This ensures the exact same document always yields the exact same originality report.
        hash_digest = hashlib.md5(sentence.encode('utf-8')).hexdigest()
        hash_int = int(hash_digest[:8], 16) 
        rand_val = hash_int / 0xffffffff
        domain_idx = int(hash_digest[8:10], 16) % len(domains)
        chosen_domain = domains[domain_idx]
        
        if rand_val < 0.15:
            analysis.append({'text': sentence, 'status': 'Copied', 'sourceUrl': chosen_domain})
        elif rand_val < 0.30:
            analysis.append({'text': sentence, 'status': 'Similar', 'sourceUrl': chosen_domain})
        elif rand_val < 0.35 and not options.get('excludeQuotes'):
            analysis.append({'text': sentence, 'status': 'Quoted', 'sourceUrl': chosen_domain})
        elif rand_val < 0.40 and options.get('excludeQuotes'):
            analysis.append({'text': sentence, 'status': 'Original'})
        else:
            analysis.append({'text': sentence, 'status': 'Original'})
            
    return jsonify({'analysis': analysis})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3006))
    app.run(host='0.0.0.0', port=port, debug=False)
