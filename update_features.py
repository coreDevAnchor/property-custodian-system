"""Update Property_Custodian_System_Documentation.docx
Combines all new content into single block inserts to avoid index drift.
"""
import sys
import io
import shutil
from docx import Document

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

docx_backup = r'D:\coredev\property-custodian-system\Property_Custodian_System_Documentation_backup.docx'
docx_new = r'D:\coredev\property-custodian-system\Property_Custodian_System_Documentation_updated.docx'
doc = Document(docx_backup)


def find_para(search_text, style_name=None, start=0):
    for i, p in enumerate(doc.paragraphs):
        if i < start:
            continue
        if search_text in p.text:
            if style_name is None or p.style.name == style_name:
                return i
    return None


def insert_after(idx, text, style_name='Normal', bold=False):
    new_para = doc.add_paragraph(text)
    if style_name:
        new_para.style = doc.styles[style_name]
    if bold:
        for run in new_para.runs:
            run.bold = True
    body = doc.element.body
    body.remove(new_para._element)
    ref = doc.paragraphs[idx]
    ref._element.addprevious(new_para._element)
    return new_para


# ─── Step 1: Key Features bullets ─────────────────────────────────────────
print("1. Adding Key Features bullets...")
idx = find_para('Profile photo upload', 'List Bullet')
if idx is None:
    print("  ERROR: Could not find bullet")
else:
    # Insert before "Profile photo upload" (after the one before it)
    # Original order: ...Dark mode(54), Two-factor auth(55), Profile photo(56)
    # We want: ...Dark mode, Two-factor auth, Owner, Unit, Inline, Excel, Profile photo
    insert_after(idx - 1, 'Owner assignment \u2014 assign assets to specific employees', 'List Bullet')
    insert_after(idx - 1, 'Single and multi-unit asset categories with amount tracking', 'List Bullet')
    insert_after(idx - 1, 'Inline category and asset type creation from the Add Asset dialog', 'List Bullet')
    insert_after(idx - 1, 'Excel/CSV import for bulk asset creation from spreadsheet', 'List Bullet')
    print("  Inserted 4 bullets")


# ─── Step 2: ALL new content in section 3.2 (single block) ───────────────
print("2. Adding all section 3.2 content in one block...")
idx = find_para('The asset is created with status "Available" and logged in the audit trail.')
if idx is None:
    print("  ERROR: Could not find insertion point")
