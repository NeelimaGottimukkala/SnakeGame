
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


"""
Jira ticket dashboard
---------------------
Give it VNQE ticket IDs -> it pulls Created, Resolved, Brand, Reporting Team
(plus Status, Priority, Environment, Summary) from onejira and builds an
HTML dashboard + CSV.

Setup (once) - no pip install needed, uses only built-in Python:
    Create a Personal Access Token in onejira:
        profile picture -> Profile -> Personal Access Tokens -> Create token
    When you run the script it asks you to paste the token (input is hidden).
    Optional: set it once per terminal to skip the prompt:
        $env:JIRA_TOKEN = "your-token"

Run:
    python jira_dashboard.py VNQE-36881 VNQE-36900 VNQE-37012
    python jira_dashboard.py -f tickets.txt          (one ID per line, or comma separated)
    python jira_dashboard.py -f tickets.txt --no-verify   (if corporate SSL cert errors)

Output: jira_dashboard.html (open in browser) and jira_dashboard.csv
"""
import argparse
import csv
import getpass
import html
import json
import os
import re
import ssl
import sys
import urllib.error
import urllib.request
from datetime import datetime

JIRA_URL = "https://onejira.verizon.com"

# Custom field names exactly as they appear on the ticket screen.
# The script looks up their internal IDs (customfield_xxxxx) automatically.
CUSTOM_FIELDS = {
    "brand": "Brand",
    "reporting_team": "Reporting Team",
    "environment": "Environment",
}


def parse_ids(args):
    raw = list(args.ids)
    if args.file:
        with open(args.file, encoding="utf-8") as fh:
            raw.append(fh.read())
    ids = re.findall(r"[A-Z][A-Z0-9]+-\d+", " ".join(raw).upper())
    return list(dict.fromkeys(ids))  # de-duplicate, keep order


class Jira:
    """Tiny Jira client using only the standard library."""

    def __init__(self, token, verify):
        self.headers = {"Authorization": f"Bearer {token}", "Accept": "application/json",
                        "Content-Type": "application/json"}
        self.ctx = ssl.create_default_context() if verify else ssl._create_unverified_context()

    def call(self, method, path, body=None, timeout=120):
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(JIRA_URL + path, data=data, headers=self.headers, method=method)
        try:
            with urllib.request.urlopen(req, context=self.ctx, timeout=timeout) as r:
                return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            detail = e.read().decode("utf-8", "ignore")[:300]
            if e.code == 401:
                sys.exit("401 Unauthorized - check JIRA_TOKEN (expired or copied wrong?)")
            sys.exit(f"Jira returned HTTP {e.code} for {path}: {detail}")
        except urllib.error.URLError as e:
            if isinstance(e.reason, ssl.SSLError):
                sys.exit(f"SSL error: {e.reason}\nRe-run with --no-verify")
            sys.exit(f"Could not reach {JIRA_URL}: {e.reason}")


def find_field_ids(s):
    by_name = {}
    for f in s.call("GET", "/rest/api/2/field"):
        by_name.setdefault(f["name"].strip().lower(), f["id"])
    ids = {}
    for key, name in CUSTOM_FIELDS.items():
        fid = by_name.get(name.lower())
        if not fid:
            print(f"  ! Field '{name}' not found - it will show blank")
        ids[key] = fid
    return ids


def to_text(v):
    """Turn any Jira field value (string, option, list, user) into plain text."""
    if v is None:
        return ""
    if isinstance(v, list):
        return ", ".join(filter(None, (to_text(x) for x in v)))
    if isinstance(v, dict):
        for k in ("value", "name", "displayName", "key"):
            if v.get(k):
                return str(v[k])
        return ""
    return str(v)


def parse_dt(s):
    if not s:
        return None
    return datetime.strptime(s, "%Y-%m-%dT%H:%M:%S.%f%z")


