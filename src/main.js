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
    mtDebutGameDone: false,
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
  return {
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
  };
}

function resetGame() {
  state = structuredClone(initialState);
  saveState();
  render();
}

function changeStats(delta) {
  for (const [key, value] of Object.entries(delta)) {
    const before = state.stats[key] ?? 0;
    const after = clamp(before + value);
    state.stats[key] = after;
    if (after > before) pendingStatChanges[key] = "up";
    if (after < before) pendingStatChanges[key] = "down";
  }
}

function addFlag(name) {
  state.flags[name] = true;
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

这不是一场普通失利，而是项目评估里的第二次失败。

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
  if (value <= 75) return "过载边缘";
  return "危险";
}

function selfStatus(value) {
  if (value <= 25) return "等待暗号";
  if (value <= 50) return "开始提问";
  if (value <= 75) return "偶尔摇头";
  return "知道自己想投什么";
}

function syncStatus(value) {
  if (value <= 20) return "陌生的好球";
  if (value <= 45) return "开始咬合";
  if (value <= 70) return "共振";
  return "危险共生";
}

function statRows() {
  return [
    { key: "record", label: "战绩", value: state.stats.record, text: "联赛存在感" },
    { key: "funds", label: "资金", value: state.stats.funds, text: "小破队资源" },
    { key: "morale", label: "士气", value: state.stats.morale, text: "球队相信度" },
    { key: "sync", label: "同步", value: state.stats.sync, text: syncStatus(state.stats.sync), danger: state.stats.sync > 75 },
    { key: "load", label: "负荷", value: state.stats.load, text: loadStatus(state.stats.load), danger: state.stats.load > 70 },
    { key: "self", label: "自我", value: state.stats.self, text: selfStatus(state.stats.self) },
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
        <button class="tiny-reset" data-reset title="从头开始">重开</button>
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
    if (saved && saved.screen !== "menu") state = saved;
    render();
  });
}

function storyScreen(title, text, nextLabel, next) {
  shell(title, `
    <h2 class="screen-title">${title}</h2>
    <div class="prose">${text}</div>
    <div class="primary-row">
      <button class="primary-btn" data-next>${nextLabel}</button>
    </div>
  `, { weekText: "剧情" });

  app.querySelector("[data-next]").addEventListener("click", next);
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
  const buttons = choices
    .map((choice, index) => `
      <button class="choice-btn" data-choice="${index}">
        <strong>${choice.label}</strong>
        <span>${choice.desc}</span>
      </button>
    `)
    .join("");

  shell(title, `
    <h2 class="screen-title">${title}</h2>
    <div class="prose">${text}</div>
    <div class="choices">${buttons}</div>
    ${state.log ? `<div class="log">${state.log}</div>` : ""}
  `, { weekText });

  app.querySelectorAll("[data-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      const choice = choices[Number(button.dataset.choice)];
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
      state.log = choice.result;
      if (!maybeTriggerSyncHiddenEvent(choice.next)) choice.next();
      saveState();
      render();
    });
  });
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

