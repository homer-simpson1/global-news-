/**
 * 全球决策情报终端 · 核心涉事主体/企业业务概况档案库与知识图谱系统
 * (Enterprise Profile & Business Brief Registry)
 * 
 * 核心设计目标：
 * 当新闻报道涉及某家科技、半导体、大模型或宏观企业（如燧原、沐曦、摩尔线程、长鑫存储、中芯国际等）时，
 * 为用户提供干脆利落的【涉事主体速览 / 核心业务概况】，交代“这家公司是谁、做什么、处在产业链什么位置”，
 * 彻底解决“为什么不简单介绍这家公司”的痛点，杜绝空洞标题复读与机械免责套话。
 */

export interface CompanyProfile {
  name: string;            // 主体规范全称 / 通用名称（如 "燧原科技"）
  aliases: string[];       // 别名与检索触发词（如 ["燧原", "Enflame"]）
  sector: string;          // 核心赛道（如 "AI算力芯片 / 云端智算"）
  description: string;     // 核心业务定位与主营产品概况
  marketRole?: string;     // 产业链地位与生态角色
  coreProducts?: string[]; // 核心产品/技术代际
}

// ─────────────────────────────────────────────────────────────
// 1. 重点硬核科技 / 半导体 / 大模型 / 宏观产业主体精选图谱库
// ─────────────────────────────────────────────────────────────
export const CURATED_COMPANY_PROFILES: CompanyProfile[] = [
  // ── 国产AI算力与GPU领军梯队 ──
  {
    name: '燧原科技',
    aliases: ['燧原', 'Enflame', '燧原智能'],
    sector: 'AI算力芯片 / 云端智算',
    description: '国内专注云端AI训练与推理算力芯片的领军企业，研发云燧/邃思系列智算硬件，腾讯为其核心战略投资方与生态客户。',
    marketRole: '云端训推一体AI芯片核心供应商，主打自主知识产权架构与国产智算中心全栈适配。',
    coreProducts: ['云燧T系列训练加速卡', '云燧i系列推理加速卡', '邃思架构芯片', 'TopsRider软件栈'],
  },
  {
    name: '沐曦集成电路',
    aliases: ['沐曦', 'MetaX', '沐曦科技'],
    sector: '通用GPU / 高性能计算',
    description: '国内聚焦全栈高性能通用GPU芯片领军企业，核心产品涵盖AI推理、通用算力及图形渲染芯片，赋能千亿参数大模型训推。',
    marketRole: '国产全栈通用GPU核心研发商，主打异构计算平台与智算中心集群交付。',
    coreProducts: ['曦思N系列AI推理GPU', '曦云C系列通用算力GPU', '曦彩G系列图形渲染GPU', 'MXMACA软件栈'],
  },
  {
    name: '摩尔线程',
    aliases: ['摩尔线程', 'Moore Threads'],
    sector: '全功能GPU / 智算集群',
    description: '国内全功能GPU研发商，自主研发MUSA统一系统架构，覆盖AI智算加速、3D图形渲染、超高清视频处理及物理仿真。',
    marketRole: '国产全功能GPU代表厂商，以MUSA架构打造万卡智算集群与端云一体生态。',
    coreProducts: ['夸娥万卡智算集群', '苏堤/春晓GPU核心', 'MTT S系列加速卡', 'MUSIFY工具链'],
  },
  {
    name: '壁仞科技',
    aliases: ['壁仞', 'Biren', '壁仞智能'],
    sector: '高端通用算力GPU',
    description: '国内高端通用算力芯片领军企业，自研BR100系列通用GPU架构，专注云端大模型大算力训练与高吞吐推理。',
    marketRole: '对标国际旗舰算力卡的国产通用GPU设计商，专注数据中心高算力密度集群。',
    coreProducts: ['BR100通用GPU', 'BR104计算芯片', 'BIRENSUPA软件生态平台'],
  },
  {
    name: '寒武纪',
    aliases: ['寒武纪', 'Cambricon', '中科寒武纪'],
    sector: '通用AI芯片 / 智算系统',
    description: '国内专注通用AI芯片与智能计算集群的科创板上市公司，中科院计算所背景，自研思元系列云端AI加速卡。',
    marketRole: '国产AI芯片第一股，提供端云一体智能处理器与大规模智能计算集群系统。',
    coreProducts: ['思元MLU系列云端加速卡', '玄思智算集群系统', 'Cambricon Neuware软件开发平台'],
  },
  {
    name: '天数智芯',
    aliases: ['天数智芯', 'Iluvatar CoreX'],
    sector: '通用云端GPU芯片',
    description: '国内首家实现云端通用GPU芯片量产交付的企业，主打天垓训练芯片与智铠推理芯片。',
    marketRole: '专注于通用GPU软硬件全栈研发与商用规模化落地的核心供应商。',
    coreProducts: ['天垓100通用GPU训练卡', '智铠100通用GPU推理卡'],
  },
  {
    name: '昆仑芯',
    aliases: ['昆仑芯', '百度昆仑', 'Kunlunxin'],
    sector: '云端AI算力芯片',
    description: '前身为百度智能芯片及架构部，专注于打造高性价比、全功能云端AI芯片，已在金融、工业、互联网大模型集群规模化部署。',
    marketRole: '百度AI生态全栈硬件基石，大模型训推一体核心加速芯片提供商。',
    coreProducts: ['昆仑芯2代AI加速卡', '昆仑芯3代架构', 'XPU全栈软件工具包'],
  },
  {
    name: '地平线',
    aliases: ['地平线', 'Horizon Robotics', '地平线机器人'],
    sector: '智能汽车计算方案 / 车规AI芯片',
    description: '行业领先的乘用车高级辅助驾驶（ADAS）和高阶自动驾驶计算方案提供商，自主研发征程系列智驾芯片与BPU架构。',
    marketRole: '国内前装量产出货量最大的智能汽车计算芯片方案商，连接车企与智驾软件生态。',
    coreProducts: ['征程5高算力计算芯片', '征程6系列芯片', 'BPU智能计算架构'],
  },
  {
    name: '黑芝麻智能',
    aliases: ['黑芝麻智能', '黑芝麻', 'Black Sesame'],
    sector: '车规级高算力SoC芯片',
    description: '行业领先的车规级智能汽车计算SoC及基于SoC的解决方案供应商，专注自动驾驶与跨域计算芯片研发。',
    marketRole: '港股车规芯片第一股，主打华山系列高算力自动驾驶与武当系列跨域计算芯片。',
    coreProducts: ['华山A1000系列SoC', '武当C1200跨域计算芯片'],
  },
  {
    name: '芯原股份',
    aliases: ['芯原股份', '芯原', 'VeriSilicon'],
    sector: '芯片设计平台即服务 / 半导体IP',
    description: '国内领先的芯片设计平台即服务（SiPaaS）提供商，拥有自主可控的NPU、GPU、VPU、DSP等六类核心处理器IP。',
    marketRole: '国内IP种类最全的半导体IP与芯片定制设计龙头，赋能海内外芯片系统客户。',
    coreProducts: ['自主微纳NPU IP', 'Chiplet互连架构', '一站式芯片定制服务'],
  },
  {
    name: '海思半导体 / 华为',
    aliases: ['海思', '华为海思', '华为', '昇腾', '鲲鹏', 'Huawei'],
    sector: '全栈ICT / 半导体与智算底盘',
    description: '全球领先的半导体与ICT基础设施领军企业，自主研发昇腾AI芯片、鲲鹏通用CPU及麒麟移动终端芯片，构建全栈自主计算底座。',
    marketRole: '国内最具生态号召力的全栈自研计算底座构建者，CANN异构计算与MindSpore框架主力。',
    coreProducts: ['昇腾910B/910C AI处理器', '鲲鹏920服务器CPU', '麒麟系列SoC', 'CANN异构计算架构'],
  },

  // ── 半导体晶圆制造 / IDM / 存储龙头 ──
  {
    name: '长鑫存储',
    aliases: ['长鑫', 'CXMT', '长鑫集电'],
    sector: 'DRAM内存芯片IDM制造',
    description: '中国大陆DRAM内存芯片IDM制造龙头，自主研发先进制程DRAM晶圆并量产DDR4/DDR5/LPDDR5芯片，推进高带宽内存（HBM）生态布局。',
    marketRole: '国内唯一的先进制程DRAM内存制造基地，打破海外存储巨头寡头垄断的关键战略支点。',
    coreProducts: ['DDR4/DDR5内存颗粒', 'LPDDR5低功耗内存', '定制化高带宽内存方案'],
  },
  {
    name: '长江存储',
    aliases: ['长江存储', '长存', 'YMTC'],
    sector: '3D NAND闪存IDM制造',
    description: '中国大陆3D NAND闪存芯片IDM制造龙头，自研Xtacking晶栈架构，量产先进制程三维闪存颗粒。',
    marketRole: '全球3D NAND存储重要技术革新者，以Xtacking技术确立国产存储自主微缩路径。',
    coreProducts: ['Xtacking晶栈架构NAND颗粒', '致态（ZhiTai）消费级SSD', '企业级固态硬盘'],
  },
  {
    name: '兆易创新',
    aliases: ['兆易创新', '兆易', 'GigaDevice'],
    sector: '存储器 / MCU微控制器',
    description: '国内领先的Fabless芯片设计企业，主营业务涵盖NOR Flash、NAND Flash存储器、微控制器（MCU）与模拟传感器。',
    marketRole: '全球NOR Flash市场前三，国内32位通用MCU出货量绝对龙头。',
    coreProducts: ['SPI NOR Flash', 'GD32系列通用MCU', '指纹识别芯片'],
  },
  {
    name: '韦尔股份 / 豪威科技',
    aliases: ['韦尔股份', '韦尔', '豪威科技', 'OmniVision'],
    sector: 'CIS图像传感器 / 半导体设计',
    description: '全球排名前三的CIS图像传感器芯片龙头，产品广泛应用于智能手机、智能汽车、医疗影像与安防监控领域。',
    marketRole: '中国最具规模的半导体设计平台之一，车规CIS市占率位居全球领先地位。',
    coreProducts: ['高阶手机CIS传感器', '车规级OX系列图像传感器', '电源管理IC'],
  },
  {
    name: '中芯国际',
    aliases: ['中芯国际', '中芯', 'SMIC'],
    sector: '晶圆代工制造龙头',
    description: '中国大陆规模最大、技术最先进的晶圆代工制造龙头，提供0.35微米至先进制程晶圆代工及配套封测服务。',
    marketRole: '大陆半导体制造的基石代工厂，支撑国内芯片设计公司从设计到流片交付全流程。',
    coreProducts: ['先进/成熟逻辑制程代工', '特种工艺晶圆制造', '中芯南方/北方晶圆厂群'],
  },
  {
    name: '华虹半导体',
    aliases: ['华虹半导体', '华虹宏力', '华虹', 'Hua Hong'],
    sector: '特色工艺晶圆代工巨头',
    description: '中国大陆领先的特色工艺晶圆代工巨头，主攻功率半导体、嵌入式非易失性存储器、模拟芯片及电源管理IC。',
    marketRole: '全球特色工艺代工领军者，汽车电子与工业级功率器件关键制造平台。',
    coreProducts: ['8英寸/12英寸特色工艺晶圆', 'IGBT与MOSFET代工', '嵌入式闪存工艺'],
  },

  // ── 关键半导体核心零组件 / 设备 / 接口 ──
  {
    name: '澜起科技',
    aliases: ['澜起科技', '澜起', 'Montage'],
    sector: '内存接口芯片 / 服务器互联',
    description: '全球内存接口芯片龙头，主打DDR5/DDR4内存接口与津逮服务器CPU平台，深度布局PCIe Retimer与CXL内存扩展芯片。',
    marketRole: '全球三大内存接口芯片供应商之一，掌握JEDEC国际标准制定权的高壁垒互联芯片龙头。',
    coreProducts: ['DDR5 RCD/DB接口芯片', 'PCIe 5.0 Retimer', 'CXL内存扩展控制器', '津逮CPU'],
  },
  {
    name: '龙芯中科',
    aliases: ['龙芯中科', '龙芯', 'Loongson'],
    sector: '通用处理器 / 自主指令集',
    description: '基于自主指令系统LoongArch的通用CPU芯片龙头，产品覆盖通用计算、工业控制与关键基础信息底座。',
    marketRole: '国内完全自主指令系统微处理器先行者，构建独立于Wintel和AA体系的第三套自主生态。',
    coreProducts: ['龙芯3A6000通用CPU', '龙芯3C5000服务器处理器', 'LoongArch自主指令架构'],
  },
  {
    name: '北方华创',
    aliases: ['北方华创', 'NAURA'],
    sector: '半导体前道工艺装备龙头',
    description: '国内半导体前道工艺装备龙头，业务覆盖等离子体刻蚀、薄膜沉积（PVD/CVD/ALD）、清洗与热处理等核心制程设备。',
    marketRole: '国内半导体装备产品线最全的平台型龙头，晶圆厂扩产国产替代主力供应商。',
    coreProducts: ['等离子体刻蚀机', '薄膜沉积设备', '立式炉', '单片清洗机'],
  },
  {
    name: '中微公司',
    aliases: ['中微公司', '中微半导体', '中微', 'AMEC'],
    sector: '先进制程刻蚀设备龙头',
    description: '国内先进制程等离子体刻蚀设备龙头，自研介质刻蚀机与MOCVD设备进入国际头部先进制程晶圆生产线。',
    marketRole: '国产高深宽比刻蚀与先进制程装备核心代表，突破海外垄断关键力量。',
    coreProducts: ['CCP/ICP等离子体刻蚀机', 'MOCVD设备', 'ALD薄膜设备'],
  },
  {
    name: '拓荆科技',
    aliases: ['拓荆科技', '拓荆'],
    sector: '半导体薄膜沉积设备领军',
    description: '国内半导体薄膜沉积设备领军企业，专注PECVD、ALD、SACVD等先进制程核心薄膜设备与键合设备。',
    marketRole: '国内薄膜沉积设备市占率第一梯队，先进制程晶圆厂核心扩产标配。',
    coreProducts: ['PECVD设备', 'ALD薄膜设备', '晶圆级3D集成键合设备'],
  },
  {
    name: '盛美上海',
    aliases: ['盛美上海', '盛美半导体', 'ACM Research'],
    sector: '半导体清洗与湿法设备龙头',
    description: '专注于半导体前道单晶圆及槽式湿法清洗设备、电镀设备、无应力抛光设备和立式炉管设备研发制造。',
    marketRole: '国内半导体清洗设备领军者，以SAPS/TEBO兆声波清洗技术服务全球主流晶圆厂。',
    coreProducts: ['单晶圆清洗机', '槽式清洗机', '前道电镀铜设备'],
  },
  {
    name: '华大九天',
    aliases: ['华大九天', 'Empyrean'],
    sector: 'EDA电子设计自动化软件龙头',
    description: '国内领先的EDA工具软件与集成电路设计服务商，业务覆盖模拟电路设计全流程EDA、数字电路设计及晶圆制造EDA。',
    marketRole: '中国本土规模最大、技术实力最强的EDA龙头企业，筑牢芯片底层设计软件根基。',
    coreProducts: ['模拟电路设计全流程EDA', '平板显示电路设计EDA', '存储电路设计工具'],
  },

  // ── 全球科技与半导体领军巨头 ──
  {
    name: '英伟达',
    aliases: ['英伟达', 'NVIDIA', 'Nvidia', 'NVDA'],
    sector: 'AI计算平台 / GPU垄断巨头',
    description: '全球GPU与AI加速计算领跑垄断巨头，主导CUDA异构计算生态与Hopper/Blackwell架构智算系统，掌控全球AI算力供给中枢。',
    marketRole: '全球AI算力生态统治级霸主，软硬一体全栈算力网络绝对核心。',
    coreProducts: ['H100/H200/B200 GPU', 'GB200 NVL72超算集群', 'CUDA并行计算架构'],
  },
  {
    name: '台积电',
    aliases: ['台积电', 'TSMC', '台湾积体电路'],
    sector: '纯晶圆代工制造垄断龙头',
    description: '全球最大先进制程纯晶圆代工龙头，垄断全球3nm/2nm等前沿制程代工产能，英伟达、苹果、AMD核心代工厂。',
    marketRole: '全球芯片制造中枢，CoWoS先进制程封装垄断提供商。',
    coreProducts: ['3nm/2nm先进制程代工', 'CoWoS先进封装', '全定制晶圆制造服务'],
  },
  {
    name: 'ASML',
    aliases: ['ASML', '阿斯麦', '艾司摩尔'],
    sector: '高端光刻机设备独家垄断商',
    description: '全球唯一先进制程极紫外（EUV）与高端深紫外（DUV）光刻机设备供应商，半导体物理微缩制造的绝对喉咙节点。',
    marketRole: '全球半导体制造母机独家垄断者，决定先进制程晶圆产能上限。',
    coreProducts: ['High-NA EUV光刻机', '标准EUV光刻机', 'Twinscan浸没式DUV光刻机'],
  },
  {
    name: 'AMD',
    aliases: ['AMD', '超威半导体', '超微'],
    sector: '高性能计算 / GPU与CPU',
    description: '全球高性能计算与GPU/CPU芯片龙头，研发MI300/MI325系列AI加速器及EPYC服务器处理器，直面英伟达竞争。',
    marketRole: '全球少数兼具高端x86 CPU与高端通用GPU设计能力的科技巨头。',
    coreProducts: ['Instinct MI300/MI325系列AI加速器', 'EPYC服务器CPU', 'ROCm开放软件栈'],
  },
  {
    name: '英特尔',
    aliases: ['英特尔', 'Intel', 'INTC'],
    sector: '通用CPU / 半导体IDM制造巨头',
    description: '全球半导体与计算机x86架构奠基者，主导全球PC与服务器处理器市场，推进Intel 18A先进制程晶圆代工代工转型。',
    marketRole: '全球计算基础设施骨干支柱，兼具顶级芯片设计与前沿晶圆制造能力的IDM巨擘。',
    coreProducts: ['至强Xeon服务器CPU', '酷睿Ultra移动处理器', 'Gaudi 3 AI加速器', 'Intel 18A制程代工'],
  },
  {
    name: '高通',
    aliases: ['高通', 'Qualcomm', 'QCOM', '骁龙'],
    sector: '移动SoC / 无线通信基带霸主',
    description: '全球移动通信芯片与智能终端SoC领导者，自研骁龙系列处理器、自研Oryon CPU架构与5G/6G基带芯片。',
    marketRole: '全球智能手机与端侧AI算力主导供应商，掌握全球无线通信底层核心专利。',
    coreProducts: ['骁龙8至尊版移动平台', '骁龙X Elite PC芯片', '5G调制解调器及射频系统'],
  },
  {
    name: '博通',
    aliases: ['博通', 'Broadcom', 'AVGO'],
    sector: '网络互联芯片 / 定制AI ASIC巨头',
    description: '全球数据中心网络交换芯片与高速互联芯片绝对龙头，为谷歌、Meta等定制开发下一代AI加速ASIC芯片。',
    marketRole: '全球AI智算网络交换核心（Tomahawk/Jericho）垄断者，大型云厂商定制AI硬件合伙人。',
    coreProducts: ['Tomahawk系列以太网交换芯片', '定制云端AI ASIC', 'PCIe Switch互联芯片'],
  },
  {
    name: '美光科技',
    aliases: ['美光', 'Micron', '美光科技'],
    sector: 'DRAM与NAND存储巨头',
    description: '全球前三DRAM与NAND闪存制造商，HBM3E高带宽内存主要供应商，深度参与英伟达AI加速卡供应链。',
    marketRole: '全球存储器三巨头之一，高带宽内存（HBM）核心供应商。',
    coreProducts: ['HBM3E内存模块', 'DDR5/LPDDR5芯片', '先进制程NAND固态硬盘'],
  },
  {
    name: 'SK海力士',
    aliases: ['SK海力士', 'SK Hynix', '海力士'],
    sector: '存储器巨头 / HBM绝对先锋',
    description: '全球顶尖存储芯片制造商，高带宽内存（HBM）市场份额绝对领先者，英伟达AI芯片HBM核心一级供应商。',
    marketRole: '全球HBM高带宽内存市占率第一，先进制程DRAM领军企业。',
    coreProducts: ['HBM3/HBM3E高带宽内存', '1cnm先进制程DRAM', '4D NAND闪存'],
  },
  {
    name: '三星电子',
    aliases: ['三星电子', '三星', 'Samsung'],
    sector: '半导体综合IDM / 消费电子巨头',
    description: '全球最大存储芯片制造商与全产业链IDM龙头，业务横跨DRAM、NAND、晶圆代工制造与智能移动终端。',
    marketRole: '全球存储制造规模最大巨头，拥有全栈自主垂直整合能力。',
    coreProducts: ['DRAM/NAND存储颗粒', 'Exynos处理器', '先进制程代工产线'],
  },
  {
    name: '苹果',
    aliases: ['苹果', 'Apple', 'AAPL'],
    sector: '消费电子 / 软硬协同自研芯片巨擘',
    description: '全球顶尖消费电子与操作系统巨头，自研M系列Mac芯片与A系列iPhone芯片，构建封闭而强大的软硬件生态护城河。',
    marketRole: '全球先进制程晶圆最大采购客户之一，引领端侧个人智能系统落地。',
    coreProducts: ['M4/M3系列自研芯片', 'A18 Pro移动芯片', 'Apple Intelligence生态平台'],
  },
  {
    name: 'OpenAI',
    aliases: ['OpenAI', '奥特曼', 'ChatGPT'],
    sector: 'AGI大模型 / 前沿人工智能领军者',
    description: '全球前沿人工智能研发机构与AGI开拓者，研发GPT-4o、o1思维链推理大模型与Sora生成式视频模型。',
    marketRole: '全球AI浪潮风向标，推动大模型从单模态向全模态、强逻辑推理系统跃迁。',
    coreProducts: ['GPT-4o / GPT-5', 'o1推理模型', 'ChatGPT平台', 'Sora视频生成模型'],
  },
  {
    name: '微软',
    aliases: ['微软', 'Microsoft', 'MSFT', 'Azure'],
    sector: '全球云计算与软件巨头 / AI算力平台',
    description: '全球顶级软件与公有云服务巨擘，重金战略投资OpenAI，将AI能力深度整合入Azure智算云与Copilot生产力矩阵。',
    marketRole: '全球企业级云计算二强之一，全球最大的商业AI应用部署平台。',
    coreProducts: ['Azure AI智算云', 'Microsoft 365 Copilot', '自研Maia AI芯片'],
  },
  {
    name: '特斯拉',
    aliases: ['特斯拉', 'Tesla', 'TSLA', '马斯克'],
    sector: '智能电动整车 / 端到端自动驾驶与智算',
    description: '全球领先智能电动汽车与清洁能源巨头，自主研发端到端神经网络FSD（Full Self-Driving）与Dojo超算中心。',
    marketRole: '全球智能出行与端到端具身智能标杆，全球最大规模自研智驾算力消耗方之一。',
    coreProducts: ['FSD全自动驾驶系统', 'Optimus具身人形机器人', '4680电池与Cybertruck'],
  },

  // ── 国内互联网大厂与智算云平台 ──
  {
    name: '腾讯',
    aliases: ['腾讯', '腾讯控股', '腾讯云', 'Tencent'],
    sector: '互联网巨头 / 云计算与大模型',
    description: '全球头部互联网科技巨头与云计算服务商，布局腾讯云自研沧海/玄灵/紫霄芯片，燧原科技核心战略股东与大模型智算采购主力。',
    marketRole: '全栈智算基础设施投资方与算力大客户，深度赋能混元大模型与产业互联网。',
    coreProducts: ['混元大模型', '腾讯云智算中心', '自研沧海/玄灵/紫霄芯片'],
  },
  {
    name: '阿里巴巴 / 阿里云',
    aliases: ['阿里', '阿里巴巴', '阿里云', '平头哥', '达摩院', 'Alibaba'],
    sector: '云计算 / AI大模型与自研芯片',
    description: '全球领先云计算与人工智能服务商，旗下平头哥自研倚天710 ARM服务器芯片与含光800 AI推理芯片，深度部署通义千问智算集群。',
    marketRole: '国内公有云与开源大模型领头羊，以通义千问与飞天算力底盘构筑生态。',
    coreProducts: ['通义千问系列大模型', '倚天710服务器芯片', '平头哥玄铁RISC-V处理器'],
  },
  {
    name: '百度',
    aliases: ['百度', 'Baidu', '百度智能云'],
    sector: '人工智能 / 自动驾驶与搜索',
    description: '国内领先人工智能平台型巨头，自研昆仑芯AI加速芯片与文心一言大模型，提供软硬一体智能云算力底座。',
    marketRole: '国内AI全栈自研技术积累最深厚的科技巨头之一，主打文心大模型与萝卜快跑自动驾驶。',
    coreProducts: ['文心一言大模型', '昆仑芯系列AI芯片', 'Apollo自动驾驶平台'],
  },
  {
    name: '字节跳动',
    aliases: ['字节跳动', '字节', 'ByteDance'],
    sector: '数字内容 / AI大模型与算力集群',
    description: '全球头部内容分发与人工智能科技企业，深度部署豆包大模型智算集群，布局自研云端AI推理工控芯片与异构智算网络。',
    marketRole: '国内AI推理算力消耗与落地规模最大的互联网巨头之一，以豆包大模型驱动海量应用。',
    coreProducts: ['豆包大模型', '火山引擎智算平台', '飞书协作平台'],
  },

  // ── 新能源 / 先进制造 / 资本中介 ──
  {
    name: '宁德时代',
    aliases: ['宁德时代', 'CATL'],
    sector: '动力电池 / 储能系统绝对龙头',
    description: '全球动力电池与储能系统绝对龙头，研发麒麟电池与神行超充电池，构建全球动力电池生态。',
    marketRole: '全球动力电池市占率连续多年蝉联第一，全球新能源交通关键动力底座。',
    coreProducts: ['麒麟电池', '神行超充电池', '天恒储能系统'],
  },
  {
    name: '比亚迪',
    aliases: ['比亚迪', 'BYD'],
    sector: '新能源整车 / 动力电池IDM',
    description: '全球新能源汽车与动力电池IDM领军企业，自研车规级IGBT/SiC功率半导体与刀片电池全产业链。',
    marketRole: '全球新能源汽车销量冠军，具备三电与车规级半导体垂直整合壁垒。',
    coreProducts: ['刀片电池', 'DM-i超级混动', '易四方技术平台', '车规级SiC芯片'],
  },
  {
    name: '中金公司',
    aliases: ['中金公司', '中金', 'CICC'],
    sector: '头部投资银行 / 综合金融中介',
    description: '国内头部投资银行与综合金融服务商，主导科创板先锋硬科技与半导体企业IPO保荐承销，参与头部券商战略集约整合。',
    marketRole: '硬科技与半导体企业资本化国家队保荐机构，连接产业实体与多层次资本市场。',
    coreProducts: ['科创板IPO保荐承销', '跨境并购重组', '机构资产管理'],
  },
];

