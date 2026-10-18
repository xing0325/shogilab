"""Import factual names, promotions and move notation; no article prose or images.
Source: Wikipedia Taikyoku shogi, CC BY-SA 4.0. See SOURCES.md.
"""
from html.parser import HTMLParser
import subprocess, re, json
from pathlib import Path

class Node:
    def __init__(self, tag='', parent=None):
        self.tag, self.parent, self.children = tag, parent, []
    def text(self):
        return ''.join(c if isinstance(c, str) else c.text() for c in self.children)
    def all(self, tag):
        out = []
        for c in self.children:
            if isinstance(c, Node):
                if c.tag == tag: out.append(c)
                out.extend(c.all(tag))
        return out

class Parser(HTMLParser):
    def __init__(self):
        super().__init__(); self.root = self.current = Node()
    def handle_starttag(self, tag, attrs):
        n = Node(tag, self.current); self.current.children.append(n)
        if tag not in ['br','hr','img','meta','link','input','wbr','source']: self.current = n
    def handle_endtag(self, tag):
        n = self.current
        while n.parent and n.tag != tag: n = n.parent
        if n.parent: self.current = n.parent
    def handle_data(self, text): self.current.children.append(text)

def clean(s): return re.sub(r'\s+', ' ', re.sub(r'\[[^\]]*\]', '', s)).strip()

if __name__ == '__main__':
    html = subprocess.check_output(['curl','-fsSL','--max-time','40','https://en.wikipedia.org/w/index.php?title=Taikyoku_shogi&oldid=1378938316']).decode()
    p = Parser(); p.feed(html)
    table = next(t for t in p.root.all('table') if 'Promotes to' in t.text() and 'Free dream' in t.text())
    rows = []
    for tr in table.all('tr'):
        cells = [clean(c.text()) for c in tr.children if isinstance(c, Node) and c.tag in ['td','th']]
        if len(cells) >= 4 and cells[0] != 'Piece': rows.append(cells)
    moves = {}
    for li in p.root.all('li'):
        txt = clean(li.text())
        if not re.match(r'(?:Betza )?Notation:', txt): continue
        node = li.parent
        siblings = [c for c in node.parent.children if isinstance(c, Node)]
        idx = siblings.index(node)
        header = next((clean(c.text()) for c in reversed(siblings[:idx]) if c.tag == 'p' and '(' in c.text()), '')
        notation = txt.split(':', 1)[1].strip()
        moves[header] = notation
    out = {'source':'https://en.wikipedia.org/w/index.php?title=Taikyoku_shogi&oldid=1378938316','rows':rows,'moves':moves}
    Path('data').mkdir(exist_ok=True)
    Path('data/catalog-source.json').write_text(json.dumps(out, ensure_ascii=False, indent=2))
    def notation_for(name):
        if name.startswith('Howling dog'): return 'bWfR'
        for title, notation in moves.items():
            if re.search(r'(?:^|,\s*|\band\s+)'+re.escape(name)+r'\s*\(', title, re.I): return notation
        return None
    def key(name): return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    entries = {}
    for row in rows:
        name, kanji, romaji, promotion = row[:4]
        entries[key(name)] = dict(id=key(name), name=kanji.split(' / ')[0], english=name, romaji=romaji,
            notation=notation_for(name), promotion=key(promotion.lstrip('*')) if promotion != '—' else None, original=True)
    for row in rows:
        if row[3] == '—': continue
        name = row[3].lstrip('*'); id = key(name)
        if id not in entries:
            entries[id] = dict(id=id, name=row[4], english=name, romaji=row[5] if len(row)>5 else '',
                notation=notation_for(name), promotion=None, original=False)
    # The source's tokin is a gold-moving promoted pawn, not another promotion chain.
    entries['gold-general']['name'] = '金将'
    Path('data/catalog.json').write_text(json.dumps(list(entries.values()), ensure_ascii=False, indent=2))
    print(f'{len(rows)} catalogue rows; {len(moves)} movement groups')
    print(json.dumps(list(moves.items())[:8], ensure_ascii=False, indent=2))