function goToFinalOrWarning() {
  if (state.stats.load > 35 && !state.flags.yewFirstLoadWarningSeen) {
    state.screen = "event";
    state.phase = "yew-warning";
    return;
  }
  openLeagueIntro("final");
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

他看着货架上的零食，像在观察某种不明但强烈的信号源。队员已经走出去几步，他还站在自动门前，眼睛跟着彩色包装移动。

你看了一眼明天的训练表，又看了一眼他手里的东西。

紫阳的声音从背后飘过来：“别忘了，他明天要试投。”`,
    [
      {
        label: "直接没收",
        desc: "明天有投球训练。他不能随便吃这个。",
        delta: { load: -2, self: -3, sync: -1 },
        flags: ["mtSnackEventSeen", "mtSnackConfiscated", "rayDecidedForMTBodySnack"],
        result: "你把零食从他手里拿走。满天没有反抗，只是低头看了看空掉的手，像是在确认某种规则。",
        next: goToPractice,
      },
      {
        label: "买一袋，但调整晚饭和训练",
        desc: "允许他吃，但你会重新计算晚饭和恢复菜单。",
        delta: { funds: -2, self: 2, sync: 2 },
        flags: ["mtSnackEventSeen", "mtSnackCompromise", "rayManagedMTBody"],
        result: "满天拿着零食看你，像是在确认这是不是一种许可。你已经在脑子里重排了晚饭、恢复菜单和明天的热身时间。",
        next: goToPractice,
      },
      {
        label: "问他为什么想吃",
        desc: "你先不阻止，只问他为什么想要。",
        delta: { self: 6, sync: 1, morale: -1 },
        flags: ["mtSnackEventSeen", "mtAskedBodyWant"],
        result: "满天想了很久。他说不清是饿，还是被颜色吸引，还是只是想知道那是什么味道。你意识到，他不是在任性。他是在用一种很笨的方式认识自己的身体。",
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

他们已经听说这个空降投手很强，也已经听说钟锐只看了三颗球就沉默了很久。

满天站上投手丘，转了转球。他看向你，等你的暗号。`,
    [
      {
        label: "直接测试完整球种",
        desc: "你想知道这副身体到底能执行到什么程度。",
        delta: { sync: 10, load: 18, self: -2, morale: 3 },
        flags: ["mtFirstPracticeSeen", "mtFullPitchMixTested", "rayTestedMTBodyLimit"],
        result: "第一颗变化球落进你的手套时，场边彻底安静下来。你听见某个队员低声骂了一句。不是不满，是被吓到了。满天看着你的手套，眼睛亮得过分。",
        next: goToTeamMisread,
      },
      {
        label: "只测试快速球和落点",
        desc: "你暂时不碰最锋利的部分，先确认基础。",
        delta: { sync: 6, load: 8, self: 2, morale: 5 },
        flags: ["mtFirstPracticeSeen", "mtFastballControlTested"],
        result: "满天的快速球一颗颗落进手套。没有花哨变化，但每颗球都像被钉在你想要的位置上。队员们开始小声讨论：如果只是这种球，他们也许还能理解。",
        next: goToTeamMisread,
      },
      {
        label: "让队员自由上场打",
        desc: "不只测试满天，也测试队伍能不能面对他。",
        delta: { morale: 8, sync: 4, load: 12, self: 3 },
        flags: ["mtFirstPracticeSeen", "teamFacedMTPitching"],
        result: "你让队员按平时节奏打。前三个打者几乎没有舒服挥棒。第四个打者勉强擦到球，跑回休息区时表情复杂得像刚看见天气预报变成了数学题。满天回头看你，像是在问：这样可以吗？",
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

满天坐在长椅另一端，认真擦着球。他刚才对三棒说“你的身体比你的球棒慢半拍”，语气非常平静。

对他来说，那只是观察。

对队友来说，那听起来像把人拆成零件。

几个人看向你。`,
    [
      {
        label: "替满天解释",
        desc: "他不是在嘲讽。他只是不会说人话。",
        delta: { morale: 4, sync: 3, self: -1 },
        flags: ["teamMisreadsMTSeen", "rayExplainedMTToTeam"],
        result: "你简单解释了满天的说话方式。队员们半信半疑，但至少没有继续把敌意堆到他身上。满天抬头看了你一眼，又低头擦球。",
        next: goToWeekFourManage,
      },
      {
        label: "让满天自己解释",
        desc: "如果他要留在队里，他也得学着和队友说话。",
        delta: { self: 6, morale: 3, sync: 1 },
        flags: ["teamMisreadsMTSeen", "mtExplainedSelfToTeam"],
        result: "你没有立刻开口。满天想了一会儿，对三棒说：“我不是讨厌你。我是说你的脚比手诚实。”休息区安静了两秒。然后有人笑出了声。",
        next: goToWeekFourManage,
      },
      {
        label: "用训练结果压过去",
        desc: "与其解释，不如让他们承认他确实看得准。",
        delta: { morale: 6, self: -4, sync: 2 },
        flags: ["teamMisreadsMTSeen", "rayUsedMTAccuracyToConvinceTeam"],
        result: "你把三棒刚才的挥棒录像调出来，逐帧指出满天说的“慢半拍”在哪里。队员闭嘴了。但满天看着屏幕，像是突然明白自己刚才被你拿来证明了一件事。",
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
        flags: ["yewFirstLoadWarningSeen", "yewWarningAccepted"],
        result: "你把下一场的配球预案删掉一半。删到最后，你发现最难删的不是球种，而是你自己想接住它们的冲动。",
        next: goToFinalOrWarning,
      },
      {
        label: "要求更多数据",
        desc: "你不是不信她。你只是想亲自确认。",
        delta: { load: -3, morale: -2, sync: 1 },
        flags: ["yewFirstLoadWarningSeen", "rayRequestedMoreLoadData"],
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

不是输掉一场比赛那么简单，而是整个赛季在这里断掉。

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
        desc: "不是训练菜单，不是比赛预案。只是他想投什么。",
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

你们吵了十分钟，最后都意识到问题不是要不要改，而是钱只能改一个地方。`,
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

你拎着他的后领把人带回家，打开冰箱。

满天站在厨房门口，看着你拿出食材，问：“今天的饭是为了投球，还是为了吃饭？”

这个问题比菜单本身麻烦。`,
    [
      {
        label: "做严格健康餐",
        desc: "花一点钱。你知道这对他的身体更稳妥。",
        cost: 3,
        delta: { load: -8, self: -3, sync: 1 },
        flags: ["mtCookingSeen", "mtStrictHealthMeal"],
        result: "你做了严格健康餐。满天吃得很认真，也很痛苦。你知道这顿饭对他的身体最好，但他看向盘子的眼神像是在阅读一份处罚决定。",
        next: goToMosasaurGame,
      },
      {
        label: "做满天想吃的甜食大餐",
        desc: "花一点钱。满天看起来真的很想吃。",
        cost: 5,
        delta: { sync: 8, self: 3, load: 3 },
        flags: ["mtCookingSeen", "mtSweetMeal"],
        result: "你做了满天想吃的甜食大餐。满天坐在桌边，眼睛亮得像刚接到你给出的暗号。你看着他吃，脑子里已经开始计算明天要怎么把这顿饭补回来。",
        next: goToMosasaurGame,
      },
      {
        label: "一起商量菜单",
        desc: "花一点钱。你把菜单交给一个不太懂自己身体的人。",
        cost: 4,
        delta: { load: -4, self: 6, sync: 4 },
        flags: ["mtCookingSeen", "mtChoseMenuWithRay"],
        result: "你让满天一起商量菜单。他说不清想吃什么，只能说颜色、味道和身体里的感觉。你把那些奇怪描述翻译成一顿勉强合格的饭。",
        next: goToMosasaurGame,
      },
      {
        label: "没时间做，随便解决",
        desc: "少花一点钱。今晚先这样糊弄过去。",
        cost: 1,
        delta: { load: 5, sync: -2 },
        flags: ["mtCookingSeen", "mtMealHandledCasually"],
        result: "你随便解决了晚饭。满天没有抱怨，但吃完以后还是看了你一会儿。那不是责怪，更像是不明白为什么今天这件事没有被认真安排。",
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

满天从你身后探头，看见“江陵”这个名字，问：“这是以前钟锐的棒球交际圈吗？”

沧龙今晚主场。江陵和白城都在先发名单里。去看比赛要花钱，也要花掉一整个晚上。`,
    [
      {
        label: "带满天去看沧龙比赛",
        desc: "要花钱。满天会看到你以前那群麻烦的棒球熟人。",
        cost: 8,
        delta: { self: 4, sync: 3, record: 4 },
        flags: ["mosasaurInviteSeen", "watchedMosasaurGame", "lingChengLineOpened"],
        result: "你带满天去了沧龙主场。江陵在九局下半挥出一记漂亮安打，白城在待打区笑得像早就知道会这样。满天看完以后说：“他们也像一组投捕吗？”你决定暂时不回答。",
        next: goToFinalOrWarning,
      },
      {
        label: "自己去看，让满天休息",
        desc: "要花钱。你可以把它当成一次单独侦察。",
        cost: 5,
        delta: { record: 6, load: -4, sync: -2 },
        flags: ["mosasaurInviteSeen", "rayWatchedMosasaurAlone"],
        result: "你自己去了沧龙主场。江陵打得很烦，白城处理所有媒体镜头都很熟练。你带回很多有用情报，也带回一个明显不太高兴的满天。",
        next: goToFinalOrWarning,
      },
      {
        label: "不去，买录像分析",
        desc: "少花一点钱。只看录像，不去现场。",
        cost: 3,
        delta: { record: 3 },
        flags: ["mosasaurInviteSeen", "boughtMosasaurFootage"],
        result: "你买了录像分析。画面里的江陵和白城依然烦人，但至少他们现在可以被暂停、倒放和标注。满天看了一会儿，问为什么他们不用暗号也知道彼此要做什么。",
        next: goToFinalOrWarning,
      },
      {
        label: "不去，留钱给峡光",
        desc: "不花钱。今晚留在峡光这边。",
        delta: { self: -2 },
        flags: ["mosasaurInviteSeen", "skippedMosasaurGameForFunds"],
        result: "你没有去。钱留给了峡光。满天没有继续问，但那天晚上他翻来覆去看了很多沧龙的公开剪辑。",
        next: goToFinalOrWarning,
      },
    ],
    "日常"
  );
}

function renderSyncWarmBodyEvent() {
  choiceEvent(
    "隐藏事件：体温不稳定",
    `训练结束后，满天坐在长椅上，手指搭在球缝上。

你原本只是路过，却忽然停下来。

他的指尖很凉，额头却有一点不正常的热。满天看着自己的手，说：“这个部分好像又不太听话了。”

他说得很平静。像在说一只手套的皮革开始松。`,
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

他的手腕发出很轻的一声响。不是骨头的声音。

你还没开口，他已经自己转了转手，说：“如果这里坏掉，应该还有备用的。”

他说得太自然了。像在说球棒裂了，可以换一根。`,
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
        desc: "不是比赛前的检测，是单独为他确认身体。",
        cost: 6,
        costFailDelta: { sync: -4, self: -2 },
        delta: { sync: 4, load: -8, self: 3 },
        flags: ["syncSparePartsSeen", "mtExtraBodyCheck"],
        result: "你安排了一次额外检查。满天躺在检测台上时有点紧张，但检查结束后，他很小声地说：“原来今天不是因为我要投球。”",
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

然后他说：“我今天还能投。”

他不是在争取训练量。你听得出来。他是在确认：如果今天不投，他是不是还需要留在这里。`,
    [
      {
        label: "说：不是因为能投才留下你",
        desc: "你把话说慢一点。",
        delta: { sync: 8, self: 7, load: -3 },
        flags: ["syncCanStillPitchSeen", "rayKeptMTBeyondPitching"],
        result: "满天看着你，像在等后半句。你没有把后半句变成战术说明。你只是重复了一遍：不是因为能投。",
        next: continueAfterHiddenEvent,
      },
      {
        label: "让他再投几颗给你看",
        desc: "这似乎能让他安心。",
        delta: { sync: 2, load: 12, self: -5 },
        flags: ["syncCanStillPitchSeen", "rayAskedMorePitchesForComfort"],
        result: "满天立刻点头。球一颗颗落进你的手套，精准得让人安心。可你越接越清楚：安心的人不是他，是你。",
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
    delta: { morale: 10, record: 5, funds: -5 },
    log: "你把训练切成更细的模块。队员们骂得很小声，但动作开始像样。",
  },
  {
    id: "report",
    title: "写分析报告",
    desc: "资金会好看一点，但球队今晚少了一段训练。",
    delta: { funds: 15, morale: -3 },
    flag: "rayReportOverTraining",
    log: "你熬夜写完一份高价报告。账户好看了一点，训练表空了一块。",
  },
  {
    id: "field",
    title: "整修球场",
    desc: "夕阳很好看，但坏灯和漏水会实打实影响比赛。",
    delta: { funds: -15, morale: 5, record: 5 },
    log: "旧球场终于少了几个能让人分心的问题。它仍然破，但开始像主场。",
  },
  {
    id: "scout",
    title: "研究对手",
    desc: "最像你的办法，但你把时间给了对手，不是队友。",
    delta: { record: 10, morale: -2 },
    flag: "rayScoutOverTraining",
    log: "对手打线被拆成一格一格的弱点。你知道该怎么让他们不舒服。",
  },
  {
    id: "restMT",
    title: "陪满天恢复",
    desc: "负荷会下降，但你们要放弃一部分短期战绩。",
    requiresMT: true,
    delta: { load: -15, self: 5, sync: 3, record: -3 },
    flags: ["restedMT", "rayManagedMTRecovery"],
    log: "满天不太理解为什么今天不多投。你没解释太多，只把恢复表推到他面前。",
  },
  {
    id: "talkMT",
    title: "和满天谈谈",
    desc: "同步和自我会上升，但这会吃掉球队训练时间。",
    requiresMT: true,
    delta: { self: 10, sync: 4, morale: -2 },
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

  changeStats(action.delta);
  if (action.flag) state.flags[action.flag] = true;
  if (action.flags) action.flags.forEach(addFlag);
  state.actionsLeft -= 1;
  state.log = action.log;
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
    final: "关键联赛",
  };
  const matchName = matchNames[state.currentMatchType] || "关键联赛";
  shell("联赛日", `
    <h2 class="screen-title">独立联盟联赛 第 ${state.leagueMatchNo} 场</h2>
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
  saveState();
  render();
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
  if (state.endingOverride) {
    state.screen = "ending";
  } else {
    goToWeekFiveManage(`${text}

满天的第一场正式登板结束后，峡光队突然变得像一支会被认真研究的球队。你得重新安排下一周。`);
  }
  saveState();
  render();
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

  if (!checkMoraleCrisis("final-defense")) {
    state.screen = "game";
    state.phase = "final-defense";
  }
  saveState();
  render();
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

  if (!checkMoraleCrisis("final-game")) {
    state.screen = "game";
    state.phase = "final-game";
  }
  saveState();
  render();
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
  if (state.endingOverride) {
    state.screen = "ending";
  } else if (choice === "bench") {
    state.screen = "event";
    state.phase = "bench-question";
  } else if ((choice === "ask" || choice === "soft") && state.stats.load < 85) {
    state.screen = "event";
    state.phase = "empty-field";
  } else {
    state.screen = "ending";
  }
  state.log = text;
  saveState();
  render();
}

function renderResult() {
  storyScreen(
    "赛后",
    `${state.log}

夜里，海风从外野吹进来。你坐在空荡荡的休息区，重新整理比赛记录。

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

  const { record, morale, sync, load, self } = state.stats;
  const choseCare = state.flags.mtAskedOnMound || state.flags.restedMT;

  if (load > 85) {
    return {
      title: "Bad End：燃尽的手套",
      text: `${state.log}

最后一局，满天投出失控球。

那颗球没有落进你的手套。

你冲上投手丘时，他看着你，说自己还能投。但他的手指已经无法正确扣住球缝。

你接住过他最好的球。然后你亲手把那只手用到了尽头。`,
    };
  }

  if (load < 70 && self > 50 && sync > 35 && choseCare) {
    return {
      title: "Good End：第一颗直球",
      text: `${state.log}

比赛结束后，你和满天留在空球场。

你蹲回本垒后方，比出快速球暗号。

满天摇头。

你停了一下。然后点头。

他投出一颗并不最华丽、但完全出于自己意愿的直球。

球落进你的手套。

这颗球不是被你安排出来的。你接住了它。`,
    };
  }

  if (record > 65 && sync > 45 && load < 85 && self < 50) {
    return {
      title: "Normal End：赢球机器",
      text: `${state.log}

峡光赢下比赛。媒体第一次认真写下这支球队的名字。

满天站在你身边，等你告诉他下一场该怎么投。

你终于有了能执行一切暗号的投手。

问题是，他也只剩下暗号。`,
    };
  }

  if (morale < 20 && sync > 40) {
    return {
      title: "Normal End：只剩投捕",
      text: `${state.log}

峡光没有彻底输掉这场比赛。

但当你整理记录时，发现胜利几乎全部落在你和满天的连线上。队友们安静地收拾东西，没人打扰你们，也没人真正进入这盘棋。

满天还在看你的手套。你知道他愿意继续投。

问题是，峡光队越来越不像一支队伍。`,
    };
  }

  return {
    title: "Normal End：未完成的配球",
    text: `${state.log}

峡光没有崩盘，也没有真正起飞。

满天还在你的手套前投球。你们之间有某种东西正在形成，但它还没有清楚到足以改变结局。

下一次，你需要更早决定：你到底想接住的是球，还是人。`,
  };
}

function renderEnding() {
  const ending = endingData();
  shell("结局", `
    <h2 class="screen-title">${ending.title}</h2>
    <div class="prose">${ending.text}</div>
    <div class="primary-row">
      <button class="primary-btn" data-restart>重新开始</button>
    </div>
  `, { weekText: "Demo结束" });

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
}

render();
