# 资料与规则版本

查阅日期：2026-10-09。

## 大局将棋

- [Taikyoku shogi, Wikipedia](https://en.wikipedia.org/w/index.php?title=Taikyoku_shogi&oldid=1378938316)：本体名称、升变表、Betza 走法、王族胜负、无打入与规则歧义。数据衍生文件 `data/catalog-source.json`、`data/catalog.json` 署名 Wikipedia contributors，按 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 提供。转换为结构化数据，去除说明文字与图像；保留原始记谱以便核对。
- [《世界の将棋》](https://archive.org/details/sekai-no-shogi)：资料表引用的研究资料，本次没有逐页校核原书。因此不将整个棋子库标为历史规则已完全验证。
- [Shogi variants: translation notes](https://drericsilverman.com/2021/04/22/shogi-variants-translation-notes-i/)：资料表引用的历史术语歧义讨论。

常见统计为每方 402 枚、207 类、含升变需记忆 253 套走法。这里导入的是所引用版本的 209 条本体名称记录（含左右分项等），并不以程序记录数代替历史棋种统计。许多不同名称棋子共享基础走法、升变不同；并非每个名字都对应独一无二的走法。

升变采用资料列出的“第一次吃子时强制升变”版本，每枚棋子仅翻面一次，不沿名称链无限升变；另一史料版本是进入敌方 11 排升变，本版未采用。王按八方向直行最多两格，太子八方向一步。火鬼无天竺将棋的烧杀效果。

自动导入不会把未知 Betza 表达降级成普通走法。只有本体及直接升变目标均有规则的本体才能入池。固定王将及太子不参与随机 BP，酔象吃子后产生太子仍可成为第二王族。

手动对照修正：雲鷲原表 `sWfF3vWW` 与其文字、图示不一致，采用 `sWfB3vR`；鴻翼原表 `FsW3vWW` 采用 `FsR3vR`。天馬 `vN` 只允许纵向长边的四个马跳，不误解析为全部八方向。所有这些解释在 `src/engine.js` 中可追溯。

## BP

- [Riot 2017 World Championship Rules v17.3](https://esports-assets.s3.amazonaws.com/production/files/rules/2017-World-Championship-Rules-v-17-3.pdf)，§7.7.3：以 A 为蓝方、B 为红方，禁 ABABAB、选 ABBAAB、禁 BABA、选 BAAB。本原型把 A/B 映射到先手/后手。
- [职业 draft 流程说明](https://udrafter.eu/tips/how-a-draft-works)：交叉核对 3 禁 → 3 选 → 2 禁 → 2 选的阶段划分。

选用常规单局职业 BP；Fearless/全局 BP 是跨局约束，本原型没有系列赛，因此不加入。

## lishogi

- [lishogi 源码](https://github.com/WandererXII/lishogi)、[COPYING.md](https://github.com/WandererXII/lishogi/blob/master/COPYING.md)：主体 AGPL-3.0-or-later，存在具体资源例外。
- [Shogiground](https://github.com/WandererXII/shogiground)：棋盘 UI，GPL-3.0-or-later；README 明确不包含将棋规则。

本次界面适配使用官方仓库提交 `5394fc3dd868de1442ea24ecd87cdf065dea2f33`（2026-10-09 获取）。

实际复用清单：

- `ui/@build/static/assets/images/boards/wood.png` → `vendor/lishogi/wood.png`，原样复制，AGPL-3.0-or-later。
- `ui/@build/pieces/assets/standard/ryoko_1kanji/0*.svg` → `vendor/lishogi/pieces/`，原样复制，作者 nexxogen，CC BY-SA 4.0；只为名称有明确对应的棋种使用图像，不继承标准将棋走法。
- `ui/@build/pieces/assets/chushogi/ryoko_1kanji/blank/big.svg` → `vendor/lishogi/pieces/blank.svg`，同作者与许可证，增加 180° SVG 分组旋转以统一先手朝向；用于未包含在标准棋子素材中的大局棋子，文字单独叠加。
- `ui/round/css/_app-layout.scss`、`_moves-col2.scss` → `vendor/lishogi/round.css`，保留原 grid-area 结构及棋谱样式，解析浅色主题变量，调整独立页面断点与容器。原始 SCSS 保存在 `vendor/lishogi/upstream/`。
- `ui/common/css/theme/_light.scss` 的浅色背景与主色用于页面适配；原始文件也保存在上述目录。

`src/lishogi.css` 和 `src/app.js` 是与本地 BP 引擎连接的适配层。没有复用线上账号、服务器 API、实时对战通信或原站 logo。原站 logo 的授权仅允许用于指代 lishogi.org，因此此页面保留“大局·择阵”名称。

本应用代码与 CSS 以 AGPL-3.0-or-later 提供；完整上游许可证与素材例外见 `vendor/lishogi/LICENSE` 和 `vendor/lishogi/COPYING.md`。棋子 SVG 仍适用 CC BY-SA 4.0，数据适用本文件前述 CC BY-SA 4.0。所有本地源文件可直接访问，页面还提供 `source.zip` 下载，包含适配源代码、原始 SCSS 和许可证。

界面与官方不同之处是有意保留的本地功能：5×5、自定义 BP 与布阵、无时限同屏双人、棋子研习；没有标准 9×9、联网匹配或电脑对手。原有界面源文件保存在 `src/legacy/` 便于对照。

## Shogi Lab 首页故事

首页“我和将棋的故事”依用户授权，改写自其 2026-10-03 Manus 游戏方向申请中的棋类经历与项目缘起。仓库仅保存与本项目相关的简短改写，不包含申请原文或联系方式。

## Chess vs Shogi 与原版 lichess 资源

原版 cburnett SVG 和 brown.png 的固定提交、逐文件许可和 SHA-256 校验见 [vendor/lichess/README.md](vendor/lichess/README.md) 与 manifest.json。棋子 GPL-2.0-or-later，棋盘 AGPL-3.0-or-later；未重画材质。9×9 以原 PNG 的八格周期重复到九格，底半使用原 lishogi 木纹。

- 标准将棋走法、升变、打入及王手规则：[日本将棋联盟](https://www.shogi.or.jp/match/taikyoku_rules/)。
- 国际象棋走法、王车易位、吃过路兵和升变：[FIDE Laws of Chess](https://handbook.fide.com/chapter/e012023)。
- 大局将棋王将两格、太子一格及升变关系：[Taikyoku 规则英译记录](https://metacpan.org/release/JGOFF/Games-Shogi-0.03/view/lib/Games/Shogi/Taikyoku.pm)。
- 混合棋盘、数量、单方打入、被俘国象棋子保留走法并转向，以及不自动处理重复/五十步，是 Shogi Lab 变体约定，不属于标准赛事规则。
- 修正旧导入 mocking-bird 显示名 `or` 为可排印展开写法「古寺時鳥」，原表为罕见合体字，读 jichō；参考 [大局将棋规则站](https://taikyoku-shogi.github.io/rules/#mocking-bird)。

作者联系二维码经用户指定复用自本地「世一蛙」项目，仅用于联系作者。

## Round interaction update

- The move and capture sounds in `vendor/lishogi/sound/` are the **SFX** sound set from Lishogi, by **Enigmahack**, licensed **AGPL-3.0-or-later**. Source: `ui/@build/static/assets/sound/mp3/system/sfx/{move,capture}.mp3`, commit `5394fc3dd868de1442ea24ecd87cdf065dea2f33` at https://github.com/WandererXII/lishogi. This is Lishogi's open SFX set, not its default wooden sound set.
- Player rows, hand row, vertical promotion chooser, replay strip and setup modal follow the Lishogi interaction references. Local implementation is in `src/round-ui.css`, `src/app.js` and `src/clock.js`.
- `assets/mark.svg` is an original Shogi Lab mark; the `.manus` wordmark is visual branding and does not assert ownership of a domain. No Lishogi logo is reused.

### Side-specific move sounds

The active move sounds now follow the **acting player**, not the moved piece's original faction:

- `vendor/lishogi/sound/shogi-{move,capture}.mp3`: original Lishogi **Shogi** set, from `ui/@build/static/assets/sound/mp3/system/shogi/` at commit `5394fc3dd868de1442ea24ecd87cdf065dea2f33`, https://github.com/WandererXII/lishogi. These files fall under the upstream COPYING.md “other sounds” exception; they are not covered by this project's AGPL license. The previous SFX files remain separately attributed above.
- `vendor/lichess/sound/{move,capture}.mp3`: original Lichess **Standard** set, downloaded from https://raw.githubusercontent.com/lichess-org/lila/master/public/sound/standard/Move.mp3 and https://raw.githubusercontent.com/lichess-org/lila/master/public/sound/standard/Capture.mp3 on 2026-10-18. Retain upstream sound-asset terms; application-code licensing does not relicense these recordings.

Shogi drops use the shogi move sound, including drops of captured chess pieces. En passant uses the chess capture sound. Castling and promotion use the moving side's move/capture sound without a duplicate extra sound.

## Manus mark

`assets/manus-glyph.svg` is the official white Manus glyph from [Manus Brand Assets](https://manus.im/brand), downloaded from `https://files.manuscdn.com/assets/image/brand/image/Manus-Glyph-White.svg`. `assets/mark.svg` places that glyph on a custom beige-outline shogi tile as requested. Manus trademark and artwork remain with their owner; this composition does not imply official affiliation or relicense the glyph under AGPL.
