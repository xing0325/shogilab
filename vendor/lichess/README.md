# Lichess original assets

These files are copied unchanged from [lichess-org/lila](https://github.com/lichess-org/lila) at commit `cf699f718065fb479d7c891e8453768c222c7b9f` (retrieved 2026-10-15).

| Local path | Upstream path | Author / license |
| --- | --- | --- |
| `piece/cburnett/{w,b}{K,Q,R,B,N,P}.svg` | `public/piece/cburnett/` | Colin M. L. Burnett; GPL-2.0-or-later |
| `board/brown.png` | `public/images/board/brown.png` | Lila authors and pirouetti; AGPL-3.0-or-later |

`COPYING.md` is the unchanged upstream attribution table. `LICENSE` is the upstream AGPL license. `GPL-2.0.txt` contains the GNU GPL version 2 text, downloaded from https://www.gnu.org/licenses/old-licenses/gpl-2.0.txt. `manifest.json` records exact upstream paths and SHA-256 hashes.

The cburnett SVG files are the actual Lichess set, not regenerated approximations. The brown board is the upstream 8×8 board image. A 9×9 hybrid board must repeat/crop its original two-color tile pattern at the appropriate cell size instead of stretching all eight columns to nine cells.
