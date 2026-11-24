import os
import sys
import time
import openpyxl
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = r"C:\Users\aksha\.gemini\antigravity\brain\8369736c-3e71-4dcf-bcc9-356afd214594"
os.makedirs(ARTIFACT_DIR, exist_ok=True)

BASE_URL = "http://localhost:5173"
EXCEL_PATH = r"C:\Users\aksha\Documents\CampusHarmony_Private\CampusHarmony_Demo_Credentials.xlsx"

# Dynamically resolve demo credentials from private workbook outside Git
admin_pw = os.environ.get("CAMPUS_ADMIN_PASSWORD", "AdminSecure@2026!")
teacher_pw = ""
student_pw = ""

if os.path.exists(EXCEL_PATH):
    try:
        wb = openpyxl.load_workbook(EXCEL_PATH, data_only=True)
        ws1 = wb["Quick Demo Accounts"]
        for r in ws1.iter_rows(values_only=True):
            if r and len(r) >= 4 and r[2] and r[3]:
                ident = str(r[2]).strip()
                pw = str(r[3]).strip()
                if ident == "admin":
                    admin_pw = pw
                elif ident == "prof_rao":
                    teacher_pw = pw
                elif ident == "24CSE001":
                    student_pw = pw
    except Exception as e:
        print(f"[WARN] Failed to load workbook credentials: {e}")

VIEWPORTS = {
    "1366px": {"width": 1366, "height": 768},
    "1920px": {"width": 1920, "height": 1080},
    "768px": {"width": 768, "height": 1024},
    "390px": {"width": 390, "height": 844}
}

print(f"[INFO] Initializing Playwright Screenshot Capture...")
print(f"[INFO] Destination: {ARTIFACT_DIR}")

def capture_screen(page, name_base, v_name, full_page=False):
    filename = f"{name_base}_{v_name}.png"
    filepath = os.path.join(ARTIFACT_DIR, filename)
    page.screenshot(path=filepath, full_page=full_page)
    print(f"  [SAVED] {filename}")
    # Also save standard filename for 1366px default
    if v_name == "1366px":
        std_filepath = os.path.join(ARTIFACT_DIR, f"{name_base}.png")
        page.screenshot(path=std_filepath, full_page=full_page)
        print(f"  [SAVED] {name_base}.png")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    # 1. Login Screen across all viewports
    print("\n--- 1. Capturing Login Screen ---")
    for v_name, vp in VIEWPORTS.items():
        ctx = browser.new_context(viewport=vp)
        page = ctx.new_page()
        page.goto(BASE_URL, wait_until="networkidle")
        page.wait_for_selector("#identifier", timeout=10000)
        time.sleep(1)
        capture_screen(page, "login_screen", v_name)
        ctx.close()

    # Helper function to login and capture pages
    def capture_authenticated_screens(username, password, screens):
        for v_name, vp in VIEWPORTS.items():
            ctx = browser.new_context(viewport=vp)
            page = ctx.new_page()
            
            # Go to login
            page.goto(BASE_URL, wait_until="networkidle")
            page.wait_for_selector("#identifier", timeout=10000)
            page.fill("#identifier", username)
            page.fill("#password", password)
            page.click("button[type='submit']")
            
            # Wait for dashboard to load (portal navbar or main content)
            page.wait_for_selector("nav, main, .portal-card", timeout=15000)
            time.sleep(1.5)

            for path, name_base in screens:
                if path != "/":
                    page.goto(f"{BASE_URL}{path}", wait_until="networkidle")
                    time.sleep(1.5)
                capture_screen(page, name_base, v_name)

            ctx.close()

    # 2. Admin Screens (Dashboard, Courses, Grievances)
    print("\n--- 2. Capturing Admin Screens (Dashboard, Courses, Grievances) ---")
    admin_screens = [
        ("/", "admin_dashboard"),
        ("/courses", "courses_management"),
        ("/complaints", "grievance_management")
    ]
    capture_authenticated_screens("admin", admin_pw, admin_screens)

    # 3. Teacher Screens (Dashboard, Attendance, Marks)
    print("\n--- 3. Capturing Teacher Screens (Dashboard, Attendance, Marks) ---")
    teacher_screens = [
        ("/", "teacher_dashboard"),
        ("/attendance", "attendance_management"),
        ("/marks", "marks_management")
    ]
    capture_authenticated_screens("prof_rao", teacher_pw, teacher_screens)

    # 4. Student Screens (Dashboard)
    print("\n--- 4. Capturing Student Screens (Dashboard) ---")
    student_screens = [
        ("/", "student_dashboard")
    ]
    capture_authenticated_screens("24CSE001", student_pw, student_screens)

    browser.close()

print("\n[SUCCESS] All screenshots captured successfully across all 4 resolutions!")
