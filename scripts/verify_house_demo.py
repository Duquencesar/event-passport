#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.parse
import urllib.request
from typing import Any


DEFAULT_BASE_URL = os.getenv("HOUSE_BASE_URL", "http://127.0.0.1:3000")


class CheckFailed(RuntimeError):
    pass


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise CheckFailed(message)


def app_request(base_url: str, token: str, method: str, path: str, payload: Any | None = None) -> Any:
    body = None if payload is None else json.dumps(payload).encode("utf-8")
    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {token}",
    }
    if body is not None:
        headers["Content-Type"] = "application/json"

    req = urllib.request.Request(
        url=f"{base_url.rstrip('/')}{path}",
        data=body,
        headers=headers,
        method=method.upper(),
    )
    with urllib.request.urlopen(req, timeout=30) as response:
        raw = response.read().decode("utf-8")
        return json.loads(raw) if raw else None


def supabase_get(path: str, params: dict[str, str]) -> Any:
    base_url = os.getenv("SUPABASE_URL")
    service_role = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not base_url or not service_role:
        raise CheckFailed("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios para verificar a demo.")

    query = urllib.parse.urlencode(params)
    url = f"{base_url.rstrip('/')}/rest/v1/{path}?{query}"
    req = urllib.request.Request(
        url=url,
        headers={
            "Accept": "application/json",
            "apikey": service_role,
            "Authorization": f"Bearer {service_role}",
        },
        method="GET",
    )
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def fetch_single_row(table: str, filters: dict[str, str], select: str) -> dict[str, Any]:
    rows = supabase_get(table, {"select": select, **filters})
    assert_true(len(rows) == 1, f"Esperava 1 linha em {table} para {filters}, recebi {len(rows)}")
    return rows[0]


