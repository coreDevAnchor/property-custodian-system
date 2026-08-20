"""Update Property_Custodian_System_Documentation.docx
- Add tech stack under Technology heading
- Add Installation section as section 2
- Renumber all subsequent sections
- Update Table of Contents
"""
import sys
import io
import re
from docx import Document
from docx.shared import Pt, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

docx_path = r'D:\coredev\property-custodian-system\Property_Custodian_System_Documentation.docx'
docx_backup = r'D:\coredev\property-custodian-system\Property_Custodian_System_Documentation_backup.docx'
doc = Document(docx_path)

# ─── Helper: clear paragraph and set text with style ────────────────────────
def set_paragraph_text(para, text, style_name=None, bold=False):
    """Clear paragraph runs and set new text."""
    for run in para.runs:
        run.text = ''
    if para.runs:
        para.runs[0].text = text
        if bold:
            para.runs[0].bold = True
    else:
        run = para.add_run(text)
        if bold:
            run.bold = True
    if style_name:
        para.style = doc.styles[style_name]

def insert_paragraph_after(para, text, style_name=None, bold=False):
    """Insert a new paragraph after the given paragraph."""
    new_para = doc.add_paragraph()
    # Move new paragraph to after `para`
    new_para._element.addnext(para._element)
    # Actually, we need to insert after, so we use a different approach
    # We'll collect paragraphs to insert and do it after
    return new_para

def add_paragraph_after_index(idx, text, style_name=None, bold=False):
    """Add a paragraph at a specific index position."""
    # python-docx doesn't support direct insertion at index
    # We'll need to work with the XML directly
    from lxml import etree
    from docx.oxml.ns import qn

    new_para = doc.add_paragraph(text)
    if style_name:
        new_para.style = doc.styles[style_name]
    if bold:
        for run in new_para.runs:
            run.bold = True

    # Move to correct position
    body = doc.element.body
    # Remove from end
    body.remove(new_para._element)
    # Insert at position
    ref_para = doc.paragraphs[idx]
    ref_para._element.addprevious(new_para._element)

    return new_para

# ─── Step 1: Find key paragraph indices ────────────────────────────────────
print("Finding paragraph indices...")
tech_heading_idx = None
getting_started_idx = None
toc_start_idx = None
toc_end_idx = None

for i, p in enumerate(doc.paragraphs):
    if p.style and p.style.name == 'Heading 1':
        if 'Technology' in p.text or (p.text.strip() == '' and tech_heading_idx is not None):
            pass  # skip empty
        if 'Introduction' in p.text:
            pass  # skip
        if 'Getting Started' in p.text:
            getting_started_idx = i
        if 'Custodian Guide' in p.text:
            custodian_guide_idx = i
        if 'Employee Guide' in p.text:
            employee_guide_idx = i
        if 'Notifications' in p.text and i > 200:
            notifications_idx = i
        if 'Settings' in p.text and i > 300:
            settings_idx = i
        if 'Frequently' in p.text:
            faq_idx = i
        if 'Appendix A' in p.text:
            appendix_a_idx = i

    if p.style and p.style.name == 'Heading 2':
        if p.text.strip() == 'Technology':
            tech_heading_idx = i

    # Find TOC entries
    if 'Table of Contents' in p.text and p.style and p.style.name == 'Heading 1':
        toc_start_idx = i + 1  # TOC content starts after heading

print(f"Technology heading: {tech_heading_idx}")
print(f"Getting Started heading: {getting_started_idx}")

# Find TOC end (next heading after TOC content)
if toc_start_idx:
    for i in range(toc_start_idx, len(doc.paragraphs)):
        p = doc.paragraphs[i]
        if p.style and p.style.name.startswith('Heading'):
            toc_end_idx = i
            break
    print(f"TOC range: {toc_start_idx} - {toc_end_idx}")

# ─── Step 2: Add tech stack content after Technology heading ────────────────
print("\nAdding tech stack content...")

