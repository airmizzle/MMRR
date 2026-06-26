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
};

let state = normalizeState(loadState()) || structuredClone(initialState);
let pendingStatChanges = {};

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
      </header>
      <section class="main-panel">
        <div class="topline">
          <div class="chapter">${title}</div>
          <div class="week">${options.weekText || `第 ${state.week} 周 · 行动 ${state.actionsLeft}/2`}</div>
        </div>
        <div class="content">${body}</div>
      </section>
    </div>
  `;

  window.setTimeout(() => {
    pendingStatChanges = {};
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
      if (choice.delta) changeStats(choice.delta);
      if (choice.flags) choice.flags.forEach(addFlag);
      state.log = choice.result;
      choice.next();
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
  if (state.phase === "bench-question") return renderBenchQuestionEvent();
  if (state.phase === "empty-field") return renderEmptyFieldEvent();
  if (state.phase === "report-late-night") return renderReportLateNightEvent();
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

function goToFinalOrWarning() {
  if (state.stats.load > 35 && !state.flags.yewFirstLoadWarningSeen) {
    state.screen = "event";
    state.phase = "yew-warning";
    return;
  }
  state.screen = "game";
  state.phase = "final-game";
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
        next: goToFinalOrWarning,
      },
      {
        label: "让他坐一会儿",
        desc: "你继续写，他坐在旁边。不是效率最高，但你没有赶他走。",
        delta: { sync: 4, self: 2, morale: -1 },
        flags: ["rayReportLateNightSeen", "mtSatWithRayReport"],
        result: "满天坐在旁边看你写报告。你没有解释那些模型，他也没有问。房间里只有键盘声和他的呼吸。",
        next: goToFinalOrWarning,
      },
      {
        label: "关掉报告，明天再写",
        desc: "钱重要，但你突然觉得今晚不适合继续。",
        delta: { funds: -5, sync: 3, self: 3 },
        flags: ["rayReportLateNightSeen", "rayStoppedReportForMT"],
        result: "你关掉报告。满天看着黑下来的屏幕，又看向你，像是第一次发现你也会停止运转。",
        next: goToFinalOrWarning,
      },
    ],
    "日常"
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
    desc: "战绩收益最高，但你把时间给了对手，不是队友。",
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
      <button class="primary-btn" data-next-week>${state.actionsLeft > 0 ? "跳过剩余行动" : "进入下一段"}</button>
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

  return `满天加入以后，一切都变得更容易，也更危险。

你脑子里的配球终于有人能执行。问题是，那个人不是一台机器。他会发热，会沉默，会因为你接住他的球而继续想投。`;
}

function takeAction(id) {
  if (state.actionsLeft <= 0) return;
  const action = actions.find((item) => item.id === id);
  if (!action) return;

  changeStats(action.delta);
  if (action.flag) state.flags[action.flag] = true;
  if (action.flags) action.flags.forEach(addFlag);
  state.actionsLeft -= 1;
  state.log = action.log;
  saveState();
  render();
}

function advanceFromManage() {
  if (state.week === 1) {
    state.screen = "game";
    state.phase = "first-game";
  } else if (state.week === 3) {
    state.week = 4;
    state.actionsLeft = 2;
    state.phase = "week4";
    state.log = "满天在训练后把球递给你，问：下一场，我可以多投一点吗？";
  } else if (state.week === 4) {
    if (state.flags.rayReportOverTraining && !state.flags.rayReportLateNightSeen) {
      state.screen = "event";
      state.phase = "report-late-night";
    } else {
      goToFinalOrWarning();
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
  } else {
    renderFinalGame();
  }
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
    changeStats({ record: 5, morale: 5 });
    text = "球被打成二垒方向的滚地。你们守住了这一局。比赛还是输了，但不是毫无内容。";
  } else if (choice === "risk") {
    if (state.stats.record >= 35) {
      changeStats({ record: 12, morale: 3 });
      addFlag("rayRiskyCallSuccess");
      text = "内角球压进来。打者挥空。投手回头看你，像是第一次发现自己还能做到这种事。";
    } else {
      changeStats({ record: -5, morale: -5 });
      addFlag("rayPlanExecutionFailed");
      text = "球偏了半颗。三棒把它打穿。你的方案没错，执行的人撑不住。";
    }
  } else {
    changeStats({ record: -3, morale: 3 });
    text = "你保送了三棒。四棒没有浪费这个礼物。至少队员们看懂了你在计算什么。";
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
    text = "你没有收手。满天投出了你想要的球，一颗接一颗，像所有暗号终于找到了身体。峡光赢了。满天的手指在赛后很久都没有停止发抖。";
  } else if (choice === "soft") {
    changeStats({ record: 10, sync: 6, load: 25, self: 5 });
    addFlag("rayLimitedMTPitchMix");
    text = "你把配球削到更简单。满天有些困惑，但还是执行了。峡光守住胜利，你知道自己还可以做得更细。";
  } else if (choice === "bench") {
    changeStats({ record: -8, load: -20, self: -3, morale: 2, sync: -5 });
    addFlag("rayDecidedForMTBody");
    text = "你换下了满天。替补投手丢了分，比赛输了。满天坐在你旁边，低声问：我刚才不能投了吗？";
  } else {
    const selfGain = state.flags.askedMT || state.flags.restedMT ? 22 : 12;
    changeStats({ record: 5, sync: 8, load: 10, self: selfGain });
    state.flags.askedMT = true;
    addFlag("mtAskedOnMound");
    text = "你走上投手丘。满天等着你的暗号。你问他：你现在想怎么投？他愣了一下，第一次认真检查自己的手、呼吸和脚下的土。";
  }

  state.flags.finalGameDone = true;
  if (choice === "bench") {
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
  if (state.screen === "manage") renderManage();
  if (state.screen === "game") renderGame();
  if (state.screen === "result") renderResult();
  if (state.screen === "ending") renderEnding();
}

render();
