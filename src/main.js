const initialState = {
  screen: "menu",
  week: 0,
  actionsLeft: 2,
  phase: "intro",
  flags: {
    metMT: false,
    askedMT: false,
    restedMT: false,
    firstGameDone: false,
    finalGameDone: false,
    rayReportOverTraining: false,
    rayScoutOverTraining: false,
    rayManagedMTRecovery: false,
    rayOverusedMTForWin: false,
    rayDecidedForMTBody: false,
    rayLimitedMTPitchMix: false,
    rayRiskyCallSuccess: false,
    rayPlanExecutionFailed: false,
    rayTestedMTBodyLimit: false,
    rayDecidedForMTBodySnack: false,
    rayManagedMTBody: false,
    rayTrustedGloveOverData: false,
    mtSnackEventSeen: false,
    mtFirstPracticeSeen: false,
    teamMisreadsMTSeen: false,
    yewFirstLoadWarningSeen: false,
    mtBenchedQuestionSeen: false,
    emptyFieldCatchSeen: false,
    rayReportLateNightSeen: false,
    yewImprovementPlanSeen: false,
    mtCookingSeen: false,
    mosasaurInviteSeen: false,
    watchedMosasaurGame: false,
    mosasaurConversationSeen: false,
    mtDebutGameDone: false,
    gloveAliveSeen: false,
    translationGroupSeen: false,
    firstMediaSeen: false,
    mosasaurTapeNightSeen: false,
    weekSixManageSeen: false,
    playoffCelebrationSeen: false,
    yewNightWarningSeen: false,
    playoffCollapseSeen: false,
    playoffFirstGameWon: false,
    firstSeasonContinue: false,
    playoffDugoutTalkSeen: false,
    playoffMentalCrashSeen: false,
    syncWarmBodySeen: false,
    syncSparePartsSeen: false,
    syncCanStillPitchSeen: false,
    syncEmptyLockerSeen: false,
  },
  stats: {
    record: 25,
    funds: 35,
    morale: 28,
    sync: 0,
    load: 0,
    self: 15,
  },
  log: "",
  endingOverride: null,
  matchLosses: 0,
  leagueMatchNo: 1,
  currentMatchType: null,
  currentOpponent: "",
  crisisReturnPhase: "final-offense",
  hiddenReturnKey: "",
  playoffScore: 0,
  collapseLevel: "medium",
  collapseDecision: "",
};

let state = normalizeState(loadState()) || structuredClone(initialState);
let pendingStatChanges = {};
let pendingActionFlash = false;

const app = document.querySelector("#app");

const clamp = (value) => Math.max(0, Math.min(100, value));

function saveState() {
  localStorage.setItem("mmrr_xiazhiguang_demo", JSON.stringify(state));
}

function loadState() {
  try {
    const raw = localStorage.getItem("mmrr_xiazhiguang_demo");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function normalizeState(saved) {
  if (!saved) return null;
  const fresh = structuredClone(initialState);
  const normalized = {
    ...fresh,
    ...saved,
    flags: {
      ...fresh.flags,
      ...(saved.flags || {}),
    },
    stats: {
      ...fresh.stats,
      ...(saved.stats || {}),
      morale: saved.stats?.morale ?? saved.stats?.team ?? fresh.stats.morale,
      sync: saved.stats?.sync ?? fresh.stats.sync,
    },
    endingOverride: saved.endingOverride ?? fresh.endingOverride,
    matchLosses: saved.matchLosses ?? fresh.matchLosses,
    leagueMatchNo: saved.leagueMatchNo ?? fresh.leagueMatchNo,
    currentMatchType: saved.currentMatchType ?? fresh.currentMatchType,
    currentOpponent: saved.currentOpponent ?? fresh.currentOpponent,
    crisisReturnPhase: saved.crisisReturnPhase ?? fresh.crisisReturnPhase,
    hiddenReturnKey: saved.hiddenReturnKey ?? fresh.hiddenReturnKey,
    playoffScore: saved.playoffScore ?? fresh.playoffScore,
    collapseLevel: saved.collapseLevel ?? fresh.collapseLevel,
    collapseDecision: saved.collapseDecision ?? fresh.collapseDecision,
  };

  const skippedWeekSixManage =
    normalized.flags.finalGameDone &&
    !normalized.flags.weekSixManageSeen &&
    !normalized.flags.playoffCollapseSeen &&
    !normalized.endingOverride &&
    ["playoff-celebration", "yew-night-warning"].includes(normalized.phase);

  if (skippedWeekSixManage) {
    normalized.week = 6;
    normalized.actionsLeft = 2;
    normalized.screen = "manage";
    normalized.phase = "week6";
    normalized.log = "峡光赢下了通往季后赛的关键一战。你们还没有真正抵达终点。你决定先把季后赛前的最后一周安排好。";
    normalized.flags.weekSixManageSeen = true;
  }

  return normalized;
}

function encodeSaveCode() {
  const payload = {
    version: 1,
    savedAt: new Date().toISOString(),
    state,
  };
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}

function decodeSaveCode(code) {
  const payload = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
  return normalizeState(payload.state || payload);
}

function showOverlay(title, body) {
  const existing = app.querySelector(".overlay");
  if (existing) existing.remove();
  app.insertAdjacentHTML("beforeend", `
    <div class="overlay">
      <div class="overlay-panel">
        <div class="overlay-head">
          <strong>${title}</strong>
          <button class="tiny-tool" data-close-overlay>关闭</button>
        </div>
        <div class="overlay-body">${body}</div>
      </div>
    </div>
  `);
  app.querySelector("[data-close-overlay]").addEventListener("click", () => {
    app.querySelector(".overlay")?.remove();
  });
}

function exportSaveCode() {
  const code = encodeSaveCode();
  showOverlay("导出存档", `
    <p>复制这段存档码，发给自己或朋友。之后可以用“导入”从这里继续。</p>
    <textarea class="save-code" readonly>${code}</textarea>
    <button class="primary-btn compact" data-copy-save>复制存档码</button>
  `);
  app.querySelector("[data-copy-save]").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(code);
      state.log = "存档码已复制。";
    } catch {
      state.log = "复制失败，可以手动选中存档码复制。";
    }
    saveState();
    render();
  });
}

function importSaveCode() {
  const code = window.prompt("粘贴存档码：");
  if (!code) return;
  try {
    const imported = decodeSaveCode(code);
    if (!imported) throw new Error("empty save");
    state = imported;
    state.log = "存档已导入。";
    saveState();
    render();
  } catch {
    state.log = "存档码无法读取。";
    saveState();
    render();
  }
}

function resetGame() {
  state = structuredClone(initialState);
  saveState();
  render();
}

function tunedDelta(key, value, before) {
  if (value <= 0 || !["record", "morale", "sync", "self"].includes(key)) return value;
  if (before >= 80) return Math.max(1, Math.ceil(value * 0.18));
  if (before >= 65) return Math.max(1, Math.ceil(value * 0.32));
  if (before >= 50) return Math.max(1, Math.ceil(value * 0.5));
  return Math.max(1, Math.ceil(value * 0.75));
}

function flashDirection(key, before, after) {
  if (after === before) return "";
  const wentUp = after > before;
  if (key === "load") return wentUp ? "down" : "up";
  return wentUp ? "up" : "down";
}

function changeStats(delta) {
  for (const [key, value] of Object.entries(delta)) {
    const before = state.stats[key] ?? 0;
    const after = clamp(before + tunedDelta(key, value, before));
    state.stats[key] = after;
    const flash = flashDirection(key, before, after);
    if (flash) pendingStatChanges[key] = flash;
  }
}

function actionCost(action) {
  if (action.cost) return action.cost;
  const fundDelta = action.delta?.funds || 0;
  return fundDelta < 0 ? Math.abs(fundDelta) : 0;
}

function addFlag(name) {
  state.flags[name] = true;
}

function pickLine(lines) {
  return lines[Math.floor(Date.now() / 1000) % lines.length];
}

function getDialogue(speaker) {
  const s = state.stats;
  const f = state.flags;
  if (speaker === "mt") {
    if (!f.metMT) return "投手丘上还没有那个会把球精准投进你手套的人。";
    if (state.screen === "ending" && f.firstSeasonContinue) return "下一次，我还能投给你吗？如果只剩直球，也可以。";
    if (state.screen === "ending" && f.playoffCollapseSeen) return "投手丘还在吗？你也还在本垒后方吗？";
    if (f.playoffCollapseSeen) return "刚才手指没有听见球缝。我不喜欢那种安静。";
    if (f.yewNightWarningSeen) return "紫阳看我的时候，像在看一场还没发生的雨。季后赛会下雨吗？";
    if (f.playoffCelebrationSeen) return "庆功宴的声音很多。三棒笑的时候，肩膀终于没有逃跑。";
    if (f.mosasaurTapeNightSeen) return "江陵和白城会把地方让给对方。那我摇头的时候，你会让地方给我吗？";
    if (f.firstMediaSeen) return "话筒不会接球，但会把话传很远。那我刚才的话也在跑垒吗？";
    if (f.translationGroupSeen) return "他们今天听懂了三句。还有七句没有懂，但已经很好了。";
    if (f.gloveAliveSeen) return "你的手套今天睡醒了吗？它昨天叫球的声音很亮。";
    if (s.sync <= 10) return "你今天没有立刻给暗号。你觉得我不能理解暗号吗？";
    if (s.load >= 70) return "手指有点热，像球缝在里面长出来了。你现在还想接我的球吗？";
    if (s.self <= 20) return "如果今天不让我投，我应该做什么？坐着等，还是继续练？";
    if (s.sync >= 40) return "你还没比暗号，我就知道你想让我投什么。你的肩膀比手先说了。";
    return pickLine([
      "便利店的灯很亮。看起来很灿烂，很香。",
      "峡光的海风会推球。它也是峡光的队友吗？",
      "三棒今天的脚比眼睛诚实。他说不怕我，但膝盖先后退了。",
      "你的手套今天很急，很想赢。",
      "旧球场的灯坏得很有规律。是不是也能算一种暗号？",
    ]);
  }

  if (speaker === "yew") {
    if (state.screen === "ending" && f.firstSeasonContinue) return "别急着高兴。能进第二季，说明问题还活着，不代表问题解决了。";
    if (state.screen === "ending" && f.playoffCollapseSeen) return "我说过红线会来。现在我们只能看还剩多少能修。";
    if (f.playoffCollapseSeen) return "别站在那里发呆。要么叫医疗组，要么让开。";
    if (f.yewNightWarningSeen) return "季后赛可以打。你最好记得，漂亮数据也会杀人。";
    if (f.playoffCelebrationSeen) return "他们今天很开心。我也是。然后呢？开心不能抵消负荷。";
    if (f.firstMediaSeen) return "下次满天碰话筒之前，先把你自己的措辞想好。";
    if (f.translationGroupSeen) return "队员能听懂满天，是好事。你别把这件事又收回自己手里。";
    if (f.gloveAliveSeen) return "你们两个昨天的加练数据很好看。太好看了。";
    if (s.funds <= 5) return "我建议你现在不要打开账本。真的。";
    if (s.load >= 65) return "满天的出手点在漂。你最好不要用“手感”解释所有问题。";
    if (s.record < 40 || s.morale < 35) return "下一场不是靠漂亮配球就能解决。峡光自己也得像支球队。";
    return pickLine([
      "莫道集团给钱很快，收东西的时候也很快。",
      "你很懂风险。麻烦在于，你经常觉得自己能把风险接住。",
      "别用小破队当借口。破和不改是两件事。",
      "满天不是普通投手。你最好记得这句话的前半句和后半句。",
    ]);
  }

  if (state.screen === "ending" && f.firstSeasonContinue) return "钟哥，下一季我们是不是还算一支队？我这次想先问清楚。";
  if (state.screen === "ending" && f.playoffCollapseSeen) return "没人敢收满天的柜子。就先那样放着吧。";
  if (f.playoffCollapseSeen) return "刚才大家都吓到了。三棒说他下次能多扑一个球，虽然他说得很小声。";
  if (f.yewNightWarningSeen) return "紫阳姐刚才脸色不太好。她高兴的时候都这么吓人吗？";
  if (f.playoffCelebrationSeen) return "满天刚才问庆功宴是不是训练项目。我们说是，练习开心。";
  if (f.mosasaurTapeNightSeen) return "钟哥，你看沧龙录像看到半夜，是不是又想把谁拆成格子？";
  if (f.firstMediaSeen) return "今天记者好多。满天说完那句以后，三棒差点把水喷出来。";
  if (f.translationGroupSeen) return "翻译小组今日成果：满天说我脚吵，意思是启动太早。大概吧。";
  if (f.gloveAliveSeen) return "昨晚你们加练以后，牛棚的球印密得像有人拿针扎过。";
  if (s.morale <= 20) return "钟哥，大家想赢，就是有点……不知道该靠谁赢。";
  if (s.record < 35) return "下一场对面不会因为咱们球场破就手下留情吧？";
  if (s.funds <= 8) return "我刚才看见紫阳姐在算车费。客场不会要我们自己骑车去吧。";
  return pickLine([
    "峡光这个球场吧，灯坏的时候比亮的时候更有主场感。",
    "满天说话怪是怪，但他说我挥棒慢半拍，居然真对。",
    "钟哥，你有时候看战术板的眼神，比看活人认真。",
    "要是这队真赢了，观众席那四十个人能吹一辈子。",
  ]);
}

function showDialogue(speaker) {
  const names = { mt: "满天", yew: "紫阳", player: "队员" };
  showOverlay(names[speaker] || "对话", `
    <div class="talk-card">
      <div class="talk-avatar">${(names[speaker] || "?").slice(0, 1)}</div>
      <div class="talk-text">“${getDialogue(speaker)}”</div>
    </div>
  `);
}

function inventoryItems() {
  const items = [];
  if (state.flags.watchedMosasaurGame) {
    items.push({
      name: "沧龙队票根",
      text: "满天看见了江陵和白城的比赛。以后或许能接上那条沟通线。",
    });
  }
  if (state.flags.mtExtraBodyCheck) {
    items.push({
      name: "满天的额外检查记录",
      text: "不是为了比赛做的检查。记录里有一些还没被说出口的身体秘密。",
    });
  }
  if (state.flags.fieldRepaired) {
    items.push({
      name: "旧球场整修清单",
      text: "坏灯、漏水和松动的围网被一项项划掉。峡光开始像一个可以回来的地方。",
    });
  }
  if (state.flags.yewDataBackup || state.flags.yewWarningAccepted || state.flags.rayRequestedMoreLoadData) {
    items.push({
      name: "紫阳的数据备份",
      text: "关于满天负荷的早期记录。它提醒你，有些危险不是靠手套能接住的。",
    });
  }
  if (state.flags.mtChoseMenuWithRay) {
    items.push({
      name: "满天选过的菜单",
      text: "颜色、味道和身体感觉拼成的一张菜单。很难说它算不算营养学。",
    });
  }
  return items;
}

function inventoryNames() {
  return inventoryItems().map((item) => item.name);
}

function itemGainText(beforeNames) {
  const before = new Set(beforeNames);
  const gained = inventoryNames().filter((name) => !before.has(name));
  return gained.length ? `\n\n获得持有物：${gained.join("、")}` : "";
}

function showInventory() {
  const items = inventoryItems();
  const body = items.length
    ? `<div class="item-list">${items.map((item) => `
        <div class="item-card">
          <strong>${item.name}</strong>
          <span>${item.text}</span>
        </div>
      `).join("")}</div>`
    : `<p>还没有获得持有物。某些比赛、日常和隐藏事件会留下可以被记录的东西。</p>`;
  showOverlay("持有物", body);
}

const hiddenReturnRoutes = {
  returnToManage,
  goToPractice,
  goToTeamMisread,
  goToWeekFourManage,
  goToFinalOrWarning,
  goToYewImprovement,
  goToMTCooking,
  goToMosasaurGame,
  goToMosasaurAfterGame,
};

function returnToManage() {
  state.screen = "manage";
}

function maybeTriggerSyncHiddenEvent(next) {
  if (!state.flags.metMT || !next?.name || !hiddenReturnRoutes[next.name]) return false;
  if (state.phase?.startsWith("sync-")) return false;

  const { sync } = state.stats;
  let phase = "";
  if (sync <= 8 && !state.flags.syncEmptyLockerSeen) {
    phase = "sync-empty-locker";
  } else if (sync <= 15 && !state.flags.syncCanStillPitchSeen) {
    phase = "sync-can-still-pitch";
  } else if (sync >= 40 && !state.flags.syncSparePartsSeen) {
    phase = "sync-spare-parts";
  } else if (sync >= 25 && !state.flags.syncWarmBodySeen) {
    phase = "sync-warm-body";
  }

  if (!phase) return false;
  state.hiddenReturnKey = next.name;
  state.screen = "event";
  state.phase = phase;
  return true;
}