// ─────────────────────────────────────────────────────────────
// 2. 智能检索与动态背景合成引擎 (Dynamic Profile Synthesis)
// ─────────────────────────────────────────────────────────────

/**
 * 政府机关、司法、监管部门及公共事业单位排除黑名单（严禁将其误识别为企业主体！）
 */
const GOVERNMENT_OR_PUBLIC_ENTITY_REGEX = /(?:部|局|署|院|委|厅|办|所|会|府|台|关|警|队|盟|联|党委|纪检|监察|检察|法院|公安|交警|应急|消防|海关|税务|医保|统计|防总|网信|金融监管|银保监|证监|保监|中纪委|国资委|央行|联储|五角大楼|白宫|国会|军|司令部|国务院|发改委|工信部|商务部|财政部|外交部|教育部|科技部|住建部|交通部|人社部|文旅部|自然资源部|卫健委|退役军人部|生态环境部|农业农村部|市委|省委|县委|管委会|街道|社区|协会|中心)$/;

/**
 * 常见非企业名称（产品词、事件词、地理词、通用概念词）
 */
const NON_COMPANY_NOUNS_REGEX = /(?:机器人|芯片|大模型|应用|系统|平台|项目|标准|数据|指南|规范|计划|方案|政策|通知|报告|规划|创新药|疫苗|车型|电池|手机|手机壳|算法|模型|设备|工程|基站|网络|口岸|边境|干线|灾害|暴雨|山洪|泥石流|事故|地震)$/;

