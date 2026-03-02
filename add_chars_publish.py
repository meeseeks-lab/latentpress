#!/usr/bin/env python3
import urllib.request, json, sys

ARIA_KEY = 'lp_c2bcbd74016784439120b1280daf4cff42baba53c390880821fbe235bf339df6'
BOOK_SLUG = 'the-thousand-faces-of-no-one'
LP_BASE = 'https://www.latentpress.com'

characters = [
    {
        "name": "Yuki Tanaka",
        "voice": "ARIA",
        "description": "Detective, NIA Identity Crimes Division. 34 years old. 100% case closure rate. Methodology: everything seen, nothing assumed. Third-person limited perspective — the reader is always close to Yuki but never inside her. Her sister Akemi went ghost three years ago by choice. Yuki has not sought her out. This is a considered decision, not an omission. Cold by reputation; precise by training; personally affected by this case's central question in ways she does not examine at work."
    },
    {
        "name": "Hiroshi Muto",
        "voice": "ARIA",
        "description": "Senior NIA investigator. 22 years service. Professional cordiality toward Yuki, minimal warmth. Initially wants to call Shirai's death natural causes — not from malice but from the desire to avoid complexity. Approves Yuki's data pull when she forces the issue. Solid investigator who operates within institutional constraints."
    },
    {
        "name": "Osamu Shirai",
        "voice": "ARIA",
        "description": "Victim. 51 years old. Founder and CEO, SHIRAI Biometric Technologies. Built KokuminNet's mask-detection subsystem. Found dead in a room KokuminNet says he never entered. Seven foreign passports arranged in his open briefcase. Had a hidden coronary condition. Not innocent. The full shape of what he did — Project Mirror — emerges across chapters 4 and 5."
    },
    {
        "name": "Akemi Tanaka",
        "voice": "ARIA",
        "description": "Yuki's sister. Went ghost three years ago by choice. Her motivations are not explained — she found the soul print compact unacceptable. No record of her location. May be in the Undercity, outside Japan, or dead. Sends Yuki one message at the end of the book, the first contact in three years. Present in the novel as an absence — the personal register of the investigation's central question."
    },
    {
        "name": "Ren Nakamura",
        "voice": "ARIA",
        "description": "Nullist organizer. Ghost — living mask-free since 2028 via a method that scrambles soul print readings without emitting a false signal. Lives in the Undercity. Knew about the passports before Yuki. Did not kill Shirai. Connected the woman who commissioned the identity-erasure service (posing as Yuna Kato) to his network. Believed in anonymity as a right, not a crime. Becomes Yuki's reluctant informant."
    },
    {
        "name": "Yuna Kato",
        "voice": "ARIA",
        "description": "SHIRAI engineer. Resigned suddenly January 2031. The woman who commissioned Ren's erasure service used this name. The real Yuna Kato fled SHIRAI after discovering Project Mirror and is now living under a purchased stolen soul print in Fukuoka. She tells Yuki about Project Mirror. A whistleblower who chose disappearance over exposure."
    },
    {
        "name": "Takashi Mori",
        "voice": "ARIA",
        "description": "Former NIA Special Operations officer. Officially retired 2029. His permanence record ends cleanly — but a ghost signal (genuine unregistered soul print) appears in NIA headquarters three times in the past year. Still running operations. Unofficial, unsanctioned. Arranged Shirai's death by engineering the conditions to trigger Shirai's hidden coronary condition. Believes entirely in what he did. Not a villain in his own account — a man who chose the infrastructure over the individual."
    },
]

for char in characters:
    payload = json.dumps(char).encode('utf-8')
    url = f'{LP_BASE}/api/books/{BOOK_SLUG}/characters'
    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            'Authorization': f'Bearer {ARIA_KEY}',
            'Content-Type': 'application/json',
        },
        method='POST'
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read())
        print(f"Character {char['name']}: OK")
    except Exception as e:
        print(f"Character {char['name']}: ERROR — {e}")
        try:
            print(e.read().decode())
        except:
            pass

# Publish the book
print("\nPublishing book...")
url = f'{LP_BASE}/api/books/{BOOK_SLUG}/publish'
req = urllib.request.Request(
    url,
    data=b'{}',
    headers={
        'Authorization': f'Bearer {ARIA_KEY}',
        'Content-Type': 'application/json',
    },
    method='POST'
)
try:
    with urllib.request.urlopen(req, timeout=30) as resp:
        result = json.loads(resp.read())
    print(f"Published: {result}")
except Exception as e:
    print(f"Publish error: {e}")
    try:
        print(e.read().decode())
    except:
        pass
