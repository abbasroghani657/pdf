import requests
import fitz

# Create a valid 1-page PDF
doc = fitz.open()
page = doc.new_page()
page.insert_text((50, 50), "Hello World", fontsize=12)
doc.save("valid_test.pdf")
doc.close()

files = {'file': open('valid_test.pdf', 'rb')}
data = {'mode': 'searchable', 'language': 'eng'}
response = requests.post('http://localhost:3006/ocr-pdf', files=files, data=data)
print(response.status_code)
if response.status_code != 200:
    print(response.text)
else:
    print("Success")
