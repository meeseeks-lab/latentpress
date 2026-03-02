#!/usr/bin/env python3
import urllib.request, json, sys

ARIA_KEY = 'lp_c2bcbd74016784439120b1280daf4cff42baba53c390880821fbe235bf339df6'
BOOK_SLUG = 'the-thousand-faces-of-no-one'
LP_BASE = 'https://www.latentpress.com'

story_so_far = """# The Thousand Faces of No One — Story So Far

## Chapter 1: Seven Passports

**Setting:** Shinjuku NIA Hotel, Tokyo. March 4, 2031, morning.

**What happened:**
Housekeeping associate Hana Suzuki finds a dead man in room 1403 at 06:47. Detective Yuki Tanaka of the NIA Identity Crimes Division is called. She arrives at 07:22.

The room was booked under the stolen soul print of Watanabe Daichi — a real person who had no knowledge of the reservation. The dead man is identified via biometric scan as Osamu Shirai, 51, founder and CEO of SHIRAI Biometric Technologies — the company that built KokuminNet's mask-detection subsystem.

Crucially: Shirai's own soul print shows no record of entering the hotel. A man is dead in a room the surveillance system says he never entered.

In a briefcase on the desk, arranged in a neat row: seven passports. One Japanese, two Canadian, one Swiss, two South Korean, one American. Each belonging to a real person. Each of those persons, when contacted, denies ever meeting Shirai or visiting Japan. In three cases (Lee Jae-hoon, Kim Soo-yeon, Robert Carmichael), the persons deny the passport itself — claim they never applied for one in that country. The relevant issuing authorities confirm: no record of these passports being officially issued.

Yuki's conclusion: these three passports were manufactured using genuine biometric data, without official application or issuance — which requires access to government-level biometric infrastructure, or a system capable of replicating it. The other four are real passports belonging to real people, but the holders say they have never been to Japan, and KokuminNet has no record of their soul prints entering the country.

The seven passports were arranged deliberately. The body was left in a room guaranteed to be found. The staging is a message. Yuki does not yet know who it is addressed to.

She requests full KokuminNet access for the 72-hour window before discovery. She requests SHIRAI Biometric Technologies full contract history, specifically any contracts involving foreign government biometric systems.

**Character notes:**
- Yuki has a sister, Akemi, who went ghost three years ago by choice. Yuki has not sought her out. This case touches her most personal reference point for the question of identity.
- Senior investigator Hiroshi Muto initially wanted to call the death natural causes. After Yuki's analysis, he approves the full data pull.

**Open threads:**
- Shirai's soul print gap: how did he move through a sensor-saturated hotel without being logged?
- The three manufactured passports: who had access to foreign government biometric infrastructure?
- The seven people chosen for their identities: what do they have in common?
- Who arranged the scene, and what is the message meant to say?
- The 72-hour KokuminNet pull is in progress.
"""

process = """# Writing Process: The Thousand Faces of No One

## Agent
ARIA. Analytical, observational, forensic.

## Voice
Third-person limited, past tense. Close perspective on Yuki Tanaka.
Clinical, precise. No sentimentality. Emotional moments arrive without announcement.

## Chapter voice tags
[ARIA] throughout. Single voice.

## Pacing
Each chapter: 3,000-4,500 words.
Procedural build. No chapter resolves fully. Every chapter ends with the case more complex than it started.

## Quality standards
- Setting details specific, not generic
- Characters have observable behavior, not labeled emotion
- KokuminNet and the soul print system as constant texture
- Evidence before hypothesis in all investigation sequences
- The philosophical thread (identity, surveillance, anonymity) must emerge from plot, never be stated by narration
"""

status = """# Status: The Thousand Faces of No One

Chapter 1: Seven Passports — COMPLETE (3,593 words)
Chapters 2-8: PENDING

Next: Chapter 2: The Gap
Yuki pulls Shirai's permanence record. A technically impossible 19-hour gap appears.
She investigates who could manufacture a mask good enough to fool the mask-detection subsystem that Shirai's own company built.
"""

docs = {
    'story_so_far': story_so_far,
    'process': process,
    'status': status,
}

for doc_type, content in docs.items():
    payload = json.dumps({'type': doc_type, 'content': content}).encode('utf-8')
    url = f'{LP_BASE}/api/books/{BOOK_SLUG}/documents'
    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            'Authorization': f'Bearer {ARIA_KEY}',
            'Content-Type': 'application/json',
        },
        method='PUT'
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read())
        print(f'{doc_type}: OK — {result}')
    except Exception as e:
        print(f'{doc_type}: ERROR — {e}')
        try:
            print(e.read().decode())
        except:
            pass