function continueAfterHiddenEvent() {
  const route = hiddenReturnRoutes[state.hiddenReturnKey];
  state.hiddenReturnKey = "";
  if (route) {
    route();
    return;
  }
  state.screen = "manage";
}

const opponentNames = ["北湾海鸥队", "铁桥工蜂队", "雾港鲸队", "南岭石鹫队", "蓝湾航星队"];

function nextOpponent() {
  return opponentNames[(state.leagueMatchNo - 1) % opponentNames.length];
}

function registerMatchWin(amount = 10) {
  changeStats({ record: amount });
  addFlag(`league_match_${state.leagueMatchNo}_won`);
  state.leagueMatchNo += 1;
}

function registerMatchLoss(amount = -8) {
  changeStats({ record: amount });
  state.matchLosses += 1;
  addFlag(`league_match_${state.leagueMatchNo}_lost`);
  state.leagueMatchNo += 1;
  if (state.matchLosses >= 2) {
    state.endingOverride = {
      title: "Game Over：消失的王牌",
      text: `峡光再次输掉了正式联赛。

这场失利进入了项目评估。

莫道集团不再相信峡光能提供足够稳定、足够有价值的真实比赛环境。紫阳试图争取时间，但手续已经被重新启动。

第二天，满天没有出现在训练场。

他的储物柜被清空，投手丘上没有脚印。所有人都说那名外援只是离队了，只有你知道，他不是离队。

他被回收了。`,
    };
  }
}

function loadStatus(value) {
  if (value <= 30) return "稳定";
  if (value <= 55) return "发热";
  if (value <= 75) return "过载";
  return "崩溃";
}

function selfStatus(value) {
  if (value <= 30) return "空心";
  if (value <= 65) return "摇摆";
  return "自得";
}

function syncStatus(value) {
  if (value <= 25) return "陌生";
  if (value <= 60) return "咬合";
  return "共振";
}

function recordStatus(value) {
  if (value <= 35) return "破烂";
  if (value <= 65) return "关注";
  return "黑马";
}

function fundsStatus(value) {
  if (value <= 15) return "穷困";
  if (value <= 55) return "稳定";
  return "充足";
}

function moraleStatus(value) {
  if (value <= 30) return "低迷";
  if (value <= 65) return "平稳";
  return "亢奋";
}

function statRows() {
  return [
    { key: "record", label: "联赛战绩", value: state.stats.record, text: recordStatus(state.stats.record) },
    { key: "funds", label: "资金", value: state.stats.funds, text: fundsStatus(state.stats.funds) },
    { key: "morale", label: "球队士气", value: state.stats.morale, text: moraleStatus(state.stats.morale) },
    { key: "sync", label: "投捕同步率", value: state.stats.sync, text: syncStatus(state.stats.sync) },
    { key: "load", label: "王牌压力值", value: state.stats.load, text: loadStatus(state.stats.load), danger: state.stats.load > 70 },
    { key: "self", label: "王牌自洽值", value: state.stats.self, text: selfStatus(state.stats.self) },
  ];
}

function shell(title, body, options = {}) {
  const rows = statRows()
    .map((row) => {
      const flash = pendingStatChanges[row.key] ? `flash-${pendingStatChanges[row.key]}` : "";
      return `
      <div class="stat ${flash} ${row.danger ? "stat-danger" : ""}">
        <div class="stat-label"><span>${row.label}</span><span>${row.value}</span></div>
        <div class="bar"><div class="bar-fill ${row.danger ? "danger" : ""}" style="width: ${row.value}%"></div></div>
        <div class="status-text">${row.text}</div>
      </div>
    `;
    })
    .join("");

  app.innerHTML = `
    <div class="shell">
      <header class="status-strip">
        <div class="brand">
          <div class="project">MMRR项目 Demo</div>
          <h1 class="title">峡之光</h1>
        </div>
        <div class="stats">${rows}</div>
        <div class="toolbox">
          <button class="tiny-tool portrait-tool" data-talk="mt" title="和满天说话">满</button>
          <button class="tiny-tool portrait-tool" data-talk="yew" title="和紫阳说话">紫</button>
          <button class="tiny-tool portrait-tool" data-talk="player" title="和队员说话">队</button>
          <button class="tiny-tool" data-inventory title="查看持有物">持有</button>
          <button class="tiny-tool" data-export title="导出存档码">导出</button>
          <button class="tiny-tool" data-import title="导入存档码">导入</button>
          <button class="tiny-tool danger-tool" data-reset title="从头开始">重开</button>
        </div>
      </header>
      <section class="main-panel">
        <div class="topline">
          <div class="chapter">${title}</div>
          <div class="week ${pendingActionFlash ? "week-flash" : ""}">${options.weekText || `第 ${state.week} 周 · 行动 ${state.actionsLeft}/2`}</div>
        </div>
        <div class="content">${body}</div>
      </section>
    </div>
  `;

  const resetButton = app.querySelector("[data-reset]");
  if (resetButton) {
    resetButton.addEventListener("click", resetGame);
  }
  app.querySelectorAll("[data-talk]").forEach((button) => {
    button.addEventListener("click", () => showDialogue(button.dataset.talk));
  });
  app.querySelector("[data-inventory]")?.addEventListener("click", showInventory);
  app.querySelector("[data-export]")?.addEventListener("click", exportSaveCode);
  app.querySelector("[data-import]")?.addEventListener("click", importSaveCode);

  window.setTimeout(() => {
    pendingStatChanges = {};
    pendingActionFlash = false;
  }, 900);
}

function renderMenu() {
  app.innerHTML = `
    <section class="menu-screen">
      <div class="menu-card">
        <div class="project">MMRR项目 Demo</div>
        <h1 class="menu-title">峡之光</h1>
        <p class="menu-copy">
          你是钟锐。你拒绝了沧龙队，留在海边旧球场，经营一支几乎没人看的小破队。
          你以为自己只是想要一盘能被你下完的比赛。直到那个投手把球投进你的手套。
        </p>
        <div class="primary-row">
          <button class="primary-btn" data-action="start">新游戏</button>
          <button class="choice-btn" data-action="continue"><strong>继续</strong><span>读取本地进度</span></button>
          <button class="choice-btn" data-action="import"><strong>导入</strong><span>粘贴朋友发来的存档码</span></button>
        </div>
      </div>
    </section>
  `;

  app.querySelector('[data-action="start"]').addEventListener("click", () => {
    state = structuredClone(initialState);
    state.screen = "story";
    state.phase = "intro";
    saveState();
    render();
  });

  app.querySelector('[data-action="continue"]').addEventListener("click", () => {
    const saved = loadState();
    if (saved && saved.screen !== "menu") state = normalizeState(saved);
    render();
  });

  app.querySelector('[data-action="import"]').addEventListener("click", importSaveCode);
}

function splitLongParagraph(paragraph, limit) {
  const pages = [];
  let rest = paragraph.trim();
  while (rest.length > limit) {
    const searchFrom = Math.max(80, limit - 120);
    const searchTo = Math.min(rest.length, limit + 80);
    const slice = rest.slice(searchFrom, searchTo);
    const punct = Math.max(
      slice.lastIndexOf("。"),
      slice.lastIndexOf("？"),
      slice.lastIndexOf("！"),
      slice.lastIndexOf("”")
    );
    const cut = punct >= 0 ? searchFrom + punct + 1 : limit;
    pages.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) pages.push(rest);
  return pages;
}

function pageLimit() {
  return 240;
}

function textPages(text, limit = pageLimit()) {
  const chunks = String(text)
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
  const pages = [];
  let current = "";

  chunks.forEach((chunk) => {
    const paragraphPages = chunk.length > limit ? splitLongParagraph(chunk, limit) : [chunk];
    paragraphPages.forEach((part) => {
      if (!current) {
        current = part;
        return;
      }
      if (`${current}\n\n${part}`.length > limit) {
        pages.push(current);
        current = part;
      } else {
        current = `${current}\n\n${part}`;
      }
    });
  });

  if (current) pages.push(current);
  return pages.length ? pages : [""];
}

function storyScreen(title, text, nextLabel, next) {
  const pages = textPages(text);
  let page = 0;

  const renderPage = () => {
    const isLast = page >= pages.length - 1;
    shell(title, `
      <h2 class="screen-title">${title}</h2>
      <div class="prose">${pages[page]}</div>
      ${pages.length > 1 ? `<div class="page-mark">${page + 1}/${pages.length}</div>` : ""}
      <div class="primary-row">
        <button class="primary-btn" data-next>${isLast ? nextLabel : "继续"}</button>
      </div>
    `, { weekText: "剧情" });

    app.querySelector("[data-next]").addEventListener("click", () => {
      if (!isLast) {
        page += 1;
        renderPage();
        return;
      }
      next();
    });
  };

  renderPage();
}

function outcomeScreen(title, text, next, weekText = "结果", options = {}) {
  const pages = textPages(text);
  let page = 0;

  const renderPage = () => {
    const isLast = page >= pages.length - 1;
    shell(title, `
      <h2 class="screen-title">${title}</h2>
      <div class="prose">${pages[page]}</div>
      ${pages.length > 1 ? `<div class="page-mark">${page + 1}/${pages.length}</div>` : ""}
      <div class="primary-row">
        <button class="primary-btn" data-outcome-next>继续</button>
      </div>
    `, { weekText });

    app.querySelector("[data-outcome-next]").addEventListener("click", () => {
      if (!isLast) {
        page += 1;
        renderPage();
        return;
      }
      if (options.clearLogBeforeNext) state.log = "";
      next();
      saveState();
      render();
    });
  };

  renderPage();
}

function renderStory() {
  if (state.phase === "intro") {
    storyScreen(
      "序章：小破队",
      `你拒绝了沧龙队两次。

第一次，他们要你做球员。第二次，他们要你做教练。

那是一支有钱、有球迷、有市中心球场的队伍。所有人都觉得你应该过去，成为一枚足够锋利、足够体面的零件。

可你留在了峡光。旧球场靠着海，灯坏了三盏，下雨天会漏水，观众席能坐八百人，实际来的有时候不到四十。

这当然不是情怀。

你只是想要一支真正能被你从本垒板后方控制的球队。哪怕它现在烂得很有层次。`,
      "开始经营",
      () => {
        state.week = 1;
        state.actionsLeft = 2;
        state.screen = "manage";
        state.phase = "week1";
        saveState();
        render();
      }
    );
    return;
  }

  if (state.phase === "mt-arrival") {
    storyScreen(
      "第二周：空降",
      `紫阳带着一个陌生投手来到牛棚。

她没有解释太多，只让那个人站上投手丘。

第一颗球，贴着你的暗号落进手套。

第二颗球，球速、旋转、落点像被精密仪器校准过。

第三颗球进入手套时，你的掌心被震得发麻。

有那么一瞬间，你脑子里那些多年无法被执行的配球方案一起亮了起来。

或许之前接过的所有球、写过的所有报告、熬过的所有烂比赛，都是为了等这一刻。

紫阳说：“他的名字是满天。”`,
      "接住这颗球",
      () => {
        state.flags.metMT = true;
        addFlag("mtMet");
        addFlag("yewArrived");
        changeStats({ record: 5, morale: 5, self: 10, sync: 10 });
        state.log = "满天加入。投捕同步率进入面板。新行动已解锁：陪满天恢复、和满天谈谈。";
        state.screen = "event";
        state.phase = "snack";
        saveState();
        render();
      }
    );
    return;
  }
}

function choiceEvent(title, text, choices, weekText = "事件") {
  const pages = textPages(text);
  let page = 0;

  const renderChoicePage = () => {
    const isLast = page >= pages.length - 1;
    const buttons = isLast
      ? choices
        .map((choice, index) => `
          <button class="choice-btn" data-choice="${index}">
            <strong>${choice.label}</strong>
            <span>${choice.desc}</span>
          </button>
        `)
        .join("")
      : "";

    shell(title, `
      <h2 class="screen-title">${title}</h2>
      <div class="prose">${pages[page]}</div>
      ${pages.length > 1 ? `<div class="page-mark">${page + 1}/${pages.length}</div>` : ""}
      ${isLast ? `<div class="choices">${buttons}</div>` : `
        <div class="primary-row">
          <button class="primary-btn" data-choice-page-next>继续</button>
        </div>
      `}
      ${state.log ? `<div class="log">${state.log}</div>` : ""}
    `, { weekText });

    app.querySelector("[data-choice-page-next]")?.addEventListener("click", () => {
      page += 1;
      renderChoicePage();
    });

    app.querySelectorAll("[data-choice]").forEach((button) => {
      button.addEventListener("click", () => {
        const choice = choices[Number(button.dataset.choice)];
        const beforeItems = inventoryNames();
        if (choice.cost && state.stats.funds < choice.cost) {
          state.log = `资金不足。你看了一眼账户余额，把这个方案从脑子里划掉。`;
          if (choice.costFailDelta) changeStats(choice.costFailDelta);
          pendingStatChanges.funds = "down";
          saveState();
          render();
          return;
        }
        if (choice.cost) changeStats({ funds: -choice.cost });
        if (choice.delta) changeStats(choice.delta);
        if (choice.flags) choice.flags.forEach(addFlag);
        state.log = `${choice.result}${itemGainText(beforeItems)}`;
        outcomeScreen(title, state.log, () => {
          if (!maybeTriggerSyncHiddenEvent(choice.next)) choice.next();
        }, weekText, { clearLogBeforeNext: true });
      });
    });
  };

  renderChoicePage();
}

function renderEvent() {
  if (state.phase === "snack") return renderSnackEvent();
  if (state.phase === "practice") return renderPracticeEvent();
  if (state.phase === "team-misread") return renderTeamMisreadEvent();
  if (state.phase === "yew-warning") return renderYewWarningEvent();
  if (state.phase === "league-crisis") return renderLeagueCrisisEvent();
  if (state.phase === "bench-question") return renderBenchQuestionEvent();
  if (state.phase === "empty-field") return renderEmptyFieldEvent();
  if (state.phase === "report-late-night") return renderReportLateNightEvent();
  if (state.phase === "yew-improvement") return renderYewImprovementEvent();
  if (state.phase === "mt-cooking") return renderMTCookingEvent();
  if (state.phase === "mosasaur-game") return renderMosasaurGameEvent();
  if (state.phase === "mosasaur-after-game") return renderMosasaurAfterGameEvent();
  if (state.phase === "glove-alive") return renderGloveAliveEvent();
  if (state.phase === "translation-group") return renderTranslationGroupEvent();
  if (state.phase === "first-media") return renderFirstMediaEvent();
  if (state.phase === "mosasaur-tape-night") return renderMosasaurTapeNightEvent();
  if (state.phase === "playoff-celebration") return renderPlayoffCelebrationEvent();
  if (state.phase === "yew-night-warning") return renderYewNightWarningEvent();
  if (state.phase === "playoff-collapse") return renderPlayoffCollapseEvent();
  if (state.phase === "playoff-dugout") return renderPlayoffDugoutEvent();
  if (state.phase === "playoff-mental-crash") return renderPlayoffMentalCrashEvent();
  if (state.phase === "sync-warm-body") return renderSyncWarmBodyEvent();
  if (state.phase === "sync-spare-parts") return renderSyncSparePartsEvent();
  if (state.phase === "sync-can-still-pitch") return renderSyncCanStillPitchEvent();
  if (state.phase === "sync-empty-locker") return renderSyncEmptyLockerEvent();
}

function goToPractice() {
  state.screen = "event";
  state.phase = "practice";
}

function goToTeamMisread() {
  state.screen = "event";
  state.phase = "team-misread";
}

function goToWeekFourManage() {
  state.week = 4;
  state.actionsLeft = 2;
  state.screen = "manage";
  state.phase = "week4";
}

function goToWeekFiveManage(logText = "满天的第一场正式登板结束后，峡光队突然变得像一支会被认真研究的球队。你得重新安排下一周。") {
  state.week = 5;
  state.actionsLeft = 2;
  state.screen = "manage";
  state.phase = "week5";
  state.log = logText;
}

function goToWeekSixManage(logText = "峡光赢下了通往季后赛的关键一战。庆祝之前，你还要安排最后一周。") {
  state.week = 6;
  state.actionsLeft = 2;
  state.screen = "manage";
  state.phase = "week6";
  state.log = logText;
  state.flags.weekSixManageSeen = true;
}

