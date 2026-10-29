
 let inputDir = { x: 0, y: 0 };
const foodSound = new Audio('food.mp3');
const gameOverSound = new Audio('gameover.mp3');
const moveSound = new Audio('move.mp3');
let musicSound = new Audio('music.mp3');
let speed = 2;
let score = 0;  // Initialize score to 0
let lastPaintTime = 0;
let snakeArr = [
    { x: 13, y: 13 }
];
let food = { x: 6, y: 9 };

// Select elements for the game over modal and score box
const gameOverModal = document.getElementById('gameOverModal');
const finalScoreDisplay = document.getElementById('finalScore');
const playAgainBtn = document.getElementById('playAgainBtn');

// Function to update the score on the screen
function updateScore() {
    document.getElementById('scorebox').textContent = "Score: " + score;
}

// Main game function
function main(ctime) {
    window.requestAnimationFrame(main);

    // Control game speed
    if ((ctime - lastPaintTime) / 1000 < 1 / speed) {
        return;
    }
    lastPaintTime = ctime;
    gameEngine();
}

function isCollide(snake) {
    for (let i = 1; i < snakeArr.length; i++) {
        if (snake[i].x === snake[0].x && snake[i].y === snake[0].y) {
            return true;
        }
    }
    if (snake[0].x >= 18 || snake[0].x <= 0 || snake[0].y >= 18 || snake[0].y <= 0) {
        return true;
    }
}

function gameEngine() {
    musicSound.play();

    // Game Over Logic
    if (isCollide(snakeArr)) {
        gameOverSound.play();
        musicSound.pause();
        inputDir = { x: 0, y: 0 };

        // Display the game over modal and the score
        finalScoreDisplay.textContent = "Score: " + score; 
        gameOverModal.style.display = 'flex';  // Show the modal
        updateScore(); // Update score display after game over
    }

    // If snake eats the food
    if (snakeArr[0].y === food.y && snakeArr[0].x === food.x) {
        snakeArr.unshift({ x: snakeArr[0].x + inputDir.x, y: snakeArr[0].y + inputDir.y });
        foodSound.play();

        // Generate new food coordinates
        let a = 2;
        let b = 16;
        food = { x: Math.round(a + (b - a) * Math.random()), y: Math.round(a + (b - a) * Math.random()) };

        score += 10; 
        updateScore(); // Update score display after eating food
    }

    // Moving the snake
    for (let a = snakeArr.length - 2; a >= 0; a--) {
        snakeArr[a + 1] = { ...snakeArr[a] };
    }
    snakeArr[0].x = snakeArr[0].x + inputDir.x;
    snakeArr[0].y = snakeArr[0].y + inputDir.y;

    // Display snake and food
    board.innerHTML = "";
    snakeArr.forEach((e, index) => {
        let snakeElement = document.createElement('div');
        snakeElement.style.gridRowStart = e.y;
        snakeElement.style.gridColumnStart = e.x;
        if (index == 0) {
            snakeElement.classList.add('head');
        } else {
            snakeElement.classList.add('snake');
        }
        board.appendChild(snakeElement);
    });

    // Display food
    let foodElement = document.createElement('div');
    foodElement.style.gridRowStart = food.y;
    foodElement.style.gridColumnStart = food.x;
    foodElement.classList.add('food');
    board.appendChild(foodElement);
}

// Keyboard control logic
window.addEventListener('keydown', e => {
    inputDir = { x: 0, y: 1 }; // Start the game
    moveSound.play();
    switch (e.key) {
        case "ArrowUp":
            inputDir.x = 0;
            inputDir.y = -1;
            break;
        case "ArrowDown":
            inputDir.x = 0;
            inputDir.y = 1;
            break;
        case "ArrowRight":
            inputDir.x = 1;
            inputDir.y = 0;
            break;
        case "ArrowLeft":
            inputDir.x = -1;
            inputDir.y = 0;
            break;
        default:
            break;
    }
});

// Play Again Button Click
playAgainBtn.addEventListener('click', () => {
    gameOverModal.style.display = 'none';  
    score = 0;
    snakeArr = [{ x: 13, y: 13 }];  
    inputDir = { x: 0, y: 0 }; 
    updateScore();  
    window.requestAnimationFrame(main);  
});