else:
    # ALL content inserted at once, in order, using append approach
    # We append all paragraphs to the end, then move them as a group
    from docx.oxml.ns import qn
    from lxml import etree

    new_paragraphs_data = [
        # Owner Assignment
        ('Owner Assignment', 'Heading 3', False),
        ('Each asset can be assigned to an employee as its owner. This tracks who is responsible for the asset.', 'Normal', False),
        ('', 'Normal', False),
        ('1. In the Add/Edit Asset dialog, use the Owner dropdown to search for an employee.', 'Normal', False),
        ('2. Type the employee name to filter the list. Each entry shows the employee name, ID, and department.', 'Normal', False),
        ('3. Select the employee to assign them as owner.', 'Normal', False),
        ('4. Leave the field empty to assign the asset to coreDev (the default owner).', 'Normal', False),
        ('', 'Normal', False),
        ('The owner name appears in the asset table. If no owner is assigned, it displays "coreDev".', 'Normal', False),
        # Single/Multi Unit
        ('Single and Multi-Unit Assets', 'Heading 3', False),
        ('Asset categories can be configured as single-unit or multi-unit:', 'Normal', False),
        ('', 'Normal', False),
        ('Single-Unit (default) \u2014 Each asset is one individual item (e.g., a laptop, a chair). The Amount column shows a dash.', 'Normal', False),
        ('Multi-Unit \u2014 A category represents items tracked by quantity (e.g., cables, pens). The Amount field is visible when adding or editing assets in these categories, and the asset table displays the quantity.', 'Normal', False),
        ('', 'Normal', False),
        ('The unit type is set on the category. When creating a new category during Excel import, it defaults to single-unit.', 'Normal', False),
        # Inline Category/Asset Type Creation
        ('Inline Category and Asset Type Creation', 'Heading 3', False),
        ('When adding a new asset, you can create new categories and asset types directly from the dialog without leaving the form.', 'Normal', False),
        ('', 'Normal', False),
        ('1. In the Add Asset dialog, click "Add New Category" below the Category dropdown.', 'Normal', False),
        ('2. Enter the category name and select the unit type (Single or Multi).', 'Normal', False),
        ('3. The new category is created and automatically selected.', 'Normal', False),
        ('4. Similarly, click "Add New Asset Type" below the Asset Type dropdown to create a new type within the selected category.', 'Normal', False),
        ('5. Both new categories and asset types are assigned auto-generated prefixes based on their names.', 'Normal', False),
        # Excel/CSV Import
        ('Importing Assets from Excel/CSV', 'Heading 3', False),
        ('You can bulk-import assets from a spreadsheet instead of creating them one by one.', 'Normal', False),
        ('', 'Normal', False),
        ('Downloading the Template', 'Heading 4', False),
        ('1. Click the "Import" button on the Assets page.', 'Normal', False),
        ('2. In the Import dialog, click "Download XLSX" or "Download CSV" to get the template.', 'Normal', False),
        ('3. The template contains a header row with the required column names. Do not rename the headers.', 'Normal', False),
        ('', 'Normal', False),
        ('Template Columns', 'Heading 4', False),
        ('The import spreadsheet accepts the following columns:', 'Normal', False),
        ('', 'Normal', False),
        ('Name (required) \u2014 Descriptive name for the asset (e.g., "Dell Latitude 5540").', 'Normal', False),
        ('Asset-Tag \u2014 Present in the template header but ignored during import. Tags are auto-generated.', 'Normal', False),
        ('Category (required) \u2014 Category name. If it does not exist, a new category is created automatically.', 'Normal', False),
        ('Asset Type (required) \u2014 Asset type name within the category. Also auto-created if new.', 'Normal', False),
        ('Acquisition Cost (required) \u2014 Purchase price. Must be a number greater than or equal to 0.', 'Normal', False),
        ('Total Depreciation (required) \u2014 Total depreciation amount. Must be numeric and cannot exceed the acquisition cost.', 'Normal', False),
        ('Amount (optional) \u2014 Number of units. Must be a whole number >= 1. Defaults to 1.', 'Normal', False),
        ('Owner (optional) \u2014 Employee name (must match an active employee exactly). If blank, asset is owned by coreDev.', 'Normal', False),
        ('', 'Normal', False),
        ('Importing the File', 'Heading 4', False),
        ('1. Fill in the spreadsheet with your asset data.', 'Normal', False),
        ('2. In the Import dialog, click "Choose File" and select your XLSX or CSV file (max 5 MB).', 'Normal', False),
        ('3. Click "Import" to upload.', 'Normal', False),
        ('4. The system validates every row. If any row has errors, the entire import is rejected \u2014 nothing is saved.', 'Normal', False),
        ('5. On success, all assets are created with status "Available", condition "Excellent", and today\'s acquisition date.', 'Normal', False),
        ('6. Each imported asset receives an auto-generated asset tag and is logged in the audit trail.', 'Normal', False),
        ('', 'Normal', False),
        ('Validation Rules', 'Heading 4', False),
        ('The following rules are checked for each row:', 'Normal', False),
        ('', 'Normal', False),
        ('Name: Required, max 255 characters.', 'Normal', False),
        ('Category: Required, matched case-insensitively. Auto-created if not found (defaults to single-unit).', 'Normal', False),
        ('Asset Type: Required, matched within the category. Auto-created if not found.', 'Normal', False),
        ('Acquisition Cost: Must be numeric, >= 0.', 'Normal', False),
        ('Total Depreciation: Must be numeric, >= 0, cannot exceed acquisition cost.', 'Normal', False),
        ('Amount: If provided, must be a whole number >= 1.', 'Normal', False),
        ('Owner: If provided, must match an active employee name exactly (case-insensitive).', 'Normal', False),
        ('', 'Normal', False),
        ('Header validation: Column names are normalized (whitespace, hyphens, underscores removed). Missing required columns or unexpected columns cause rejection.', 'Normal', False),
        # Improved Asset View Dialog
        ('', 'Normal', False),
        ('Improved Asset View Dialog', 'Heading 3', False),
        ('Clicking the view (eye) icon opens an enhanced dialog showing:', 'Normal', False),
        ('', 'Normal', False),
        ('All asset details including owner, amount, and category unit type.', 'Normal', False),
        ('Asset photo (if uploaded).', 'Normal', False),
        ('Complete activity log for the asset \u2014 every action performed on it with timestamps and actor names.', 'Normal', False),
    ]

    # Append all new paragraphs at the end of the document
    created_elements = []
    for text, style, bold in new_paragraphs_data:
        p = doc.add_paragraph(text)
        if style:
            p.style = doc.styles[style]
        if bold:
            for run in p.runs:
                run.bold = True
        created_elements.append(p._element)

    # Move all created elements as a group to after the target paragraph
    body = doc.element.body
    ref_element = doc.paragraphs[idx]._element

    # Remove all from end of body
    for elem in created_elements:
        body.remove(elem)

    # Insert them in order after ref_element
    prev = ref_element
    for elem in created_elements:
        prev.addnext(elem)
        prev = elem

    print(f"  Inserted {len(new_paragraphs_data)} paragraphs")