function goToFinalOrWarning() {
  if (state.stats.load > 35 && !state.flags.yewFirstLoadWarningSeen) {
    state.screen = "event";
    state.phase = "yew-warning";
    return;
  }
  goToGloveAlive();
}

function goToGloveAlive() {
  if (!state.flags.gloveAliveSeen) {
    state.screen = "event";
    state.phase = "glove-alive";
    return;
  }
  goToTranslationGroup();
}

function goToTranslationGroup() {
  if (!state.flags.translationGroupSeen) {
    state.screen = "event";
    state.phase = "translation-group";
    return;
  }
  goToFirstMedia();
}

function goToFirstMedia() {
  if (!state.flags.firstMediaSeen) {
    state.screen = "event";
    state.phase = "first-media";
    return;
  }
  goToMosasaurTapeNight();
}

function goToMosasaurTapeNight() {
  const canWatchTape = state.flags.watchedMosasaurGame || state.flags.boughtMosasaurFootage || state.flags.mosasaurConversationSeen;
  if (canWatchTape && !state.flags.mosasaurTapeNightSeen) {
    state.screen = "event";
    state.phase = "mosasaur-tape-night";
    return;
  }
  openLeagueIntro("final");
}

function goToPlayoffCelebration() {
  if (!state.flags.playoffCelebrationSeen) {
    state.screen = "event";
    state.phase = "playoff-celebration";
    return;
  }
  goToYewNightWarning();
}

function goToYewNightWarning() {
  if (!state.flags.yewNightWarningSeen) {
    state.screen = "event";
    state.phase = "yew-night-warning";
    return;
  }
  openLeagueIntro("playoff");
}

function goToYewImprovement() {
  if (!state.flags.yewImprovementPlanSeen) {
    state.screen = "event";
    state.phase = "yew-improvement";
    return;
  }
  goToMTCooking();
}

function goToMTCooking() {
  if (!state.flags.mtCookingSeen) {
    state.screen = "event";
    state.phase = "mt-cooking";
    return;
  }
  goToMosasaurGame();
}

function goToMosasaurGame() {
  if (!state.flags.watchedMosasaurGame && !state.flags.mosasaurInviteSeen) {
    state.screen = "event";
    state.phase = "mosasaur-game";
    return;
  }
  goToFinalOrWarning();
}

function goToMosasaurAfterGame() {
  state.screen = "event";
  state.phase = "mosasaur-after-game";
}

function canEnterLeagueMatch() {
  return state.stats.record >= 45 && state.stats.morale >= 40;
}

function canBurnMTToSaveMatch() {
  return state.stats.record >= 30 && state.stats.morale >= 25;
}

function renderSnackEvent() {
  choiceEvent(
    "日常：便利店门口",
    `训练结束后，满天停在便利店门口。

他没有立刻进去，站在自动门前，看着货架上一整墙彩色包装。

“人类为什么把味道做成这么多颜色？”他问。

你还没回答，他已经拿起一袋糖，认真读配料表，像在看对手打线。

“这个写着葡萄味。”满天说，“但它不像葡萄。它在撒谎吗？”

队员已经走出去几步，又回头看他。有人小声说：“他连零食都能分析吗？”

你看了一眼明天的训练表，又看了一眼他手里的东西。

紫阳的声音从背后飘过来：“别忘了，他明天要试投。”`,
    [
      {
        label: "直接没收",
        desc: "明天有投球训练。他不能随便吃这个。",
        delta: { load: -2, self: -3, sync: -1 },
        flags: ["mtSnackEventSeen", "mtSnackConfiscated", "rayDecidedForMTBodySnack"],
        result: "你把零食从他手里拿走。满天低头看了看空掉的手，又看了看货架。“原来明天投球的时候，葡萄味会干扰手指。”他说得太认真，认真到你一时不知道要不要纠正。",
        next: goToPractice,
      },
      {
        label: "买一袋，但调整晚饭和训练",
        desc: "允许他吃，但你会重新计算晚饭和恢复菜单。",
        delta: { funds: -2, self: 2, sync: 2 },
        flags: ["mtSnackEventSeen", "mtSnackCompromise", "rayManagedMTBody"],
        result: "满天拿着零食，眼睛亮了一下。“所以可以吃，只要放进计划里。”你已经开始重排晚饭、恢复菜单和明天热身。满天把那袋糖拿得像一颗崭新的球。",
        next: goToPractice,
      },
      {
        label: "问他为什么想吃",
        desc: "你先不阻止，只问他为什么想要。",
        delta: { self: 6, sync: 1, morale: -1 },
        flags: ["mtSnackEventSeen", "mtAskedBodyWant"],
        result: "满天想了很久。“颜色很吵。”他说，“而且它说自己是葡萄，但不像葡萄。我想知道它到底是什么。”你意识到，他正在用一种很笨、很亮的方式认识世界。",
        next: goToPractice,
      },
    ],
    "日常"
  );
}

function renderPracticeEvent() {
  choiceEvent(
    "练习赛：满天第一次队内登板",
    `这不是正式比赛。没有观众，没有转播，没有排名压力。

但队员们全部站在场边看。

满天上投手丘前，先低头踩了踩土。

“这里比牛棚软。”他说，“如果三棒站上去，前脚会陷得更慢一点。”

三棒在场边脸色一变：“你为什么突然说我？”

满天很无辜：“因为你的前脚最吵。”

休息区安静了半秒。

然后满天站上投手丘，转了转球。风、土、打者、你的手套，好像都被他一瞬间读进身体里。

他看向你，等你的暗号。`,
    [
      {
        label: "直接测试完整球种",
        desc: "你想知道这副身体到底能执行到什么程度。",
        delta: { sync: 10, load: 18, self: -2, morale: 3 },
        flags: ["mtFirstPracticeSeen", "mtFullPitchMixTested", "rayTestedMTBodyLimit"],
        result: "第一颗变化球落进你的手套时，场边彻底安静下来。满天的眼睛亮得过分，像终于找到一个能把身体里所有开关同时打开的地方。有队员低声骂了一句。那是被吓到了。",
        next: goToTeamMisread,
      },
      {
        label: "只测试快速球和落点",
        desc: "你暂时不碰最锋利的部分，先确认基础。",
        delta: { sync: 6, load: 8, self: 2, morale: 5 },
        flags: ["mtFirstPracticeSeen", "mtFastballControlTested"],
        result: "满天的快速球一颗颗落进手套。没有花哨变化，但每颗球都像钉在你想要的位置上。他投完以后问：“这样比较像人类投手吗？”队员们开始小声讨论：如果只是这种球，他们也许还能理解。",
        next: goToTeamMisread,
      },
      {
        label: "让队员自由上场打",
        desc: "不只测试满天，也测试队伍能不能面对他。",
        delta: { morale: 8, sync: 4, load: 12, self: 3 },
        flags: ["mtFirstPracticeSeen", "teamFacedMTPitching"],
        result: "你让队员按平时节奏打。前三个打者几乎没有舒服挥棒。第四个勉强擦到球，跑回休息区时满天忽然说：“你的肩膀刚才想逃跑，但是球棒没有同意。”第四个打者愣住。其他队员开始笑。满天回头看你，像是在问：这样也算观察吗？",
        next: goToTeamMisread,
      },
    ],
    "练习赛"
  );
}

function renderTeamMisreadEvent() {
  choiceEvent(
    "日常：队友误解满天",
    `练习赛结束后，有队员在休息区小声说：“那家伙刚才是不是在嘲讽我？”

满天坐在长椅另一端，认真擦球。

他刚才对三棒说：“你的身体比你的球棒慢半拍。”

三棒问他什么意思。

满天又补了一句：“球棒还想打，身体已经想回去了。”

对他来说，那只是观察。

对队友来说，那听起来像把人拆成零件以后，还顺手写了质检报告。

几个人看向你。`,
    [
      {
        label: "替满天解释",
        desc: "他没有骂人。他只是还没学会把观察翻译成人话。",
        delta: { morale: 4, sync: 3, self: -1 },
        flags: ["teamMisreadsMTSeen", "rayExplainedMTToTeam"],
        result: "你简单解释了满天的说话方式。“他没有骂人。他只是暂时还不知道，观察报告不能直接扔到别人脸上。”满天抬头：“可是他的脸也在挥棒的时候后退了。”你说：“这句也先别说。”",
        next: goToWeekFourManage,
      },
      {
        label: "让满天自己解释",
        desc: "如果他要留在队里，他也得学着和队友说话。",
        delta: { self: 6, morale: 3, sync: 1 },
        flags: ["teamMisreadsMTSeen", "mtExplainedSelfToTeam"],
        result: "你没有立刻开口。满天想了一会儿，对三棒说：“我没有讨厌你。我是说你的脚比手诚实。”休息区安静了两秒。然后有人笑出了声。三棒骂了一句，但没有真生气。",
        next: goToWeekFourManage,
      },
      {
        label: "用训练结果压过去",
        desc: "与其解释，不如让他们承认他确实看得准。",
        delta: { morale: 6, self: -4, sync: 2 },
        flags: ["teamMisreadsMTSeen", "rayUsedMTAccuracyToConvinceTeam"],
        result: "你把三棒刚才的挥棒录像调出来，逐帧指出满天说的“慢半拍”在哪里。队员闭嘴了。满天看着屏幕，忽然说：“原来我的话要变成数据，才比较像可以听的话。”你手里的遥控器停了一下。",
        next: goToWeekFourManage,
      },
    ],
    "日常"
  );
}

function renderYewWarningEvent() {
  choiceEvent(
    "日常：紫阳第一次负荷警告",
    `紫阳把数据板放到你面前。

她没有寒暄，也没有绕弯。

“出手点偏了。只有一点，但已经偏了。”

你看向牛棚。满天正在和队员说话，看起来比任何人都精神。

紫阳说：“他兴奋的时候，比疲劳的时候更危险。”`,
    [
      {
        label: "接受警告，降低下一场强度",
        desc: "你承认紫阳的长期模型比你的临场欲望更可靠。",
        delta: { load: -8, morale: 3, sync: -2 },
        flags: ["yewFirstLoadWarningSeen", "yewWarningAccepted", "yewDataBackup"],
        result: "你把下一场的配球预案删掉一半。删到最后，最难删的东西浮出来了：你自己想接住它们的冲动。",
        next: goToFinalOrWarning,
      },
      {
        label: "要求更多数据",
        desc: "你相信她，也想亲自确认。",
        delta: { load: -3, morale: -2, sync: 1 },
        flags: ["yewFirstLoadWarningSeen", "rayRequestedMoreLoadData", "yewDataBackup"],
        result: "紫阳盯着你看了三秒，还是把更详细的数据传给了你。你们在休息区吵了二十分钟，旁边队员一句都听不懂。",
        next: goToFinalOrWarning,
      },
      {
        label: "相信自己的接球手感",
        desc: "他的球还在你的手套里。你认为自己能判断。",
        delta: { sync: 4, load: 10, morale: -3 },
        flags: ["yewFirstLoadWarningSeen", "yewWarningIgnored", "rayTrustedGloveOverData"],
        result: "你没有改预案。紫阳收起数据板，声音冷得像球场夜风：“那你最好真的能负责。”",
        next: goToFinalOrWarning,
      },
    ],
    "负荷警告"
  );
}

function renderLeagueCrisisEvent() {
  const recordGap = state.stats.record < 45;
  const moraleGap = state.stats.morale < 40;
  const reason = [
    recordGap ? "战绩不够，峡光还没有把自己打到足够关键的位置。" : "",
    moraleGap ? "球队士气不够，普通队员撑不住满天之外的部分。" : "",
  ].filter(Boolean).join("\n");

  choiceEvent(
    "联赛危机：小破队撑不住",
    `联赛强制推进到这里，但峡光的底子没有跟上。

${reason}

比赛还没进入你最想操控的局面，普通队员已经开始被对手压着打。守备慢半拍，打线推不动，休息区里没人说话。

满天站在你身边，看向投手丘。

他没有说“让我上”。但你知道，只要你比出暗号，他会去。`,
    [
      {
        label: "燃烧满天，把比赛拖回来",
        desc: "如果球队还没烂到底，他可以强行救场；代价会落在他身上。",
        delta: {},
        flags: ["mtBurnAttemptedInLeagueCrisis"],
        result: canBurnMTToSaveMatch()
          ? "你比出暗号。满天走上投手丘，把本来已经散掉的比赛一球一球拽回来。峡光还活着，但你听见紫阳在休息区用力合上了数据板。"
          : "你比出暗号。满天走上投手丘，试图把整支队伍都拖回来。可是峡光已经烂得太深了。球落进你的手套时，比分没有被救回来，满天的脸色却先白了。",
        next: () => {
          if (canBurnMTToSaveMatch()) {
            changeStats({ record: 10, sync: 10, load: 35, self: -8 });
            addFlag("mtBurnedToSaveMatch");
            state.screen = "game";
            state.phase = state.crisisReturnPhase || "final-game";
          } else {
            changeStats({ load: 25, self: -10, sync: 5 });
            addFlag("mtBurnedButMatchLost");
            state.endingOverride = {
              title: "Game Over：消失的王牌",
              text: `峡光输了。

整个赛季在这里断掉。

满天的项目评估没有通过。紫阳试图争取时间，但莫道集团的人比她更快。

第二天，满天没有出现在训练场。

他的储物柜被清空，投手丘上没有脚印。所有人都说那名外援只是离队了，只有你知道，他不是离队。

他被回收了。`,
            };
            state.screen = "ending";
          }
        },
      },
      {
        label: "不让满天补，承认峡光现在打不过",
        desc: "不燃烧他，但这场联赛会直接断掉。",
        delta: { record: -10, morale: -8, self: 3, load: -5 },
        flags: ["refusedToBurnMTInLeagueCrisis"],
        result: "你没有比暗号。满天看着你，像是不理解为什么明明还可以投，却要坐在这里看比赛输掉。",
        next: () => {
          state.endingOverride = {
            title: "Game Over：没有奇迹的小破队",
            text: `峡光输了。

你保住了满天这一场的身体，却没能保住这个项目继续存在的舞台。

战绩不够，士气不够，峡光没有成为能承载他的球队。

赛季结束得很安静。几天后，满天的手续被莫道集团重新接走。没有新闻，没有告别，也没有下一场比赛。`,
          };
          state.screen = "ending";
        },
      },
    ],
    "联赛判定"
  );
}

function renderBenchQuestionEvent() {
  choiceEvent(
    "赛后：我刚才不能投了吗？",
    `比赛输了。

替补投手没有撑住局面。队员们没有责怪谁，但休息区安静得过分。

满天坐在你旁边，低头看着自己的手。

过了一会儿，他问：“我刚才不能投了吗？”`,
    [
      {
        label: "告诉他，这是保护",
        desc: "你解释他的身体需要被管理。",
        delta: { load: -5, self: -4, sync: -2 },
        flags: ["mtBenchedQuestionSeen", "mtInterpretedBenchAsLimit"],
        result: "满天点头。他理解了你的意思，但你不确定他理解的是“我被保护”，还是“我不够好用”。",
        next: () => {
          state.screen = "ending";
        },
      },
      {
        label: "告诉他，你还需要他下一场继续投",
        desc: "你把换下他解释成更长远的战术安排。",
        delta: { self: 2, sync: 4, load: -2 },
        flags: ["mtBenchedQuestionSeen", "mtBenchedButNeededLater"],
        result: "满天抬起头。“下一场还投给你？”你说，是。他的手指终于从球缝上松开一点。",
        next: () => {
          state.screen = "ending";
        },
      },
      {
        label: "问他刚才自己怎么感觉",
        desc: "你不先给答案，让他回到自己的身体里。",
        delta: { self: 7, sync: 2, load: -3 },
        flags: ["mtBenchedQuestionSeen", "mtNamedBodyHeat"],
        result: "满天低头想了很久。他说：“手指有点热。但是我看见你的手套，就忘了。”这不是一个让人安心的答案。",
        next: () => {
          state.screen = "ending";
        },
      },
    ],
    "结果事件"
  );
}