// Start the game loop
window.requestAnimationFrame(main);
#hi

"""ETNI_ACTM: reactivation post-provisioning for one MDN.

Steps, in order:
  1. Service Inventory: search by MDN, set status ACTIVE when it is not already.
  2. Product Inventory: search by MDN, set status ACTIVE when it is not already.
     A missing PI record means it is Obsolete, so the run stops for an AYS ticket.
  3. ETNI: query the MDN, deactivate it only when omdnStatus is AI.
  4. ETNI: resume the MDN using the MIN from step 3 and the SIM from the input.

Preview runs every read and reports each write it would make. Execute performs the
writes and stops at the first failure. Nothing is retried, because a repeated PATCH or
PUT can duplicate work.
"""

from __future__ import annotations

import csv
import io
import json
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import httpx

import etni_decision
import policy
import sso_token

SI_SEARCH_URL = os.getenv(
    "ETNI_SI_SEARCH_URL",
    "https://vxpcore-k0cv-west-prod.vpc.verizon.com/serviceinventory/search",
)
SI_UPDATE_URL = os.getenv(
    "ETNI_SI_UPDATE_URL",
    "https://vxpcore-k0cv-prod.verizon.com/serviceinventory/service",
)
PI_SEARCH_URL = os.getenv(
    "ETNI_PI_SEARCH_URL",
    "https://k0cv-east-gz-prod-nlb.vpc.verizon.com/productinventory-domain/product/bulk-search",
)
PI_UPDATE_URL = os.getenv(
    "ETNI_PI_UPDATE_URL",
    "https://k0cv-east-gz-prod-nlb.vpc.verizon.com/productinventory-domain/product",
)
ETNI_BASE_URL = os.getenv(
    "ETNI_BASE_URL",
    "https://cxp-domain-b6vv-prod-proxy.vpc.verizon.com/b6vv/prod",
)
SERVICE_ORDER_URL = os.getenv(
    "ETNI_SERVICE_ORDER_URL",
    "https://vxpcore-k0cv-prod.verizon.com/serviceorder-domain/service/retrieveServiceOrder",
)
POST_PROVISIONING_URL = os.getenv(
    "ETNI_POST_PROVISIONING_URL",
    "https://vbpm-k2nv-east-prod.vpc.verizon.com/bpmbpmi/bpmi/customerorder/post-provisioning",
)
AUTOFIX_SUBMIT_URL = os.getenv(
    "ETNI_AUTOFIX_SUBMIT_URL",
    "https://vbpm-k2nv-east-prod.vpc.verizon.com/sombpmbpmi/serviceorder/autofix/submit",
)

ETNI_QUERY_STATUS_AI = "AI"
PI_ACTIVE = "ACTIVE"
SI_ACTIVE = "ACTIVE"
PI_NOT_FOUND_MARKER = "not found in product inventory with customerid"
PI_OBSOLETE_MESSAGE = "please raise AYS cassandra update to mark PI as Active"
MDN_NOT_AI_MESSAGE = "MDN is not in AI state"
POST_PROVISIONING_STATUS = "SUCCESS"
POST_PROVISIONING_MESSAGE = "Transaction Completed Successfully"

STEP_SI = "si_update"
STEP_PI = "pi_update"
STEP_ETNI_DEACTIVATE = "etni_deactivate"
STEP_ETNI_RESUME = "etni_resume"

HTTP_TIMEOUT = 60.0


class EtniActmError(RuntimeError):
    """A step failed and the run must stop."""

    def __init__(self, step: str, message: str) -> None:
        super().__init__(message)
        self.step = step
        self.message = message


@dataclass
class EtniActmInput:
    customer_id: str
    mdn: str
    sim_serial: str
    product_serial: str
    com_id: str
    service_order_id: str

    @classmethod
    def from_dict(cls, raw: Dict[str, Any]) -> "EtniActmInput":
        values: Dict[str, str] = {}
        missing: List[str] = []
        for key in ("mdn", "sim_serial", "product_serial", "com_id", "service_order_id"):
            value = str(raw.get(key) or "").strip()
            if not value:
                missing.append(key)
            values[key] = value
        values["customer_id"] = str(raw.get("customer_id") or "").strip()
        if missing:
            raise ValueError(f"Missing required input: {', '.join(missing)}")
        digits = "".join(ch for ch in values["mdn"] if ch.isdigit())
        if len(digits) != 10:
            raise ValueError("MDN must be exactly 10 digits")
        values["mdn"] = digits
        return cls(**values)


