import requests

with open("test.pdf", "wb") as f:
    f.write(b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF")

files = {'file': open('test.pdf', 'rb')}
data = {'mode': 'searchable', 'language': 'eng'}
response = requests.post('http://localhost:3006/ocr-pdf', files=files, data=data)
print(response.status_code)
print(response.headers.get('content-type'))
if response.status_code != 200:
    print(response.text)