tech_stack_content = [
    ("The system is built with the following technologies:", "Normal"),
    ("Backend", "List Bullet"),
    ("Laravel 13 — PHP web framework", "List Bullet"),
    ("PHP 8.3 — Server-side scripting language", "List Bullet"),
    ("Inertia.js — Server-side rendering bridge between Laravel and React", "List Bullet"),
    ("Laravel Fortify — Authentication and account management", "List Bullet"),
    ("Laravel Wayfinder — Type-safe route generation for frontend", "List Bullet"),
    ("Laravel DomPDF — PDF report generation", "List Bullet"),
    ("", "Normal"),
    ("Frontend", "List Bullet"),
    ("React 19 — UI library", "List Bullet"),
    ("TypeScript — Type-safe JavaScript", "List Bullet"),
    ("Vite 8 — Build tool and development server", "List Bullet"),
    ("Inertia.js React adapter — Seamless server-client navigation", "List Bullet"),
    ("", "Normal"),
    ("UI Components", "List Bullet"),
    ("shadcn/ui — Component library built on Radix UI primitives", "List Bullet"),
    ("Tailwind CSS v4 — Utility-first CSS framework", "List Bullet"),
    ("Framer Motion — Animation library", "List Bullet"),
    ("Lucide React — Icon library", "List Bullet"),
    ("", "Normal"),
    ("Forms & Validation", "List Bullet"),
    ("React Hook Form — Form state management", "List Bullet"),
    ("Zod — Schema validation", "List Bullet"),
    ("", "Normal"),
    ("Data & Charts", "List Bullet"),
    ("Recharts — Charting library for analytics dashboards", "List Bullet"),
    ("date-fns — Date manipulation library", "List Bullet"),
    ("", "Normal"),
    ("Other", "List Bullet"),
    ("Sonner — Toast notifications", "List Bullet"),
    ("Passkeys (WebAuthn) — Passwordless authentication", "List Bullet"),
    ("Pest PHP — Testing framework", "List Bullet"),
]

# Insert after Technology heading (index tech_heading_idx)
# We need to insert in reverse order since each insertion shifts indices
insert_start = tech_heading_idx + 1

for i, (text, style) in enumerate(reversed(tech_stack_content)):
    if text == "":
        # Empty paragraph - add at position
        new_para = add_paragraph_after_index(insert_start, "", "Normal")
    else:
        new_para = add_paragraph_after_index(insert_start, text, style)

print(f"Inserted {len(tech_stack_content)} paragraphs for tech stack")

# Recalculate indices after insertion
inserted_count = len(tech_stack_content)
getting_started_idx += inserted_count
toc_start_idx += inserted_count
toc_end_idx += inserted_count

# ─── Step 3: Add Installation section ──────────────────────────────────────
print("\nAdding Installation section...")

installation_content = [
    ("2. Installation", "Heading 1"),
    ("Follow these steps to set up the Property Custodian System on your local machine.", "Normal"),
    ("", "Normal"),
    ("1. Clone the repository from GitHub", "Normal", True),
    ("Clone the repository", "Normal", False),
    ("git clone https://github.com/coreDevAnchor/property-custodian-system.git", "Normal", False),
    ("cd property-custodian-system", "Normal", False),
    ("", "Normal"),
    ("2. Install PHP dependencies with Composer", "Normal", True),
    ("Install dependencies", "Normal", False),
    ("composer install", "Normal", False),
    ("npm install", "Normal", False),
    ("", "Normal"),
    ("3. Install JavaScript dependencies with npm", "Normal", True),
    ("", "Normal"),
    ("4. Configure your environment file", "Normal", True),
    ("Configure environment", "Normal", False),
    ("cp .env.example .env", "Normal", False),
    ("php artisan key:generate", "Normal", False),
    ("", "Normal"),
    ("5. Run database migrations", "Normal", True),
    ("Run migrations and seeders", "Normal", False),
    ("php artisan migrate --seed", "Normal", False),
    ("", "Normal"),
    ("6. Start the development servers", "Normal", True),
    ("Start development servers", "Normal", False),
    ("php artisan serve", "Normal", False),
    ("npm run dev", "Normal", False),
]

# Insert before Getting Started heading
insert_start = getting_started_idx

for i, item in enumerate(reversed(installation_content)):
    if len(item) == 3:
        text, style, bold = item
    else:
        text, style = item
        bold = False

    if text == "":
        new_para = add_paragraph_after_index(insert_start, "", "Normal")
    else:
        new_para = add_paragraph_after_index(insert_start, text, style, bold)

inserted_count = len(installation_content)
print(f"Inserted {len(installation_content)} paragraphs for installation")

# Recalculate all indices
getting_started_idx += inserted_count
toc_start_idx += inserted_count
toc_end_idx += inserted_count

# ─── Step 4: Update TOC entries ────────────────────────────────────────────
print("\nUpdating Table of Contents...")

