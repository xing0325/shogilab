# 在线对战部署与接口交接

本仓库包含可以运行的完整前后端，协议版本 1。`src/engine.js` 与 `src/versus.js` 是前后端共享规则；不要在新后端另写一份规则，也不要接受客户端棋盘快照作为裁决依据。

## 运行与部署

- Node 20+，单 Node 进程，无依赖。运行 `node server.mjs`，默认仅监听 127.0.0.1:5173。
- 环境变量：`HOST` 监听地址；`PORT` 默认5173；`DATA_DIR` 私有持久化目录（默认项目内 .server-data）；`PUBLIC_ORIGIN` 公网完整 origin，例如 https://play.example.com，不带尾斜杠。
- 同源提供静态前端与 /api；不需要前端密钥或构建过程。公开服务必须通过 HTTPS 代理。不跨域部署前后端。
- Docker：设置 PUBLIC_ORIGIN 后，在 deploy 内执行 `docker compose up -d --build`。使用 Caddyfile 示例配置 HTTPS；Docker 端口仅绑定宿主机 loopback。使用持久化 volume。
- 非 Docker：`HOST=127.0.0.1 PORT=5173 DATA_DIR=/var/lib/shogi PUBLIC_ORIGIN=https://play.example.com node server.mjs`，用系统服务管理重启，再由 Caddy 反代。
- 保存目录必须可写且不能公开托管；备份整个 DATA_DIR。单实例使用同步、原子 rename 文件保存，不能启动多个写入同目录的 worker。需要横向扩容时将 RoomStore 改为数据库事务/CAS，保留协议与服务器规则调用。
- 7 天房间有效期，最多500个房间，最多1500次棋局状态变化后自动和棋。1秒拉取，500ms 检查超时。进程关闭期间时间仍按持久化时间戳流逝；恢复后超时按原期限判负。服务器时钟需同步。
- 代理层补充公网连接/带宽限制。应用已有请求体4KB、请求超时、基础 IP 限流、同源检查、座位鉴权。反向代理下应用按 socket 地址限流（不信任客户端 X-Forwarded-For）；大型部署应在代理按真实客户端限流并调整应用策略。
- `GET /api/health` 返回 `{ok:true,protocol:1}`。运行 `node --test tests/*.test.mjs` 检查规则、鉴权、幂等、持久化和 HTTP 层。Docker 配置尚需在目标 Docker 环境实测；本机直接 Node 服务已验证。

## API

所有写请求 `Content-Type: application/json`。凭证放 `Authorization: Bearer <token>`，不放 URL。

- `POST /api/rooms`：`{mode:"draft"|"versus",side:0|1,minutes:1..180,seconds:0..60,timed:boolean,seed?:string,name?:string}`。seed仅供BP棋池使用。返回快照及一次性原始token。
- `POST /api/rooms/:id/join`：`{name?:string}`，领取空座位，返回快照和token。无空位返回409。重连必须使用原始token，不能重新抢已占用座位。
- `GET /api/rooms/:id`：鉴权后获取完整快照（含棋谱）；读取时也检查超时。
- `POST /api/rooms/:id/actions`：`{id:UUID,revision:number,action:{type,...}}`。id用于失败后重试；同一id不会重复执行。版本过期返回409，客户端先拉新快照。

动作：

| type | 字段 | 限制 |
|---|---|---|
| ready | 无 | 双方准备后开始；开始前不能走棋 |
| pick | piece | BP选阵、轮到本人、棋池中未占用 |
| deploy | piece,to | 本人阵容，己方两排空格 |
| move | from,to,promotion? | 合法走法；promotion为棋子id或null |
| drop | piece,to | 仅混战将棋方，合法持驹与空格 |
| offer-draw | 无 | 单个待决和棋提议 |
| accept-draw / decline-draw | 无 | 仅提议的另一方可回复 |
| resign | 无 | 本人认输，不依赖当前行棋方 |

快照：`{id,revision,side,started,ready:[bool,bool],players:[{name}|null,{name}|null],game,history,offer:0|1|null,createdAt,expiresAt,serverNow}`。除创建/加入，绝不回传token；不回传令牌哈希。前端用 serverNow 校正显示，服务器计时不依赖客户端。draw、resign不需要轮到本人；走棋必须轮到本人。

错误：`{error:string}`，400非法动作，401凭证无效，403越权/来源不符，404房间不存在，409满房或版本冲突，413体积超限，429频率限制，503容量不足。客户端最多自动重试同一个动作id一次，此后拉快照确认，避免重复落子。

## 前端接入与安全边界

`src/online.js` 管理 API、1秒同步和断线重连；`src/app.js` 管理UI与显式动作转换。`#room/<id>` 是邀请链接。token存于本浏览器 localStorage 的 `shogi-seat-<id>`，不会出现在复制链接中。丢失token后无法证明原座位归属；未来账号体系可在认证后恢复座位，不要新增仅凭roomId接管座位的接口。

不使用客户端传来的winner、clock、board或side更新服务器；任何AI接手都应维持此原则。自定义规则为吃王制：国象两王全失才输，将棋只有一王；仅将棋可打入。旧本地单王规则不作为在线房间规则。在线房间不能以离线存档方式继续操作；历史中的在线记录返回原房间。

当前没有公共匹配、观战、聊天或账号恢复；没有伪装这些功能的占位接口。增加这些功能时需另行设计隐私、鉴权和容量策略。

悔棋协议：`offer-undo` 发起，`accept-undo` / `decline-undo` 仅对方可执行。快照 `undoOffer` 为申请方座位或 null；同意后回退最近一步，不返还已用时间。新的落子自动取消申请，对局结束后不可悔棋。
