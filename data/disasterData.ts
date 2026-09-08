import { DisasterTracker } from '@/lib/types';

// ================= 全球特大灾害持续追踪专题档案库 =================
export const GYIRONG_PORT_DISASTER_TRACKER: DisasterTracker = {
  id: "TRK-GYIRONG-PORT-2026",
  disasterName: "中尼吉隆口岸跨境特大冰岩崩泥石流与保通重建",
  location: "中国西藏日喀则吉隆口岸热索中尼边境段",
  startDate: "2026年8月26日",
  trackedDays: 14,
  currentStage: "FEASIBILITY_REBUILD",
  stageLabel: "阶段 4/5 · 抢险搜救与选址防灾论证",
  currentProgressPercent: 75,
  status: "ONGOING",
  conclusionCondition: "以吉隆口岸全面完成工程抢修与抗灾重构、正式恢复双向通关运营并发布官方灾害善后结案通报为终结节点",
  nextWatchMilestone: "国家应急管理部失联搜救阶段性总结，以及国家口岸办关于吉隆口岸抗灾加固与异地迁建防灾科学论证方案发布",
  latestUpdateDate: "9月8日 11:30",
  latestUpdateSummary: "武警工兵连续爆破打通陆路抢险便道，重装机械深入核心区搜救；双向货运大范围改道樟木口岸，国家与地方专家组展开口岸选址抗灾论证。",
  timeline: [
    {
      date: "8月26日",
      time: "14:00",
      stage: "IMPACT_OUTBREAK",
      stageName: "突发冲击",
      title: "境外高位冰岩崩诱发跨境特大泥石流，冲毁热索桥通关全面阻断",
      description: "受气候变暖影响，尼泊尔境内朗当雪山北坡突发特大冰岩崩，剧烈势能带动高位冰碛物转化为泥石流越境倾泻，直接冲垮热索桥及边防口岸核心区设施，致人员失联与通关全面中断。国家应急管理部与西藏自治区启动一级响应。",
      isCompleted: true
    },
    {
      date: "9月3日",
      time: "18:00",
      stage: "RESCUE_CLEARING",
      stageName: "抢险抢通",
      title: "武警工兵连续定向爆破开山，陆路抢险便道全线打通",
      description: "针对峡谷巨石堆积与边坡塌方阻断道路，武警工兵抢险分队克服高寒缺氧连续实施多次定向控制爆破，成功打通挺进口岸核心损毁区的应急抢险便道，大型挖掘机、生命探测仪与救援物资全面进场。",
      isCompleted: true
    },
    {
      date: "9月8日",
      time: "11:30",
      stage: "DIVERSION_RELIEF",
      stageName: "搜救分流",
      title: "救援力量展开拉网式搜救，跨境陆路公路货运紧急分流至樟木口岸",
      description: "军地多方搜救力量沿峡谷及河道全力搜寻失联人员并设立家属联络热线；为保障中尼双边经贸通道运转，海关与边检部门启动应急保通机制，引导滞留货运卡车大范围改道樟木口岸通关，部分物资转走海运。",
      isCompleted: true
    },
    {
      date: "9月8日",
      time: "14:00",
      stage: "FEASIBILITY_REBUILD",
      stageName: "选址论证",
      title: "国家口岸办与工程专家组进驻现场，启动原址防灾加固与选址论证",
      description: "国家口岸办会同自然资源部及地质专家组进驻核心灾区，鉴于喜马拉雅高位冰川失稳频发，全面评估口岸热索原址工程防护冗余极限，同步开展口岸异地选址与防灾搬迁可行性科学论证。",
      isCompleted: false,
      isCurrent: true
    },
    {
      date: "待达成",
      time: "终结哨点",
      stage: "CONCLUDED_RESTORED",
      stageName: "恢复通关",
      title: "口岸工程抢修竣工、恢复双向通关运营并发布善后结案通报",
      description: "【系统终结观察哨判定条件】：当吉隆口岸完成防灾工程重构、边检验放设施全面恢复运营并恢复双向通关，且官方正式发布善后处置与调查结案通报后，本终端方将该事件移入历史归档。",
      isCompleted: false,
      isCurrent: false
    }
  ]
};
