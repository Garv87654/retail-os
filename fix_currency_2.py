import glob

files = glob.glob('frontend/src/pages/*.jsx') + glob.glob('backend/app/api/reports.py')

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
        
    original = content
    
    # Restore the rupee symbol before template literals where appropriate
    content = content.replace('value={`', 'value={`₹')
    content = content.replace('\">${', '\">₹${')
    content = content.replace(' \${', ' ₹${')
    
    # Let's not double up if they already have ₹
    content = content.replace('₹₹', '₹')
    
    if original != content:
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
        print('Fixed currency ' + f)
