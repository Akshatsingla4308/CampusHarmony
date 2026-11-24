#!/usr/bin/env python3
"""
CampusHarmony — Credentials Workbook & Live Authentication Verifier
Validates Sheet structure, row counts, and tests actual backend authentication.
"""

import os
import sys
import openpyxl
import json
import urllib.request
import urllib.error

REPO_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if REPO_DIR not in sys.path:
    sys.path.insert(0, REPO_DIR)

from scripts.credentials_path import get_private_credentials_path

EXCEL_PATH = get_private_credentials_path()
BASE_URL = "http://localhost:8080/api/auth/login"

print("======================================================================")
print("  CAMPUS HARMONY — CREDENTIALS WORKBOOK & AUTHENTICATION AUDIT")
print("======================================================================")

if not os.path.exists(EXCEL_PATH):
    print(f"[FAIL] Excel file not found at: {EXCEL_PATH}")
    sys.exit(1)

print(f"[PASS] Found private credentials file outside Git at:\n       {EXCEL_PATH}")

wb = openpyxl.load_workbook(EXCEL_PATH, data_only=True)
sheet_names = wb.sheetnames
print(f"[INFO] Sheets present: {sheet_names}")

# 1. Sheet 1: Quick Demo Accounts
ws1 = wb["Quick Demo Accounts"]
demo_rows = [r for r in ws1.iter_rows(values_only=True) if r and r[0] and r[0] not in ["CampusHarmony — College ERP Demonstration Credentials", "Role / Persona"] and not str(r[0]).startswith("Curated quick")]
print(f"[PASS] Sheet 1 (Quick Demo Accounts): {len(demo_rows)} curated demo accounts found.")

# 2. Sheet 2: All 15 Faculty Members
ws2 = wb["All 15 Faculty Members"]
teacher_rows = [r for r in ws2.iter_rows(values_only=True) if r and r[0] and str(r[0]).startswith("T-")]
print(f"[PASS] Sheet 2 (All 15 Faculty Members): Exactly {len(teacher_rows)} faculty records found.")
assert len(teacher_rows) == 15, f"Expected 15 teachers, found {len(teacher_rows)}"

# 3. Sheet 3: All 300 Enrolled Students
ws3 = wb["All 300 Enrolled Students"]
student_rows = [r for r in ws3.iter_rows(values_only=True) if r and r[0] and str(r[0]).startswith("24CSE")]
print(f"[PASS] Sheet 3 (All 300 Enrolled Students): Exactly {len(student_rows)} student records found.")
assert len(student_rows) == 300, f"Expected 300 students, found {len(student_rows)}"

# 4. Sheet 4: Administrator Details
ws4 = wb["Administrator & Architecture"]
admin_rows = [r for r in ws4.iter_rows(values_only=True) if r and r[0] and r[0] not in ["CampusHarmony — Administrative Access & Architecture Reference", "Configuration Parameter"] and not str(r[0]).startswith("Master administrator")]
print(f"[PASS] Sheet 4 (Administrator Details): {len(admin_rows)} configuration entries found.")

# 5. Live Authentication Tests against Spring Boot Backend
print("\n--- Testing Live Backend Authentication via POST /api/auth/login ---")

def test_auth(identifier, password, expected_role, should_succeed=True):
    data = json.dumps({"identifier": identifier, "password": password}).encode("utf-8")
    req = urllib.request.Request(
        BASE_URL,
        data=data,
        headers={"Content-Type": "application/json", "X-Campus-Request": "1"}
    )
    try:
        with urllib.request.urlopen(req) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            if should_succeed:
                role = body.get("role")
                name = body.get("name")
                if role == expected_role:
                    print(f"  [PASS] {identifier} -> Authenticated successfully as '{role}' ({name})")
                    return True
                else:
                    print(f"  [FAIL] {identifier} -> Expected role {expected_role}, got {role}")
                    return False
            else:
                print(f"  [FAIL] {identifier} -> Expected authentication failure, but succeeded!")
                return False
    except urllib.error.HTTPError as e:
        if not should_succeed and e.code == 401:
            print(f"  [PASS] {identifier} (Invalid Password) -> Correctly rejected with HTTP 401 Unauthorized")
            return True
        else:
            print(f"  [FAIL] {identifier} -> HTTP Error {e.code}: {e.read().decode('utf-8', errors='ignore')}")
            return False
    except Exception as e:
        print(f"  [FAIL] {identifier} -> Connection error: {e}")
        return False

# Look up passwords directly from the loaded workbook sheets
demo_account_map = {str(r[2]).strip(): str(r[3]).strip() for r in demo_rows if len(r) >= 4 and r[2] and r[3]}
teacher_account_map = {str(r[2]).strip(): str(r[9]).strip() for r in teacher_rows if len(r) >= 10 and r[2] and r[9]}
student_account_map = {str(r[0]).strip(): str(r[11]).strip() for r in student_rows if len(r) >= 12 and r[0] and r[11]}

def get_account_pw(ident):
    if ident in demo_account_map:
        return demo_account_map[ident]
    if ident in teacher_account_map:
        return teacher_account_map[ident]
    if ident in student_account_map:
        return student_account_map[ident]
    raise ValueError(f"Account {ident} not found in workbook")

test_accounts = [
    ("admin", get_account_pw("admin"), "admin", True),
    ("prof_rao", get_account_pw("prof_rao"), "teacher", True),
    ("prof_sharma", get_account_pw("prof_sharma"), "teacher", True),
    ("prof_kapoor", get_account_pw("prof_kapoor"), "teacher", True),
    ("prof_mehra", get_account_pw("prof_mehra"), "teacher", True),
    ("prof_joshi", get_account_pw("prof_joshi"), "teacher", True),
    ("prof_sengupta", get_account_pw("prof_sengupta"), "teacher", True),
    ("24CSE001", get_account_pw("24CSE001"), "student", True),
    ("24CSE046", get_account_pw("24CSE046"), "student", True),
    ("24CSE058", get_account_pw("24CSE058"), "student", True),
    ("24CSE005", get_account_pw("24CSE005"), "student", True),
    ("24CSE300", get_account_pw("24CSE300"), "student", True),
    ("admin", "WrongPassword!999", "admin", False),
    ("prof_rao", "WrongPassword!999", "teacher", False),
    ("24CSE001", "WrongPassword!999", "student", False)
]

all_auth_passed = True
for ident, pw, exp_role, succ in test_accounts:
    ok = test_auth(ident, pw, exp_role, succ)
    if not ok:
        all_auth_passed = False

print("======================================================================")
if all_auth_passed:
    print(" ALL 15 AUTHENTICATION TESTS (VALID & INVALID) PASSED PERFECTLY!")
else:
    print(" SOME AUTHENTICATION TESTS FAILED!")
print("======================================================================")