def main() -> int:
    parser = argparse.ArgumentParser(description="Verifica a demo house/door end-to-end contra app + Supabase.")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL)
    parser.add_argument("--token", default=os.getenv("HOUSE_API_TOKEN", ""))
    args = parser.parse_args()

    if not args.token:
      print(json.dumps({"ok": False, "error": "HOUSE_API_TOKEN é obrigatório"}, indent=2, ensure_ascii=False))
      return 1

    try:
        prepared_once = app_request(args.base_url, args.token, "POST", "/api/house/v1/demo/prepare", {})
        prepared_twice = app_request(args.base_url, args.token, "POST", "/api/house/v1/demo/prepare", {})

        event = prepared_twice["event"]
        guests = prepared_twice["guests"]
        residents = prepared_twice["residents"]
        occurred_at = event["occurred_at"]

        assert_true(event["name"] == "Demo Test", "A demo precisa recriar o evento Demo Test")
        assert_true(prepared_once["event"]["id"] == event["id"], "O reset repetido deve manter o ID fixo do evento demo")

        feed = app_request(args.base_url, args.token, "GET", "/api/house/v1/feed")
        resident_ids = {resident["house_user_id"] for resident in residents}
        feed_house_user_ids = {grant["house_user_id"] for grant in feed["grants"]}

        assert_true(len(feed["grants"]) == len(guests), "O feed demo deve exportar apenas os guests seeded")
        assert_true(resident_ids.isdisjoint(feed_house_user_ids), "Residentes não podem aparecer no feed")
        assert_true(all(grant["source"] == "luma" for grant in feed["grants"]), "Todos os grants demo devem sair como source=luma")

        guest = guests[0]
        resident = residents[0]

        guest_event = {
            "house_event_id": "verify-demo-guest-granted",
            "house_user_id": guest["house_user_id"],
            "credential_type": "qrcode",
            "credential_value": guest["luma_guest_id"],
            "decision": "granted",
            "occurred_at": occurred_at,
            "event_id": event["id"],
            "event_name": event["name"],
            "raw_payload": {"demo_marker": prepared_twice["marker"], "test_case": "guest_granted"},
        }
        guest_result = app_request(args.base_url, args.token, "POST", "/api/house/v1/access-events/batch", {"events": [guest_event]})
        assert_true(guest_result["inserted"] == 1, "Grant de guest deve inserir um access-event")
        assert_true(guest_result["granted_checkins_created"] == 1, "Grant de guest deve criar presença")

        guest_replay = app_request(args.base_url, args.token, "POST", "/api/house/v1/access-events/batch", {"events": [guest_event]})
        assert_true(guest_replay["duplicated"] == 1, "Replay do mesmo house_event_id deve ser idempotente")
        assert_true(guest_replay["granted_checkins_created"] == 0, "Replay não pode duplicar presença")

        resident_event = {
            "house_event_id": "verify-demo-resident-granted",
            "house_user_id": resident["house_user_id"],
            "credential_type": "face",
            "decision": "granted",
            "occurred_at": occurred_at,
            "event_id": event["id"],
            "event_name": event["name"],
            "raw_payload": {"demo_marker": prepared_twice["marker"], "test_case": "resident_granted"},
        }
        resident_result = app_request(args.base_url, args.token, "POST", "/api/house/v1/access-events/batch", {"events": [resident_event]})
        assert_true(resident_result["inserted"] == 1, "Grant de residente deve inserir um access-event")
        assert_true(resident_result["granted_checkins_created"] == 1, "Grant de residente deve criar presença")

        denied_event = {
            "house_event_id": "verify-demo-denied",
            "credential_type": "qrcode",
            "credential_value": "verify-invalid-qr",
            "decision": "denied",
            "reason": "invalid demo credential",
            "occurred_at": occurred_at,
            "event_id": event["id"],
            "event_name": event["name"],
            "raw_payload": {"demo_marker": prepared_twice["marker"], "test_case": "denied"},
        }
        denied_result = app_request(args.base_url, args.token, "POST", "/api/house/v1/access-events/batch", {"events": [denied_event]})
        assert_true(denied_result["inserted"] == 1, "Denied deve entrar no log bruto")
        assert_true(denied_result["granted_checkins_created"] == 0, "Denied não pode criar presença")

        checkins = supabase_get(
            "checkins",
            {
                "select": "person_id,event_id,event_name,source",
                "event_id": f"eq.{event['id']}",
                "order": "person_id.asc",
            },
        )
        assert_true(len(checkins) == 2, "A demo verificada deve terminar com 2 presenças no Demo Test")
        assert_true(all(row["event_name"] == "Demo Test" for row in checkins), "As presenças devem apontar para o Demo Test")

        denied_log = fetch_single_row(
            "house_access_logs_raw",
            {"house_event_id": "eq.verify-demo-denied"},
            "house_event_id,decision,processed_at,resolved_event_id,resolved_event_name",
        )
        assert_true(denied_log["decision"] == "denied", "O acesso negado deve permanecer como denied no log bruto")
        assert_true(denied_log["processed_at"] is not None, "O log denied precisa ficar marcado como processado")
        assert_true(denied_log["resolved_event_id"] == event["id"], "A heurística da demo deve resolver o denied para o Demo Test")

        granted_log = fetch_single_row(
            "house_access_logs_raw",
            {"house_event_id": "eq.verify-demo-resident-granted"},
            "house_event_id,decision,resolved_event_id,resolved_event_name",
        )
        assert_true(granted_log["decision"] == "granted", "O acesso de residente precisa entrar como granted")
        assert_true(granted_log["resolved_event_id"] == event["id"], "Grant de residente deve resolver para o Demo Test")

        event_row = fetch_single_row(
            "events",
            {"id": f"eq.{event['id']}"},
            "id,name,date",
        )
        assert_true(event_row["name"] == "Demo Test", "O evento demo deve existir no banco")

        print(
            json.dumps(
                {
                    "ok": True,
                    "event": event,
                    "checks": {
                        "feed_guests_only": True,
                        "resident_outside_feed": True,
                        "guest_granted_presence": True,
                        "resident_granted_presence": True,
                        "denied_without_presence": True,
                        "idempotent_replay": True,
                        "resolution_hits_demo_test": True,
                    },
                },
                indent=2,
                ensure_ascii=False,
            )
        )
        return 0
    except CheckFailed as exc:
        print(json.dumps({"ok": False, "error": str(exc)}, indent=2, ensure_ascii=False))
        return 1
    except Exception as exc:  # noqa: BLE001 - script operacional
        print(json.dumps({"ok": False, "error": str(exc)}, indent=2, ensure_ascii=False))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