# Re-read paragraphs to get fresh indices
# TOC is between toc_start_idx and toc_end_idx
toc_updates = {
    # Current text -> New text
    "2.   Getting Started": "3.   Getting Started",
    "2.1   Logging In": "3.1   Logging In",
    "2.2   First-Time Password Change": "3.2   First-Time Password Change",
    "2.3   Understanding the Interface": "3.3   Understanding the Interface",
    "3.   Custodian Guide": "4.   Custodian Guide",
    "3.1   Dashboard": "4.1   Dashboard",
    "3.2   Asset Management": "4.2   Asset Management",
    "3.3   Managing Borrow Requests": "4.3   Managing Borrow Requests",
    "3.4   Managing Returns": "4.4   Managing Returns",
    "3.5   Employee Management": "4.5   Employee Management",
    "3.6   Custodian Management": "4.6   Custodian Management",
    "3.7   Audit Trail": "4.7   Audit Trail",
    "3.8   Reports & Analytics": "4.8   Reports & Analytics",
    "4.   Employee Guide": "5.   Employee Guide",
    "4.1   Dashboard": "5.1   Dashboard",
    "4.2   Browsing & Requesting Assets": "5.2   Browsing & Requesting Assets",
    "4.3   Managing Current Borrows": "5.3   Managing Current Borrows",
    "4.4   Borrow History": "5.4   Borrow History",
    "5.   Notifications": "6.   Notifications",
    "6.   Settings & Account": "7.   Settings & Account",
    "7.   Frequently Asked Questions": "8.   Frequently Asked Questions",
}

# Add installation entry after Introduction
install_toc_entry = "2.   Installation"

for i in range(toc_start_idx, toc_end_idx):
    p = doc.paragraphs[i]
    text = p.text.strip()

    # Add installation entry after Introduction
    if text == "1.   Introduction & System Overview":
        # Insert installation entry after this
        add_paragraph_after_index(i + 1, install_toc_entry, "Normal")
        toc_end_idx += 1
        # Shift all subsequent updates
        continue

    # Update existing entries
    if text in toc_updates:
        set_paragraph_text(p, toc_updates[text])

print("TOC updated")

# ─── Step 5: Renumber section headings ─────────────────────────────────────
print("\nRenumbering section headings...")

# Heading renumbering map
heading_renumber = {
    # Heading 1
    "2. Getting Started": "3. Getting Started",
    "3. Custodian Guide": "4. Custodian Guide",
    "4. Employee Guide": "5. Employee Guide",
    "5. Notifications": "6. Notifications",
    "6. Settings & Account": "7. Settings & Account",
    "7. Frequently Asked Questions": "8. Frequently Asked Questions",
    # Heading 2 - Getting Started
    "2.1 Logging In": "3.1 Logging In",
    "2.2 First-Time Password Change": "3.2 First-Time Password Change",
    "2.3 Understanding the Interface": "3.3 Understanding the Interface",
    # Heading 2 - Custodian Guide
    "3.1 Dashboard": "4.1 Dashboard",
    "3.2 Asset Management": "4.2 Asset Management",
    "3.3 Managing Borrow Requests": "4.3 Managing Borrow Requests",
    "3.4 Managing Returns": "4.4 Managing Returns",
    "3.5 Employee Management": "4.5 Employee Management",
    "3.6 Custodian Management": "4.6 Custodian Management",
    "3.7 Audit Trail": "4.7 Audit Trail",
    "3.8 Reports & Analytics": "4.8 Reports & Analytics",
    # Heading 2 - Employee Guide
    "4.1 Employee Dashboard": "5.1 Employee Dashboard",
    "4.2 Browsing & Requesting Assets": "5.2 Browsing & Requesting Assets",
    "4.3 Managing Your Current Borrows": "5.3 Managing Your Current Borrows",
    "4.4 Borrow History": "5.4 Borrow History",
}

# Process in reverse to avoid index shifting issues
for i, p in enumerate(doc.paragraphs):
    if p.style and p.style.name.startswith('Heading'):
        text = p.text.strip()
        if text in heading_renumber:
            # Update the paragraph text
            for run in p.runs:
                run.text = ''
            if p.runs:
                p.runs[0].text = heading_renumber[text]
            else:
                p.add_run(heading_renumber[text])

print("Headings renumbered")

# ─── Step 6: Save ──────────────────────────────────────────────────────────
doc.save(docx_backup)
print(f"\nSaved to {docx_backup}")
print("Done!")