def fetch(s, keys, field_ids):
    fields = ["summary", "status", "priority", "created", "resolutiondate"]
    fields += [f for f in field_ids.values() if f]
    rows, found = [], set()
    for i in range(0, len(keys), 50):
        batch = keys[i:i + 50]
        result = s.call("POST", "/rest/api/2/search",
                        {"jql": f"key in ({','.join(batch)})", "fields": fields,
                         "maxResults": 50, "validateQuery": "warn"})
        for issue in result.get("issues", []):
            f = issue["fields"]
            created, resolved = parse_dt(f.get("created")), parse_dt(f.get("resolutiondate"))
            found.add(issue["key"])
            rows.append({
                "key": issue["key"],
                "summary": f.get("summary") or "",
                "status": to_text(f.get("status")),
                "priority": to_text(f.get("priority")),
                "brand": to_text(f.get(field_ids["brand"])) if field_ids["brand"] else "",
                "reporting_team": to_text(f.get(field_ids["reporting_team"])) if field_ids["reporting_team"] else "",
                "environment": to_text(f.get(field_ids["environment"])) if field_ids["environment"] else "",
                "created": created.strftime("%Y-%m-%d %H:%M") if created else "",
                "resolved": resolved.strftime("%Y-%m-%d %H:%M") if resolved else "",
                "days_to_resolve": round((resolved - created).total_seconds() / 86400, 1)
                if created and resolved else None,
            })
    missing = [k for k in keys if k not in found]
    order = {k: n for n, k in enumerate(keys)}
    rows.sort(key=lambda x: order.get(x["key"], 1e9))
    return rows, missing


def write_csv(rows, path):
    cols = ["key", "summary", "brand", "reporting_team", "environment", "status",
            "priority", "created", "resolved", "days_to_resolve"]
    with open(path, "w", newline="", encoding="utf-8-sig") as fh:
        w = csv.DictWriter(fh, fieldnames=cols)
        w.writeheader()
        w.writerows(rows)


def write_html(rows, missing, path):
    data = json.dumps(rows).replace("</", "<\\/")
    miss = html.escape(", ".join(missing))
    page = TEMPLATE.replace("__DATA__", data).replace("__JIRA__", JIRA_URL) \
        .replace("__MISSING__", f"Not found / no access: {miss}" if missing else "") \
        .replace("__GENERATED__", datetime.now().strftime("%d %b %Y, %H:%M"))
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(page)