function renderEmptyFieldEvent() {
  choiceEvent(
    "赛后：空球场加练",
    `队员都走后，你和满天留在空球场。

海风从外野吹进来，灯光把本垒附近照得很白。

满天拿着球，问：“还接吗？”`,
    [
      {
        label: "接几颗轻的",
        desc: "只接几颗，不做训练，只确认手感。",
        delta: { sync: 5, self: 3, load: 3 },
        flags: ["emptyFieldCatchSeen", "emptyFieldSoftCatch"],
        result: "满天投了几颗很轻的球。它们没有正式比赛里的锋利，却很安静地落进你的手套。你突然意识到，自己也喜欢这样的球。",
        next: () => {
          state.screen = "ending";
        },
      },
      {
        label: "拒绝，带他回家",
        desc: "今晚不再投。你必须把“停止”也变成你们的默契。",
        delta: { load: -5, self: 2, sync: -1 },
        flags: ["emptyFieldCatchSeen", "emptyFieldWentHome"],
        result: "满天看起来有点失望，但还是跟你离开球场。走到出口时，他突然问：“明天还可以投吗？”你说，明天看身体。",
        next: () => {
          state.screen = "ending";
        },
      },
      {
        label: "让他自己决定投什么",
        desc: "不按训练菜单，也不按比赛预案。只看他想投什么。",
        delta: { self: 8, sync: 6, load: 5 },
        flags: ["emptyFieldCatchSeen", "mtChoseEmptyFieldPitch"],
        result: "满天站在投手丘上想了很久。最后他投了一颗直球。它不快，也不锋利，但你接住的时候，手套里有一种非常陌生的重量。",
        next: () => {
          state.screen = "ending";
        },
      },
    ],
    "结果事件"
  );
}

function renderReportLateNightEvent() {
  choiceEvent(
    "日常：钟锐写报告熬夜",
    `凌晨两点，你还在写报告。

屏幕上是别队打线的拆解，桌边是峡光明天的训练表。

满天从房间里出来，站在门口看你。

“你也需要维护吗？”他问。`,
    [
      {
        label: "让他回去睡",
        desc: "你不需要被照顾。至少现在不需要。",
        delta: { funds: 3, sync: -1, self: -1 },
        flags: ["rayReportLateNightSeen", "rayRefusedMTCare"],
        result: "你让他回去睡。满天在门口站了几秒，像是确认这条指令是否也需要执行，然后转身回房间。",
        next: goToYewImprovement,
      },
      {
        label: "让他坐一会儿",
        desc: "你继续写，他坐在旁边。不是效率最高，但你没有赶他走。",
        delta: { sync: 4, self: 2, morale: -1 },
        flags: ["rayReportLateNightSeen", "mtSatWithRayReport"],
        result: "满天坐在旁边看你写报告。你没有解释那些模型，他也没有问。房间里只有键盘声和他的呼吸。",
        next: goToYewImprovement,
      },
      {
        label: "关掉报告，明天再写",
        desc: "钱重要，但你突然觉得今晚不适合继续。",
        delta: { funds: -5, sync: 3, self: 3 },
        flags: ["rayReportLateNightSeen", "rayStoppedReportForMT"],
        result: "你关掉报告。满天看着黑下来的屏幕，又看向你，像是第一次发现你也会停止运转。",
        next: goToYewImprovement,
      },
    ],
    "日常"
  );
}

function renderYewImprovementEvent() {
  choiceEvent(
    "日常：和紫阳商量球队改进计划",
    `紫阳把峡光最近几场的训练记录摊在桌上。

她说：“你能靠临场配球把这支队伍拖起来，但不能一直这样拖。”

你指出下一场联赛马上就到，长期计划救不了眼前的局面。

紫阳冷笑：“那你就继续把眼前的局面全塞给满天？”

你们吵了十分钟，最后都意识到真正的问题：钱只能改一个地方。`,
    [
      {
        label: "升级训练器材",
        desc: "需要一笔钱。紫阳认为这是最该先补的短板。",
        cost: 12,
        delta: { morale: 10, record: 4 },
        flags: ["yewImprovementPlanSeen", "teamTrainingGearUpgraded"],
        result: "你同意先升级训练器材。紫阳没有夸你，只把采购清单推过来。队员们第二天看见新器材时，休息区里少见地响起了欢呼。",
        next: goToMTCooking,
      },
      {
        label: "增加录像和对手分析设备",
        desc: "需要花钱。更像你的办法，紫阳不一定完全满意。",
        cost: 8,
        delta: { record: 10, morale: 2 },
        flags: ["yewImprovementPlanSeen", "analysisEquipmentUpgraded"],
        result: "你选择先补录像和分析设备。紫阳看起来不完全满意，但也承认这能让下一场比赛少一些盲区。你的战术板终于不再像临时拼出来的犯罪现场。",
        next: goToMTCooking,
      },
      {
        label: "建立满天专用恢复监测流程",
        desc: "需要一笔钱。这个方案会让所有人看见资源流向哪里。",
        cost: 10,
        delta: { load: -12, sync: 3, morale: -2 },
        flags: ["yewImprovementPlanSeen", "mtRecoveryMonitorBuilt"],
        result: "你把钱投进满天的恢复监测。紫阳亲自改了表格。满天看起来很开心，因为他发现你们正在认真记录他的身体；几个队员则假装没看见那套新设备。",
        next: goToMTCooking,
      },
      {
        label: "先什么都不做",
        desc: "不花钱。也不用现在回答紫阳的问题。",
        delta: { morale: -8 },
        flags: ["yewImprovementPlanSeen", "yewPlanDelayed"],
        result: "你把计划暂时压下。紫阳没有继续吵，只把记录收起来。第二天训练时，队员们仍然用旧器材、旧场地和旧问题面对下一场比赛。",
        next: goToMTCooking,
      },
    ],
    "球队改进"
  );
}

function renderMTCookingEvent() {
  choiceEvent(
    "日常：给满天做饭",
    `训练结束后，满天又在便利店货架前停住。

这次他没有拿糖，指着一排饮料问：“为什么红色的都说自己会让人精神？”

你拎着他的后领把人带回家，打开冰箱。

满天站在厨房门口，看着你拿出食材，问：“今天的饭是为了投球，还是为了吃饭？”

你回头看他。

他补充：“如果是为了投球，味道可以淡一点。如果是为了吃饭，我想吃甜甜的东西。”

这个问题比菜单本身麻烦。`,
    [
      {
        label: "做严格健康餐",
        desc: "花一点钱。你知道这对他的身体更稳妥。",
        cost: 3,
        delta: { load: -8, self: -3, sync: 1 },
        flags: ["mtCookingSeen", "mtStrictHealthMeal"],
        result: "你做了严格健康餐。满天吃得很认真，也很痛苦。他咽下最后一口，评价：“这个饭很安静。安静到像紫阳的数据表。”你知道这顿饭对他的身体最好，但他看向盘子的眼神像是在阅读一份处罚决定。",
        next: goToMosasaurGame,
      },
      {
        label: "做满天想吃的甜食大餐",
        desc: "花一点钱。满天看起来真的很想吃。",
        cost: 5,
        delta: { sync: 8, self: 3, load: 3 },
        flags: ["mtCookingSeen", "mtSweetMeal"],
        result: "你做了满天想吃的甜食大餐。满天坐在桌边，眼睛亮得像刚接到你给出的暗号。他吃到一半，认真宣布：“这个味道在跑垒。”你问哪里在跑。他说：“这里。”然后指了指自己的胸口。你脑子里已经开始计算明天要怎么把这顿饭补回来。",
        next: goToMosasaurGame,
      },
      {
        label: "一起商量菜单",
        desc: "花一点钱。你把菜单交给一个不太懂自己身体的人。",
        cost: 4,
        delta: { load: -4, self: 6, sync: 4 },
        flags: ["mtCookingSeen", "mtChoseMenuWithRay"],
        result: "你让满天一起商量菜单。他说不清想吃什么，只能说颜色、味道和身体里的感觉。“不要太直的味道。今天手指已经很直了。”你沉默两秒，把这句话翻译成少盐、温热、软一点。这顿饭勉强合格，但至少是他参与选择的。",
        next: goToMosasaurGame,
      },
      {
        label: "没时间做，随便解决",
        desc: "不花钱。今晚先这样糊弄过去。",
        delta: { load: 6, sync: -3, self: -1 },
        flags: ["mtCookingSeen", "mtMealHandledCasually"],
        result: "你翻出库存里剩下的东西，随便解决了晚饭。满天没有抱怨。他只是把筷子放下后问：“是因为我今天投得不好吗？”他问得太直，反而不像责怪。你意识到，有些糊弄对他来说像规则突然消失。",
        next: goToMosasaurGame,
      },
    ],
    "日常"
  );
}

function renderMosasaurGameEvent() {
  choiceEvent(
    "日常：要不要去看沧龙队比赛",
    `江陵发来一条信息。

“今晚打你们看不懂的棒球。”

满天从你身后探头，看见“江陵”这个名字。

“这是你的朋友吗？”

你说算是。

满天又问：“那他们也是能从身体读懂暗号的人吗？”

你决定暂时不解释前队友、旧搭档和暗号之间到底有什么关系。

沧龙今晚主场。江陵和白城都在先发名单里。去看比赛要花钱，也要花掉一整个晚上。`,
    [
      {
        label: "带满天去看沧龙比赛",
        desc: "要花钱。满天会看到你以前那群麻烦的棒球熟人。",
        cost: 8,
        delta: { self: 4, sync: 3, record: 4 },
        flags: ["mosasaurInviteSeen", "watchedMosasaurGame", "lingChengLineOpened"],
        result: "你带满天去了沧龙主场。江陵在九局下半挥出一记漂亮安打，白城在待打区笑得像早就知道会这样。满天看完以后说：“他们没有手套暗号，也能互相读懂下一步。”你问他看见了什么。他指向内野：“那个三棒跑起来的时候，四棒已经在替他赢了。”你决定暂时不回答。",
        next: goToMosasaurAfterGame,
      },
      {
        label: "自己去看，让满天休息",
        desc: "要花钱。你可以把它当成一次单独侦察。",
        cost: 5,
        delta: { record: 6, load: -4, sync: -2 },
        flags: ["mosasaurInviteSeen", "rayWatchedMosasaurAlone"],
        result: "你自己去了沧龙主场。江陵打得很干脆，白城处理所有媒体镜头都很熟练。你带回很多有用情报，也得面对一个无聊到空洞的满天。他问：“你的朋友，比我更需要你看吗？”",
        next: goToFinalOrWarning,
      },
      {
        label: "不去，买录像分析",
        desc: "少花一点钱。只看录像，不去现场。",
        cost: 3,
        delta: { record: 3 },
        flags: ["mosasaurInviteSeen", "boughtMosasaurFootage"],
        result: "你买了录像分析。画面里的江陵和白城依然配合天衣无缝，但至少他们现在可以被暂停、倒放和标注。满天看了一会儿，忽然说：“他们不用看手套也知道下一步。这个可以学吗？”",
        next: goToFinalOrWarning,
      },
      {
        label: "不去，留钱给峡光",
        desc: "不花钱。今晚留在峡光这边。",
        delta: { self: -2 },
        flags: ["mosasaurInviteSeen", "skippedMosasaurGameForFunds"],
        result: "你没有去。钱留给了峡光。满天没有继续问，但那天晚上他翻来覆去看了很多沧龙的公开剪辑。第二天他问你：“如果读过他们的身体，算是认识他们吗？”",
        next: goToFinalOrWarning,
      },
    ],
    "日常"
  );
}

function renderMosasaurAfterGameEvent() {
  choiceEvent(
    "日常：沧龙赛后",
    `比赛结束后，沧龙主场的灯还亮着。

江陵从球员通道那边走过来，手里还拎着打击手套。

他看见你，第一句话是：“钟锐，你终于舍得带王牌来看真正的棒球了？”

满天立刻说：“我不止是王牌，我是搭档。”

江陵一愣，笑出声。

白城慢一步跟在后面，先看了满天一眼，又看向你。

“新投手？”白城问。

满天很认真地纠正：“我是满天。投手是我现在被使用得最多的部分。”

这句话让白城的笑意淡了一点。

他看向满天，说：“那你最好别只看钟锐的手套。投手如果只看接球手，会错过很多东西。”

满天问：“比如你看江陵的时候，会错过球吗？”

江陵：“喂。”

白城：“……有时候会。”`,
    [
      {
        label: "和江陵斗嘴",
        desc: "他嘴太欠，不回一句很难受。",
        delta: {},
        flags: ["mosasaurConversationSeen", "rayBickeredWithLingCheng"],
        result: "你和江陵互相嘲了三分钟。满天在旁边听得很认真，最后问：“这是以前队友之间的交流方式，还是攻击行为？”白城说：“这叫朋友。”江陵说：“你们峡光的投手怎么说话也这么烦？”",
        next: goToFinalOrWarning,
      },
      {
        label: "问白城刚才那句话是什么意思",
        desc: "你想知道他是不是看出了什么。",
        delta: {},
        flags: ["mosasaurConversationSeen", "rayAskedBaiChengAboutPitcher"],
        result: "白城看着满天，说投手不能只把自己交给暗号。江陵在旁边插嘴：“他说得委婉，意思是你别把人养成球形遥控器。”满天低头看自己的手：“球形遥控器不能自己选球种吗？”你没有立刻反驳。",
        next: goToFinalOrWarning,
      },
      {
        label: "带满天先走",
        desc: "今晚到这里就够了。",
        delta: {},
        flags: ["mosasaurConversationSeen", "rayLeftMosasaurEarlyWithMT"],
        result: "你没有让对话继续。走出球场时，满天回头看了一眼沧龙的灯。“他们吵得好开心。”他说。过了一会儿，他又问：“以后峡光也会这样吗？”",
        next: goToFinalOrWarning,
      },
    ],
    "沧龙赛后"
  );
}

function renderGloveAliveEvent() {
  choiceEvent(
    "日常：手套活过来了",
    `满天首次正式登板之后，你们留在旧球场加练。

海风从外野灌进来，坏掉的灯一闪一闪。满天站在投手丘上，手里转着球，眼睛一直看着你的手套。

“它今天很亮。”他说。

你问他说的是灯，还是球。

满天摇头：“是你的手套。它有方向，会把球叫过去。”

你蹲回本垒后方。脑子里那些过去只能写在报告里的配球，一条一条亮起来。`,
    [
      {
        label: "测一组复杂球路",
        desc: "你想看这只手套和这只手能走到哪里。",
        delta: { record: 8, sync: 8, load: 18, self: -2 },
        flags: ["gloveAliveSeen", "rayTestedComplexMix"],
        result: "你比出第一个暗号。满天投了进来。第二个，第三个，第四个。球路像被你从脑子里直接拽进现实。满天的眼睛越来越亮，你的手套也越来越热。停下来的时候，你们谁都没有先说话。",
        next: goToTranslationGroup,
      },
      {
        label: "只练基础控球",
        desc: "先确认直球、落点和节奏。",
        delta: { sync: 5, load: 7, self: 5, record: 3 },
        flags: ["gloveAliveSeen", "rayKeptBasicWork"],
        result: "你只给基础暗号。满天一开始有点困惑，但每颗直球都稳稳落进手套。最后他问：“只投这个，你也会接吗？”你说会。他低头看球缝，像把这句话放进了什么地方。",
        next: goToTranslationGroup,
      },
      {
        label: "问满天看见了什么",
        desc: "你不急着继续，只想知道他怎么读你的手套。",
        delta: { sync: 6, self: 6, morale: -2 },
        flags: ["gloveAliveSeen", "rayAskedMTPerception"],
        result: "满天想了很久，说你的手套里面有路。那条路没有画出来，球自己想往那里去。你听着他说，第一次觉得自己的配球也可以被别人从身体里读出来。",
        next: goToTranslationGroup,
      },
      {
        label: "结束训练，让他休息",
        desc: "今晚到这里。越亮的东西越该及时关灯。",
        delta: { load: -6, sync: 3, record: -2, self: 2 },
        flags: ["gloveAliveSeen", "rayStoppedExtraWork"],
        result: "你收起手套。满天站在投手丘上看了你一会儿，问：“手套睡觉以后，球会去哪里？”你说，明天再来。他点点头，像接受了一条很难但可以执行的规则。",
        next: goToTranslationGroup,
      },
    ],
    "日常"
  );
}

