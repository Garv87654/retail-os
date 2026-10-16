import glob

files = glob.glob('frontend/src/pages/*.jsx') + glob.glob('backend/app/api/reports.py')

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
        
    original = content
    
    # Revert all broken template literals
    content = content.replace('₹{', '${')
    
    # But wait, now I need to put the Rupee symbol back where it belongs!
    # A true currency symbol was usually followed by a template literal, e.g. `${(item.price).toFixed(2)}`
    # In my previous script, I replaced `>` + `$` with `>₹`. That was correct for `>₹`
    # Let's fix specific currency patterns manually.
    
    if original != content:
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
        print('Fixed ' + f)
