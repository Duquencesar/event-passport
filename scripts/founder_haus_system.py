#!/usr/bin/env python3
"""
Simulador do Founder Haus System.

Ele fica entre o broker (dashboard) e a porta:
- consome grants do broker via bootstrap/changes
- expõe um mapa simplificado para a porta
- valida leituras da porta
- devolve access-events para o broker

Exemplo:
  HOUSE_API_TOKEN=house-test-token \
  python3 scripts/founder_haus_system.py serve \
    --host 127.0.0.1 \
    --port 8100 \
    --fixture scripts/fixtures/founder_haus_demo_grants.json
"""

from __future__ import annotations

import argparse
import json
import os
import urllib.error
import urllib.parse
import urllib.request
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any


DEFAULT_BROKER_BASE_URL = os.getenv("BROKER_BASE_URL", "http://127.0.0.1:3000")
DEFAULT_TOKEN = os.getenv("HOUSE_API_TOKEN", "")
DEFAULT_STATE_FILE = Path(
    os.getenv("FOUNDER_HAUS_STATE_FILE", ".founder-haus-system-state.json")
).resolve()
DEFAULT_FIXTURE = Path(
    os.getenv(
        "FOUNDER_HAUS_FIXTURE_FILE",
        "scripts/fixtures/founder_haus_demo_grants.json",
    )
).resolve()


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def load_json_file(path: Path) -> Any:
    with open(path, "r", encoding="utf-8") as fh:
        return json.load(fh)


def ensure_state_file(path: Path) -> None:
    if path.exists():
        return
    save_state(
        path,
        {
            "next_cursor": None,
            "grants": {},
            "residents": {},
            "entries": [],
            "last_sync_at": None,
            "loaded_from_fixture": None,
        },
    )


def load_state(path: Path) -> dict[str, Any]:
    ensure_state_file(path)
    with open(path, "r", encoding="utf-8") as fh:
        data = json.load(fh)
    data.setdefault("next_cursor", None)
    data.setdefault("grants", {})
    data.setdefault("residents", {})
    data.setdefault("entries", [])
    data.setdefault("last_sync_at", None)
    data.setdefault("loaded_from_fixture", None)
    return data


def save_state(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=2, ensure_ascii=False)
        fh.write("\n")


def parse_iso(value: str) -> datetime:
    normalized = value.replace("Z", "+00:00")
    return datetime.fromisoformat(normalized)


def is_active_grant(grant: dict[str, Any], occurred_at: str) -> bool:
    if grant.get("status") != "active":
        return False
    try:
        occurred = parse_iso(occurred_at)
        valid_from = parse_iso(grant["valid_from"])
        valid_until = parse_iso(grant["valid_until"])
    except Exception:
        return False
    return valid_from <= occurred <= valid_until