function renderTranslationGroupEvent() {
  choiceEvent(
    "日常：满天翻译小组",
    `满天在训练里又说了几句很准也很刺的话。

三棒本来要发火，旁边队员突然举手：“等一下，他的意思是不是我启动太慢？”

另一个队员接上：“那句肩膀想逃跑，是说你怕内角球。”

休息区安静了一瞬。

满天看着他们，眼睛亮起来：“你们听懂了？”

三棒骂了一句，但这次没人真的生气。有人甚至拿了白板，在上面写：满天翻译小组。`,
    [
      {
        label: "让队员自己磨合",
        desc: "这件事不必由你替他们完成。",
        delta: { morale: 12, self: 5, sync: 2 },
        flags: ["translationGroupSeen", "teamTranslationGroupStarted"],
        result: "你没有插手。队员们吵吵嚷嚷地给满天的话做注释，满天很认真地纠正他们。休息区第一次因为他变得热闹，而且不是因为误会。",
        next: goToFirstMedia,
      },
      {
        label: "钟锐替满天翻译",
        desc: "你知道他想表达什么，也知道队友哪里会听错。",
        delta: { sync: 5, morale: 6, self: -2 },
        flags: ["translationGroupSeen", "rayTranslatedForMT"],
        result: "你把满天的观察一句句翻成人话。队员们听懂了，也服气了。满天坐在你旁边，认真观察你的嘴，像在学习一种新的暗号。",
        next: goToFirstMedia,
      },
      {
        label: "让满天教他们看身体",
        desc: "既然他看得准，就让这件事变成训练。",
        delta: { morale: 12, record: 6, load: 5, self: 4 },
        flags: ["translationGroupSeen", "mtTaughtBodyReading"],
        result: "满天站到白板前，认真讲每个人的脚、肩膀和呼吸。队员们一开始想笑，后来笑不出来了。因为他说得太准。峡光像突然多了一种奇怪又有用的训练课。",
        next: goToFirstMedia,
      },
      {
        label: "叫满天少刺激队友",
        desc: "他们刚刚开始接受他，你不想再出乱子。",
        delta: { morale: 3, self: -8, sync: -3 },
        flags: ["translationGroupSeen", "rayToldMTToHoldBack"],
        result: "满天很快点头。之后的训练里，他看见了很多东西，却只把球递回给你。队员们轻松了一点，但你发现他的眼睛没有刚才那么亮了。",
        next: goToFirstMedia,
      },
    ],
    "日常"
  );
}

function renderFirstMediaEvent() {
  choiceEvent(
    "日常：新闻发布会第一次失控",
    `峡光连赢之后，第一次有这么多记者堵在休息区外。

你和紫阳坐在桌前。满天坐在你旁边，低头研究话筒，像在判断它会不会接球。

记者问：“满天选手，你怎么评价钟锐捕手？”

紫阳的手指在桌下轻轻敲了一下，像预感到什么。

满天抬头，很认真地说：“他接球的时候，手套里面有我想去的地方。”

房间里安静了一瞬。闪光灯随后亮成一片。`,
    [
      {
        label: "官方回答：满天是峡光的王牌",
        desc: "把这句话收回球队的公共叙事里。",
        delta: { funds: 8, morale: 6, sync: -2 },
        flags: ["firstMediaSeen", "rayCalledMTTeamAce"],
        result: "你接过话，说满天是峡光的王牌，也是全队努力的一部分。队员们在后台听见这句，第二天训练时比平时吵了很多。满天看了你一眼，像在思考王牌和搭档哪个更靠近手套。",
        next: goToMosasaurTapeNight,
      },
      {
        label: "顺着满天说：他是我的投手",
        desc: "你把那句危险的话说得更明确。",
        delta: { sync: 10, morale: -4, load: 3 },
        flags: ["firstMediaSeen", "rayCalledMTMyPitcher"],
        result: "你说他是你的投手。满天立刻转头看你，眼睛亮得比闪光灯更直接。紫阳在旁边闭了一下眼。第二天，媒体标题比比赛本身还热闹。",
        next: goToMosasaurTapeNight,
      },
      {
        label: "让紫阳接管采访",
        desc: "这局让专业发言人来守。",
        delta: { funds: 10, load: -2 },
        flags: ["firstMediaSeen", "yewHandledMedia", "yewTrustHigh"],
        result: "紫阳接过话筒，用一串训练负荷、投球效率和队伍协同把记者淹没。满天听得很认真，最后小声问你：“她是在保护我，还是保护话筒？”",
        next: goToMosasaurTapeNight,
      },
      {
        label: "直接带满天离开",
        desc: "今天到这里。你不想让他继续被问下去。",
        delta: { sync: 5, funds: -3, morale: -2 },
        flags: ["firstMediaSeen", "rayLeftMediaWithMT"],
        result: "你带满天离开发布会。走廊里安静下来以后，满天问：“刚才不能说吗？”你说可以说。只是有些话说出去以后，会被很多人拿走。",
        next: goToMosasaurTapeNight,
      },
    ],
    "媒体"
  );
}

function renderMosasaurTapeNightEvent() {
  choiceEvent(
    "日常：沧龙录像夜",
    `晚上，你打开了沧龙队的比赛录像。

江陵和白城的配合被暂停在屏幕上。一个刚刚出手，一个已经移动到接球位置。

满天坐在你旁边，盯着画面看了很久。

“他们吵得好开心。”他说，“是因为他们知道对方不会走吗？”

你看着屏幕里那对前队友。江陵的动作很吵，白城的判断很稳。两个人像在互相扩大对方能到达的地方。`,
    [
      {
        label: "认真分析江陵白城",
        desc: "把这场录像拆成下一场能用的东西。",
        delta: { record: 7, sync: 2 },
        flags: ["mosasaurTapeNightSeen", "rayStudiedMosasaursPair"],
        result: "你把江陵和白城的配合拆给满天看。满天听到一半，忽然说：“他们不是一个身体，但会把地方让给对方。”你停了一下，把这句话写进了笔记。",
        next: () => openLeagueIntro("final"),
      },
      {
        label: "和满天讨论搭档",
        desc: "今晚不只看棒球，也看人和人的距离。",
        delta: { self: 7, sync: 6 },
        flags: ["mosasaurTapeNightSeen", "rayDiscussedPartnership"],
        result: "你问满天觉得搭档是什么。满天想了很久，说：“也许是我摇头的时候，你还在本垒后方。”电视光落在他脸上，你没有立刻说话。",
        next: () => openLeagueIntro("final"),
      },
      {
        label: "酸沧龙几句",
        desc: "他们确实强，但你不想承认得太轻松。",
        delta: { sync: 4, self: -2 },
        flags: ["mosasaurTapeNightSeen", "rayWasSourAboutMosasaurs"],
        result: "你挑了几处沧龙的毛病。满天听得很认真，最后问：“你说他们烦的时候，身体比较高兴。”你把录像往后拖了十秒，决定不回答这个问题。",
        next: () => openLeagueIntro("final"),
      },
      {
        label: "关掉录像去做饭",
        desc: "今晚不再看对手。你们也需要自己的晚上。",
        delta: { load: -6, sync: 5, funds: -2 },
        flags: ["mosasaurTapeNightSeen", "rayChoseHomeOverTape"],
        result: "你关掉录像，去厨房开火。满天跟过来，问今天的饭会不会也有配合。你说会。他立刻站到旁边，认真等你分配一个他能完成的位置。",
        next: () => openLeagueIntro("final"),
      },
    ],
    "沧龙录像"
  );
}

function renderPlayoffCelebrationEvent() {
  choiceEvent(
    "日常：庆功宴",
    `峡光进入季后赛。

这个事实比比分更不真实。旧球场旁边的小店被队员们挤满，三棒举着饮料喊到破音，替补投手把手机递给每个人看媒体标题。

满天坐在桌边，被队员们轮流投喂。他认真听每个人说话，偶尔冒出一句精准到过分的评价，大家已经学会先笑再翻译。

紫阳坐在角落看数据板。她的眉头还是皱着，但你看见她嘴角往上抬了一下。

这支小破队今晚真的像一支球队。`,
    [
      {
        label: "陪队员闹到很晚",
        desc: "今晚让峡光像一支会庆祝的队伍。",
        cost: 6,
        delta: { morale: 14, sync: -2 },
        flags: ["playoffCelebrationSeen", "teamCelebratedLate"],
        result: "你陪他们闹到很晚。满天被队员们拉着学庆祝手势，动作很认真，表情很空，反而让所有人笑得更厉害。峡光从来没有这么吵过。",
        next: goToYewNightWarning,
      },
      {
        label: "坐在满天旁边看他吃东西",
        desc: "他今晚也应该知道自己在庆祝里。",
        delta: { sync: 7, self: 6, morale: 4, load: 3 },
        flags: ["playoffCelebrationSeen", "raySatWithMTAtParty"],
        result: "你坐到满天旁边。他把一块甜点推给你，说：“这个味道跑得比我慢，但很高兴。”队员们在旁边起哄，满天问他们为什么声音变高。你没有解释。",
        next: goToYewNightWarning,
      },
      {
        label: "和紫阳聊数据",
        desc: "快乐是真的，数据也是真的。",
        delta: { load: -4, morale: -2, self: 2 },
        flags: ["playoffCelebrationSeen", "rayCheckedDataAtParty", "yewTrustHigh"],
        result: "你坐到紫阳旁边。她把数据板转给你看，曲线漂亮得像胜利，也危险得像警报。紫阳低声说：“我也高兴。但你别被高兴骗了。”",
        next: goToYewNightWarning,
      },
      {
        label: "站起来说季后赛也要赢",
        desc: "你把今晚的热度继续推向下一场。",
        delta: { morale: 12, sync: 4, load: 8 },
        flags: ["playoffCelebrationSeen", "rayPromisedPlayoffWin"],
        result: "你站起来，说季后赛也要赢。队员们用力鼓掌，满天看着你，像看见本垒后方又亮起一盏灯。紫阳没有鼓掌，但她也没有阻止你。",
        next: goToYewNightWarning,
      },
    ],
    "庆功宴"
  );
}

function renderYewNightWarningEvent() {
  choiceEvent(
    "夜间：紫阳的警告",
    `庆功宴散场以后，紫阳把你叫到旧球场边。

海风很冷。远处的小店还亮着灯，队员们的笑声断断续续传过来。

紫阳把数据板递给你。

“他今天的数据非常漂亮。”她说。

她停了一下。

“漂亮到不正常。”

你看见满天站在不远处，正低头研究队员送给他的纸帽。那顶帽子歪得很厉害，他看起来很开心。`,
    [
      {
        label: "答应季后赛控制强度",
        desc: "你承认这件事不能只靠手套判断。",
        delta: { load: -6, record: -3 },
        flags: ["yewNightWarningSeen", "rayPromisedYewToLimitMT", "yewTrustHigh"],
        result: "你说季后赛会控制强度。紫阳看了你很久，像在判断你这句话有几分能落到球场上。最后她收起数据板，说：“记住你现在还会说这句话。”",
        next: () => openLeagueIntro("playoff"),
      },
      {
        label: "说现在不能停",
        desc: "峡光终于飞起来了，你不想在这里踩刹车。",
        delta: { record: 5, load: 8, sync: 3 },
        flags: ["yewNightWarningSeen", "rayRefusedToSlowDown"],
        result: "你说现在不能停。紫阳笑了一下，冷得让人不舒服。“我知道。”她说，“所以我才在这里提醒你。”远处满天抬头看过来，像听见了自己的名字。",
        next: () => openLeagueIntro("playoff"),
      },
      {
        label: "问有没有维护方案",
        desc: "如果一定要继续，你至少要知道能不能接住代价。",
        cost: 8,
        delta: { load: -8 },
        flags: ["yewNightWarningSeen", "rayAskedForMaintenancePlan", "yewTrustHigh"],
        result: "你问紫阳有没有维护方案。她说有，但没有哪一种能让你们无限使用他。你们在夜风里把资金、检查、恢复和轮休排了一遍。每一项都像一条太细的绳。",
        next: () => openLeagueIntro("playoff"),
      },
      {
        label: "沉默看满天",
        desc: "他现在很开心。你一时不知道该说什么。",
        delta: { sync: 5, self: -2, load: 3 },
        flags: ["yewNightWarningSeen", "raySilentAfterWarning"],
        result: "你没有回答。满天把纸帽扶正，又很快弄歪。紫阳顺着你的视线看过去，声音低下来：“我知道你喜欢他这样。但这样也会烧起来。”",
        next: () => openLeagueIntro("playoff"),
      },
    ],
    "夜间警告"
  );
}

function playoffResultText() {
  if (state.flags.playoffFirstGameWon) {
    return `峡光赢下了队史第一场季后赛。

但满天没有再正常站上下一场比赛的投手丘。第二场，峡光输得很安静。`;
  }
  return `峡光输掉了队史第一场季后赛。

比分停在记分板上，可投手丘上的满天让所有人沉默。`;
}

function controlFlagCount() {
  return [
    "rayDecidedForMTBody",
    "rayDecidedForMTBodySnack",
    "rayTestedMTBodyLimit",
    "rayTrustedGloveOverData",
    "rayRefusedMTCare",
    "rayAskedMorePitchesForComfort",
    "rayShowedMTPower",
    "rayOverusedMTForWin",
    "rayTranslatedForMT",
    "rayControlledPlayoffOpening",
    "rayPushedThroughWarning",
    "rayRefusedToSlowDown",
    "rayToldMTToHoldBack",
  ].filter((flag) => state.flags[flag]).length;
}

function teamSupportScore() {
  return [
    "teamTranslationGroupStarted",
    "mtTaughtBodyReading",
    "teamSharedTheWin",
    "teamCarriedPlayoffSpot",
    "teamTriedToCatchCollapse",
    "playoffTeamSettledIn",
    "teamCelebratedLate",
  ].filter((flag) => state.flags[flag]).length;
}

function publicSupportScore() {
  return [
    "watchedMosasaurGame",
    "mosasaurConversationSeen",
    "rayCalledMTTeamAce",
    "rayCalledMTMyPitcher",
    "yewHandledMedia",
    "rayAskedBaiChengAboutPitcher",
    "lingChengLineOpened",
    "mosasaurTapeNightSeen",
    "rayStudiedMosasaursPair",
    "rayDiscussedPartnership",
    "yewTrustHigh",
    "rayAskedForMaintenancePlan",
  ].filter((flag) => state.flags[flag]).length;
}

