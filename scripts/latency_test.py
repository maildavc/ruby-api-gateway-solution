import random
import string
import json
import subprocess
import statistics
from datetime import datetime, timedelta

HEADERS = [
    "-H", "accept: application/json",
    "-H", "Content-Type: application/json",
    "-H", "OrganizationId: GAP-8c21aa75-cbe4-429a-9e1f-ef927b8e79d0",
    "-H", "ApplicationId: NIP",
    "-H", "Cookie: 2b420c707556a5fcd8491af1f855585d=f4e42cd7c681f300feb43fff9ceb2e69; 98f86e2a62a1eb4700b8bc7775563a6e=93fcada173e29c2897dca1f53f8e7cf2; a7b99556de9311a45e75ea10759ccba0=2c42fbfc7a88b54c0c88f49bce0d442a"
]


def rand_id(prefix: str, n: int = 24) -> str:
    return prefix + "".join(random.choice(string.digits) for _ in range(n))


def rand_digits(n: int) -> str:
    return "".join(random.choice(string.digits) for _ in range(n))


def rand_name() -> str:
    first = random.choice(["John", "James", "Ada", "Fatima", "Chinedu", "Ife", "Tunde", "Ngozi", "Musa", "Grace"])
    last = random.choice(["Doe", "Ibori", "Okafor", "Ali", "Bello", "Nwosu", "Adebayo", "Umeh", "Okoro", "Balogun"])
    return f"{first} {last}"


def rand_channel() -> str:
    return random.choice(["Onebank", "Mobile", "Web", "POS", "USSD"])


def rand_ip() -> str:
    return f"192.168.{random.randint(0, 255)}.{random.randint(1, 254)}"


def rand_device() -> str:
    return f"ANDRO{random.randint(10000, 99999)}ID-{random.choice(['ABC','DEF','GHI','JKL'])}{random.randint(100, 999)}"


def rand_location() -> str:
    return random.choice(["Lagos", "Abuja", "Kano", "Port Harcourt", "Ibadan", "Enugu"])


def rand_amount() -> int:
    return random.choice([1000, 2500, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000])


def rand_date() -> str:
    dt = datetime.utcnow() - timedelta(minutes=random.randint(0, 60))
    return dt.isoformat(timespec="seconds") + "Z"


def curl_time(url: str, payload: dict) -> float:
    cmd = [
        "curl",
        "-s",
        "-o",
        "/dev/null",
        "-w",
        "%{time_total}",
        "-X",
        "POST",
        url,
        *HEADERS,
        "--data",
        json.dumps(payload),
    ]
    out = subprocess.check_output(cmd).decode().strip()
    return float(out)


def ms(value: float) -> float:
    return value * 1000.0


def main() -> None:
    n = 50
    gateway_times = []
    direct_times = []

    for i in range(n):
        payload = {
            "transaction_id": rand_id("TRX-") + f"-{i:03d}",
            "request_id": rand_id("REQ-"),
            "customer_id": "CUS" + rand_digits(8),
            "bvn": rand_digits(11),
            "nin": rand_digits(11),
            "source_account_no": rand_digits(10),
            "source_account_name": rand_name(),
            "destination_account_no": rand_digits(10),
            "destination_account_name": rand_name(),
            "source_institution_code": random.choice(["044", "058", "011", "214", "070"]),
            "destination_institution_code": random.choice(["044", "058", "011", "214", "070"]),
            "amount": rand_amount(),
            "currency": "NGN",
            "transaction_type": "INWARD",
            "channel": rand_channel(),
            "transaction_date": rand_date(),
            "narration": random.choice(["Funds transfer", "Payment", "Invoice settlement", "Salary", "Refund"]),
            "ip_address": rand_ip(),
            "callback_url": "http://www.test.com",
            "device_id": rand_device(),
            "location": rand_location(),
        }

        gateway_times.append(
            curl_time("http://localhost:5050/gateway/inbound-sentinel/api/transactions/async/check-inbound", payload)
        )
        direct_times.append(
            curl_time("http://127.0.0.1:5003/inbound-sentinel/api/transactions/async/check-inbound", payload)
        )

    add_times = [g - d for g, d in zip(gateway_times, direct_times)]

    print(f"gateway_avg_ms={ms(statistics.mean(gateway_times)):.3f}")
    print(f"direct_avg_ms={ms(statistics.mean(direct_times)):.3f}")
    print(f"gateway_added_avg_ms={ms(statistics.mean(add_times)):.3f}")

    for label, data in [("gateway", gateway_times), ("direct", direct_times), ("added", add_times)]:
        p95 = statistics.quantiles(data, n=100)[94]
        print(f"{label}_p95_ms={ms(p95):.3f}")


if __name__ == "__main__":
    main()