def sort_grants(grants: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    return sorted(grants.values(), key=lambda item: (item.get("updated_at") or "", item["grant_id"]))


def merge_grants(state: dict[str, Any], payload: dict[str, Any]) -> dict[str, Any]:
    grants = state.setdefault("grants", {})
    for grant in payload.get("grants", []):
        grants[grant["grant_id"]] = grant
    state["next_cursor"] = payload.get("next_cursor", state.get("next_cursor"))
    state["last_sync_at"] = now_iso()
    return state


def merge_residents(state: dict[str, Any], residents: list[dict[str, Any]]) -> dict[str, Any]:
    resident_map = state.setdefault("residents", {})
    for resident in residents:
        house_user_id = resident.get("house_user_id")
        if not house_user_id:
            continue
        resident_map[house_user_id] = resident
    return state


def load_fixture_into_state(state: dict[str, Any], fixture_path: Path) -> dict[str, Any]:
    payload = load_json_file(fixture_path)
    if isinstance(payload, list):
        payload = {"generated_at": now_iso(), "next_cursor": now_iso(), "grants": payload, "residents": []}
    if not isinstance(payload, dict) or "grants" not in payload:
        raise RuntimeError("Fixture inválida. Esperado objeto com { grants: [] } ou uma lista de grants.")
    state["grants"] = {}
    state["residents"] = {}
    merge_grants(state, payload)
    merge_residents(state, payload.get("residents", []))
    state["loaded_from_fixture"] = str(fixture_path)
    state["last_fixture_load_at"] = now_iso()
    return state


class ApiError(RuntimeError):
    def __init__(self, status: int, body: Any):
        self.status = status
        self.body = body
        super().__init__(f"HTTP {status}: {body}")


@dataclass
class BrokerClient:
    base_url: str
    token: str
    timeout: float = 15.0

    def is_configured(self) -> bool:
        return bool(self.base_url and self.token)

    def request(self, method: str, path: str, payload: Any | None = None) -> Any:
        if not self.is_configured():
            raise RuntimeError("Broker não configurado. Defina BROKER_BASE_URL e HOUSE_API_TOKEN.")

        body = None
        headers = {
            "Accept": "application/json",
            "Authorization": f"Bearer {self.token}",
        }
        if payload is not None:
            body = json.dumps(payload).encode("utf-8")
            headers["Content-Type"] = "application/json"

        req = urllib.request.Request(
            url=f"{self.base_url.rstrip('/')}{path}",
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
            raise RuntimeError(f"Falha ao conectar no broker {self.base_url}: {exc.reason}") from exc

    def bootstrap(self) -> Any:
        return self.request("GET", "/api/house/v1/feed")

    def changes(self, cursor: str | None) -> Any:
        suffix = f"?cursor={urllib.parse.quote(cursor)}" if cursor else ""
        return self.request("GET", f"/api/house/v1/feed{suffix}")

    def heartbeat(self, device_id: str, label: str | None = None, metadata: Any | None = None) -> Any:
        return self.request(
            "POST",
            "/api/house/v1/heartbeat",
            {"device_id": device_id, "label": label, "metadata": metadata or {}},
        )

    def access_events(self, events: list[dict[str, Any]]) -> Any:
        return self.request("POST", "/api/house/v1/access-events/batch", {"events": events})


@dataclass
class AppContext:
    state_file: Path
    broker: BrokerClient
    system_device_id: str
    system_label: str


def build_grants_map(state: dict[str, Any]) -> dict[str, Any]:
    qr_code_map: dict[str, str] = {}
    residents_face_ids: list[str] = []
    grants = sort_grants(state.get("grants", {}))
    residents = state.get("residents", {})

    for grant in grants:
        if grant.get("status") != "active":
            continue
        if grant.get("credential_type") == "qrcode" and grant.get("credential_value"):
            qr_code_map[grant["house_user_id"]] = grant["credential_value"]

    for resident in residents.values():
        if resident.get("status", "active") != "active":
            continue
        if resident.get("credential_type", "face") == "face":
            residents_face_ids.append(resident["house_user_id"])

    return {
        "generated_at": now_iso(),
        "active_grants": len([grant for grant in grants if grant.get("status") == "active"]),
        "active_residents": len(
            [resident for resident in residents.values() if resident.get("status", "active") == "active"]
        ),
        "qr_code_map": qr_code_map,
        "resident_face_ids": residents_face_ids,
    }


def find_grant_for_scan(
    state: dict[str, Any],
    credential_type: str,
    credential_value: str | None,
    house_user_id: str | None,
    occurred_at: str,
) -> dict[str, Any] | None:
    grants = sort_grants(state.get("grants", {}))

    if credential_type == "qrcode":
        for grant in grants:
            if grant.get("credential_type") != "qrcode":
                continue
            if grant.get("credential_value") != credential_value:
                continue
            if is_active_grant(grant, occurred_at):
                return grant
        return None

    if house_user_id:
        for grant in grants:
            if grant.get("house_user_id") != house_user_id:
                continue
            if is_active_grant(grant, occurred_at):
                return grant
    return None


def find_resident_for_scan(
    state: dict[str, Any],
    house_user_id: str | None,
) -> dict[str, Any] | None:
    if not house_user_id:
        return None
    resident = state.get("residents", {}).get(house_user_id)
    if not resident:
        return None
    if resident.get("status", "active") != "active":
        return None
    return resident


def append_entry(state: dict[str, Any], entry: dict[str, Any]) -> None:
    entries = state.setdefault("entries", [])
    entries.append(entry)


def sync_entry_to_broker(context: AppContext, entry: dict[str, Any]) -> tuple[bool, Any]:
    if not context.broker.is_configured():
        return False, {"error": "Broker não configurado."}

    payload = {
        "house_event_id": entry["house_event_id"],
        "device_id": entry["device_id"],
        "door_id": entry["door_id"],
        "house_user_id": entry["house_user_id"],
        "credential_type": entry["credential_type"],
        "credential_value": entry["credential_value"],
        "decision": entry["decision"],
        "reason": entry.get("reason"),
        "occurred_at": entry["occurred_at"],
        "event_id": entry.get("event_id"),
        "event_name": entry.get("event_name"),
        "raw_payload": entry.get("raw_payload", {}),
    }

    try:
        response = context.broker.access_events([payload])
        return True, response
    except Exception as exc:  # noqa: BLE001 - fluxo de demo
        return False, {"error": str(exc)}


def validate_scan(context: AppContext, body: dict[str, Any]) -> dict[str, Any]:
    state = load_state(context.state_file)
    occurred_at = body.get("occurred_at") or now_iso()
    credential_type = body.get("credential_type") or "unknown"
    credential_value = body.get("credential_value")
    house_user_id = body.get("house_user_id")

    grant = find_grant_for_scan(
        state=state,
        credential_type=credential_type,
        credential_value=credential_value,
        house_user_id=house_user_id,
        occurred_at=occurred_at,
    )
    resident = None if grant else find_resident_for_scan(state=state, house_user_id=house_user_id)

    decision = "granted" if grant or resident else "denied"
    reason = body.get("reason") or (None if grant or resident else "Credential not mapped or not active")
    event = {
        "house_event_id": f"fhs-{uuid.uuid4()}",
        "device_id": body.get("device_id") or "door-main",
        "door_id": body.get("door_id") or "front-door",
        "house_user_id": grant["house_user_id"] if grant else resident.get("house_user_id") if resident else house_user_id,
        "credential_type": credential_type,
        "credential_value": credential_value,
        "decision": decision,
        "reason": reason,
        "occurred_at": occurred_at,
        "grant_id": grant["grant_id"] if grant else None,
        "event_id": grant.get("event_id") if grant else None,
        "person_name": grant.get("person_name") if grant else resident.get("person_name") if resident else None,
        "event_name": grant.get("event_name") if grant else None,
        "access_subject": "guest" if grant else "resident" if resident else "unknown",
        "raw_payload": body.get("raw_payload") or {},
        "broker_synced": False,
        "broker_response": None,
        "created_at": now_iso(),
    }

    synced, broker_response = sync_entry_to_broker(context, event)
    event["broker_synced"] = synced
    event["broker_response"] = broker_response

    append_entry(state, event)
    save_state(context.state_file, state)

    return {
        "allowed": decision == "granted",
        "decision": decision,
        "reason": reason,
        "house_user_id": event["house_user_id"],
        "grant_id": event["grant_id"],
        "person_name": event["person_name"],
        "event_name": event["event_name"],
        "access_subject": event["access_subject"],
        "dashboard_synced": synced,
        "dashboard_response": broker_response,
        "event": event,
    }


def replay_pending(context: AppContext) -> dict[str, Any]:
    state = load_state(context.state_file)
    pending = [entry for entry in state.get("entries", []) if not entry.get("broker_synced")]
    synced = 0

    for entry in pending:
        ok, response = sync_entry_to_broker(context, entry)
        entry["broker_synced"] = ok
        entry["broker_response"] = response
        if ok:
            synced += 1

    save_state(context.state_file, state)
    return {"pending": len(pending), "synced": synced}


def bootstrap_from_broker(context: AppContext) -> dict[str, Any]:
    payload = context.broker.bootstrap()
    state = load_state(context.state_file)
    merge_grants(state, payload)
    save_state(context.state_file, state)
    return payload


def changes_from_broker(context: AppContext) -> dict[str, Any]:
    state = load_state(context.state_file)
    payload = context.broker.changes(state.get("next_cursor"))
    merge_grants(state, payload)
    save_state(context.state_file, state)
    return payload


def heartbeat_to_broker(context: AppContext) -> Any:
    return context.broker.heartbeat(
        device_id=context.system_device_id,
        label=context.system_label,
        metadata={"component": "founder-haus-system", "simulated": True},
    )


def load_fixture(context: AppContext, path: Path) -> dict[str, Any]:
    state = load_state(context.state_file)
    load_fixture_into_state(state, path)
    save_state(context.state_file, state)
    return {
        "ok": True,
        "fixture": str(path),
        "grants_loaded": len(state.get("grants", {})),
        "residents_loaded": len(state.get("residents", {})),
    }


class FounderHausHandler(BaseHTTPRequestHandler):
    server: "FounderHausServer"

    def log_message(self, format: str, *args: Any) -> None:  # noqa: A003 - assinatura da stdlib
        return

    def _json_response(self, status: int, payload: Any) -> None:
        encoded = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def _read_json(self) -> dict[str, Any]:
        content_length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(content_length) if content_length else b"{}"
        if not raw:
            return {}
        try:
            data = json.loads(raw.decode("utf-8"))
            return data if isinstance(data, dict) else {}
        except json.JSONDecodeError:
            raise ValueError("JSON inválido.")

    def _handle_exception(self, exc: Exception) -> None:
        self._json_response(
            500,
            {
                "ok": False,
                "error": str(exc),
            },
        )

    def do_GET(self) -> None:  # noqa: N802 - stdlib
        try:
            parsed = urllib.parse.urlparse(self.path)
            if parsed.path == "/health":
                state = load_state(self.server.context.state_file)
                self._json_response(
                    200,
                    {
                        "ok": True,
                        "checked_at": now_iso(),
                        "grants_count": len(state.get("grants", {})),
                        "residents_count": len(state.get("residents", {})),
                        "entries_count": len(state.get("entries", [])),
                        "next_cursor": state.get("next_cursor"),
                    },
                )
                return

            if parsed.path == "/grants":
                state = load_state(self.server.context.state_file)
                self._json_response(
                    200,
                    {
                        "ok": True,
                        "grants": sort_grants(state.get("grants", {})),
                    },
                )
                return

            if parsed.path == "/door/grants-map":
                state = load_state(self.server.context.state_file)
                self._json_response(200, {"ok": True, "result": build_grants_map(state)})
                return

            if parsed.path == "/door/entries":
                state = load_state(self.server.context.state_file)
                self._json_response(200, {"ok": True, "entries": state.get("entries", [])})
                return

            self._json_response(404, {"ok": False, "error": "Not found"})
        except Exception as exc:  # noqa: BLE001 - servidor de demo
            self._handle_exception(exc)

    def do_POST(self) -> None:  # noqa: N802 - stdlib
        try:
            parsed = urllib.parse.urlparse(self.path)
            body = self._read_json()
            context = self.server.context

            if parsed.path == "/sync/bootstrap":
                result = bootstrap_from_broker(context)
                self._json_response(200, {"ok": True, "result": result})
                return

            if parsed.path == "/sync/changes":
                result = changes_from_broker(context)
                self._json_response(200, {"ok": True, "result": result})
                return

            if parsed.path == "/sync/heartbeat":
                result = heartbeat_to_broker(context)
                self._json_response(200, {"ok": True, "result": result})
                return

            if parsed.path == "/sync/load-fixture":
                fixture_path = Path(body.get("path") or self.server.default_fixture).resolve()
                result = load_fixture(context, fixture_path)
                self._json_response(200, {"ok": True, "result": result})
                return

            if parsed.path == "/dashboard/replay-pending":
                result = replay_pending(context)
                self._json_response(200, {"ok": True, "result": result})
                return

            if parsed.path == "/door/validate":
                result = validate_scan(context, body)
                self._json_response(200, {"ok": True, "result": result})
                return

            self._json_response(404, {"ok": False, "error": "Not found"})
        except ValueError as exc:
            self._json_response(400, {"ok": False, "error": str(exc)})
        except Exception as exc:  # noqa: BLE001 - servidor de demo
            self._handle_exception(exc)


class FounderHausServer(ThreadingHTTPServer):
    def __init__(
        self,
        server_address: tuple[str, int],
        context: AppContext,
        default_fixture: Path,
    ) -> None:
        super().__init__(server_address, FounderHausHandler)
        self.context = context
        self.default_fixture = default_fixture


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Simulador do Founder Haus System.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    serve = subparsers.add_parser("serve", help="Sobe o servidor HTTP do sistema da casa")
    serve.add_argument("--host", default="127.0.0.1")
    serve.add_argument("--port", type=int, default=8100)
    serve.add_argument("--state-file", type=Path, default=DEFAULT_STATE_FILE)
    serve.add_argument("--broker-base-url", default=DEFAULT_BROKER_BASE_URL)
    serve.add_argument("--broker-token", default=DEFAULT_TOKEN)
    serve.add_argument("--fixture", type=Path, default=DEFAULT_FIXTURE)
    serve.add_argument("--system-device-id", default="founder-haus-system")
    serve.add_argument("--system-label", default="Founder Haus System")
    serve.add_argument(
        "--auto-load-fixture",
        action="store_true",
        help="Carrega a fixture no startup se o state estiver vazio",
    )

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    if args.command != "serve":
        parser.error("Comando inválido.")

    broker = BrokerClient(base_url=args.broker_base_url, token=args.broker_token)
    context = AppContext(
        state_file=args.state_file.resolve(),
        broker=broker,
        system_device_id=args.system_device_id,
        system_label=args.system_label,
    )

    ensure_state_file(context.state_file)
    if args.auto_load_fixture:
        state = load_state(context.state_file)
        if not state.get("grants"):
            load_fixture(context, args.fixture.resolve())

    server = FounderHausServer(
        (args.host, args.port),
        context=context,
        default_fixture=args.fixture.resolve(),
    )
    print(
        json.dumps(
            {
                "ok": True,
                "message": "Founder Haus System running",
                "host": args.host,
                "port": args.port,
                "state_file": str(context.state_file),
                "broker_base_url": args.broker_base_url,
                "fixture": str(args.fixture.resolve()),
            },
            ensure_ascii=False,
        )
    )
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print(json.dumps({"ok": True, "message": "Founder Haus System stopped"}, ensure_ascii=False))
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