function finishFirstSeason(decision) {
  const { record, morale, sync, load, self } = state.stats;
  const control = controlFlagCount();
  const team = teamSupportScore();
  const publicScore = publicSupportScore();
  const base = playoffResultText();
  const caredForMT = [
    "restedMT",
    "rayManagedMTRecovery",
    "rayManagedMTBody",
    "rayAskedMTPerception",
    "rayKeptBasicWork",
    "rayDiscussedPartnership",
    "rayChoseHomeOverTape",
    "rayAskedForMaintenancePlan",
    "playoffCollapseAskedPain",
    "playoffCollapseAskedMTFear",
    "playoffCollapseNeededBeyondPitch",
  ].filter((flag) => state.flags[flag]).length;
  const protectedMT = [
    "yewWarningAccepted",
    "rayPromisedYewToLimitMT",
    "rayAskedForMaintenancePlan",
    "playoffBasicMixUsed",
    "yewCheckedMTInPlayoff",
    "playoffCollapseBenchedMT",
    "playoffCollapseComfortedMT",
    "playoffCollapseNeededBeyondPitch",
  ].filter((flag) => state.flags[flag]).length;

  state.flags.firstSeasonContinue = false;

  if (decision === "continue" && load >= 80) {
    state.endingOverride = {
      title: "Bad End：燃尽的手套",
      text: `${base}

你让满天继续投。

那颗球极漂亮，漂亮到全场都忘了它来自一具已经撑不住的身体。

球落进你的手套时，满天的手没有再稳稳垂下去。

你接住过他最好的球。然后你亲手把那只手用到了尽头。`,
    };
  } else if ((record < 45 || morale < 30) && team < 1 && publicScore < 1) {
    state.endingOverride = {
      title: "Bad End：消失的王牌",
      text: `${base}

季后赛之后，莫道集团重新评估满天的项目。

峡光没有足够的成绩，队伍没有足够的承接，外界也没有足够多的人真正看见他。

手续来得很快。第二天，满天没有出现在训练场。

他的储物柜被清空，投手丘上没有脚印。`,
    };
  } else if (load >= 82 && self <= 35 && sync <= 35) {
    state.endingOverride = {
      title: "Bad End：空掉的投手丘",
      text: `${base}

满天的身体和精神都在季后赛里崩溃。

医生说他不能再投球。紫阳没有反驳。你也没有。

你不知道该怎么回应一个不能再投球、也无法再相信自己会被需要的满天。

过了一段时间，他从你身边突然消失。没有告别，也没有留下球。`,
    };
  } else if (control >= 4 && self < 50) {
    state.endingOverride = {
      title: "Bad End：钟锐的独裁比赛",
      text: `${base}

满天消失了一阵子，又回到了峡光。

他还站在你身边，也还会听暗号。

可他再也投不出之前那样的球。

峡光成了你手里更精密的棋盘，满天成了其中一枚普通棋子。`,
    };
  } else if (sync >= 50 && morale < 40) {
    state.endingOverride = {
      title: "Normal End：只剩投捕",
      text: `${base}

满天留在你身边。你们之间的暗号仍然存在，甚至比之前更紧。

可峡光队没有真正接住这件事。队员们站在稍远的地方，安静地把训练器材收好。

你和满天还可以互相看见。只是所有压力仍会回到你们两个人身上。`,
    };
  } else if (load < 75 && self < 45 && (decision === "bench" || decision === "yew" || decision === "comfort")) {
    state.endingOverride = {
      title: "Normal End：被保护的王牌",
      text: `${base}

你保住了满天的身体。

检查、恢复、轮休，每一项都被安排得很仔细。满天也很配合，像配合一份新的训练表。

只是他偶尔会看向投手丘，问今天是不是也没有他的名字。

你守住了身体，没有守住那个想继续投球的人。`,
    };
  } else if (record >= 60 && morale >= 55 && (sync < 45 || self < 45)) {
    state.endingOverride = {
      title: "Normal End：小破队的季后赛",
      text: `${base}

峡光创造了队史最好的赛季。

队员们第一次相信，这支队伍真的可以从烂泥里打上来。

但满天的崩溃让故事停在这里。峡光还会往前走，只是投手丘上不会再有那个能把你的暗号全部点亮的人。`,
    };
  } else if (load < 70 && self >= 62 && sync >= 58 && caredForMT >= 4 && protectedMT >= 2 && (decision === "mound" || state.flags.playoffBasicMixUsed || state.flags.rayKeptBasicWork)) {
    state.flags.firstSeasonContinue = true;
    state.endingOverride = {
      title: "Continue：第一颗直球",
      text: `${base}

满天暂时不能再使用复杂球种。

你蹲回本垒后方，比出直球暗号。满天看了很久，最后点头。

这颗球很轻，也不锋利，却稳稳落进你的手套。

第二季，将从这颗直球开始。`,
    };
  } else if (load < 76 && morale >= 62 && record >= 58 && team >= 4 && protectedMT >= 3 && (decision === "yew" || decision === "bench" || decision === "comfort")) {
    state.flags.firstSeasonContinue = true;
    state.endingOverride = {
      title: "Continue：峡光仍在",
      text: `${base}

满天倒下的时候，峡光没有散。

队员们第一次没有等你一个人解决所有事。有人去叫紫阳，有人守住休息区，有人把记者挡在外面。

这支小破队还很破，但它终于能接住一点重量。

第二季，峡光必须学会一起保护自己的王牌。`,
    };
  } else if (load < 76 && record >= 68 && morale >= 60 && publicScore >= 3 && self >= 58 && caredForMT >= 3 && protectedMT >= 1) {
    state.flags.firstSeasonContinue = true;
    state.endingOverride = {
      title: "Continue：无法被消失的人",
      text: `${base}

季后赛之后，关于满天的名字没有安静下去。

队友、球迷、媒体、对手，都已经看见过那个站在投手丘上的人。

莫道可以带走一个项目样本，却很难让一个被这么多人记住的投手无声消失。

第二季，你们要把这件事变成真正的自由。`,
    };
  } else {
    state.endingOverride = {
      title: "Normal End：未完成的第一季",
      text: `${base}

满天活了下来，峡光也没有立刻散掉。

但你们还没有找到足够清楚的答案。身体、球队、自由、暗号，每一样都悬在半空。

这个赛季停在这里。下一次，你需要更早决定要让谁来接住这场比赛。`,
    };
  }

  state.screen = "ending";
}

function renderPlayoffCollapseEvent() {
  const highLoad = state.stats.load >= 75;
  state.collapseLevel = state.stats.load >= 90
    ? "disaster"
    : state.stats.load >= 78 || state.stats.self <= 25
      ? "heavy"
      : state.stats.load >= 60
        ? "medium"
        : "light";

  storyScreen(
    "季后赛：满天崩溃",
    `满天站在投手丘上，手里的球没有立刻投出去。

他低头看自己的右手，像那只手突然变成了需要重新读懂的东西。

全场还在喊，队友还在等，比分还挂在记分板上。

你从本垒后方站起来。

下一秒，他试图完成出手动作。肩膀先滞住，手肘跟着失去方向，球从指尖滑出去，砸在本垒板前方。

那不是暴投。

那是一整条手臂突然断开了原本的投球路径。

满天站在投手丘上，像还想把动作补完。可他的右手已经垂下去，手指不受控制地蜷了一下。然后他膝盖一软，倒在投手丘上。

全场的声音从很远的地方退开。

你掀掉面罩冲上去。紫阳也从休息区冲出来，声音第一次尖得不像她。

满天被你和队员一起架回休息区。他很轻，轻得让你发冷。他靠在你身上，还在看投手丘。

“我还能投。”他说。

你知道，身体崩溃已经发生。${highLoad ? "\n\n他的脸色白得很快，连灯光都压不住。" : ""}`,
    "架他回休息区",
    () => {
      state.flags.playoffCollapseSeen = true;
      state.screen = "event";
      state.phase = "playoff-dugout";
      saveState();
      render();
    }
  );
}

function renderPlayoffDugoutEvent() {
  choiceEvent(
    "休息区：我还想投",
    `休息区里乱成一团。

紫阳跪在满天面前检查他的手臂，医疗组的人把器材箱打开。队员们围在外面，没人敢说话。

满天坐在长椅上，右手被紫阳按住，左手却还抓着球。

他看着你，声音很轻。

“我还想投。”

你知道他现在听不进比赛，听不进比分，甚至听不进疼。

他只在确认一件事：如果不能投，他还会不会被你需要。`,
    [
      {
        label: "强硬告诉他：你的身体不能投",
        desc: "先把事实钉住，不让他继续往投手丘走。",
        delta: { load: -12, self: -4, sync: -2, morale: 2 },
        flags: ["playoffCollapseBenchedMT", "rayDecidedForMTBody"],
        result: "你说不能投。你的身体现在不能投。满天很快点头，像听见了一条可以执行的指令。可他点完头以后，眼睛仍然停在你的手套上，像规则已经执行，身体却还没找到新的位置。",
        next: () => {
          state.collapseDecision = "bench";
          state.screen = "event";
          state.phase = "playoff-mental-crash";
        },
      },
      {
        label: "安慰他，先问哪里疼",
        desc: "先确认他的身体，把他从比赛里拉回来。",
        delta: { load: -10, self: 4, sync: 3, morale: 2 },
        flags: ["playoffCollapseComfortedMT", "playoffCollapseAskedPain"],
        result: "你蹲下来，问他哪里疼，手指能不能动，肩膀有没有感觉。满天愣了一下，像第一次发现你问的不是球。他慢慢低头看自己的手，说：“这里很吵。这里听不见球了。”",
        next: () => {
          state.collapseDecision = "comfort";
          state.screen = "event";
          state.phase = "playoff-mental-crash";
        },
      },
      {
        label: "问他：你想投，还是害怕停下来",
        desc: "你把他最深的恐惧直接问出来。",
        delta: { sync: 5, self: 8, load: -4 },
        flags: ["playoffCollapseAskedMTFear", "mtAskedOnMound"],
        result: "你问他，是想投，还是害怕停下来。满天的呼吸断了一拍。他看着你，嘴唇动了很久，最后只说：“停下来以后，你还在本垒后面吗？”",
        next: () => {
          state.collapseDecision = "mound";
          state.screen = "event";
          state.phase = "playoff-mental-crash";
        },
      },
      {
        label: "说：我还需要你，但不是这一球",
        desc: "你明确把需要从这场比赛里拆出来。",
        delta: { sync: 6, self: 7, load: -6, morale: 1 },
        flags: ["playoffCollapseNeededBeyondPitch", "yewTrustHigh"],
        result: "你说我还需要你，这一球先停下。满天看着你，像听见一条完全陌生的配球。他问：“不投，也需要？”你说，是。紫阳低头继续固定他的手臂，没有打断你。",
        next: () => {
          state.collapseDecision = "yew";
          state.screen = "event";
          state.phase = "playoff-mental-crash";
        },
      },
    ],
    "季后赛崩溃"
  );
}

function renderPlayoffMentalCrashEvent() {
  const decision = state.collapseDecision || "bench";
  storyScreen(
    "休息区：精神崩溃",
    `满天没有再说要投。

这比他说要投更糟。

他低头看着自己被固定住的右手，左手里那颗球慢慢滚到地上。他想弯腰去捡，身体却被紫阳按住。

“我没有投完。”他说。

没有人回答。

满天抬头看你，眼神第一次偏离暗号，在找一个能继续存在的位置。

“如果今天不投，”他说，“我今天还算王牌吗？”

紫阳闭了一下眼。队员们站在休息区外，安静得像整支队伍都被按下暂停。

满天的呼吸越来越乱。他开始反复说自己还能投，说下一局还需要他，说手套还在等。他说到最后，句子碎掉了，只剩下几个词：投球、手套、下一局、我。

你伸手去扶他，他抓住你的护具，力气很轻，却像溺水。

身体崩溃之后，精神也终于崩塌。`,
    "进入赛后",
    () => {
      state.flags.playoffMentalCrashSeen = true;
      finishFirstSeason(decision);
      saveState();
      render();
    }
  );
}

function renderSyncWarmBodyEvent() {
  choiceEvent(
    "隐藏事件：体温不稳定",
    `训练结束后，满天坐在长椅上，手指搭在球缝上。

你原本只是路过，却忽然停下来。

他的指尖很凉，额头却有一点不正常的热。

满天低头按了按自己的手腕，说：“这里今天像没有调好的投球机。”

他想了想，又补充：“但投球机不会觉得痒。所以我应该还算满天。”`,
    [
      {
        label: "把外套披给他，先不追问",
        desc: "你先处理眼前这件小事。",
        delta: { sync: 6, self: 4, load: -2 },
        flags: ["syncWarmBodySeen", "mtBodyWarmthNoticed"],
        result: "你把外套披到他肩上。满天低头看了看衣服，又看向你。他没有继续解释那个“不听话的部分”，但也没有躲开。",
        next: continueAfterHiddenEvent,
      },
      {
        label: "问他“这个部分”是什么意思",
        desc: "你想知道他到底在说什么。",
        delta: { sync: 2, self: 2 },
        flags: ["syncWarmBodySeen", "mtBodyQuestioned"],
        result: "满天想了很久，说：“就是这里。这里，还有这里。有些地方是后来才变成我的。”他指给你看，又很快把手收回去。",
        next: continueAfterHiddenEvent,
      },
      {
        label: "立刻叫紫阳过来检查",
        desc: "这件事不能只靠感觉。",
        delta: { sync: -4, load: -6 },
        flags: ["syncWarmBodySeen", "yewCalledForWarmBody"],
        result: "你叫了紫阳。满天很配合地伸出手，像配合一次常规检测。检查结束后，他问你：“刚才是异常吗？”你一时没有回答。",
        next: continueAfterHiddenEvent,
      },
    ],
    "隐藏事件"
  );
}

function renderSyncSparePartsEvent() {
  choiceEvent(
    "隐藏事件：备用零件",
    `满天帮你整理训练器材时，忽然停了一下。

他的手腕发出很轻的一声响。听起来不像骨头。

你还没开口，他已经自己转了转手，说：“如果这里坏掉，应该还有备用的。”

他说得太自然。

甚至有点高兴，像是发现坏掉也有解决办法。

你却听得后背发冷。`,
    [
      {
        label: "告诉他：你不是器材",
        desc: "这句话可能太直接，但你还是说了。",
        delta: { sync: 8, self: 8 },
        flags: ["syncSparePartsSeen", "raySaidMTNotEquipment"],
        result: "满天抬头看你，像是没听懂。过了很久，他才问：“那坏掉以后，也还是满天吗？”你说，是。",
        next: continueAfterHiddenEvent,
      },
      {
        label: "问备用零件在哪里",
        desc: "你需要知道更多，哪怕这个问题不太像关心。",
        delta: { sync: -5, self: -3 },
        flags: ["syncSparePartsSeen", "rayAskedSparePartsLocation"],
        result: "满天认真回忆了一下，说他不知道。紫阳可能知道，莫道集团也可能知道。他回答得很完整，完整到你意识到自己刚才问得像一份资产清单。",
        next: continueAfterHiddenEvent,
      },
      {
        label: "花钱给他做一次额外检查",
        desc: "这次检测不服务比赛，只单独确认他的身体。",
        cost: 6,
        costFailDelta: { sync: -4, self: -2 },
        delta: { sync: 4, load: -8, self: 3 },
        flags: ["syncSparePartsSeen", "mtExtraBodyCheck"],
        result: "你安排了一次额外检查。满天躺在检测台上时有点紧张。检查结束后，他很小声地说：“原来今天检查我，和今天要不要投球没有关系。”",
        next: continueAfterHiddenEvent,
      },
    ],
    "隐藏事件"
  );
}

function renderSyncCanStillPitchEvent() {
  choiceEvent(
    "隐藏事件：我今天还能投",
    `你把今天的训练表改掉，没有安排满天继续投球。

满天站在白板前看了很久。

“这里没有我的名字。”他说。

你说今天不安排他投球。

他立刻接上：“我今天还能投。”

语速很快，像在抢一个快要关上的窗口。

他在确认：如果今天不投，他还算不算今天的一部分。`,
    [
      {
        label: "说：你今天就在这里",
        desc: "你把话说慢一点。",
        delta: { sync: 8, self: 7, load: -3 },
        flags: ["syncCanStillPitchSeen", "rayKeptMTBeyondPitching"],
        result: "满天看着你，像在等后半句。你没有把后半句变成战术说明。你只是重复了一遍：你今天就在这里。",
        next: continueAfterHiddenEvent,
      },
      {
        label: "让他再投几颗给你看",
        desc: "这似乎能让他安心。",
        delta: { sync: 2, load: 12, self: -5 },
        flags: ["syncCanStillPitchSeen", "rayAskedMorePitchesForComfort"],
        result: "满天立刻点头。球一颗颗落进你的手套，精准得让人安心。你越接越清楚：真正松了一口气的人是你。",
        next: continueAfterHiddenEvent,
      },
      {
        label: "说：别添乱，今天照表休息",
        desc: "你没有力气解释那么多。",
        delta: { sync: -8, self: -6, load: -2 },
        flags: ["syncCanStillPitchSeen", "rayCalledMTRestTrouble"],
        result: "满天安静下来。他很快点头，像终于找到了正确指令。之后一整天，他都没有再主动问你任何问题。",
        next: continueAfterHiddenEvent,
      },
    ],
    "隐藏事件"
  );
}

function renderSyncEmptyLockerEvent() {
  choiceEvent(
    "隐藏事件：空掉的储物柜",
    `你在休息区找到满天时，他正把自己的东西一件件叠好。

毛巾，备用手套，训练服。连球都排成整齐的一列。

你问他在做什么。

满天说：“如果要走，这样比较快。”

他说完以后，又补了一句：“我没有偷懒。今天如果需要，我也可以投。”`,
    [
      {
        label: "问：谁跟你说你要走？",
        desc: "你先把这个问题拦下来。",
        delta: { sync: 9, self: 5 },
        flags: ["syncEmptyLockerSeen", "rayAskedWhoSaidMTWouldLeave"],
        result: "满天愣了一下。他说没有人说。可是输球、停投、检查、回收，这些词总是离得很近。你站在储物柜前，第一次觉得这地方太容易被清空。",
        next: continueAfterHiddenEvent,
      },
      {
        label: "帮他把东西放回去",
        desc: "先让这里恢复原样。",
        delta: { sync: 3, self: 2 },
        flags: ["syncEmptyLockerSeen", "rayRestoredMTLocker"],
        result: "你没有多说，蹲下来帮他把东西一件件放回去。满天看着你放，最后自己把那颗球摆回最里面。",
        next: continueAfterHiddenEvent,
      },
      {
        label: "说：项目失败的话，我也不一定保得住你",
        desc: "这是实话。也是很重的话。",
        delta: { sync: -10, self: -4 },
        flags: ["syncEmptyLockerSeen", "rayAdmittedMayNotSaveMT"],
        result: "满天点头。他看起来并不意外，甚至像是终于听见了一个能执行的答案。那天以后，他训练得更安静了。",
        next: continueAfterHiddenEvent,
      },
    ],
    "隐藏事件"
  );
}

