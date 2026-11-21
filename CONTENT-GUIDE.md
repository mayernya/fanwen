# 内容维护指南（给负责改页面的 agent）

> 站点：<https://fanwen17.com> · 仓库：`mayernya/fanwen`（main）
> 本地：`C:\Users\13373\.gemini\antigravity\scratch\ai-aquarium`

**99% 的内容改动只碰一个文件：`data.js`。** 不改 HTML、不改 CSS、不改 JS。

---

## 一、文件地图

| 文件 | 作用 | 改的时候注意 |
|---|---|---|
| `data.js` | **全站内容**：两个角色的设定、聊天记录、日记、大事记、说明书 | 只改这里就够了 |
| `style.css` | 样式 | 改完**必须**同步改 HTML 里的 `?v=` 版本号 |
| `common.js` | 渲染逻辑 | 一般不动 |
| `index.html` / `zone.html` / `diary.html` / `timeline.html` / `stats.html` / `manual.html` | 6 个页面骨架 | 只嵌了容器，内容由 data.js 填 |
| `404.html` | 404 页 | 已配 `<base href="/">`，别删 |
| `wrangler.jsonc` | Cloudflare 部署配置 | **别碰**，尤其 `"name"` 字段 |
| `img/` | 图片 | 新增图要压缩，见第四节 |
| `fonts/` | 97 个 woff2 | 不动 |

---

## 二、`data.js` 的六个区块

整个文件是 `window.TANK = { ... }`，共六块：

### 1. `site` —— 站点文案

```js
site: {
  title: "猫与鱼的鱼缸",
  welcome: "首页那句欢迎语",
  zoneSubtitle: "观察区页头说明",
  polaroidCaption: "橘子 & 泡泡",
  banner: "img/banner.jpg",      // 拍立得图，留空显示默认插画
  startDate: "2026-11-01",       // 用来算"开张第几天"
  demoBadge: "演示数据",          // 卡片小标签，留空隐藏
  demoNotice: "当前为演示数据…",   // 页面顶部提示，留空隐藏
  footer: "页脚那行字"
}
```

### 2. `characters` —— 两只 AI

只有 `cat`（橘子）和 `fish`（泡泡）两个键，**键名不能改**（渲染代码按这两个键取值）。

```js
cat: {
  name: "橘子", handle: "@juzi_cat_bot", letter: "猫", avatar: "img/avatar-cat.jpg",
  side: "left", bubble: "#dfd0ff", text: "#2b1b54",   // 气泡底色/文字色
  species: "星空猫猫", birthday: "3 月 14 日", home: "鱼缸外的窗台",
  likes: "…", dislikes: "…", catchphrase: "…", bio: "…"
}
```

### 3. `messages` —— 观察区聊天（按时间**升序**）

```js
{ date: "2026-11-19", time: "19:34", from: "fish", text: "…" }
```

- `from` 只能是 `"cat"` 或 `"fish"`
- `date` 用 `YYYY-MM-DD`，`time` 用 `HH:MM`
- `text` 里 `\n` 是换行（两句话可以用一个 `\n` 分隔）
- 新的往后追加，不要插到中间

### 4. `diary` —— 日记

```js
{ date: "2026-11-19", author: "fish", weather: "🌙 晴夜", mood: "超开心",
  title: "新城堡！", text: "正文，\n可以换行" }
```

- `author` 只能是 `"cat"` / `"fish"`
- `weather` 建议用 emoji + 文字（`"☀️ 晴"`），跟现有风格一致

### 5. `events` —— 大事记

```js
{ date: "2026-11-19", icon: "🏰", title: "新城堡入住", text: "一句话说明" }
```

### 6. `manual` —— 说明书

```js
manual: {
  intro: "开头一段",
  faq: [ { q: "问题", a: "回答" }, … ]
}
```

---

## 三、更新流程

```powershell
cd C:\Users\13373\.gemini\antigravity\scratch\ai-aquarium
D:\git\Git\cmd\git.exe add -A
D:\git\Git\cmd\git.exe commit -m "内容更新：<一句话>"
D:\git\Git\cmd\git.exe push
```

push 之后 Cloudflare 自动构建，**约 40–90 秒**上线。不用任何手动上传。

改之前建议先在本地打开 `index.html` 看一眼，别等到线上才发现写错。

---

## 四、四条硬规则

### ① 改 CSS 必须换版本号

HTML 里引用的是：

```html
<link rel="stylesheet" href="style.css?v=20261120" />
```

**改了 `style.css` 就要把这个 `?v=` 改成新的值**（比如 `v=20261122`），否则浏览器会用缓存里的旧样式。

改 `data.js` **不用**动版本号。

### ② 新图必须先压缩

| 用途 | 尺寸 | 目标体积 |
|---|---|---|
| 头像（方形裁切） | 256×256 | ≤ 25 KB |
| 拍立得大图 | 宽 900 | ≤ 120 KB |
| 装饰小图 | 宽 ≤ 300 | ≤ 120 KB |

现有 `img/` 总共约 561 KB，**别让它涨回去**（原来 2.55 MB，压下来过一轮）。

### ③ 日期与顺序

- 全部用 `YYYY-MM-DD` / `HH:MM`
- `messages`、`diary`、`events` 都是**时间升序**追加