@dataclass
class PlannedCall:
    step: str
    method: str
    url: str
    body: Any
    mutating: bool
    note: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "step": self.step,
            "method": self.method,
            "url": self.url,
            "body": self.body,
            "mutating": self.mutating,
            "note": self.note,
        }


@dataclass
class StepOutcome:
    step: str
    status: str
    detail: str
    http_code: int = 0
    payload: Any = None
    body_status_code: str = ""

    def to_timeline(self) -> Dict[str, Any]:
        meta: Dict[str, Any] = {"http_code": self.http_code}
        if self.body_status_code:
            meta["body_status_code"] = self.body_status_code
        return {
            "id": self.step,
            "label": STEP_LABELS[self.step],
            "status": self.status,
            "detail": self.detail,
            "meta": meta,
        }


STEP_LABELS = {
    STEP_SI: "SI Update",
    STEP_PI: "PI Update",
    STEP_ETNI_DEACTIVATE: "ETNI Deactivate",
    STEP_ETNI_RESUME: "ETNI Resume",
}

STEP_POST_PROVISIONING = "post_provisioning"
STEP_AUTOFIX = "autofix_submit"
STEP_LABELS[STEP_POST_PROVISIONING] = "Post Provisioning"
STEP_LABELS[STEP_AUTOFIX] = "Auto-Fix SubDel/Add"

_WRITE_CHANNEL = {
    STEP_SI: ("WEB", "WEB"),
    STEP_PI: ("WEB", "WEB"),
    STEP_ETNI_DEACTIVATE: ("ETNI", "ETNI"),
    STEP_ETNI_RESUME: ("ETNI", "ETNI"),
    STEP_POST_PROVISIONING: ("WEB", "WEB"),
    STEP_AUTOFIX: ("AURA-INDIRECT", "AURA-INDIRECT"),
}


def _post_provisioning_body(inp: EtniActmInput, so_model: Dict[str, Any], *, status: str, message: str) -> Dict[str, Any]:
    return {
        "data": {
            "serviceOrder": {
                "id": inp.service_order_id,
                "flowType": "REACTIVATION",
                "mdn": inp.mdn,
                "simSerialNumber": inp.sim_serial,
                "productSerialNumber": inp.product_serial,
                "status": status,
                "statusMessage": message,
                "serviceOrderType": so_model.get("serviceOrderType"),
            }
        }
    }


def _autofix_body(inp: EtniActmInput, stamp: str) -> Dict[str, Any]:
    return {
        "meta": {"comCaseId": stamp, "cartNo": f"TF{stamp}"},
        "data": {"mdn": inp.mdn, "callbackUrl": "dummy", "serviceOrderCategory": "RESET"},
    }


def _vfops_stamp() -> str:
    return datetime.now().strftime("%m%d%Y%H%M%S")


def _headers(inp: EtniActmInput, *, e2e_suffix: str, channel: str, source: str) -> Dict[str, str]:
    e2e = f"ETNIACTM-{inp.service_order_id}-{e2e_suffix}"[:64]
    return {
        "content-type": "application/json",
        "sso_jwt": sso_token.resolve(),
        "x-brand": "TOTAL_WIRELESS",
        "x-sourcesystem": source,
        "e2erequestid": e2e,
        "correlation_id": e2e,
        "channel-id": channel,
        "channel_id": channel,
        "client_id": channel,
        "brandname": "TOTAL_WIRELESS",
        "Cookie": f"vxp_ig_session={os.getenv('VXP_IG_SESSION', '')}",
    }


def _etni_query_headers() -> Dict[str, str]:
    """Headers exactly as the working queryMdn curl sends them: GET, no content-type."""
    return {
        "channel-id": "DOTCOM",
        "channel_id": "DOTCOM",
        "client_id": "DOTCOM",
        "e2erequestid": "MANUAL",
        "correlation_id": "MANUAL",
        "sso_jwt": sso_token.resolve(),
        "x-brand": "TOTAL_WIRELESS",
        "x-sourcesystem": "WEB",
        "brandname": "TOTAL_WIRELESS",
        "Cookie": f"vxp_ig_session={os.getenv('VXP_IG_SESSION', '')}",
    }