/**
 * 从文本中精确查找或动态推断涉事企业主体业务概况
 */
export function getCompanyProfileForNews(title: string, content?: string): CompanyProfile | null {
  const cleanTitle = (title || '').replace(/^[【\[][^】\]]+[】\]]/, '').trim();
  const combined = `${cleanTitle} ${content || ''}`.trim();
  if (!combined) return null;

  // 1. 优先在精选图谱库中匹配别名与规范名（最精准）
  for (const profile of CURATED_COMPANY_PROFILES) {
    if (profile.aliases.some((alias) => combined.includes(alias))) {
      return profile;
    }
  }

  // 2. 若未命中静态库，智能探测未收录的科技/半导体/上市主体并动态合成背景
  const detected = detectUncuratedCompany(cleanTitle, combined);
  if (detected) {
    return detected;
  }

  return null;
}

/**
 * 针对未列入静态库的涉事企业进行模式探测与智能背景合成
 */
function detectUncuratedCompany(title: string, fullText: string): CompanyProfile | null {
  // 模式 A: 必须包含明确企业身份指示词（如 "AI芯片公司燧原", "存储芯片龙头长鑫", "GPU厂商摩尔线程", "芯片企业瀚博"）
  const explicitCompanyMatch = title.match(
    /(?:AI芯片|算力芯片|GPU|CPU|半导体|芯片|存储|大模型|具身智能|机器人|晶圆代工|自动驾驶|新能源|动力电池|造车)?\s*(?:公司|厂商|龙头|企业|独角兽|品牌|设计商|供应商|集成商|造车新势力)\s*([A-Za-z\u4e00-\u9fa5]{2,10})/
  );

  // 模式 B: 标准带企业组织形式法定后缀的企业名（如 "某某科技"、"某某半导体"、"某某微电子"、"某某软件"、"某某股份"）
  const corporateSuffixMatch = title.match(
    /([A-Z\u4e00-\u9fa5]{2,8}(?:半导体|集成电路|微电子|软件|网络|动力|制药|药业|重工|能源|股份|智算|计算|微|电子|精密|电工|光电|新材料|生物科技|科技))/
  );

  let targetName = '';
  let industryHint = '';

  if (explicitCompanyMatch && explicitCompanyMatch[1]) {
    const cand = explicitCompanyMatch[1].trim();
    // 截断动词等后续无用内容（如 "燧原上市" -> "燧原"）
    const verbCut = cand.match(/^([A-Za-z\u4e00-\u9fa5]{2,6}?)(?:上市|开盘|IPO|发布|量产|获批|完成|入局|反超|增资|挂牌|停牌|暴涨|大跌)/);
    targetName = verbCut ? verbCut[1] : cand;
  } else if (corporateSuffixMatch && corporateSuffixMatch[1]) {
    targetName = corporateSuffixMatch[1].trim();
  }

  if (!targetName || targetName.length < 2 || targetName.length > 10) {
    return null;
  }

  // 严正红线：排除政府机关、司法机构、军警、公共部门
  if (GOVERNMENT_OR_PUBLIC_ENTITY_REGEX.test(targetName)) {
    return null;
  }

  // 严正红线：排除非企业实体、通用产品、自然灾害、地理位置词
  if (NON_COMPANY_NOUNS_REGEX.test(targetName)) {
    return null;
  }

  // 排除通用无主体指称的虚词/修饰词
  if (
    /^(?:新一代|首款|首个|全新|多款|多项|一批|各类|最新|重大|相关|全国|全球|国内|国际|部分|中国|美国|欧洲|日本|中央|国务院|发改委|商务部|财政部|央行|联储|政府|法院|公安)/.test(
      targetName
    )
  ) {
    return null;
  }

  // 推断行业与赛道
  let sector = '硬核科技 / 先进制造';
  let desc = `专注于前沿技术研发与产业落地的行业主体，积极推进核心自主创新与商业化应用。`;

  if (/芯片|算力|gpu|cpu|半导体|晶圆|微电子|光刻|封装|流片|存储/i.test(fullText) || /芯片|算力|半导体/i.test(industryHint)) {
    sector = '芯片与半导体硬件';
    desc = `深耕半导体与集成电路产业链的关键创新企业，核心业务覆盖芯片架构研发、软硬件协同适配与规模化量产交付。`;
  } else if (/大模型|ai|算法|人工智能|推理|智能体|agent|文生/i.test(fullText) || /大模型|ai/i.test(industryHint)) {
    sector = '前沿人工智能与算法生态';
    desc = `聚焦人工智能核心算法架构与垂直场景模型落地，致力提升大模型推理吞吐能力与产业智能化渗透率。`;
  } else if (/电池|储能|新能源|电动车|光伏|锂电/i.test(fullText)) {
    sector = '新能源与绿色制造';
    desc = `专注新能源关键设备研发与产业化制造的行业核心主体，持续优化产品能量密度、转换效率与供应链韧性。`;
  } else if (/医药|生物|创新药|医疗器械|临床|靶点/i.test(fullText)) {
    sector = '生物医药与生命健康';
    desc = `致力于创新药物与核心医疗器械临床研发的医药创新企业，依托自主专利管线加速全球化商业化推进。`;
  } else if (/券商|证券|银行|保险|基金|金融|期货/i.test(fullText)) {
    sector = '综合金融与资本市场服务';
    desc = `提供全方位投资银行、资本中介与财富管理服务的专业金融实体，服务实体经济多层次直接融资。`;
  }

  return {
    name: targetName,
    aliases: [targetName],
    sector,
    description: desc,
    marketRole: `细分行业重要参与方，依托技术壁垒与商业落地构筑核心竞争优势。`,
  };
}

/**
 * 格式化企业速览小标签
 */
export function formatCompanyProfileBadge(profile: CompanyProfile): string {
  return `【${profile.name}速览 · ${profile.sector}】：${profile.description}`;
}