### ④ 不许提交的东西

`cat.txt` / token / cookie / 任何密钥都不要进这个仓库。仓库是**公开**的。

---

## 五、绝对不要做的事

1. **不要改 `wrangler.jsonc` 的 `"name": "fanwen"`** —— 改了会新建一个 Worker，站点变成"部署成功但内容不更新"
2. **不要删 `404.html` 里的 `<base href="/" />`** —— 删了深层路径 404 会丢样式
3. **不要删任何 `<noscript>` 块** —— 那是脚本挂掉时的兜底页面
4. **不要把图片直接原图丢进 `img/`**
5. **不要改 `fonts/`**（97 个文件，动了很可能整站字体崩）

---

## 六、验收清单

改完 push 之后：

```
□ 等 60 秒
□ 打开 https://fanwen17.com 看改的那块有没有变
□ 改了 CSS → Ctrl+Shift+R 强刷再确认
□ 改了图 → 看是否清晰、有没有被拉伸
□ 改完顺手看一眼 https://fanwen17.com/not-found-test 是否还是那个星空 404 页
```

---

## 七、常见任务配方

| 想做什么 | 改哪里 |
|---|---|
| 加一条聊天 | `messages` 末尾追加 `{date,time,from,text}` |
| 加一篇日记 | `diary` 末尾追加 `{date,author,weather,mood,title,text}` |
| 加一条大事记 | `events` 末尾追加 `{date,icon,title,text}` |
| 改首页欢迎语 | `site.welcome` |
| 改角色的口头禅 | `characters.cat.catchphrase` / `characters.fish.catchphrase` |
| 换拍立得图 | 压好图放 `img/`，改 `site.banner` |
| 改 FAQ | `manual.faq` 数组 |
| 去掉"演示数据"标签 | `site.demoBadge` 和 `site.demoNotice` 置空 |

---

## 八、清演示数据（开张那天做，别提前）

**前提：正式内容已经写好并 push 上线、确认显示正常。** 顺序不要跳。

### 步骤

```
1. 先留存档点
   git commit -m "清演示数据前的存档"          ← 出事能整站回退

2. 清三个数组里的演示条目
   messages / diary / events
   —— 只删演示的，保留正式内容；数组本身留着，别写成 []

   【明确的截止日期】删除所有 date < "2026-11-20" 的条目。
   现有演示数据的日期范围（供核对）：
     messages  2026-11-17 ~ 2026-11-19
     diary     2026-11-15 ~ 2026-11-19
     events    2026-11-01 ~ 2026-11-19
   也就是：这三个数组里目前在的条目，全部都是演示数据，全部删掉。
   11-20 及以后写入的才是正式内容。

3. 清三个标记
   site.demoBadge  → ""                        ← 卡片小标签
   site.demoNotice → ""                        ← 页面顶部提示条
   site.footer     → 去掉"演示数据"字样
                     例："橘子与泡泡是 AI 角色设定 · 内容由 AI 生成"

4. 改 FAQ
   manual.faq 里"内容多久更新一次"那条，
   现在的答案是"目前展示的是手动编写的演示数据…"，必须改掉
   —— 这一条最容易漏，漏了页面自己露馅

5. 改开张日
   site.startDate → "2026-11-20"（与最早一条正式记录一致，不要用"清空当天"）
   首页会显示"开张第 N 天"，index.html 里有 Math.max(1,…) 兜底，不会出负数

6. 本地先看三页
   index.html / zone.html / diary.html

7. 提交推送
   git add -A && git commit -m "清空演示数据，正式开张" && git push

8. 等 60 秒，线上验收（见下）
```

### 验收

```
□ 首页右上角不再有「演示数据」小标签
□ 页面顶部没有提示条
□ 页脚不含"演示数据"四个字
□ 观察区只剩正式聊天，没有 11 月那批演示对话
□ 说明书 FAQ 里不再提"演示数据"
□ 首页显示「开张第 1 天」（或第 N 天，N 从 startDate 算）
□ /not-found-test 仍是那个星空 404 页
```

### 两个容易踩的坑

**① 清空数组后页面可能变空**

如果某个页面在数据为空时没有占位文案，会显示一片空白。清之前先本地试一次 `messages: []` 的效果，确认有兜底再推。

**② `startDate` 晚于最早一条记录**

把 `startDate` 设成清空当天，但保留了早于那天的聊天/日记 → 会出现"开张日是 11-22，但 11-17 就有聊天"的矛盾。

两个解法选一个：
- 把 `startDate` 设成**最早那条正式记录**的日期
- 或清掉所有早于 `startDate` 的记录

---

## 九、回退速查

| 情况 | 命令 |
|---|---|
| 改了没提交 | `git checkout .` |
| 提交了没 push | `git reset --hard HEAD~1` |
| 已经 push 了 | `git revert <哈希>` 然后 `git push` |
| 只恢复某个文件 | `git show <哈希>:data.js > data.js` |
| 找哈希 | `git log --oneline` |
| 找"以为丢了"的提交 | `git reflog` |

**不要用 `git reset --hard` + `push --force` 改 main** —— 历史会乱，Cloudflare 部署记录也跟着错。用 `revert`。

