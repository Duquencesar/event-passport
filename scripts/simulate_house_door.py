#!/usr/bin/env python3
"""
Simula o sistema da casa/porta consumindo os endpoints do broker.

Exemplos:
  python3 scripts/simulate_house_door.py health
  python3 scripts/simulate_house_door.py heartbeat --device-id door-main
  python3 scripts/simulate_house_door.py bootstrap
  python3 scripts/simulate_house_door.py changes
  python3 scripts/simulate_house_door.py emit-event --grant-id <grant_id>
  python3 scripts/simulate_house_door.py demo-cycle --device-id door-main
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


DEFAULT_BASE_URL = os.getenv("HOUSE_BASE_URL", "http://127.0.0.1:3000")
DEFAULT_TOKEN = os.getenv("HOUSE_API_TOKEN", "")
DEFAULT_STATE_FILE = Path(
    os.getenv("HOUSE_SIM_STATE_FILE", ".house-sim-state.json")
).resolve()
HOUSE_DEMO_MARKER = "house-door-demo-v1"


class ApiError(RuntimeError):
    def __init__(self, status: int, body: Any):
        self.status = status
        self.body = body
        super().__init__(f"HTTP {status}: {body}")


@dataclass
class HouseClient:
    base_url: str
    token: str
    timeout: float = 15.0

    def request(self, method: str, path: str, payload: Any | None = None) -> Any:
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
            raise RuntimeError(f"Falha ao conectar em {self.base_url}: {exc.reason}") from exc


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def parse_json_file(path: str | None) -> Any:
    if not path:
        return {}
    with open(path, "r", encoding="utf-8") as fh:
        return json.load(fh)


def load_state(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {"next_cursor": None, "grants": {}, "demo": None}
    with open(path, "r", encoding="utf-8") as fh:
        data = json.load(fh)
    if "grants" not in data or not isinstance(data["grants"], dict):
        data["grants"] = {}
    data.setdefault("demo", None)
    return data


def save_state(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=2, ensure_ascii=False)
        fh.write("\n")


def merge_grants(state: dict[str, Any], grants: list[dict[str, Any]], next_cursor: str | None) -> None:
    grant_map = state.setdefault("grants", {})
    for grant in grants:
        grant_map[grant["grant_id"]] = grant
    if next_cursor:
        state["next_cursor"] = next_cursor
    state["last_sync_at"] = utc_now_iso()


def sorted_grants(state: dict[str, Any]) -> list[dict[str, Any]]:
    grants = list(state.get("grants", {}).values())
    return sorted(grants, key=lambda item: item.get("updated_at") or "")


def pick_grant(
    state: dict[str, Any],
    grant_id: str | None,
    house_user_id: str | None,
) -> dict[str, Any]:
    grants = sorted_grants(state)
    if grant_id:
        match = state.get("grants", {}).get(grant_id)
        if not match:
            raise RuntimeError(f"Grant não encontrado no state file: {grant_id}")
        return match

    active = [item for item in grants if item.get("status") == "active"]
    if house_user_id:
        active = [item for item in active if item.get("house_user_id") == house_user_id]

    if not active:
        raise RuntimeError(
            "Nenhum grant ativo encontrado no state file. Rode bootstrap/changes antes."
        )
    return active[0]


def command_health(client: HouseClient, _args: argparse.Namespace) -> Any:
    return client.request("GET", "/api/house/v1/health")


def command_heartbeat(client: HouseClient, args: argparse.Namespace) -> Any:
    metadata = parse_json_file(args.metadata_json)
    return client.request(
        "POST",
        "/api/house/v1/heartbeat",
        {
            "device_id": args.device_id,
            "label": args.label,
            "metadata": metadata,
        },
    )


def command_bootstrap(client: HouseClient, args: argparse.Namespace) -> Any:
    data = client.request("GET", "/api/house/v1/feed")
    state = load_state(args.state_file)
    merge_grants(state, data.get("grants", []), data.get("next_cursor"))
    state["last_bootstrap"] = data.get("generated_at")
    save_state(args.state_file, state)
    return data


def command_changes(client: HouseClient, args: argparse.Namespace) -> Any:
    state = load_state(args.state_file)
    cursor = args.cursor or state.get("next_cursor")
    suffix = f"?cursor={urllib.parse.quote(cursor)}" if cursor else ""
    data = client.request("GET", f"/api/house/v1/feed{suffix}")
    merge_grants(state, data.get("grants", []), data.get("next_cursor"))
    save_state(args.state_file, state)
    return data


def command_prepare_demo(client: HouseClient, args: argparse.Namespace) -> Any:
    data = client.request("POST", "/api/house/v1/demo/prepare", {})
    state = {"next_cursor": None, "grants": {}, "demo": data}
    save_state(args.state_file, state)
    return data


def build_event_from_args(state: dict[str, Any], args: argparse.Namespace) -> dict[str, Any]:
    grant = None
    if args.grant_id:
        grant = pick_grant(state, args.grant_id, args.house_user_id)
    elif args.house_user_id and state.get("grants"):
        try:
            grant = pick_grant(state, None, args.house_user_id)
        except RuntimeError:
            grant = None

    credential_type = (
        args.credential_type
        or (grant.get("credential_type") if grant else None)
        or "unknown"
    )
    credential_value = (
        args.credential_value
        or (grant.get("credential_value") if grant else None)
        or None
    )
    house_user_id = args.house_user_id or (grant.get("house_user_id") if grant else None)

    if not house_user_id:
        raise RuntimeError(
            "house_user_id ausente. Informe --house-user-id ou selecione um grant pelo state file."
        )

    demo = state.get("demo") or {}
    demo_event = demo.get("event") or {}

    return {
        "house_event_id": args.house_event_id or f"sim-{uuid.uuid4()}",
        "device_id": args.device_id,
        "door_id": args.door_id,
        "house_user_id": house_user_id,
        "credential_type": credential_type,
        "credential_value": credential_value,
        "decision": args.decision,
        "reason": args.reason,
        "occurred_at": args.occurred_at or demo_event.get("occurred_at") or utc_now_iso(),
        "event_id": demo_event.get("id"),
        "event_name": demo_event.get("name"),
        "raw_payload": parse_json_file(args.raw_json) or {"demo_marker": HOUSE_DEMO_MARKER},
    }


def command_emit_event(client: HouseClient, args: argparse.Namespace) -> Any:
    state = load_state(args.state_file)
    event = build_event_from_args(state, args)
    return client.request("POST", "/api/house/v1/access-events/batch", {"events": [event]})


def command_demo_cycle(client: HouseClient, args: argparse.Namespace) -> Any:
    outputs: dict[str, Any] = {}
    outputs["prepare_demo"] = command_prepare_demo(client, args)
    outputs["health"] = command_health(client, args)
    outputs["heartbeat"] = command_heartbeat(client, args)

    state = load_state(args.state_file)
    if not state.get("next_cursor"):
        outputs["bootstrap"] = command_bootstrap(client, args)
    else:
        outputs["changes"] = command_changes(client, args)

    outputs["emit_event"] = command_emit_event(client, args)
    return outputs


def print_json(data: Any) -> None:
    print(json.dumps(data, indent=2, ensure_ascii=False))


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Simula o sistema da casa/porta contra os endpoints do broker."
    )
    parser.add_argument(
        "--base-url",
        default=DEFAULT_BASE_URL,
        help=f"URL base da app (default: {DEFAULT_BASE_URL})",
    )
    parser.add_argument(
        "--token",
        default=DEFAULT_TOKEN,
        help="Bearer token para os endpoints da casa (default: HOUSE_API_TOKEN do ambiente)",
    )
    parser.add_argument(
        "--state-file",
        type=Path,
        default=DEFAULT_STATE_FILE,
        help=f"Arquivo local para cursor/grants (default: {DEFAULT_STATE_FILE})",
    )

    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("health", help="Chama GET /api/house/v1/health")

    heartbeat = subparsers.add_parser(
        "heartbeat", help="Envia heartbeat do bridge/porta"
    )
    heartbeat.add_argument("--device-id", default="door-main", help="ID do dispositivo")
    heartbeat.add_argument("--label", default="Front Door", help="Label do dispositivo")
    heartbeat.add_argument(
        "--metadata-json",
        help="Caminho para JSON com metadata extra do dispositivo",
    )

    subparsers.add_parser(
        "bootstrap", help="Busca o snapshot completo de grants ativos"
    )

    subparsers.add_parser(
        "prepare-demo", help="Reseta e recria a demo integrada no dashboard"
    )

    changes = subparsers.add_parser(
        "changes", help="Busca deltas a partir do cursor salvo"
    )
    changes.add_argument("--cursor", help="Cursor ISO-8601. Se omitido, usa o state file.")

    emit = subparsers.add_parser(
        "emit-event", help="Envia um evento de acesso de volta para o broker"
    )
    emit.add_argument("--grant-id", help="Grant salvo no state file para usar como base")
    emit.add_argument("--house-user-id", help="House user id a ser usado no evento")
    emit.add_argument(
        "--decision",
        choices=["granted", "denied"],
        default="granted",
        help="Decisão do evento",
    )
    emit.add_argument(
        "--credential-type",
        choices=["face", "qrcode", "card", "unknown"],
        help="Tipo de credencial",
    )
    emit.add_argument("--credential-value", help="Valor da credencial lida")
    emit.add_argument("--device-id", default="door-main", help="ID do dispositivo")
    emit.add_argument("--door-id", default="front-door", help="ID da porta")
    emit.add_argument("--house-event-id", help="ID externo do evento retornado pela casa")
    emit.add_argument("--occurred-at", help="Timestamp ISO-8601 do acesso")
    emit.add_argument("--reason", help="Motivo adicional, útil para denied")
    emit.add_argument("--raw-json", help="Caminho para JSON bruto enviado no payload")

    demo = subparsers.add_parser(
        "demo-cycle",
        help="Executa health + heartbeat + bootstrap/changes + emit-event",
    )
    demo.add_argument("--device-id", default="door-main", help="ID do dispositivo")
    demo.add_argument("--label", default="Front Door", help="Label do dispositivo")
    demo.add_argument("--metadata-json", help="Caminho para JSON com metadata extra")
    demo.add_argument("--grant-id", help="Grant salvo no state file para usar como base")
    demo.add_argument("--house-user-id", help="House user id a ser usado no evento")
    demo.add_argument(
        "--decision",
        choices=["granted", "denied"],
        default="granted",
        help="Decisão do evento",
    )
    demo.add_argument(
        "--credential-type",
        choices=["face", "qrcode", "card", "unknown"],
        help="Tipo de credencial",
    )
    demo.add_argument("--credential-value", help="Valor da credencial lida")
    demo.add_argument("--door-id", default="front-door", help="ID da porta")
    demo.add_argument("--house-event-id", help="ID externo do evento retornado pela casa")
    demo.add_argument("--occurred-at", help="Timestamp ISO-8601 do acesso")
    demo.add_argument("--reason", help="Motivo adicional, útil para denied")
    demo.add_argument("--raw-json", help="Caminho para JSON bruto enviado no payload")

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    if not args.token:
        print(
            "Erro: informe --token ou defina HOUSE_API_TOKEN no ambiente.",
            file=sys.stderr,
        )
        return 2

    client = HouseClient(base_url=args.base_url, token=args.token)
    commands = {
        "health": command_health,
        "heartbeat": command_heartbeat,
        "bootstrap": command_bootstrap,
        "changes": command_changes,
        "prepare-demo": command_prepare_demo,
        "emit-event": command_emit_event,
        "demo-cycle": command_demo_cycle,
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