TEMPLATE = r"""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Jira Ticket Dashboard</title>
<style>
:root{--bg:#f6f7f9;--card:#fff;--ink:#1d2330;--mute:#6b7280;--line:#e5e7eb;--acc:#cd040b;--bar:#3b6fd8}
*{box-sizing:border-box}body{margin:0;font:14px/1.45 "Segoe UI",system-ui,sans-serif;background:var(--bg);color:var(--ink)}
header{padding:20px 28px;background:var(--card);border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:8px}
h1{margin:0;font-size:20px}h1 span{color:var(--acc)}.sub{color:var(--mute);font-size:12px}
main{padding:20px 28px;max-width:1400px;margin:auto}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin-bottom:16px}
.kpi{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:14px 16px}
.kpi b{display:block;font-size:26px;font-variant-numeric:tabular-nums}.kpi small{color:var(--mute)}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:12px;margin-bottom:16px}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:14px 16px}
.card h3{margin:0 0 10px;font-size:14px}
.row{display:grid;grid-template-columns:140px 1fr 40px;gap:8px;align-items:center;margin:6px 0;cursor:pointer}
.row .lbl{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.track{background:#eef1f6;border-radius:4px;height:14px}.fill{background:var(--bar);height:100%;border-radius:4px}
.row.on .fill{background:var(--acc)}.row .n{text-align:right;font-variant-numeric:tabular-nums}
.tools{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}
input,select,button{font:inherit;padding:7px 10px;border:1px solid var(--line);border-radius:6px;background:#fff}
input{flex:1;min-width:200px}button{cursor:pointer}
table{width:100%;border-collapse:collapse}th,td{padding:8px 10px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}
th{font-size:12px;color:var(--mute);cursor:pointer;user-select:none;white-space:nowrap;position:sticky;top:0;background:#fff}
td.num{text-align:right;font-variant-numeric:tabular-nums}a{color:var(--bar);text-decoration:none;font-weight:600}
.pill{display:inline-block;padding:1px 8px;border-radius:10px;font-size:12px;background:#eef1f6}
.pill.done{background:#e3f4e8;color:#1e7a3c}.miss{color:var(--acc);font-size:12px;margin:-6px 0 12px}
.wrap{overflow:auto;max-height:70vh}
</style></head><body>
<header><h1><span>■</span> Jira Ticket Dashboard</h1><div class="sub">Generated __GENERATED__ · source: __JIRA__</div></header>
<main>
<div class="miss">__MISSING__</div>
<div class="kpis" id="kpis"></div>
<div class="grid">
  <div class="card"><h3>By Brand</h3><div id="byBrand"></div></div>
  <div class="card"><h3>By Reporting Team</h3><div id="byTeam"></div></div>
  <div class="card"><h3>Avg days to resolve by Brand</h3><div id="ttr"></div></div>
</div>
<div class="card">
  <div class="tools">
    <input id="q" placeholder="Search ticket, summary, brand, team...">
    <select id="fBrand"></select><select id="fTeam"></select>
    <button id="reset">Reset</button>
  </div>
  <div class="wrap"><table><thead><tr id="head"></tr></thead><tbody id="body"></tbody></table></div>
</div>
</main>
<script>
const DATA=__DATA__, JIRA="__JIRA__";
const COLS=[["key","Ticket"],["summary","Summary"],["brand","Brand"],["reporting_team","Reporting Team"],
 ["environment","Env"],["status","Status"],["created","Created"],["resolved","Resolved"],["days_to_resolve","Days"]];
let sortK="created",sortDir=1;
const $=id=>document.getElementById(id), esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const uniq=k=>[...new Set(DATA.map(r=>r[k]||"(blank)"))].sort();
function opts(el,k,label){el.innerHTML=`<option value="">All ${label}</option>`+uniq(k).map(v=>`<option>${esc(v)}</option>`).join("")}
opts($("fBrand"),"brand","brands");opts($("fTeam"),"reporting_team","teams");
function rows(){const q=$("q").value.toLowerCase(),b=$("fBrand").value,t=$("fTeam").value;
 return DATA.filter(r=>(!b||(r.brand||"(blank)")===b)&&(!t||(r.reporting_team||"(blank)")===t)&&
  (!q||Object.values(r).join(" ").toLowerCase().includes(q)))}
function bars(el,pairs,sel,fmt){const max=Math.max(1,...pairs.map(p=>p[1]));
 el.innerHTML=pairs.length?pairs.map(([k,v])=>`<div class="row ${sel===k?"on":""}" data-k="${esc(k)}"><span class="lbl" title="${esc(k)}">${esc(k)}</span><div class="track"><div class="fill" style="width:${v/max*100}%"></div></div><span class="n">${fmt?fmt(v):v}</span></div>`).join(""):"<small>No data</small>"}
function count(rs,k){const m={};rs.forEach(r=>{const v=r[k]||"(blank)";m[v]=(m[v]||0)+1});return Object.entries(m).sort((a,b)=>b[1]-a[1])}
function render(){const rs=rows(),res=rs.filter(r=>r.resolved),d=res.map(r=>r.days_to_resolve).filter(x=>x!=null);
 const avg=d.length?(d.reduce((a,b)=>a+b,0)/d.length).toFixed(1):"–";
 $("kpis").innerHTML=[["Tickets",rs.length],["Resolved",res.length],["Open",rs.length-res.length],["Avg days to resolve",avg],
  ["Brands",new Set(rs.map(r=>r.brand)).size],["Reporting teams",new Set(rs.map(r=>r.reporting_team)).size]]
  .map(([l,v])=>`<div class="kpi"><b>${v}</b><small>${l}</small></div>`).join("");
 bars($("byBrand"),count(rs,"brand"),$("fBrand").value);bars($("byTeam"),count(rs,"reporting_team"),$("fTeam").value);
 const g={};res.forEach(r=>{if(r.days_to_resolve==null)return;const k=r.brand||"(blank)";(g[k]=g[k]||[]).push(r.days_to_resolve)});
 bars($("ttr"),Object.entries(g).map(([k,v])=>[k,v.reduce((a,b)=>a+b,0)/v.length]).sort((a,b)=>b[1]-a[1]),null,v=>v.toFixed(1));
 $("head").innerHTML=COLS.map(([k,l])=>`<th data-k="${k}">${l}${sortK===k?(sortDir>0?" ▲":" ▼"):""}</th>`).join("");
 rs.sort((a,b)=>{const x=a[sortK]??"",y=b[sortK]??"";return (x>y?1:x<y?-1:0)*sortDir});
 $("body").innerHTML=rs.map(r=>`<tr><td><a href="${JIRA}/browse/${esc(r.key)}" target="_blank">${esc(r.key)}</a></td><td>${esc(r.summary)}</td><td>${esc(r.brand)}</td><td>${esc(r.reporting_team)}</td><td>${esc(r.environment)}</td><td><span class="pill ${/closed|done|resolved/i.test(r.status)?"done":""}">${esc(r.status)}</span></td><td>${esc(r.created)}</td><td>${esc(r.resolved)||"–"}</td><td class="num">${r.days_to_resolve??"–"}</td></tr>`).join("")}
$("head").onclick=e=>{const k=e.target.dataset.k;if(!k)return;sortDir=sortK===k?-sortDir:1;sortK=k;render()};
$("byBrand").onclick=e=>{const r=e.target.closest(".row");if(r){$("fBrand").value=$("fBrand").value===r.dataset.k?"":r.dataset.k;render()}};
$("byTeam").onclick=e=>{const r=e.target.closest(".row");if(r){$("fTeam").value=$("fTeam").value===r.dataset.k?"":r.dataset.k;render()}};
["q","fBrand","fTeam"].forEach(id=>$(id).oninput=render);
$("reset").onclick=()=>{$("q").value=$("fBrand").value=$("fTeam").value="";render()};
render();
</script></body></html>"""