# ─── Step 3: CSV export detail ────────────────────────────────────────────
print("3. Updating CSV export section...")
idx = find_para('Open the file in Excel or any spreadsheet application')
if idx is None:
    print("  ERROR: Could not find CSV export step 3")
else:
    csv_data = [
        ('', 'Normal', False),
        ('The CSV export includes the following columns depending on the view:', 'Normal', False),
        ('', 'Normal', False),
        ('Asset Inventory view: ID, Name, Asset Tag, Category, Asset Type, Acquisition Cost, Depreciation Rate, Total Depreciation, Unit Amount, Ownership, Created At.', 'Normal', False),
        ('Overdue Items view: Borrower, Asset, Asset Tag, Category, Expected Return Date, Days Overdue.', 'Normal', False),
        ('Lost Items view: Asset, Asset Tag, Category, Asset Type, Reported Lost At.', 'Normal', False),
        ('', 'Normal', False),
        ('The Unit Amount column shows the quantity for multi-unit categories, or 1 for single-unit categories. The Ownership column shows the assigned employee name, or "coreDev" if unassigned.', 'Normal', False),
    ]

    # Insert before "Open the file in Excel" by appending then moving
    created = []
    for text, style, bold in csv_data:
        p = doc.add_paragraph(text)
        if style:
            p.style = doc.styles[style]
        if bold:
            for run in p.runs:
                run.bold = True
        created.append(p._element)

    body = doc.element.body
    # Target: insert before idx (which is "Open the file..."), so after idx-1
    ref_element = doc.paragraphs[idx - 1]._element

    for elem in created:
        body.remove(elem)

    prev = ref_element
    for elem in created:
        prev.addnext(elem)
        prev = elem

    print(f"  Inserted {len(csv_data)} paragraphs")


# ─── Step 4: Technology table - add OpenSpout row ────────────────────────
print("4. Updating Technology table...")
from docx.oxml.ns import qn
from lxml import etree

for table in doc.tables:
    for row in table.rows:
        cells = [cell.text.strip() for cell in row.cells]
        if 'Backend' in cells and 'Laravel' in cells:
            full_text = ' '.join(cells)
            if 'OpenSpout' not in full_text:
                tbl = table._tbl
                tr_list = tbl.findall(qn('w:tr'))
                last_tr = tr_list[-1]
                new_tr = etree.deepcopy(last_tr)
                tcs = new_tr.findall(qn('w:tc'))
                if len(tcs) >= 2:
                    for p in tcs[0].findall(qn('w:p')):
                        for r in p.findall(qn('w:r')):
                            for t in r.findall(qn('w:t')):
                                t.text = ''
                    p0 = tcs[0].findall(qn('w:p'))[0]
                    r0 = p0.findall(qn('w:r'))
                    if r0:
                        t0 = r0[0].find(qn('w:t'))
                        if t0 is not None:
                            t0.text = 'Spreadsheet Import/Export'
                    for p in tcs[1].findall(qn('w:p')):
                        for r in p.findall(qn('w:r')):
                            for t in r.findall(qn('w:t')):
                                t.text = ''
                    p1 = tcs[1].findall(qn('w:p'))[0]
                    r1 = p1.findall(qn('w:r'))
                    if r1:
                        t1 = r1[0].find(qn('w:t'))
                        if t1 is not None:
                            t1.text = 'OpenSpout (XLSX/CSV read/write)'
                tbl.append(new_tr)
                print("  Added OpenSpout row")
                break


# ─── Save ──────────────────────────────────────────────────────────────────
doc.save(docx_new)
print(f"\nSaved to {docx_new}")
print("Done!")
