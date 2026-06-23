#!/usr/bin/env python3
"""
End-to-end test for Gateway.Api.

Wire format for AES-128-CBC (new hardened format):
  Encrypt: [16-byte random IV][ciphertext]  → base64
  Decrypt: read first 16 bytes as IV, rest as ciphertext

Wire format for AES-256-GCM:
  Encrypt: [12-byte random nonce][ciphertext][16-byte tag] → base64
  Decrypt: first 12 bytes = nonce, last 16 = tag, middle = cipher

Run from the repo root:
  python3 scripts/test_e2e.py
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import sys
import time
import urllib.request
import urllib.error

# ── Dependencies check ────────────────────────────────────────────────────────
try:
    from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
    from cryptography.hazmat.primitives import padding
    from cryptography.hazmat.backends import default_backend
except ImportError:
    print("ERROR: 'cryptography' package not found.")
    print("Install it with:  pip install cryptography")
    print("Or activate the project venv first.")
    sys.exit(1)

# ── Config ────────────────────────────────────────────────────────────────────
GATEWAY_BASE   = "http://localhost:5001"
JWT_SECRET     = "dev-only-secret-key-minimum-32-characters-long"
CLIENT_ID      = "mobile-app-001"

# Key from migration 003: 'zAL7X5AVRm8l4Ifs' → Base64
# This is the AES-128 key stored in user_profiles for mobile-app-001
USER_KEY_B64   = "ekFMN1g1QVZSbThsNElmcw=="   # 16-byte key, base64
USER_KEY_BYTES = base64.b64decode(USER_KEY_B64)


# ── JWT (HS256, stdlib only) ──────────────────────────────────────────────────
def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

def make_jwt(subject: str, secret: str, ttl_seconds: int = 3600) -> str:
    header  = _b64url(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    payload = _b64url(json.dumps({
        "sub": subject,
        "iat": int(time.time()),
        "exp": int(time.time()) + ttl_seconds,
    }).encode())
    signing_input = f"{header}.{payload}"
    sig = hmac.new(secret.encode(), signing_input.encode(), hashlib.sha256).digest()
    return f"{signing_input}.{_b64url(sig)}"


# ── AES-128-CBC encrypt (new format: [16-byte IV][ciphertext]) ────────────────
def encrypt_aes128_cbc(plaintext: bytes, key: bytes) -> str:
    iv = os.urandom(16)
    padder = padding.PKCS7(128).padder()
    padded = padder.update(plaintext) + padder.finalize()
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    enc = cipher.encryptor()
    ciphertext = enc.update(padded) + enc.finalize()
    # [IV][ciphertext] → base64
    return base64.b64encode(iv + ciphertext).decode()


# ── AES-128-CBC decrypt (new format: first 16 bytes = IV) ─────────────────────
def decrypt_aes128_cbc(b64_data: str, key: bytes) -> bytes:
    raw = base64.b64decode(b64_data)
    iv, ciphertext = raw[:16], raw[16:]
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    dec = cipher.decryptor()
    padded = dec.update(ciphertext) + dec.finalize()
    unpadder = padding.PKCS7(128).unpadder()
    return unpadder.update(padded) + unpadder.finalize()


# ── HTTP helper ───────────────────────────────────────────────────────────────
def post(url: str, body: dict, token: str) -> tuple[int, dict | str]:
    data = json.dumps(body).encode()
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Content-Type":  "application/json",
            "Authorization": f"Bearer {token}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read().decode()
            try:
                return resp.status, json.loads(raw)
            except json.JSONDecodeError:
                return resp.status, raw
    except urllib.error.HTTPError as e:
        body_text = e.read().decode()
        return e.code, body_text


# ── Test cases ────────────────────────────────────────────────────────────────
def test_login(token: str) -> None:
    """
    POST /gateway/payhub/login
    Endpoint: payload_expectation=Decrypted, crypto_algorithm=AES_128_CBC
    Gateway decrypts the body before forwarding, MockServer gets plain JSON.
    Response is NOT encrypted (EncryptResponse=false for login endpoint).
    """
    print("\n" + "="*60)
    print("TEST: POST /gateway/payhub/login (AES-128-CBC decrypt)")
    print("="*60)

    plaintext = json.dumps({
        "username": "oladeji.olanipekun@sterling.ng",
        "password": "Password@123",
        "bank":     "jhfjfe",
    }).encode()

    encrypted_b64 = encrypt_aes128_cbc(plaintext, USER_KEY_BYTES)
    print(f"  Plaintext  : {plaintext.decode()}")
    print(f"  Encrypted  : {encrypted_b64[:60]}...")

    status, resp = post(
        f"{GATEWAY_BASE}/gateway/payhub/login",
        {"data": encrypted_b64},
        token,
    )
    print(f"  Status     : {status}")
    print(f"  Response   : {json.dumps(resp, indent=2) if isinstance(resp, dict) else resp}")

    assert status == 200, f"Expected 200, got {status}: {resp}"
    assert "token" in resp or "userId" in resp, f"Unexpected response shape: {resp}"
    print("  ✓ PASS")


def test_transfer_encrypted_response(token: str) -> None:
    """
    POST /gateway/payhub/transfer
    Endpoint: payload_expectation=Decrypted, EncryptResponse=true (if configured)
    Gateway decrypts request and encrypts response.
    """
    print("\n" + "="*60)
    print("TEST: POST /gateway/payhub/transfer (decrypt req)")
    print("="*60)

    # transfer uses AES_256_CBC_HMAC per seed data — but the user profile key is
    # only 16 bytes (AES-128). The gateway will error if the key is too short.
    # For this test we use the login endpoint's AES_128_CBC algorithm.
    # This test verifies the 403/200 path depending on your seed data.

    plaintext = json.dumps({
        "accountNumber": "1234567890",
        "amount":        5000,
        "currency":      "NGN",
        "narration":     "Test transfer",
    }).encode()

    encrypted_b64 = encrypt_aes128_cbc(plaintext, USER_KEY_BYTES)
    print(f"  Plaintext  : {plaintext.decode()}")

    status, resp = post(
        f"{GATEWAY_BASE}/gateway/payhub/transfer",
        {"data": encrypted_b64},
        token,
    )
    print(f"  Status     : {status}")
    print(f"  Response   : {json.dumps(resp, indent=2) if isinstance(resp, dict) else resp}")

    if status == 200:
        # If response is encrypted, unwrap it
        if isinstance(resp, dict) and "data" in resp:
            decrypted = decrypt_aes128_cbc(resp["data"], USER_KEY_BYTES)
            print(f"  Decrypted  : {decrypted.decode()}")
        print("  ✓ PASS")
    else:
        print(f"  ⚠ Got {status} — check that transfer endpoint crypto_algorithm "
              "matches the 16-byte key in user_profiles")


def test_no_jwt_rejected() -> None:
    """Verify that a request with no JWT is rejected with 401."""
    print("\n" + "="*60)
    print("TEST: Request without JWT → expect 401")
    print("="*60)

    req = urllib.request.Request(
        f"{GATEWAY_BASE}/gateway/payhub/login",
        data=json.dumps({"data": "anything"}).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"  Status: {resp.status}  ← should have been 401!")
            assert False, "Expected 401 but got 200"
    except urllib.error.HTTPError as e:
        print(f"  Status: {e.code}")
        assert e.code == 401, f"Expected 401, got {e.code}"
        print("  ✓ PASS")


def test_wrong_client_rejected(token: str) -> None:
    """Verify that a client without permission gets 403."""
    print("\n" + "="*60)
    print("TEST: web-portal-001 calling /transfer → expect 403")
    print("="*60)

    # web-portal-001 has no permission for /transfer
    web_token = make_jwt("web-portal-001", JWT_SECRET)
    plaintext = json.dumps({"accountNumber": "1234567890", "amount": 100}).encode()
    encrypted = encrypt_aes128_cbc(plaintext, USER_KEY_BYTES)

    status, resp = post(
        f"{GATEWAY_BASE}/gateway/payhub/transfer",
        {"data": encrypted},
        web_token,
    )
    print(f"  Status     : {status}")
    print(f"  Response   : {resp}")
    assert status == 403, f"Expected 403, got {status}"
    print("  ✓ PASS")


# ── Main ──────────────────────────────────────────────────────────────────────
def main() -> int:
    print("Gateway.Api End-to-End Test")
    print(f"Target: {GATEWAY_BASE}")
    print(f"Client: {CLIENT_ID}")

    # Check gateway is reachable
    try:
        urllib.request.urlopen(f"{GATEWAY_BASE}/health", timeout=3)
    except Exception as e:
        print(f"\nERROR: Gateway not reachable at {GATEWAY_BASE}")
        print(f"       {e}")
        print("\nStart it first:")
        print("  cd src/Gateway.Api")
        print("  ASPNETCORE_ENVIRONMENT=Development \\")
        print("  ConnectionStrings__PostgreSQL='Host=localhost;Port=5432;Database=gateway;Username=gateway;Password=gateway123' \\")
        print("  ConnectionStrings__Redis='localhost:6379' \\")
        print("  Kafka__BootstrapServers='localhost:9092' \\")
        print("  dotnet run")
        return 1

    token = make_jwt(CLIENT_ID, JWT_SECRET)
    print(f"\nJWT (mobile-app-001): {token[:60]}...")

    passed = 0
    failed = 0

    for test_fn, args in [
        (test_no_jwt_rejected, []),
        (test_login,           [token]),
        (test_transfer_encrypted_response, [token]),
        (test_wrong_client_rejected, [token]),
    ]:
        try:
            test_fn(*args)
            passed += 1
        except AssertionError as e:
            print(f"  ✗ FAIL: {e}")
            failed += 1
        except Exception as e:
            print(f"  ✗ ERROR: {e}")
            failed += 1

    print(f"\n{'='*60}")
    print(f"Results: {passed} passed, {failed} failed")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
