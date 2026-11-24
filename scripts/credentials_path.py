#!/usr/bin/env python3
"""
CampusHarmony — Portable Credentials Path Resolver
Resolves the private demonstration credentials workbook path outside Git
based on the current Windows user profile or environment overrides.
"""

import os
import sys

def get_private_credentials_dir() -> str:
    """
    Returns the absolute path to the CampusHarmony_Private directory
    located in the current Windows user's Documents folder (strictly outside Git).
    """
    # 1. Environment variable override
    env_dir = os.environ.get("CAMPUS_CREDENTIALS_DIR")
    if env_dir:
        abs_dir = os.path.abspath(env_dir)
        os.makedirs(abs_dir, exist_ok=True)
        return abs_dir

    # 2. Windows User Profile Documents folder
    user_profile = os.environ.get("USERPROFILE") or os.path.expanduser("~")
    docs_dir = os.path.join(user_profile, "Documents")
    if not os.path.exists(docs_dir):
        docs_dir = user_profile

    private_dir = os.path.join(docs_dir, "CampusHarmony_Private")
    os.makedirs(private_dir, exist_ok=True)
    return private_dir

def get_private_credentials_path() -> str:
    """
    Returns the absolute path to CampusHarmony_Demo_Credentials.xlsx.
    """
    env_file = os.environ.get("CAMPUS_CREDENTIALS_PATH")
    if env_file:
        abs_file = os.path.abspath(env_file)
        os.makedirs(os.path.dirname(abs_file), exist_ok=True)
        return abs_file

    return os.path.join(get_private_credentials_dir(), "CampusHarmony_Demo_Credentials.xlsx")

if __name__ == "__main__":
    print(get_private_credentials_path())