def main():
    ap = argparse.ArgumentParser(description="Build a dashboard from Jira ticket IDs")
    ap.add_argument("ids", nargs="*", help="Ticket IDs, e.g. VNQE-36881")
    ap.add_argument("-f", "--file", help="Text file with ticket IDs")
    ap.add_argument("-o", "--out", default="jira_dashboard", help="Output name (no extension)")
    ap.add_argument("--no-verify", action="store_true", help="Skip SSL check (corporate proxy)")
    args = ap.parse_args()

    keys = parse_ids(args)
    if not keys:
        sys.exit("No ticket IDs given. Example: python jira_dashboard.py VNQE-36881")
    token = os.environ.get("JIRA_TOKEN") or getpass.getpass(
        "Paste your Jira Personal Access Token (typing is hidden) and press Enter: ").strip()
    if not token:
        sys.exit("No token entered.")
    s = Jira(token, not args.no_verify)
    print(f"Looking up field IDs on {JIRA_URL} ...")
    field_ids = find_field_ids(s)
    print(f"Fetching {len(keys)} ticket(s) ...")
    rows, missing = fetch(s, keys, field_ids)

    write_csv(rows, args.out + ".csv")
    write_html(rows, missing, args.out + ".html")
    print(f"Done: {len(rows)} ticket(s) -> {args.out}.html and {args.out}.csv")
    if missing:
        print("Not found / no access:", ", ".join(missing))


if __name__ == "__main__":
    main()

