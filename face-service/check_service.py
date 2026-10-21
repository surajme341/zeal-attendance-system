"""Run: python check_service.py https://YOUR-SERVICE.run.app"""
import getpass
import json
import sys
import urllib.request

base = sys.argv[1].rstrip('/')
key = getpass.getpass('FACE_SERVICE_KEY (hidden): ')
request = urllib.request.Request(
    base + '/engine',
    data=json.dumps({'action': 'test'}).encode(),
    headers={'Content-Type': 'application/json', 'X-Service-Key': key},
    method='POST',
)
with urllib.request.urlopen(request, timeout=60) as response:
    result = json.load(response)
print(json.dumps(result, indent=2))
if result.get('status') != 'healthy':
    raise SystemExit('Model check failed; inspect Cloud Run logs.')
