/* 情景口袋实验室：任务元数据。每个任务均以零数据合成模式作为默认入口。 */
(function () {
  window.SCENARIOS = [
    {
      id: 's1', code: 'S1', icon: 'S1', name: '伪装之谜',
      title: '迷彩服与植被光谱反射特性对比分析', layer: '认知层',
      capability: '理解遥感为何能看到目标', color: '#0f766e', difficulty: '入门',
      summary: '用公开文献拟合的合成曲线，对比健康、干枯、针叶植被与季节迷彩的可见光、近红外和短波红外响应。',
      scene: '迷彩服为什么要设计成植被相关的颜色？这是地物波谱响应规律在材料设计中的直观体现。',
      related: '概念演示·地物波谱身份证',
      zeroData: 'numpy 生成 400–2500 nm 的植被、雪原、裸土和近似迷彩曲线。',
      realData: '可选接入 USGS Spectral Library v7 或 NASA ECOSTRESS 光谱库；军用实测波谱不在本实验范围内。',
      pipeline: ['生成或读取光谱', '按 VIS / NIR / SWIR 分段', '计算 MAE / RMSE', '叠加上传曲线（可选）', '形成解释报告'],
      outputs: ['S1-Fig1 光谱对比图', 'S1-Fig2 核心匹配图', 's1_camouflage_similarity.csv', 's1_report_template.md'],
      prompt: {
        low: '用通俗语言解释为什么迷彩服常使用绿褐色，以及近红外反射率为什么重要。',
        mid: '请写一份结构化分析，包含可见光、近红外、季节差异、波谱证据和实验局限。',
        high: '请以遥感教材风格写一篇约600字的伪装光谱科普文，明确区分公开拟合曲线与真实测量数据。'
      }
    },
    {
      id: 's2', code: 'S2', icon: 'S2', name: '天眼识阵',
      title: '公开影像目标识别与标注', layer: '信息层',
      capability: '从影像中提取目标', color: '#2563eb', difficulty: '进阶',
      summary: '从合成航拍场景开始，练习人工框选、类别统计和判读依据，再按需扩展到公开目标检测数据集。',
      scene: '面对一幅陌生影像，先用可解释的人工判读建立目标清单，再比较自动检测结果。',
      related: '编程实验·图像判读标志 / 目标检测',
      zeroData: '浏览器生成 640×480 合成航拍风格场景，包含可辨认的道路、建筑、水体和规则目标。',
      realData: '可选使用 DIOR、DOTA 等公开数据集；仅做教学标注与模型评估。',
      pipeline: ['生成合成场景', '人工框选与类别标注', '统计目标数量', '可选调用 YOLOv8', '生成侦察简报'],
      outputs: ['s2_annotated_scene.png', 'target_list.csv', 's2_report_template.md'],
      prompt: {
        low: '根据目标类别和数量，用通俗语言描述一幅遥感影像的判读结果。',
        mid: '生成结构化目标识别简报，包含判读依据、目标数量、置信度和待核查项。',
        high: '以遥感解译课程报告风格，比较人工判读与自动检测的差异，并讨论误检漏检来源。'
      }
    },
    {
      id: 's3', code: 'S3', icon: 'S3', name: '汛期守望',
      title: '灾后洪涝范围评估', layer: '决策层',
      capability: '评估地表变化', color: '#0284c7', difficulty: '进阶',
      summary: '用前后双时相影像提取水体，生成新增水体、稳定水体与退水区域的变化矩阵。',
      scene: '把灾前与灾后影像放在一起比较，回答“哪里新增了水体、影响面积有多大”。',
      related: '编程实验·变化检测 / 概念演示·变化检测',
      zeroData: '浏览器构造 72×60 双时相多波段教学网格，模拟水体扩张和局部退水。',
      realData: '可选使用公开 Sentinel-1 或 Sentinel-2 双时相样例，不依赖商业灾情数据。',
      pipeline: ['读取双时相影像', '自动或手动阈值分割', '计算三分类差分', '统计新增水体面积', '生成灾情简报'],
      outputs: ['flood_change_matrix.png', 'damage_report.csv', 's3_report_template.md'],
      prompt: {
        low: '解释前后两幅影像如何帮助我们识别新增水体。',
        mid: '输出包含方法、阈值、变化矩阵、面积估算和不确定性说明的洪涝评估报告。',
        high: '以灾害遥感评估报告风格撰写结果，比较 SAR 与光学数据的适用条件和局限。'
      }
    },
    {
      id: 's4', code: 'S4', icon: 'S4', name: '坐标锁定',
      title: '基于 GCP 的二维仿射定位教学', layer: '几何层',
      capability: '赋予精确地理坐标', color: '#7c3aed', difficulty: '进阶',
      summary: '用控制点和最小二乘法估计仿射变换，把影像中的点击位置转换为可复核的地理坐标。',
      scene: '目标只有落在地图坐标系中，才能被复核、量测和继续规划。',
      related: '概念演示·几何校正（GCP）/ 摄影成像与投影差',
      zeroData: '浏览器生成带已知坐标变换的教学控制点，离线完成二维拟合。',
      realData: '当前版本未接入 GeoTIFF / DEM；可在后续版本增加公开数据适配。',
      pipeline: ['生成教学控制点', '添加或删除 GCP', '最小二乘拟合仿射变换', '计算训练残差 RMSE', '输入目标像素并换算坐标'],
      outputs: ['geocoded_scene.png', 'gcp_distribution.png', 'raster_rms.csv', 'target_point_coord.json'],
      prompt: {
        low: '解释控制点、坐标变换和 RMS 误差分别是什么。',
        mid: '生成一份包含拟合参数、RMS、目标坐标和精度分析的定位报告。',
        high: '以摄影测量实验报告风格，分析控制点数量、空间分布和 DEM 误差对定位结果的影响。'
      }
    },
    {
      id: 's5', code: 'S5', icon: 'S5', name: '铁翼巡域',
      title: '无人机区域巡检航线规划', layer: '规划层',
      capability: '规划覆盖任务', color: '#b45309', difficulty: '挑战',
      summary: '在合成障碍与代价栅格上复用 A*，将多个任务点组织成一条可解释、可导出的巡检路线。',
      scene: '从“能到达”走向“怎样更合理地覆盖多个任务点”，把路径搜索与任务排序连接起来。',
      related: '编程实验·无人机路径规划（A*）',
      zeroData: '浏览器生成 28×20 抽象障碍栅格、代价场和多个教学任务点。',
      realData: '当前仅支持抽象合成网格，不接入真实地理位置或导航数据。',
      pipeline: ['生成抽象代价栅格', '拖动教学任务点', '运行网格 A* 路径搜索', '用最近邻或 2-opt 优化访问顺序', '导出抽象路线统计'],
      outputs: ['grid_route.png', 'grid_route.csv', 'grid_route.json'],
      prompt: {
        low: '用通俗语言说明 A* 如何在有障碍的地图上寻找一条路线。',
        mid: '输出包含栅格代价、任务顺序、总距离和路线风险说明的规划报告。',
        high: '以路径规划课程作业风格比较贪心、2-opt 与不同代价权重对巡检路线的影响。'
      }
    },
    {
      id: 's6', code: 'S6', icon: 'S6', name: '融合精读',
      title: '多源遥感协同判读与专题制图', layer: '综合层',
      capability: '协同多源信息', color: '#be185d', difficulty: '综合',
      summary: '比较 Brovey、IHS 和 PCA 三种融合方法，用质量指标和专题图支持最终判读结论。',
      scene: '综合任务不是把结果简单叠加，而是让空间细节、光谱信息和专题表达互相校验。',
      related: '编程实验·图像融合 / 概念演示·融合权重',
      zeroData: '生成 PAN 高空间分辨率影像与 MS 多波段低空间分辨率影像，完整跑通融合流程。',
      realData: '可选使用公开 GF-2、WorldView-2 样例或 SEN12MS 数据集。',
      pipeline: ['生成 PAN 与 MS 教学影像', '执行 Brovey / IHS / PCA', '计算 RMSE / SAM / UIQI', '生成融合与差异图', '输出判读报告'],
      outputs: ['fusion_comparison.png', 'quality_metrics.csv', 'thematic_maps/', 's6_report_template.md'],
      prompt: {
        low: '解释为什么要把高空间分辨率和多光谱信息结合起来。',
        mid: '生成包含算法比较、质量指标、专题图解读和选型理由的融合报告。',
        high: '以遥感图像分析课程大作业风格，讨论融合质量、视觉效果与专题判读之间的权衡。'
      }
    }
  ];
}());
