#!/usr/bin/env python3
"""
Simulador da porta.

Ele conversa com o Founder Haus System:
- busca guests vindos do feed e residentes locais da casa
- envia scans de QR
- envia validação facial pelo house_user_id

Exemplo:
  python3 scripts/mock_door.py --base-url http://127.0.0.1:8100 pull-map
  python3 scripts/mock_door.py --base-url http://127.0.0.1:8100 scan-qr --qr qr-ana-2026-04-19
  python3 scripts/mock_door.py --base-url http://127.0.0.1:8100 scan-face --house-user-id resident-arthur-001
"""

from __future__ import annotations

import argparse
import json
import urllib.error
import urllib.request
from datetime import datetime, timezone
from typing import Any


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class ApiError(RuntimeError):
    def __init__(self, status: int, body: Any):
        self.status = status
        self.body = body
        super().__init__(f"HTTP {status}: {body}")


class FounderHausClient:
    def __init__(self, base_url: str, timeout: float = 15.0) -> None:
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    def request(self, method: str, path: str, payload: Any | None = None) -> Any:
        body = None
        headers = {"Accept": "application/json"}
        if payload is not None:
            body = json.dumps(payload).encode("utf-8")
            headers["Content-Type"] = "application/json"

        req = urllib.request.Request(
            url=f"{self.base_url}{path}",
            data=body,
            headers=headers,
            method=method.upper(),
        )

        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as response:
                raw = response.read().decode("utf-8")
                return json.loads(raw) if raw else None
        except urllib.error.HTTPError as exc:
            raw = exc.read().decode("utf-8")
            try:
                body = json.loads(raw)
            except json.JSONDecodeError:
                body = raw
            raise ApiError(exc.code, body) from exc
        except urllib.error.URLError as exc:
            raise RuntimeError(f"Falha ao conectar no Founder Haus System: {exc.reason}") from exc


def print_json(data: Any) -> None:
    print(json.dumps(data, indent=2, ensure_ascii=False))


def command_health(client: FounderHausClient, _args: argparse.Namespace) -> Any:
    return client.request("GET", "/health")


def command_pull_map(client: FounderHausClient, _args: argparse.Namespace) -> Any:
    return client.request("GET", "/door/grants-map")


def command_entries(client: FounderHausClient, _args: argparse.Namespace) -> Any:
    return client.request("GET", "/door/entries")


def command_sync_bootstrap(client: FounderHausClient, _args: argparse.Namespace) -> Any:
    return client.request("POST", "/sync/bootstrap", {})


def command_sync_changes(client: FounderHausClient, _args: argparse.Namespace) -> Any:
    return client.request("POST", "/sync/changes", {})


def command_load_fixture(client: FounderHausClient, args: argparse.Namespace) -> Any:
    payload = {"path": args.path} if args.path else {}
    return client.request("POST", "/sync/load-fixture", payload)


def command_scan_qr(client: FounderHausClient, args: argparse.Namespace) -> Any:
    payload = {
        "door_id": args.door_id,
        "device_id": args.device_id,
        "credential_type": "qrcode",
        "credential_value": args.qr,
        "occurred_at": args.occurred_at or now_iso(),
        "raw_payload": {"scanner": "mock-door", "demo": True},
    }
    return client.request("POST", "/door/validate", payload)


def command_scan_face(client: FounderHausClient, args: argparse.Namespace) -> Any:
    payload = {
        "door_id": args.door_id,
        "device_id": args.device_id,
        "credential_type": "face",
        "house_user_id": args.house_user_id,
        "occurred_at": args.occurred_at or now_iso(),
        "raw_payload": {"scanner": "mock-door", "demo": True},
    }
    return client.request("POST", "/door/validate", payload)


def command_demo(client: FounderHausClient, args: argparse.Namespace) -> Any:
    outputs: dict[str, Any] = {}
    outputs["health"] = command_health(client, args)
    outputs["grants_map"] = command_pull_map(client, args)

    result = outputs["grants_map"].get("result", {})
    qr_map = result.get("qr_code_map", {})
    resident_face_ids = result.get("resident_face_ids", [])

    if qr_map:
        qr_value = next(iter(qr_map.values()))
        outputs["scan_qr"] = client.request(
            "POST",
            "/door/validate",
            {
                "door_id": args.door_id,
                "device_id": args.device_id,
                "credential_type": "qrcode",
                "credential_value": qr_value,
                "occurred_at": now_iso(),
                "raw_payload": {"scanner": "mock-door", "demo": True},
            },
        )

    if resident_face_ids:
        outputs["scan_face"] = client.request(
            "POST",
            "/door/validate",
            {
                "door_id": args.door_id,
                "device_id": args.device_id,
                "credential_type": "face",
                "house_user_id": resident_face_ids[0],
                "occurred_at": now_iso(),
                "raw_payload": {"scanner": "mock-door", "demo": True},
            },
        )

    outputs["entries"] = command_entries(client, args)
    return outputs


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Simulador da porta.")
    parser.add_argument("--base-url", default="http://127.0.0.1:8100")

    subparsers = parser.add_subparsers(dest="command", required=True)
    subparsers.add_parser("health")
    subparsers.add_parser("pull-map")
    subparsers.add_parser("entries")
    subparsers.add_parser("sync-bootstrap")
    subparsers.add_parser("sync-changes")

    load_fixture = subparsers.add_parser("load-fixture")
    load_fixture.add_argument("--path")

    scan_qr = subparsers.add_parser("scan-qr")
    scan_qr.add_argument("--qr", required=True)
    scan_qr.add_argument("--door-id", default="front-door")
    scan_qr.add_argument("--device-id", default="door-main")
    scan_qr.add_argument("--occurred-at")

    scan_face = subparsers.add_parser("scan-face")
    scan_face.add_argument("--house-user-id", required=True)
    scan_face.add_argument("--door-id", default="front-door")
    scan_face.add_argument("--device-id", default="door-main")
    scan_face.add_argument("--occurred-at")

    demo = subparsers.add_parser("demo")
    demo.add_argument("--door-id", default="front-door")
    demo.add_argument("--device-id", default="door-main")

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    client = FounderHausClient(args.base_url)

    commands = {
        "health": command_health,
        "pull-map": command_pull_map,
        "entries": command_entries,
        "sync-bootstrap": command_sync_bootstrap,
        "sync-changes": command_sync_changes,
        "load-fixture": command_load_fixture,
        "scan-qr": command_scan_qr,
        "scan-face": command_scan_face,
        "demo": command_demo,
    }

    try:
        result = commands[args.command](client, args)
    except ApiError as exc:
        print_json({"ok": False, "status": exc.status, "error": exc.body})
        return 1
    except Exception as exc:  # noqa: BLE001 - script operacional
        print_json({"ok": False, "error": str(exc)})
        return 1

    print_json({"ok": True, "result": result})
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
