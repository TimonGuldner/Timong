#!/usr/bin/env python3
import json, re, sys
from pathlib import Path

raw_path = Path(sys.argv[1])
out_path = Path(sys.argv[2])
raw = raw_path.read_text(encoding="utf-8", errors="replace").strip()


def extract_json(text: str):
    candidates = [text]
    m = re.search(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", text, re.I)
    if m:
        candidates.insert(0, m.group(1))
    start = text.find("{")
    end = text.rfind("}")
    if 0 <= start < end:
        candidates.append(text[start:end+1])
    for c in candidates:
        try:
            v = json.loads(c)
            if isinstance(v, dict):
                return v
        except Exception:
            pass
    return None

obj = extract_json(raw)
if obj is None:
    obj = {
        "status": "BLOCKED",
        "summary": "Hermes returned non-JSON output; no autonomous decision was accepted.",
        "decision": None,
        "learning": None,
        "actions": [{
            "type": "NOOP",
            "description": "Output contract validation failed safely.",
            "artifact": None,
            "requires_owner": False,
        }],
        "next_heartbeat_focus": "Retry with strict JSON output.",
        "raw_excerpt": raw[:2000],
    }

allowed_status = {"SUCCEEDED", "BLOCKED"}
allowed_decisions = {"GO", "ITERATE", "SCALE", "PAUSE", "KILL"}
allowed_actions = {"RESEARCH", "ANALYSIS", "CONTENT_BRIEF", "EXPERIMENT_DESIGN", "MEMORY_UPDATE", "NOOP"}

obj["status"] = obj.get("status") if obj.get("status") in allowed_status else "BLOCKED"
obj["summary"] = str(obj.get("summary") or "")[:4000]

if not isinstance(obj.get("decision"), dict) or obj["decision"].get("decision") not in allowed_decisions:
    obj["decision"] = None
else:
    d = obj["decision"]
    try:
        d["confidence"] = max(0, min(100, float(d.get("confidence", 0))))
    except Exception:
        d["confidence"] = 0
    d["reasoning"] = str(d.get("reasoning") or "")[:8000]
    d["business_slug"] = d.get("business_slug") or None
    d["experiment_id"] = d.get("experiment_id") or None
    d["evidence"] = d.get("evidence") if isinstance(d.get("evidence"), dict) else {}
    d["reversible"] = d.get("reversible") is not False

if not isinstance(obj.get("learning"), dict) or not obj["learning"].get("learning"):
    obj["learning"] = None
else:
    l = obj["learning"]
    l["business_slug"] = l.get("business_slug") or None
    l["experiment_id"] = l.get("experiment_id") or None
    l["category"] = str(l.get("category") or "autonomous_heartbeat")[:200]
    l["learning"] = str(l.get("learning") or "")[:8000]
    l["evidence"] = l.get("evidence") if isinstance(l.get("evidence"), dict) else {}
    try:
        l["confidence"] = max(0, min(100, float(l.get("confidence", 0))))
    except Exception:
        l["confidence"] = 0
    l["reusable"] = l.get("reusable") is not False

actions = obj.get("actions") if isinstance(obj.get("actions"), list) else []
clean_actions = []
for a in actions[:10]:
    if not isinstance(a, dict):
        continue
    typ = a.get("type") if a.get("type") in allowed_actions else "NOOP"
    artifact = a.get("artifact")
    if artifact is not None:
        artifact = str(artifact)
        if not (artifact.startswith("holding-runtime/work/") or artifact.startswith("holding-runtime/memory/")):
            artifact = None
    clean_actions.append({
        "type": typ,
        "description": str(a.get("description") or "")[:2000],
        "artifact": artifact,
        "requires_owner": bool(a.get("requires_owner", False)),
    })
obj["actions"] = clean_actions or [{"type":"NOOP","description":"No accepted action artifact.","artifact":None,"requires_owner":False}]
obj["next_heartbeat_focus"] = str(obj.get("next_heartbeat_focus") or "Review latest metrics and continue evidence collection.")[:2000]

out_path.parent.mkdir(parents=True, exist_ok=True)
out_path.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"normalized": True, "status": obj["status"], "has_decision": obj["decision"] is not None}))