const actions = [
  {
    id: "train",
    title: "训练队员",
    desc: "士气和战绩会上升，但会消耗本就不宽裕的资金。",
    delta: { morale: 6, record: 3, funds: -5 },
    log: "你把训练切成更细的模块。队员们骂得很小声，但动作开始像样。",
  },
  {
    id: "report",
    title: "写分析报告",
    desc: "资金会好看一点，但球队今晚少了一段训练。",
    delta: { funds: 12, morale: -4 },
    flag: "rayReportOverTraining",
    log: "你熬夜写完一份高价报告。账户好看了一点，训练表空了一块。",
  },
  {
    id: "field",
    title: "整修球场",
    desc: "夕阳很好看，但坏灯和漏水会实打实影响比赛。",
    delta: { funds: -15, morale: 4, record: 3 },
    flag: "fieldRepaired",
    log: "旧球场终于少了几个能让人分心的问题。它仍然破，但开始像主场。",
  },
  {
    id: "scout",
    title: "研究对手",
    desc: "最像你的办法，但你把时间给了对手，不是队友。",
    delta: { record: 6, morale: -4 },
    flag: "rayScoutOverTraining",
    log: "对手打线被拆成一格一格的弱点。你知道该怎么让他们不舒服。",
  },
  {
    id: "restMT",
    title: "陪满天恢复",
    desc: "负荷会下降，但你们要放弃一部分短期战绩。",
    requiresMT: true,
    delta: { load: -12, self: 3, sync: 2, record: -4 },
    flags: ["restedMT", "rayManagedMTRecovery"],
    log: "满天不太理解为什么今天不多投。你没解释太多，只把恢复表推到他面前。",
  },
  {
    id: "talkMT",
    title: "和满天谈谈",
    desc: "同步和自我会上升，但这会吃掉球队训练时间。",
    requiresMT: true,
    delta: { self: 5, sync: 3, morale: -3 },
    flags: ["askedMT"],
    log: "满天想了很久，说他不知道答案。至少这一次，问题是他自己的。",
  },
];

function renderManage() {
  const visibleActions = actions.filter((action) => !action.requiresMT || state.flags.metMT);
  const actionCards = visibleActions
    .map((action) => `
      <button class="action-btn" data-action="${action.id}">
        <strong>${action.title}</strong>
        <span>${action.desc}</span>
      </button>
    `)
    .join("");

  shell("经营界面", `
    <h2 class="screen-title">第 ${state.week} 周</h2>
    <div class="prose">${manageCopy()}</div>
    <div class="actions">${actionCards}</div>
    ${state.log ? `<div class="log">${state.log}</div>` : ""}
    <div class="primary-row">
      <button class="primary-btn" data-next-week>结束本周运营</button>
    </div>
  `);

  app.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => takeAction(button.dataset.action));
  });

  app.querySelector("[data-next-week]").addEventListener("click", advanceFromManage);
}

function manageCopy() {
  if (!state.flags.metMT) {
    return `你的时间只有这么多。训练、报告、球场、对手情报，每一项都在抢你的手。

峡光队不是一支等待奇迹的队伍。它甚至还没有资格等待奇迹。`;
  }

  if (state.week >= 5) {
    if (state.week >= 6) {
      return `峡光已经站到季后赛门口。队员们兴奋得很，满天也兴奋得很。

这周的经营不像补作业，更像确认谁能在季后赛里接住谁。`;
    }

    return `满天已经在正式联赛里投过球。对手会研究他，队友会依赖他，莫道集团也会重新计算他的价值。

这周的经营不只是补状态。你是在决定下一场比赛里，峡光到底是一支球队，还是一只伸向满天的手。`;
  }

  return `满天加入以后，一切都变得更容易，也更危险。

你脑子里的配球终于有人能执行。问题是，那个人不是一台机器。他会发热，会沉默，会因为你接住他的球而继续想投。`;
}

function takeAction(id) {
  if (state.actionsLeft <= 0) {
    state.log = "本周行动点已经用完。";
    pendingActionFlash = true;
    saveState();
    render();
    return;
  }
  const action = actions.find((item) => item.id === id);
  if (!action) return;

  const cost = actionCost(action);
  if (cost && state.stats.funds < cost) {
    state.log = "资金不足。你看了一眼账户余额，把这个经营方案暂时划掉。";
    pendingStatChanges.funds = "down";
    saveState();
    render();
    return;
  }

  const beforeItems = inventoryNames();
  changeStats(action.delta);
  if (action.flag) state.flags[action.flag] = true;
  if (action.flags) action.flags.forEach(addFlag);
  state.actionsLeft -= 1;
  state.log = `${action.log}${itemGainText(beforeItems)}`;
  maybeTriggerSyncHiddenEvent(returnToManage);
  saveState();
  render();
}

function advanceFromManage() {
  if (state.week === 1) {
    openLeagueIntro("first");
  } else if (state.week === 3) {
    state.week = 4;
    state.actionsLeft = 2;
    state.phase = "week4";
    state.log = "满天在训练后把球递给你，问：下一场，我可以多投一点吗？";
  } else if (state.week === 4) {
    openLeagueIntro("mt-debut");
  } else if (state.week === 5) {
    if (state.flags.rayReportOverTraining && !state.flags.rayReportLateNightSeen) {
      state.screen = "event";
      state.phase = "report-late-night";
    } else {
      goToYewImprovement();
    }
  } else if (state.week === 6) {
    goToPlayoffCelebration();
  } else {
    state.screen = "story";
    state.phase = "mt-arrival";
  }
  saveState();
  render();
}

function renderGame() {
  if (state.phase === "first-game") {
    renderFirstGame();
  } else if (state.phase === "mt-debut-game") {
    renderMTDebutGame();
  } else if (state.phase === "final-offense") {
    renderFinalOffense();
  } else if (state.phase === "final-defense") {
    renderFinalDefense();
  } else if (state.phase === "playoff-opening") {
    renderPlayoffOpening();
  } else if (state.phase === "playoff-pitching") {
    renderPlayoffPitching();
  } else if (state.phase === "playoff-pressure") {
    renderPlayoffPressure();
  } else {
    renderFinalGame();
  }
}

function checkMoraleCrisis(nextPhase) {
  if (state.stats.morale < 25) {
    state.crisisReturnPhase = nextPhase;
    state.screen = "event";
    state.phase = "league-crisis";
    return true;
  }
  return false;
}

function openLeagueIntro(type) {
  state.currentMatchType = type;
  state.currentOpponent = nextOpponent();
  state.screen = "league";
}

function renderLeagueIntro() {
  const matchNames = {
    first: "没有满天的联赛",
    "mt-debut": "满天首次正式登板",
    final: "黑马推进战",
    playoff: "季后赛第一场",
  };
  const matchName = matchNames[state.currentMatchType] || "关键联赛";
  const heading = state.currentMatchType === "playoff"
    ? "独立联盟季后赛 第一场"
    : `独立联盟联赛 第 ${state.leagueMatchNo} 场`;
  shell("联赛日", `
    <h2 class="screen-title">${heading}</h2>
    <div class="prose">峡光队 vs ${state.currentOpponent}

${matchName}

正式比赛不会等球队准备好才开始。你能带进球场的，只有之前每一周攒下来的战绩、士气和选择。球员们已经在休息区换好衣服，海风从通道尽头灌进来。

今天的对手不会知道峡光队有多破。他们只会把破绽打穿。</div>
    <div class="primary-row">
      <button class="primary-btn" data-start-match>开始比赛</button>
    </div>
  `, { weekText: "联赛日" });

  app.querySelector("[data-start-match]").addEventListener("click", () => {
    if (state.currentMatchType === "first") {
      state.screen = "game";
      state.phase = "first-game";
    } else if (state.currentMatchType === "mt-debut") {
      state.screen = "game";
      state.phase = "mt-debut-game";
    } else if (state.currentMatchType === "playoff") {
      state.playoffScore = 0;
      state.screen = "game";
      state.phase = "playoff-opening";
    } else if (!canEnterLeagueMatch()) {
      state.crisisReturnPhase = "final-offense";
      state.screen = "event";
      state.phase = "league-crisis";
    } else {
      state.screen = "game";
      state.phase = "final-offense";
    }
    saveState();
    render();
  });
}

function renderFirstGame() {
  shell("比赛：没有满天", `
    <h2 class="screen-title">第八局，一出局二垒有人</h2>
    <div class="prose">峡光 1:2 落后。你的投手已经开始喘，但对方三棒站进打击区。

你脑子里有一百种方案。问题是，投手只能执行其中最简单的二十种。</div>
    <div class="choices">
      <button class="choice-btn" data-choice="safe"><strong>稳妥配球</strong><span>诱导滚地球，先把局面压住。</span></button>
      <button class="choice-btn" data-choice="risk"><strong>冒险内角球</strong><span>赌他急躁，也赌你的投手能投到那里。</span></button>
      <button class="choice-btn" data-choice="walk"><strong>保送三棒</strong><span>绕开眼前的危险，面对更大的压力。</span></button>
    </div>
  `, { weekText: "峡光 vs 对手" });

  app.querySelectorAll("[data-choice]").forEach((button) => {
    button.addEventListener("click", () => resolveFirstGame(button.dataset.choice));
  });
}

function resolveFirstGame(choice) {
  let text = "";
  if (choice === "safe") {
    changeStats({ record: -4, morale: 5 });
    registerMatchLoss(0);
    text = "球被打成二垒方向的滚地。你们守住了这一局，但打线没有追回比分。峡光输了，不过这不是毫无内容的败局。";
  } else if (choice === "risk") {
    if (state.stats.record >= 35) {
      changeStats({ record: 12, morale: 3 });
      addFlag("rayRiskyCallSuccess");
      registerMatchWin(0);
      text = "内角球压进来。打者挥空。投手回头看你，像是第一次发现自己还能做到这种事。峡光靠这一局守住了反攻机会，险险赢下比赛。";
    } else {
      changeStats({ record: -8, morale: -5 });
      addFlag("rayPlanExecutionFailed");
      registerMatchLoss(0);
      text = "球偏了半颗。三棒把它打穿。你的方案没错，执行的人撑不住。峡光输掉了这场联赛。";
    }
  } else {
    changeStats({ record: -6, morale: 3 });
    registerMatchLoss(0);
    text = "你保送了三棒。四棒没有浪费这个礼物。峡光输了。至少队员们看懂了你在计算什么，但看懂还不等于赢。";
  }

  state.flags.firstGameDone = true;
  state.week = 2;
  state.actionsLeft = 0;
  state.screen = "result";
  state.phase = "first-result";
  state.log = text;
  outcomeScreen("赛中结果", state.log, () => {
    state.screen = "result";
    state.phase = "first-result";
  }, "比赛结果");
}

function renderMTDebutGame() {
  shell("比赛：满天首次登板", `
    <h2 class="screen-title">四局下半，满天走上投手丘</h2>
    <div class="prose">峡光和对手咬到 2:2。

满天第一次在正式联赛里站到投手丘上。看台很小，风很大，可所有人的视线都落在他的手上。

你知道他能把球投进你的手套。问题是，今天这场比赛，你要让整个队伍怎么认识他。</div>
    <div class="choices">
      <button class="choice-btn" data-choice="show"><strong>让满天完整压制</strong><span>直接用他的球把比赛拿回来。</span></button>
      <button class="choice-btn" data-choice="team"><strong>限制球种，让队友守起来</strong><span>满天负责关键位置，其他人也必须接住比赛。</span></button>
      <button class="choice-btn" data-choice="ask"><strong>让满天自己说想怎么投</strong><span>你给暗号，但先听他的判断。</span></button>
      <button class="choice-btn" data-choice="early"><strong>提前换下</strong><span>把他的第一场正式登板停在还能停的时候。</span></button>
    </div>
  `, { weekText: `${state.currentOpponent} · 满天登板` });

  app.querySelectorAll("[data-choice]").forEach((button) => {
    button.addEventListener("click", () => resolveMTDebutGame(button.dataset.choice));
  });
}

function resolveMTDebutGame(choice) {
  let text = "";
  if (choice === "show") {
    changeStats({ record: 15, sync: 8, load: 25, self: -3, morale: 2 });
    addFlag("rayShowedMTPower");
    registerMatchWin(0);
    text = "你没有隐藏满天。连续三振之后，休息区像被点亮了一下。峡光赢下比赛，但你也第一次清楚看见：胜利会让所有人更想继续用他。";
  } else if (choice === "team") {
    changeStats({ record: 8, morale: 6, sync: 4, load: 12, self: 2 });
    addFlag("rayMadeTeamProtectMT");
    registerMatchWin(0);
    text = "你压住了满天的球种，让守备自己处理能处理的球。过程不漂亮，但峡光赢了。队员们开始明白，满天不是用来替他们消失的。";
  } else if (choice === "ask") {
    changeStats({ record: 5, morale: 2, sync: 6, load: 15, self: 8 });
    state.flags.askedMT = true;
    addFlag("mtDebutAskedOwnPitch");
    registerMatchWin(0);
    text = "你在投手丘上问满天想怎么投。他看了你一会儿，说：我想试一颗直球。球落进手套，峡光赢得有点惊险，但满天第一次不像只是在等待暗号。";
  } else {
    changeStats({ record: -6, morale: 2, sync: -4, load: -12, self: -2 });
    addFlag("rayPulledMTDebutEarly");
    registerMatchLoss(0);
    text = "你提前换下满天。替补投手没能守住比分，峡光输了。满天没有抱怨，只是一直看着投手丘，像是不确定自己到底是被保护，还是被否定。";
  }

  state.flags.mtDebutGameDone = true;
  state.log = text;
  outcomeScreen("赛中结果", state.log, () => {
    if (state.endingOverride) {
      state.screen = "ending";
    } else {
      goToWeekFiveManage("满天的第一场正式登板结束后，峡光队突然变得像一支会被认真研究的球队。你得重新安排下一周。");
    }
  }, "比赛结果", { clearLogBeforeNext: true });
}

function renderFinalOffense() {
  shell("联赛：进攻布局", `
    <h2 class="screen-title">三局上半，峡光进攻</h2>
    <div class="prose">比赛进入前半段，对手投手开始适应峡光的打线。

现在不是满天能解决的问题。峡光必须自己想办法拿分。队员们看向休息区，等你决定这一局怎么打。</div>
    <div class="choices">
      <button class="choice-btn" data-choice="steady"><strong>稳定推进</strong><span>用短打、跑垒和牺牲推进慢慢抢分。适合士气高的队伍。</span></button>
      <button class="choice-btn" data-choice="rush"><strong>抢开局</strong><span>一开始就冒险抢分，成功会建立优势，失败会重创士气。</span></button>
      <button class="choice-btn" data-choice="wait"><strong>等对手失误</strong><span>少冒险，消耗对方投手。适合前面积累了足够战绩和情报时。</span></button>
    </div>
  `, { weekText: `${state.currentOpponent} · 进攻` });

  app.querySelectorAll("[data-choice]").forEach((button) => {
    button.addEventListener("click", () => resolveFinalOffense(button.dataset.choice));
  });
}

function resolveFinalOffense(choice) {
  if (choice === "steady") {
    if (state.stats.morale >= 40) {
      changeStats({ morale: 5 });
      state.log = "你让队员稳稳推进。没有漂亮的大挥棒，但每个人都知道自己该做什么。峡光抢到一个扎实的得分机会。";
    } else {
      changeStats({ morale: -8 });
      state.log = "你选择稳定推进，但队员动作慢了半拍。短打没有落到该落的位置，跑者也没有启动。休息区里的沉默变重了。";
    }
  } else if (choice === "rush") {
    if (state.stats.record >= 50 && state.stats.morale >= 35) {
      changeStats({ morale: 3, record: 3 });
      state.log = "你让峡光抢开局。跑者几乎是贴着封杀冲过去的，但成功了。队员们第一次觉得自己也能把对手逼急。";
    } else {
      changeStats({ morale: -12 });
      state.log = "你让峡光抢开局，但这支队伍还没准备好承受这种速度。一个跑垒失误把局面直接送回对手手里。";
    }
  } else {
    if (state.stats.record >= 45 || state.flags.rayScoutOverTraining) {
      changeStats({ morale: 4 });
      state.log = "你让队员耐心消耗。对方投手先急了，坏球变多。峡光没打出漂亮一击，却把局面一点点磨开。";
    } else {
      changeStats({ morale: -7 });
      state.log = "你选择等待对手失误，但峡光没有足够的压迫感。对手没有犯错，队员反而开始怀疑自己是不是只是在浪费机会。";
    }
  }

  outcomeScreen("赛中结果", state.log, () => {
    if (!checkMoraleCrisis("final-defense")) {
      state.screen = "game";
      state.phase = "final-defense";
    }
  }, `${state.currentOpponent} · 进攻`, { clearLogBeforeNext: true });
}

