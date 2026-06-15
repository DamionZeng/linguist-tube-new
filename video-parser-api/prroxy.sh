python3 << 'PYEOF'
import subprocess, base64, re
from urllib.parse import urlparse, parse_qs, unquote

# ====== 改成你的订阅链接 ======
SUB_URL = "改成你的订阅链接"
# =============================

raw = subprocess.check_output(["curl", "-s", SUB_URL], timeout=30).decode()
try:
    raw = base64.b64decode(raw).decode()
except:
    pass

proxy_names = []
proxies = []

for line in raw.splitlines():
    line = line.strip()
    if not line or line.startswith("#"):
        continue
    name = unquote(line.split("#", 1)[1]) if "#" in line else f"node-{len(proxies)}"
    proxy_names.append(name)
    u = urlparse(line)
    p = {
        "name": name,
        "type": u.scheme,
        "server": u.hostname,
        "port": u.port or 443,
        "password": u.username or "",
    }
    params = parse_qs(u.query)
    if "sni" in params:
        p["sni"] = params["sni"][0]
    if "allowInsecure" in params:
        p["skip-cert-verify"] = params["allowInsecure"][0] == "1"
    if u.scheme == "trojan":
        p["udp"] = True
    proxies.append(p)

yaml_str = """port: 7890
socks-port: 7891
allow-lan: false
mode: rule
log-level: info

proxies:
"""

for p in proxies:
    yaml_str += f'  - name: "{p["name"]}"\n'
    yaml_str += f'    type: {p["type"]}\n'
    yaml_str += f'    server: {p["server"]}\n'
    yaml_str += f'    port: {p["port"]}\n'
    yaml_str += f'    password: "{p["password"]}"\n'
    if "sni" in p:
        yaml_str += f'    sni: "{p["sni"]}"\n'
    if p.get("skip-cert-verify"):
        yaml_str += '    skip-cert-verify: true\n'
    if p.get("udp"):
        yaml_str += '    udp: true\n'

yaml_str += """
proxy-groups:
  - name: PROXY
    type: select
    proxies:
      - 自动选择
"""

for n in proxy_names:
    yaml_str += f'      - "{n}"\n'

yaml_str += """  - name: 自动选择
    type: fallback
    proxies:
"""
for n in proxy_names:
    yaml_str += f'      - "{n}"\n'

yaml_str += """    url: http://www.gstatic.com/generate_204
    interval: 300

rules:
  - MATCH,PROXY
"""

with open("/etc/clash/config.yaml", "w", encoding="utf-8") as f:
    f.write(yaml_str)

print(f"OK: {len(proxies)} 个节点, 使用 fallback 模式")
PYEOF