def _mask(headers: Dict[str, str]) -> Dict[str, str]:
    masked = dict(headers)
    for key in ("sso_jwt", "Cookie"):
        if masked.get(key):
            masked[key] = "***"
    return masked


def _body_or_empty(response: httpx.Response) -> Any:
    try:
        return response.json()
    except ValueError:
        return {"raw": response.text}


async def _send(method: str, url: str, headers: Dict[str, str], body: Any) -> tuple[int, Any]:
    async with httpx.AsyncClient(verify=False, timeout=HTTP_TIMEOUT, trust_env=False) as client:
        response = await client.request(
            method,
            url,
            headers=headers,
            content=json.dumps(body) if body is not None else None,
        )
    return response.status_code, _body_or_empty(response)


def _service_from_si(doc: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    services = (doc.get("data") or {}).get("services") or []
    return services[0] if services and isinstance(services[0], dict) else None


def _product_from_pi(doc: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    products = (doc.get("data") or {}).get("products") or []
    return products[0] if products and isinstance(products[0], dict) else None


def _characteristic(doc: Dict[str, Any], name: str) -> Any:
    for item in doc.get("characteristics") or []:
        if isinstance(item, dict) and item.get("name") == name:
            return item.get("value")
    return None


def _etni_query_status(doc: Dict[str, Any]) -> Optional[str]:
    data = doc.get("data") if isinstance(doc.get("data"), dict) else {}
    value = data.get("omdnStatus")
    return str(value).strip().upper() if value else None


def _etni_min(doc: Dict[str, Any]) -> Optional[str]:
    data = doc.get("data") if isinstance(doc.get("data"), dict) else {}
    value = data.get("min")
    return str(value).strip() if value else None


def _service_order_model(doc: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    data = doc.get("data") if isinstance(doc.get("data"), dict) else {}
    model = data.get("serviceOrderDataModel")
    return model if isinstance(model, dict) else None


def service_order_mismatches(inp: EtniActmInput, model: Dict[str, Any]) -> List[str]:
    """Return the input fields that disagree with the service order record."""
    checks = {
        "MDN": (inp.mdn, model.get("mdn"), True),
        "SIM Serial Number": (inp.sim_serial, model.get("simSerialNumber"), False),
        "Product Serial Number": (inp.product_serial, model.get("productSerialNumber"), False),
    }
    mismatches = []
    for label, (given, record, numeric) in checks.items():
        norm = (lambda v: "".join(ch for ch in str(v or "") if ch.isdigit())) if numeric else (lambda v: str(v or "").strip())
        if norm(given) != norm(record):
            mismatches.append(f"{label}: input {given}, service order {record or 'missing'}")
    return mismatches


async def read_service_order(service_order_id: str) -> Dict[str, Any]:
    """Read-only. Returns the service order fields the post-provisioning step needs."""
    code, doc = await _send(
        "GET",
        f"{SERVICE_ORDER_URL}?serviceOrderId={service_order_id}",
        {"Cookie": f"vxp_ig_session={os.getenv('VXP_IG_SESSION', '')}"},
        None,
    )
    model = _service_order_model(doc) if code < 400 else None
    return {"http_code": code, "model": model, "raw": doc}


def _si_search_body(mdn: str) -> Dict[str, Any]:
    return {"services": [{"mdn": mdn}]}


def _pi_search_body(inp: EtniActmInput) -> Dict[str, Any]:
    return {
        "relatedParties": [
            {
                "party": {
                    "partyID": "IVR",
                    "languageAbility": "ENG",
                    "partyExtension": [
                        {"name": "sourceSystem", "value": "IVR"},
                        {"name": "brand", "value": "TOTAL_WIRELESS"},
                    ],
                },
                "roleType": "internal",
            }
        ],
        "productSearch": [{"mdn": inp.mdn, "filters": {"includeAllProducts": False}}],
    }


def _si_update_body(service: Dict[str, Any]) -> Dict[str, Any]:
    updated = dict(service)
    updated["status"] = SI_ACTIVE
    return {"services": [updated]}


def _pi_update_body(product_id: str, customer_id: Any) -> Dict[str, Any]:
    return {
        "relatedParties": [
            {
                "party": {"partyID": "WEB", "partyExtension": [
                    {"name": "sourceSystem", "value": "WEB"},
                    {"name": "brand", "value": "TOTAL_WIRELESS"},
                ]},
                "roleType": "internal",
            },
            {"party": {"individual": {"id": str(customer_id)}}, "roleType": "customer"},
        ],
        "productUpdate": {
            "action": "STATUS_CHANGE",
            "product": {"id": str(product_id), "status": PI_ACTIVE},
        },
    }


def _etni_deactivate_body(inp: EtniActmInput) -> Dict[str, Any]:
    return {
        "applicationId": "D-DACM",
        "mdn": inp.mdn,
        "productType": "C",
        "iccid_4g": inp.sim_serial,
        "operatorId": "VZVALUE",
        "originationDtTm": _now_stamp(),
        "transactionMode": "",
        "deviceInd": "",
    }


def _etni_resume_body(inp: EtniActmInput, min_value: str) -> Dict[str, Any]:
    return {
        "mdn": inp.mdn,
        "min": min_value,
        "applicationId": "D-RSMM",
        "operatorId": "VZVALUE",
        "productType": "C",
        "transactionMode": "R",
        "nl": "DPRET",
        "deviceInd": "L",
        "iccid4g": inp.sim_serial,
        "originationDtTm": _now_stamp(),
    }


def _now_stamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d-%H.%M.%S.%f")


def _pi_is_obsolete(status_code: int, doc: Dict[str, Any]) -> bool:
    return status_code == 404 or PI_NOT_FOUND_MARKER in json.dumps(doc).lower()


def build_plan(inp: EtniActmInput, *, si_service: Optional[Dict[str, Any]],
               pi_product: Optional[Dict[str, Any]], etni_query: Optional[Dict[str, Any]],
               so_model: Optional[Dict[str, Any]] = None) -> List[PlannedCall]:
    """Describe the writes that would be sent, given what the reads returned."""
    planned: List[PlannedCall] = []
    if si_service is not None and str(si_service.get("status") or "").upper() != SI_ACTIVE:
        planned.append(PlannedCall(STEP_SI, "PUT", SI_UPDATE_URL, _si_update_body(si_service), True,
                                   f"SI status {si_service.get('status')} -> {SI_ACTIVE}"))
    if pi_product is not None and str(pi_product.get("status") or "").upper() != PI_ACTIVE:
        planned.append(PlannedCall(STEP_PI, "PUT", PI_UPDATE_URL,
                                   _pi_update_body(pi_product.get("id"), pi_product.get("customerId")),
                                   True, f"PI status {pi_product.get('status')} -> {PI_ACTIVE}"))
    if etni_query is not None and _etni_query_status(etni_query) == ETNI_QUERY_STATUS_AI:
        min_value = _etni_min(etni_query) or ""
        planned.append(PlannedCall(STEP_ETNI_DEACTIVATE, "PATCH", f"{ETNI_BASE_URL}/MDNServices/deactivateMtn",
                                   _etni_deactivate_body(inp), True, "omdnStatus AI"))
        planned.append(PlannedCall(STEP_ETNI_RESUME, "PATCH", f"{ETNI_BASE_URL}/MDNServices/resumeMdn",
                                   _etni_resume_body(inp, min_value), True, "after deactivate"))
    etni_resumed = any(call.step == STEP_ETNI_RESUME for call in planned)
    if so_model is not None and etni_resumed:
        planned.append(PlannedCall(
            STEP_POST_PROVISIONING, "POST", POST_PROVISIONING_URL,
            _post_provisioning_body(inp, so_model, status=POST_PROVISIONING_STATUS,
                                    message=POST_PROVISIONING_MESSAGE),
            True, f"status {POST_PROVISIONING_STATUS}: {POST_PROVISIONING_MESSAGE}",
        ))
        stamp = _vfops_stamp()
        planned.append(PlannedCall(
            STEP_AUTOFIX, "POST", AUTOFIX_SUBMIT_URL, _autofix_body(inp, stamp), True,
            f"comCaseId {stamp}, cartNo TF{stamp}",
        ))
    return planned


async def run(inp: EtniActmInput, *, dry_run: bool = False, modified_by: str = "ResolveOps") -> Dict[str, Any]:
    """Run the ETNI_ACTM flow. Dry run performs reads only and returns the planned writes."""
    timeline: List[Dict[str, Any]] = []
    planned: List[PlannedCall] = []
    reads: Dict[str, Any] = {}

    def record(outcome: StepOutcome) -> None:
        timeline.append(outcome.to_timeline())

    def stop(step: str, message: str) -> Dict[str, Any]:
        record(StepOutcome(step, "failed", message))
        return _result(inp, timeline, planned, reads, success=False, overall=f"Failed at {STEP_LABELS[step]}: {message}")

    # Reads first, so the whole plan is known before any write.
    code, si_doc = await _send("POST", SI_SEARCH_URL, _headers(inp, e2e_suffix="SISRCH", channel="WEB", source="WEB"), _si_search_body(inp.mdn))
    si_service = _service_from_si(si_doc) if code < 400 else None
    reads["si"] = {"http_code": code, "status": (si_service or {}).get("status")}
    if code >= 400 or si_service is None:
        return stop(STEP_SI, f"SI search returned HTTP {code} with no service for MDN {inp.mdn}")

    code, pi_doc = await _send("POST", PI_SEARCH_URL, _headers(inp, e2e_suffix="PISRCH", channel="IVR", source="IVR"), _pi_search_body(inp))
    pi_product = _product_from_pi(pi_doc) if code < 400 else None
    reads["pi"] = {"http_code": code, "status": (pi_product or {}).get("status")}
    if pi_product is None:
        if code < 400 or _pi_is_obsolete(code, pi_doc):
            return stop(STEP_PI, PI_OBSOLETE_MESSAGE)
        return stop(STEP_PI, f"PI search returned HTTP {code}")

    so = await read_service_order(inp.service_order_id)
    so_model = so["model"]
    reads["service_order"] = {
        "http_code": so["http_code"],
        "serviceOrderType": (so_model or {}).get("serviceOrderType"),
        "status": (so_model or {}).get("status"),
        "productOrderId": (so_model or {}).get("productOrderId"),
    }
    if so["http_code"] >= 400 or so_model is None:
        return stop(STEP_SI, f"Service order {inp.service_order_id} returned HTTP {so['http_code']}")
    so_mismatch = service_order_mismatches(inp, so_model)
    if so_mismatch:
        return stop(STEP_SI, "Input does not match the service order (" + "; ".join(so_mismatch)
                    + "). Correct the input, then rerun. Nothing was changed.")

    code, etni_doc = await _send("GET", f"{ETNI_BASE_URL}/MDNQueryServices/queryMdn/{inp.mdn}?applicationId=D-VMDN&userId=VZVALUE",
                                 _etni_query_headers(), None)
    etni_status = _etni_query_status(etni_doc) if code < 400 else None
    reads["etni"] = {"http_code": code, "omdnStatus": etni_status, "min": _etni_min(etni_doc) if code < 400 else None}
    if code >= 400:
        return stop(STEP_ETNI_DEACTIVATE, f"ETNI queryMdn returned HTTP {code}: {json.dumps(etni_doc)[:300]}")

    customer_entered = bool(inp.customer_id)
    if not customer_entered and pi_product.get("customerId") is not None:
        inp.customer_id = str(pi_product["customerId"])
    reads["customer_id"] = {"value": inp.customer_id, "source": "entered" if customer_entered else "product inventory"}

    decision = etni_decision.decide(
        customer_id=inp.customer_id,
        mdn=inp.mdn,
        sim_serial=inp.sim_serial,
        product_serial=inp.product_serial,
        si=si_service,
        pi=pi_product,
        etni=etni_doc.get("data") or {},
    )
    reads["decision"] = {
        "outcome": decision.outcome,
        "checks": [c.__dict__ for c in decision.checks],
        "skipped": decision.skipped,
    }
    if decision.stop_reason:
        return stop(STEP_PI, f"{decision.stop_reason} {decision.next_step}")

    etni_ai = etni_status == ETNI_QUERY_STATUS_AI
    min_status = str((etni_doc.get("data") or {}).get("minStatus") or "").strip().upper() if code < 400 else ""
    status_note = (
        f"{MDN_NOT_AI_MESSAGE} (ETNI omdnStatus is {etni_status or 'missing'}, "
        f"minStatus is {min_status or 'missing'}). Deactivate and resume were skipped."
    )
    planned = build_plan(inp, si_service=si_service, pi_product=pi_product, etni_query=etni_doc,
                         so_model=so_model)
    if dry_run:
        overall = "Preview — nothing was changed" if etni_ai else f"Preview — {status_note}"
        return _result(inp, timeline, planned, reads, success=etni_ai, overall=overall, dry_run=True)

    # Writes. Each one is gated by policy before the call is made.
    for call in planned:
        operation = {
            STEP_SI: policy.MUTATION_SI_UPDATE,
            STEP_PI: policy.MUTATION_PI_UPDATE,
            STEP_ETNI_DEACTIVATE: policy.MUTATION_ETNI_DEACTIVATE,
            STEP_ETNI_RESUME: policy.MUTATION_ETNI_RESUME,
            STEP_POST_PROVISIONING: policy.MUTATION_POST_PROVISIONING,
            STEP_AUTOFIX: policy.MUTATION_AUTOFIX_SUBMIT,
        }[call.step]
        try:
            policy.check_mutation(operation, context={"mdn": inp.mdn})
        except policy.PolicyViolation as exc:
            return stop(call.step, f"Blocked by safety policy: {exc.detail}")

        channel, source = _WRITE_CHANNEL[call.step]
        if call.step == STEP_AUTOFIX:
            e2e = f"vfops-{inp.mdn}-{_vfops_stamp()}"
            headers = {**_headers(inp, e2e_suffix="AUTOFIX", channel=channel, source="VFOPS"),
                       "e2erequestid": e2e, "correlation_id": e2e}
        else:
            headers = _headers(inp, e2e_suffix=call.step.upper()[:12], channel=channel, source=source)
        code, body = await _send(call.method, call.url, headers, call.body)
        if code >= 400:
            record(StepOutcome(call.step, "failed", f"HTTP {code}", code, body))
            overall = f"Failed at {STEP_LABELS[call.step]} — HTTP {code}"
            applied = [STEP_LABELS[t["id"]] for t in timeline if t["status"] == "done"]
            if applied:
                overall += f". Already applied: {', '.join(applied)}."
            if call.step == STEP_ETNI_RESUME and STEP_LABELS[STEP_ETNI_DEACTIVATE] in applied:
                overall += " The MDN is deactivated in ETNI but not resumed — resume it manually before retrying."
            return _result(inp, timeline, planned, reads, success=False, overall=overall)
        outcome = StepOutcome(call.step, "done", call.note or "ok", code, body)
        if call.step == STEP_POST_PROVISIONING:
            body_status = ((body or {}).get("data") or {}).get("status") or {}
            outcome.detail = f"{body_status.get('description') or 'accepted'} (BPMI code {body_status.get('code')})"
            outcome.body_status_code = str(body_status.get("code") or "")
        record(outcome)
        policy.record_mutation(operation)

    if not etni_ai:
        return stop(STEP_ETNI_DEACTIVATE, status_note + " SI and PI updates above were applied.")

    post_done = next((t for t in timeline if t["id"] == STEP_POST_PROVISIONING), None)
    if post_done is None:
        return _result(inp, timeline, planned, reads, success=True, overall="ETNI_ACTM completed")

    body_code = str(((post_done.get("meta") or {}).get("body_status_code")) or "")
    if body_code and body_code != "200":
        return _result(inp, timeline, planned, reads, success=False,
                       overall=f"Post Provisioning was rejected by BPMI (code {body_code})")

    final = await read_service_order(inp.service_order_id)
    final_model = final["model"] or {}
    reads["service_order_after"] = {
        "http_code": final["http_code"],
        "status": final_model.get("status"),
        "statusMessage": final_model.get("statusMessage"),
    }
    live_status = final_model.get("status") or "unknown"
    live_message = final_model.get("statusMessage") or ""
    if live_status == POST_PROVISIONING_STATUS:
        overall = "Post Provisioning complete: service order is SUCCESS."
    else:
        overall = (
            f"Post Provisioning accepted by BPMI; service order is still {live_status}"
            f"{' (' + live_message + ')' if live_message else ''}. Check again shortly."
        )
    return _result(inp, timeline, planned, reads, success=True, overall=overall)


FLOW_STEPS = (
    STEP_SI,
    STEP_PI,
    STEP_ETNI_DEACTIVATE,
    STEP_ETNI_RESUME,
    STEP_POST_PROVISIONING,
    STEP_AUTOFIX,
)


def _full_timeline(timeline: List[Dict[str, Any]], skipped: List[Dict[str, str]]) -> List[Dict[str, Any]]:
    """Return one entry per flow step, in order, so every run shows the whole flow."""
    by_id = {entry["id"]: entry for entry in timeline}
    skip_reason = {entry["step"]: entry["reason"] for entry in skipped}
    full: List[Dict[str, Any]] = []
    for step in FLOW_STEPS:
        if step in by_id:
            full.append(by_id[step])
        elif step in skip_reason:
            full.append({"id": step, "label": STEP_LABELS[step], "status": "skipped",
                         "detail": skip_reason[step], "meta": {}})
        else:
            full.append({"id": step, "label": STEP_LABELS[step], "status": "pending",
                         "detail": "Not reached: an earlier step stopped the run", "meta": {}})
    return full


def _result(inp: EtniActmInput, timeline: List[Dict[str, Any]], planned: List[PlannedCall],
            reads: Dict[str, Any], *, success: bool, overall: str, dry_run: bool = False) -> Dict[str, Any]:
    skipped = list((reads.get("decision") or {}).get("skipped") or [])
    result: Dict[str, Any] = {
        "success": success,
        "order_id": inp.service_order_id,
        "order_type": "ETNI_ACTM",
        "order_type_label": "MDN Retrieval",
        "mdn": inp.mdn,
        "overall": overall,
        "timeline": _full_timeline(timeline, skipped),
        "planned_writes": [p.to_dict() for p in planned],
        "reads": reads,
    }
    if dry_run:
        result["dry_run"] = True
    return result


CSV_HEADER_TO_FIELD = {
    "customer_id": "customer_id",
    "mdn": "mdn",
    "sim_serial_number": "sim_serial",
    "product_serial_number": "product_serial",
    "reactivation_com_id": "com_id",
    "service_order_id": "service_order_id",
}
CSV_REQUIRED_HEADERS = tuple(h for h in CSV_HEADER_TO_FIELD if h != "customer_id")
MAX_CSV_ROWS = 50


class CsvError(ValueError):
    """The file as a whole cannot be processed. Nothing runs."""


def parse_csv_rows(text: str) -> List[Dict[str, Any]]:
    """Return one entry per data row: {"row", "input"} or {"row", "error"}. Blank lines are skipped."""
    reader = csv.DictReader(io.StringIO(text.lstrip("\ufeff")))
    if reader.fieldnames is None:
        raise CsvError("The file is empty. Upload a CSV with a header row.")
    headers = {h.strip().lower() for h in reader.fieldnames if h}
    missing = [c for c in CSV_REQUIRED_HEADERS if c not in headers]
    if missing:
        raise CsvError(f"CSV is missing required column(s): {', '.join(missing)}")

    rows: List[Dict[str, Any]] = []
    for line_no, raw in enumerate(reader, start=2):
        cleaned = {(k or "").strip().lower(): (v or "").strip() for k, v in raw.items() if k}
        if not any(cleaned.values()):
            continue
        mapped = {CSV_HEADER_TO_FIELD[k]: v for k, v in cleaned.items() if k in CSV_HEADER_TO_FIELD}
        rows.append({"row": line_no, "raw": mapped})

    if len(rows) > MAX_CSV_ROWS:
        raise CsvError(
            f"{len(rows)} rows uploaded. The limit is {MAX_CSV_ROWS} per batch; split the file and upload again."
        )
    if not rows:
        raise CsvError("The file has a header but no data rows.")

    parsed: List[Dict[str, Any]] = []
    for item in rows:
        reference = (item["raw"].get("com_id") or item["raw"].get("service_order_id") or "(blank)").strip() or "(blank)"
        try:
            inp = EtniActmInput.from_dict(item["raw"])
            parsed.append({"row": item["row"], "input": inp, "reference": reference})
        except ValueError as exc:
            parsed.append({"row": item["row"], "error": str(exc), "reference": reference})
    return parsed





 

  