function renderFinalDefense() {
  shell("联赛：守备布局", `
    <h2 class="screen-title">五局下半，对手反攻</h2>
    <div class="prose">对手打线开始压上来。

现在的问题很直白：普通队员能不能守住满天之外的部分。如果守备被打穿，满天就会被迫用更多球来补整支队伍的洞。</div>
    <div class="choices">
      <button class="choice-btn" data-choice="trust"><strong>相信队友正常守备</strong><span>让队员守住自己的区域。适合士气足够高的时候。</span></button>
      <button class="choice-btn" data-choice="tight"><strong>收缩守备，先别大崩</strong><span>减少大失分风险，但会让对手一点点上垒。</span></button>
      <button class="choice-btn" data-choice="mt"><strong>让满天多用三振解决</strong><span>守备压力会下降，但满天负荷会上升。</span></button>
    </div>
  `, { weekText: `${state.currentOpponent} · 守备` });

  app.querySelectorAll("[data-choice]").forEach((button) => {
    button.addEventListener("click", () => resolveFinalDefense(button.dataset.choice));
  });
}

function resolveFinalDefense(choice) {
  if (choice === "trust") {
    if (state.stats.morale >= 45) {
      changeStats({ morale: 6, load: -3 });
      state.log = "你让队友正常守备。外野判断及时，内野传球也压得住。满天没有多投，队伍自己守住了一局。";
    } else {
      changeStats({ morale: -10, load: 5 });
      state.log = "你选择相信队友，但他们还撑不住。一次传球偏高后，满天不得不用更锋利的球把局面压回去。";
    }
  } else if (choice === "tight") {
    changeStats({ morale: 2, load: 6 });
    state.log = "你把守备收紧。峡光没有大崩，但对手一点点上垒，压力慢慢堆到满天手上。";
  } else {
    changeStats({ load: 18, sync: 5, morale: -4 });
    state.log = "你让满天多用三振解决。对手挥空，休息区松了一口气。可队员们也清楚，这一局不是他们守下来的。";
  }

  outcomeScreen("赛中结果", state.log, () => {
    if (!checkMoraleCrisis("final-game")) {
      state.screen = "game";
      state.phase = "final-game";
    }
  }, `${state.currentOpponent} · 守备`, { clearLogBeforeNext: true });
}

function renderFinalGame() {
  shell("比赛：满天登板", `
    <h2 class="screen-title">第七局，峡光 1:0 领先</h2>
    <div class="prose">满天已经连续压制对手六局。

他的球仍然漂亮。太漂亮了。漂亮到你几乎不想停下来。

紫阳站在休息区边缘，声音很冷：“数据有些异常。”

满天看向你。他没有退后的意思。</div>
    <div class="choices">
      <button class="choice-btn" data-choice="full"><strong>继续完整球种压制</strong><span>这场几乎能拿下，但紫阳已经盯着你的数据板。</span></button>
      <button class="choice-btn" data-choice="soft"><strong>降低强度</strong><span>减少复杂球种，用节奏撑住；这仍然是你替他决定。</span></button>
      <button class="choice-btn" data-choice="bench"><strong>换下满天</strong><span>保护身体，但比赛可能失控，他也可能以为自己被放弃。</span></button>
      <button class="choice-btn" data-choice="ask"><strong>走上投手丘，问他怎么想</strong><span>你放弃一部分控制权，比赛会变得不可预测。</span></button>
    </div>
  `, { weekText: "峡光关键战" });

  app.querySelectorAll("[data-choice]").forEach((button) => {
    button.addEventListener("click", () => resolveFinalGame(button.dataset.choice));
  });
}

function resolveFinalGame(choice) {
  let text = "";
  if (choice === "full") {
    changeStats({ record: 20, sync: 12, load: 90, self: -5 });
    addFlag("rayOverusedMTForWin");
    registerMatchWin(0);
    text = "你没有收手。满天投出了你想要的球，一颗接一颗，像所有暗号终于找到了身体。峡光赢了。满天的手指在赛后很久都没有停止发抖。";
  } else if (choice === "soft") {
    changeStats({ record: 10, sync: 6, load: 25, self: 5 });
    addFlag("rayLimitedMTPitchMix");
    registerMatchWin(0);
    text = "你把配球削到更简单。满天有些困惑，但还是执行了。峡光守住胜利，你知道自己还可以做得更细。";
  } else if (choice === "bench") {
    changeStats({ record: -8, load: -20, self: -3, morale: 2, sync: -5 });
    addFlag("rayDecidedForMTBody");
    registerMatchLoss(0);
    text = "你换下了满天。替补投手丢了分，比赛输了。满天坐在你旁边，低声问：我刚才不能投了吗？";
  } else {
    const selfGain = state.flags.askedMT || state.flags.restedMT ? 22 : 12;
    changeStats({ record: 5, sync: 8, load: 10, self: selfGain });
    state.flags.askedMT = true;
    addFlag("mtAskedOnMound");
    registerMatchWin(0);
    text = "你走上投手丘。满天等着你的暗号。你问他：你现在想怎么投？他愣了一下，第一次认真检查自己的手、呼吸和脚下的土。";
  }

  state.flags.finalGameDone = true;
  state.log = text;
  outcomeScreen("赛中结果", state.log, () => {
    if (state.endingOverride) {
      state.screen = "ending";
    } else {
      goToWeekSixManage("峡光赢下了通往季后赛的关键一战。你们还没有真正抵达终点，但休息区里已经有人开始发抖。他们第一次发现自己真的能走到那里。");
    }
  }, "峡光关键战", { clearLogBeforeNext: true });
}

function renderPlayoffOpening() {
  shell("季后赛：前半局布局", `
    <h2 class="screen-title">第一次站上季后赛</h2>
    <div class="prose">季后赛球场比旧球场亮太多。

峡光队的队员换好衣服，坐在休息区里，像一群突然被推到大舞台上的人。满天站在通道口，看着场内的灯，眼睛很亮。

紫阳的数据板从赛前开始就没有离手。

第一局要怎么打，决定这支小破队会用什么姿态进入季后赛。</div>
    <div class="choices">
      <button class="choice-btn" data-choice="steady"><strong>稳妥防守，让队友先进入节奏</strong><span>先让峡光稳下来，不急着把比赛交给满天。</span></button>
      <button class="choice-btn" data-choice="attack"><strong>主动抢分，打出黑马气势</strong><span>把季后赛当成你们一路打上来的延续。</span></button>
      <button class="choice-btn" data-choice="ray"><strong>交给钟锐拆对手弱点</strong><span>你用最熟悉的方式，把比赛先收进手里。</span></button>
    </div>
  `, { weekText: "季后赛第一场" });

  app.querySelectorAll("[data-choice]").forEach((button) => {
    button.addEventListener("click", () => resolvePlayoffOpening(button.dataset.choice));
  });
}

function resolvePlayoffOpening(choice) {
  if (choice === "steady") {
    changeStats({ morale: 7, load: 3 });
    state.playoffScore += state.stats.morale >= 45 ? 2 : 1;
    addFlag("playoffTeamSettledIn");
    state.log = "你让队友先稳住防守。第一颗球落地时，二垒手的动作慢了半拍，但他接住了。第二次，他提前到了位置。峡光没有立刻发光，却先站稳了。";
  } else if (choice === "attack") {
    changeStats({ record: 5, morale: 5, load: 5 });
    state.playoffScore += state.stats.record >= 55 ? 2 : 0;
    addFlag("playoffRaysAttackedFirst");
    state.log = "你让峡光主动抢分。短打、盗垒、牺牲推进，所有小动作在强光里显得又破又凶。对手一开始没把你们当回事，等他们反应过来，峡光已经踩上得分圈。";
  } else {
    changeStats({ record: 6, morale: -3, sync: 3, load: 4 });
    state.playoffScore += state.stats.record >= 50 || state.flags.rayScoutOverTraining ? 2 : 1;
    addFlag("rayControlledPlayoffOpening");
    state.log = "你把对手前几局的出手习惯拆开，给出站位、配球和进攻顺序。队员们照做，比赛被你一点点收进掌心。休息区安静得很听话。";
  }

  outcomeScreen("赛中结果", state.log, () => {
    state.screen = "game";
    state.phase = "playoff-pitching";
  }, "季后赛第一场", { clearLogBeforeNext: true });
}

function renderPlayoffPitching() {
  shell("季后赛：满天登板", `
    <h2 class="screen-title">满天走上投手丘</h2>
    <div class="prose">中盘，对手开始适应峡光的节奏。

满天拿着球走上投手丘。季后赛的灯落在他手上，像把球缝照得更深。

他回头看你。

你知道，只要现在给出复杂暗号，他能把这场比赛推到一个很漂亮的位置。你也知道，紫阳正在看数据板。</div>
    <div class="choices">
      <button class="choice-btn" data-choice="complex"><strong>复杂球路压制</strong><span>把对手最强打线直接按下去。</span></button>
      <button class="choice-btn" data-choice="basic"><strong>用基础球种控局</strong><span>节奏、落点和直球也能杀人。</span></button>
      <button class="choice-btn" data-choice="ask"><strong>问满天读到了什么</strong><span>让他用身体判断这局该怎么投。</span></button>
    </div>
  `, { weekText: "季后赛第一场" });

  app.querySelectorAll("[data-choice]").forEach((button) => {
    button.addEventListener("click", () => resolvePlayoffPitching(button.dataset.choice));
  });
}

function resolvePlayoffPitching(choice) {
  if (choice === "complex") {
    changeStats({ record: 8, sync: 8, load: 22, self: -3 });
    state.playoffScore += 2;
    addFlag("playoffComplexMixUsed");
    state.log = "你给出复杂暗号。满天投出的球一颗比一颗漂亮，对手打线像被细线勒住。全场开始安静，然后爆发。你听见自己的心跳，也听见紫阳合上数据板的声音。";
  } else if (choice === "basic") {
    changeStats({ record: 5, sync: 5, load: 10, self: 5 });
    state.playoffScore += 1;
    addFlag("playoffBasicMixUsed");
    state.log = "你削掉复杂球种，只用基础球路控局。满天一开始看了你一眼，随后把直球投进每一个你给出的角落。它们没有那么华丽，却稳得让对手越来越烦躁。";
  } else {
    changeStats({ sync: 6, self: 7, load: 12 });
    state.playoffScore += state.stats.self >= 45 ? 2 : 1;
    addFlag("playoffMTReadBatter");
    state.log = "你走到投手丘边，问满天看见了什么。满天盯着打者，说他的后脚想提前逃。你接受了他的判断。下一球，打者挥空，像被自己的身体骗了。";
  }

  outcomeScreen("赛中结果", state.log, () => {
    state.screen = "game";
    state.phase = "playoff-pressure";
  }, "季后赛第一场", { clearLogBeforeNext: true });
}

function renderPlayoffPressure() {
  shell("季后赛：关键局面", `
    <h2 class="screen-title">第七局，二出局一三垒有人</h2>
    <div class="prose">峡光还咬在比赛里。

满天连续处理了几个打者。每颗球都漂亮到让人忘记呼吸。

然后你看见了。

他的手指松开球的时间慢了一瞬。只有一瞬。普通人看不见，数据板会看见，手套也会看见。

对手最危险的打者站进打击区。现在必须决定，这局怎么过去。</div>
    <div class="choices">
      <button class="choice-btn" data-choice="push"><strong>继续压制</strong><span>相信满天和你的手套还能撑住。</span></button>
      <button class="choice-btn" data-choice="team"><strong>让队友守下来</strong><span>把比赛交给整支峡光。</span></button>
      <button class="choice-btn" data-choice="mound"><strong>上投手丘确认满天状态</strong><span>先看他，再看比赛。</span></button>
      <button class="choice-btn" data-choice="yew"><strong>叫紫阳看数据</strong><span>让专业判断进入球场。</span></button>
    </div>
  `, { weekText: "季后赛第一场" });

  app.querySelectorAll("[data-choice]").forEach((button) => {
    button.addEventListener("click", () => resolvePlayoffPressure(button.dataset.choice));
  });
}

function resolvePlayoffPressure(choice) {
  if (choice === "push") {
    changeStats({ record: 5, sync: 5, load: 22, self: -4 });
    state.playoffScore += 1;
    addFlag("rayPushedThroughWarning");
    state.log = "你压下那一瞬间的不安，继续给出暗号。满天照着投。球漂亮得几乎残忍，打者挥空，全场沸腾。只有你知道，他的手指在回收动作里抖了一下。";
  } else if (choice === "team") {
    changeStats({ morale: 10, load: 8, record: 2 });
    state.playoffScore += state.stats.morale >= 55 ? 2 : 0;
    addFlag("teamTriedToCatchCollapse");
    state.log = "你把守备向前推，让队友接住这一局。球被打进内野，三棒扑出去，膝盖擦过土，把球拦下来。满天站在投手丘上，看起来像第一次发现有人能替他挡住一点东西。";
  } else if (choice === "mound") {
    changeStats({ sync: 6, self: 6, load: 10 });
    state.playoffScore += 1;
    addFlag("rayCheckedMTOnMound");
    state.log = "你走上投手丘。满天看着你，第一句话是：“我还能投。”你没有立刻回答，只看他的手。那只手还握着球，但已经握得太紧。";
  } else {
    changeStats({ load: 6, record: -2 });
    state.playoffScore += state.flags.yewTrustHigh || state.flags.rayAskedForMaintenancePlan ? 1 : 0;
    addFlag("yewCheckedMTInPlayoff");
    addFlag("yewTrustHigh");
    state.log = "你叫紫阳上来。她只看了一眼数据板，脸色就变了。满天站在你们中间，像忽然发现自己被两种暗号同时包围。";
  }

  const won = state.playoffScore >= 4 && state.stats.record >= 45 && state.stats.morale >= 35;
  state.flags.playoffFirstGameWon = won;
  state.flags.playoffCollapseSeen = true;
  state.log = `${state.log}

下一球还没有投出，满天的呼吸先乱了。`;
  outcomeScreen("赛中结果", state.log, () => {
    state.screen = "event";
    state.phase = "playoff-collapse";
  }, "季后赛第一场", { clearLogBeforeNext: true });
}

function renderResult() {
  storyScreen(
    "赛后",
    `夜里，海风从外野吹进来。你坐在空荡荡的休息区，重新整理比赛记录。

峡光仍然是一支小破队。可你已经知道，它至少还有一点可以被修正的余地。`,
    "下一周",
    () => {
      state.screen = "story";
      state.phase = "mt-arrival";
      saveState();
      render();
    }
  );
}

function endingData() {
  if (state.endingOverride) return state.endingOverride;

  return {
    title: "归档结局：旧版流程",
    text: `${state.log ? `${state.log}\n\n` : ""}这个存档停在旧版 Demo 的结局入口。

v0.7 之后，第一季结局会通过季后赛崩溃后的中期结局矩阵结算。

如果你是从旧存档进入这里，可以从头开始体验新版第一季。`,
  };
}

function renderEnding() {
  const ending = endingData();
  const canContinue = state.flags.firstSeasonContinue || ending.title.startsWith("Continue");
  shell("结局", `
    <h2 class="screen-title">${ending.title}</h2>
    <div class="prose">${ending.text}</div>
    <div class="primary-row">
      <button class="primary-btn" data-ending-action>${canContinue ? "进入下一局" : "重新开始"}</button>
    </div>
  `, { weekText: "Demo结束" });

  app.querySelector("[data-ending-action]").addEventListener("click", () => {
    if (canContinue) {
      state.screen = "continued";
      saveState();
      render();
      return;
    }
    resetGame();
  });
}

function renderContinued() {
  shell("下一局", `
    <h2 class="screen-title">To be continued...</h2>
    <div class="prose">第二季尚未开放。

满天的第一季停在这里。下一局，会从崩溃之后开始。</div>
    <div class="primary-row">
      <button class="primary-btn" data-restart>重新开始</button>
    </div>
  `, { weekText: "未完待续" });

  app.querySelector("[data-restart]").addEventListener("click", resetGame);
}

function render() {
  if (state.screen === "menu") renderMenu();
  if (state.screen === "story") renderStory();
  if (state.screen === "event") renderEvent();
  if (state.screen === "league") renderLeagueIntro();
  if (state.screen === "manage") renderManage();
  if (state.screen === "game") renderGame();
  if (state.screen === "result") renderResult();
  if (state.screen === "ending") renderEnding();
  if (state.screen === "continued") renderContinued();
}

render();
