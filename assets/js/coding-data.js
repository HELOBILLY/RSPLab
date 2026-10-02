/* 编程口袋实验室 —— 实验教程数据（输入数据 / 处理步骤 / 可运行代码 / 参考资源） */
window.CODING = [
/* ============ A. 遥感图像处理基础实验 ============ */
{
  id: 'gray', group: 'base', icon: '灰', title: '灰度值处理：直方图与点运算增强',
  level: '入门', time: '1学时',
  goal: '掌握遥感影像灰度直方图的统计方法，实现2%线性拉伸与直方图均衡化两种点运算增强，理解"灰度映射"的本质。',
  data: '任意一幅灰度影像（JPG/PNG/TIF均可，手机照片转灰度也行）。代码内置程序生成的一幅低对比度"航空影像"，无数据也能直接运行。',
  env: 'pip install numpy matplotlib pillow',
  steps: [
    '读取影像并转为灰度数组（0—255整数）；',
    '统计灰度直方图：每个灰度级的像元个数；',
    '2%线性拉伸：取累积直方图2%与98%处的灰度值作为新范围，线性映射到0—255；',
    '直方图均衡化：用累积分布函数（CDF）构造映射表；',
    '并排显示原图、拉伸、均衡化结果及各自直方图，对比效果。'
  ],
  code: `import numpy as np
import matplotlib.pyplot as plt
from PIL import Image

# ---- 1. 读取影像（无数据时用程序生成的测试影像）----
try:
    img = np.array(Image.open('your_image.jpg').convert('L'), dtype=float)
except FileNotFoundError:
    x, y = np.meshgrid(np.arange(128), np.arange(128))
    img = 100 + 20*np.sin(x/8) + 15*np.cos(y/6) + np.random.randn(128, 128)*8
    img = np.clip(img, 0, 255)

# ---- 2. 直方图 ----
hist, _ = np.histogram(img.ravel(), bins=256, range=(0, 256))

# ---- 3. 2%线性拉伸 ----
cdf = np.cumsum(hist) / img.size
lo = np.searchsorted(cdf, 0.02); hi = np.searchsorted(cdf, 0.98)
stretch = np.clip((img - lo) / (hi - lo) * 255, 0, 255)

# ---- 4. 直方图均衡化 ----
lut = np.round((cdf - cdf[cdf > 0].min()) / (1 - cdf[cdf > 0].min()) * 255)
equalized = lut[img.astype(int)]

# ---- 5. 显示对比 ----
fig, ax = plt.subplots(2, 3, figsize=(13, 7))
for j, (im, t) in enumerate([(img, '原始'), (stretch, '2%线性拉伸'), (equalized, '均衡化')]):
    ax[0, j].imshow(im, cmap='gray', vmin=0, vmax=255); ax[0, j].set_title(t)
    ax[1, j].hist(im.ravel(), bins=64, range=(0, 256)); ax[1, j].set_title(t + '直方图')
plt.tight_layout(); plt.savefig('gray_result.png', dpi=120); plt.show()`,
  refs: [
    ['Pillow 官方文档', 'https://pillow.readthedocs.io/', '影像读写与格式转换'],
    ['GDAL 中文教程', 'https://gdal.org/', '处理GeoTIFF等带坐标的遥感影像时用gdal读取'],
  ],
  think: '把2%改成0%（普通拉伸）和5%，观察效果差异——为什么遥感影像常用2%截断？（提示： outliers与传感器异常值）'
},
{
  id: 'ndvi-calc', group: 'base', icon: 'N', title: 'NDVI计算：波段运算入门',
  level: '入门', time: '1学时',
  goal: '掌握遥感波段运算的基本流程：读取多波段数据、逐像元计算NDVI、阈值分割与伪彩色制图。',
  data: '红光与近红外两个单波段影像。真实数据：USGS EarthExplorer 免费下载 Landsat 8 影像的 B4（红）与 B5（近红外）波段（GeoTIFF）。代码内置模拟数据，可直接运行。',
  env: 'pip install numpy matplotlib pillow（真实GeoTIFF数据再加 pip install rasterio）',
  steps: [
    '分别读取红波段（Red）与近红外波段（NIR）为浮点数组；',
    '逐像元计算 NDVI = (NIR − Red) / (NIR + Red)，注意除零保护；',
    '阈值分割：NDVI > 0.4 判为植被覆盖区；',
    '伪彩色显示NDVI（蓝→黄→绿渐变），统计植被覆盖率；',
    '（选做）用rasterio读取真实Landsat波段重复上述流程。'
  ],
  code: `import numpy as np
import matplotlib.pyplot as plt

# ---- 1. 读取两个波段（无数据时用模拟数据）----
try:
    import rasterio
    with rasterio.open('B4_red.tif') as f: red = f.read(1).astype(float)
    with rasterio.open('B5_nir.tif') as f: nir = f.read(1).astype(float)
except Exception:
    x, y = np.meshgrid(np.linspace(0, 6, 256), np.linspace(0, 6, 256))
    veg = (np.sin(x) * np.cos(y) > 0.2)  # 模拟植被区
    red = np.where(veg, 0.05, 0.25) + np.random.rand(256, 256) * 0.02
    nir = np.where(veg, 0.50, 0.26) + np.random.rand(256, 256) * 0.02

# ---- 2. NDVI（除零保护）----
ndvi = (nir - red) / (nir + red + 1e-6)

# ---- 3. 阈值分割与统计 ----
veg_mask = ndvi > 0.4
cover = veg_mask.mean() * 100
print(f'植被覆盖率: {cover:.1f}%')

# ---- 4. 显示 ----
fig, ax = plt.subplots(1, 3, figsize=(13, 4))
ax[0].imshow(red, cmap='Reds'); ax[0].set_title('红波段')
ax[1].imshow(nir, cmap='gray'); ax[1].set_title('近红外波段')
im = ax[2].imshow(ndvi, cmap='RdYlGn', vmin=-1, vmax=1)
ax[2].set_title(f'NDVI（植被覆盖率{cover:.1f}%）')
fig.colorbar(im, ax=ax[2])
plt.tight_layout(); plt.savefig('ndvi_result.png', dpi=120); plt.show()`,
  refs: [
    ['USGS EarthExplorer', 'https://earthexplorer.usgs.gov/', '免费下载Landsat系列卫星影像'],
    ['rasterio', 'https://github.com/rasterio/rasterio', 'Python读写GeoTIFF的标准库'],
  ],
  think: '把阈值0.4改为0.2和0.6，植被覆盖率如何变化？实际业务中阈值应如何确定？（提示：结合地面调查样本）'
},
{
  id: 'fusion-calc', group: 'base', icon: '融', title: '图像融合：Brovey变换',
  level: '入门', time: '1学时',
  goal: '实现最经典的Brovey变换融合：把全色影像的空间细节注入多光谱影像，理解"强度调制"思想。',
  data: '一幅高分辨率全色灰度影像（PAN）+ 一幅低分辨率彩色多光谱影像（MS）。代码内置程序生成的模拟数据（清晰灰度 + 模糊彩色），可直接运行。',
  env: 'pip install numpy matplotlib pillow',
  steps: [
    '读取PAN（H×W）与MS（h×w×3），把MS上采样到PAN尺寸；',
    '计算MS的强度分量 I = (R+G+B)/3；',
    'Brovey变换：融合结果 = MS × PAN / I（逐波段调制）；',
    '裁剪到0—255并显示：PAN、MS、融合结果三方对比；',
    '观察：颜色来自MS，边缘细节来自PAN。'
  ],
  code: `import numpy as np
import matplotlib.pyplot as plt
from PIL import Image

# ---- 1. 准备数据（无数据时程序生成）----
try:
    pan = np.array(Image.open('pan.tif').convert('L'), dtype=float)
    ms = np.array(Image.open('ms.tif').convert('RGB'), dtype=float)
except FileNotFoundError:
    x, y = np.meshgrid(np.arange(192), np.arange(192))
    detail = 25*np.sin(x/2.2)*np.cos(y/1.8) + np.random.randn(192, 192)*8
    base = 120 + 40*np.sin(x/40)
    pan = np.clip(base + detail, 0, 255)                       # 高清灰度
    ms_small = np.zeros((64, 64, 3))
    ms_small[..., 0] = 150 + 60*np.sin(x[::3, ::3]/30)         # 低清彩色
    ms_small[..., 1] = 110 + 50*np.cos(y[::3, ::3]/25)
    ms_small[..., 2] = 90
    ms = np.array(Image.fromarray(ms_small.astype('uint8')).resize((192, 192)), dtype=float)

# ---- 2. MS上采样到PAN尺寸（若尺寸不同）----
if ms.shape[:2] != pan.shape:
    ms = np.array(Image.fromarray(ms.astype('uint8')).resize((pan.shape[1], pan.shape[0])), dtype=float)

# ---- 3. Brovey变换 ----
intensity = ms.mean(axis=2) + 1e-6
fused = np.clip(ms * (pan / intensity)[..., None], 0, 255).astype('uint8')

# ---- 4. 显示 ----
fig, ax = plt.subplots(1, 3, figsize=(13, 4.5))
ax[0].imshow(pan, cmap='gray'); ax[0].set_title('全色PAN：清晰·灰度')
ax[1].imshow(ms.astype('uint8')); ax[1].set_title('多光谱MS：模糊·彩色')
ax[2].imshow(fused); ax[2].set_title('Brovey融合：既清晰又多彩')
plt.tight_layout(); plt.savefig('fusion_result.png', dpi=120); plt.show()`,
  refs: [
    ['OpenCV 文档', 'https://docs.opencv.org/', '更高效的影像读写与重采样'],
    ['pansharpening 工具箱', 'https://github.com/codecanaan/pansharpening', '更多融合算法（GS、IHS、PCA）参考实现'],
  ],
  think: 'Brovey变换会让颜色轻微失真（为什么？）。查阅资料了解IHS变换融合如何避免这个问题。'
},
{
  id: 'smooth', group: 'base', icon: '滑', title: '平滑滤波：去噪与邻域运算',
  level: '入门', time: '1学时',
  goal: '理解邻域运算（卷积）的概念，实现均值、高斯、中值三种平滑滤波，对比它们对不同类型噪声的效果。',
  data: '任意一幅影像。代码内置测试影像并自动叠加椒盐噪声与高斯噪声，可直接运行。',
  env: 'pip install numpy matplotlib pillow scipy',
  steps: [
    '读取影像，分别叠加椒盐噪声（5%像元）与高斯噪声（σ=15）；',
    '均值滤波：3×3邻域取平均——所有邻域点等权；',
    '高斯滤波：3×3高斯核——中心权重大、边缘权重小；',
    '中值滤波：3×3邻域取中位数——非线性运算；',
    '对比四种结果：哪种噪声被哪种滤波器克制？'
  ],
  code: `import numpy as np
import matplotlib.pyplot as plt
from scipy.ndimage import uniform_filter, gaussian_filter, median_filter

# ---- 1. 测试影像 + 两种噪声 ----
x, y = np.meshgrid(np.arange(160), np.arange(160))
img = 128 + 60*np.sin(x/12) * np.cos(y/10)
img[(x-80)**2 + (y-60)**2 < 500] = 220  # 亮目标
salt = img.copy()
m = np.random.rand(160, 160)
salt[m < 0.05] = 0; salt[m > 0.95] = 255            # 椒盐噪声
gauss = img + np.random.randn(160, 160) * 15        # 高斯噪声

# ---- 2. 三种平滑 ----
def compare(noisy, title):
    fig, ax = plt.subplots(1, 4, figsize=(14, 3.6))
    results = [('含噪图像', noisy),
               ('均值滤波', uniform_filter(noisy, 3)),
               ('高斯滤波', gaussian_filter(noisy, 1)),
               ('中值滤波', median_filter(noisy, 3))]
    for a, (t, im) in zip(ax, results):
        a.imshow(im, cmap='gray', vmin=0, vmax=255); a.set_title(t); a.axis('off')
    fig.suptitle(title)
    plt.tight_layout(); plt.savefig(title + '.png', dpi=120); plt.show()

compare(salt, '椒盐噪声')
compare(gauss, '高斯噪声')`,
  refs: [
    ['scipy.ndimage', 'https://docs.scipy.org/doc/scipy/reference/ndimage.html', '多维图像滤波函数库'],
    ['OpenCV 滤波教程', 'https://docs.opencv.org/4.x/d4/d13/tutorial_py_filtering.html', 'cv2.blur / GaussianBlur / medianBlur'],
  ],
  think: '为什么中值滤波对椒盐噪声特别有效，而均值滤波不行？（提示：中位数不受极端值影响）'
},
{
  id: 'sharpen', group: 'base', icon: '锐', title: '锐化：边缘增强与USM',
  level: '入门', time: '1学时',
  goal: '理解锐化=增强高频分量，实现拉普拉斯锐化与USM（反锐化掩模）两种方法，体会"原图−平滑=细节"的思想。',
  data: '任意一幅影像（建议含道路、建筑等边缘）。代码内置测试影像，可直接运行。',
  env: 'pip install numpy matplotlib pillow scipy',
  steps: [
    '读取影像；',
    '拉普拉斯锐化：用4邻域拉普拉斯核提取边缘，原图减去边缘响应（增强突变）；',
    'USM锐化：细节 = 原图 − 高斯平滑图；锐化 = 原图 + k×细节；',
    '调节k（0.2—2.0）观察增强强度；',
    '对比两种方法：USM更可控，是Photoshop"USM锐化"的同款算法。'
  ],
  code: `import numpy as np
import matplotlib.pyplot as plt
from scipy.ndimage import convolve, gaussian_filter

# ---- 1. 测试影像 ----
x, y = np.meshgrid(np.arange(160), np.arange(160))
img = 128 + 60*np.sin(x/12)*np.cos(y/10)
img[(x-80)**2 + (y-60)**2 < 500] = 220
img = img + np.random.randn(160, 160) * 4  # 轻微噪声

# ---- 2. 拉普拉斯锐化 ----
lap = np.array([[0, 1, 0], [1, -4, 1], [0, 1, 0]])
edge = convolve(img, lap)
sharp1 = img - 0.4 * edge

# ---- 3. USM锐化：原图 + k×(原图−平滑) ----
k = 1.0
detail = img - gaussian_filter(img, 2)
sharp2 = img + k * detail

# ---- 4. 显示 ----
fig, ax = plt.subplots(1, 3, figsize=(13, 4))
for a, (t, im) in zip(ax, [('原图', img), ('拉普拉斯锐化', sharp1), (f'USM锐化 k={k}', sharp2)]):
    a.imshow(im, cmap='gray', vmin=0, vmax=255); a.set_title(t); a.axis('off')
plt.tight_layout(); plt.savefig('sharpen_result.png', dpi=120); plt.show()`,
  refs: [
    ['OpenCV 图像梯度教程', 'https://docs.opencv.org/4.x/d5/d0f/tutorial_py_gradients.html', 'Sobel/Scharr/Laplacian算子'],
  ],
  think: '把k调到2.0以上，图像出现什么现象（边缘"白边"）？这就是过度锐化的振铃效应。'
},
{
  id: 'kmeans', group: 'base', icon: '聚', title: 'K-means聚类：非监督分类入门',
  level: '入门', time: '1学时',
  goal: '理解非监督分类"不要样本、自动聚类"的思想：手写K-means的"分配—更新"迭代，对模拟多光谱影像完成聚类制图，体会"簇≠地物类别"。',
  data: '任意多光谱影像（两个波段即可演示）。代码内置程序生成的4类地物（水体/植被/土壤/建筑）两波段模拟影像，无数据也能直接运行。',
  env: 'pip install numpy matplotlib（进阶对比再加 pip install scikit-learn）',
  steps: [
    '读取或构造多光谱影像：每个像元是一个特征向量（如红、近红外两个波段值）；',
    '随机初始化K个簇中心；',
    '分配：每个像元归入距离最近的簇中心；',
    '更新：簇中心移动到簇内像元的均值位置；',
    '重复"分配—更新"直至收敛；随机初始化多次、取总误差最小的一次（避免陷入局部最优）；',
    '聚类结果赋色制图，并按簇中心的光谱特征为每个簇赋予地物含义。'
  ],
  code: `import numpy as np
import matplotlib.pyplot as plt

# ---- 1. 构造模拟多光谱影像（4类地物 × 红/近红外两波段）----
np.random.seed(7)
H, W = 120, 120
yy, xx = np.mgrid[0:H, 0:W]
true = np.zeros((H, W), int)                        # 0水体 1植被 2土壤 3建筑
true[(xx - 30)**2 + (yy - 35)**2 < 26**2] = 1       # 植被（圆形地块）
true[(xx > 70) & (yy < 60)] = 2                     # 土壤（矩形地块）
true[(xx - 85)**2 + (yy - 88)**2 < 22**2] = 3       # 建筑（圆形地块）
means = {0: (30, 40), 1: (60, 170), 2: (120, 90), 3: (170, 160)}  # 各类(红,近红外)均值
img = np.zeros((H, W, 2))
for k, (mr, mn) in means.items():
    m = true == k
    img[..., 0][m] = mr + np.random.randn(m.sum()) * 8
    img[..., 1][m] = mn + np.random.randn(m.sum()) * 8

# ---- 2. K-means聚类（手写"分配—更新"迭代，多次初始化取最优）----
X = img.reshape(-1, 2)              # 每个像元一个二维特征向量
K = 4
best = None
for s in range(5):                  # 5次随机初始化，保留总误差最小的一次
    rng = np.random.default_rng(s)
    C = X[rng.choice(len(X), K, replace=False)]
    for it in range(30):
        d = ((X[:, None] - C[None]) ** 2).sum(-1)   # 到各簇中心的距离平方
        lab = d.argmin(1)                           # 分配：归入最近簇
        newC = np.array([X[lab == k].mean(0) if (lab == k).any() else C[k]
                         for k in range(K)])        # 更新：簇内均值
        if np.allclose(newC, C):
            break
        C = newC
    sse = ((X - C[lab]) ** 2).sum()                 # 本次聚类的总误差
    if best is None or sse < best[0]:
        best = (sse, C, lab)
_, centers, lab = best
print('簇中心(红, 近红外)：', np.round(centers, 1))

# ---- 3. 为簇赋予地物含义（按簇中心近红外均值排序）----
order = np.argsort(centers[:, 1])
names = ['水体', '土壤', '建筑/亮地物', '植被']     # 近红外从低到高
for i, k in enumerate(order):
    print(f'  簇{k} → {names[i]}')

# ---- 4. 结果显示 ----
fig, ax = plt.subplots(1, 3, figsize=(14, 4.5))
ax[0].imshow(img[..., 1], cmap='gray'); ax[0].set_title('近红外波段（模拟影像）')
ax[1].imshow(lab.reshape(H, W), cmap='tab10'); ax[1].set_title(f'K-means聚类结果（K={K}）')
ax[2].imshow(true, cmap='tab10'); ax[2].set_title('真实地物分布')
for a in ax: a.axis('off')
plt.tight_layout(); plt.savefig('kmeans_result.png', dpi=120); plt.show()

# 进阶：等价的一行调用（n_init就是"多次初始化取最优"）——
# from sklearn.cluster import KMeans
# lab = KMeans(n_clusters=4, n_init=10, random_state=0).fit_predict(X)`,
  refs: [
    ['scikit-learn KMeans 文档', 'https://scikit-learn.org/stable/modules/generated/sklearn.cluster.KMeans.html', '成熟实现：n_init多次初始化、random_state复现实验'],
    ['scikit-learn 聚类算法指南', 'https://scikit-learn.org/stable/modules/clustering.html', 'K-means与层次聚类、DBSCAN等方法对比'],
  ],
  think: '把K改成3和5再运行，观察簇的合并与分裂；再想想：做监督分类时，训练样本能不能先从K-means的簇里初选？（提示：聚类可辅助发现光谱纯净的区域）'
},

/* ============ B. 深度学习实验 ============ */
{
  id: 'scene-cls', group: 'dl', icon: '类', title: '场景分类：ResNet迁移学习',
  level: '进阶', time: '2学时',
  goal: '用预训练ResNet18对遥感场景图像做迁移学习，掌握深度学习"数据→模型→训练→评估"完整流程。',
  data: 'NWPU-RESISC45数据集（45类场景、31500张，含机场/港口/体育场等，官网申请下载）或UCMerced（21类、2100张，体积小适合课堂）。按 类名/图片.jpg 组织目录。',
  env: 'pip install torch torchvision timm（建议GPU；CPU可跑通小数据集演示）',
  steps: [
    '数据集按 8:2 划分训练/验证集，目录结构：data/train/类别/*.jpg；',
    '加载ImageNet预训练的ResNet18，替换最后全连接层为45类；',
    '训练：交叉熵损失 + Adam，10个epoch；',
    '验证集评估总体精度，画混淆矩阵；',
    '思考：哪些场景容易混淆（如"住宅"vs"密集住宅"）？为什么？'
  ],
  code: `import torch, timm
from torchvision import datasets, transforms
from torch.utils.data import DataLoader

tf = transforms.Compose([transforms.Resize((224, 224)), transforms.ToTensor()])
train = datasets.ImageFolder('data/train', tf)
val = datasets.ImageFolder('data/val', tf)
tl = DataLoader(train, 32, shuffle=True); vl = DataLoader(val, 64)

model = timm.create_model('resnet18', pretrained=True, num_classes=len(train.classes)).cuda()
opt = torch.optim.Adam(model.parameters(), lr=1e-4)
lossf = torch.nn.CrossEntropyLoss()

for epoch in range(10):
    model.train()
    for x, y in tl:
        opt.zero_grad()
        loss = lossf(model(x.cuda()), y.cuda())
        loss.backward(); opt.step()
    # 验证
    model.eval(); ok = tot = 0
    with torch.no_grad():
        for x, y in vl:
            ok += (model(x.cuda()).argmax(1) == y.cuda()).sum().item(); tot += len(y)
    print(f'epoch {epoch}: val acc = {ok/tot:.3f}')`,
  refs: [
    ['NWPU-RESISC45 数据集', 'https://www.kaggle.com/datasets/nwpu-resisc45', '45类遥感场景分类基准（Kaggle镜像）'],
    ['timm 模型库', 'https://github.com/huggingface/pytorch-image-models', '预训练模型一行加载'],
    ['UCMerced 数据集', 'https://www.kaggle.com/datasets/chetankv/ucmerced-land-use-dataset', '21类小规模场景数据集，适合课堂'],
  ],
  think: '冻结backbone只训练分类头 vs 全网络微调，精度差多少？小数据集上哪种更稳？'
},
{
  id: 'seg', group: 'dl', icon: '割', title: '语义分割：U-Net逐像元分类',
  level: '进阶', time: '2学时',
  goal: '用U-Net对遥感影像做逐像元地物分类（建筑/道路/水体/植被…），理解编码器—解码器结构与mIoU评价。',
  data: 'LoveDA数据集（5987张0.3m影像，7类地物，GitHub直接下载）或ISPRS Vaihingen（官网申请）。数据为 影像png + 标签png（每像素值为类别号）。',
  env: 'pip install torch segmentation-models-pytorch albumentations',
  steps: [
    '读取影像与标签，裁剪为256×256小块；',
    '用segmentation_models_pytorch一行搭建U-Net（ResNet34编码器）；',
    '训练：交叉熵损失，数据增强（翻转/旋转）；',
    '验证集计算mIoU（每类交并比的平均）；',
    '把预测图与真值并排显示，分析错误区域。'
  ],
  code: `import torch, segmentation_models_pytorch as smp
from torch.utils.data import Dataset, DataLoader
from PIL import Image
import numpy as np

class SegData(Dataset):
    def __init__(self, pairs): self.pairs = pairs
    def __len__(self): return len(self.pairs)
    def __getitem__(self, i):
        img_p, lab_p = self.pairs[i]
        x = np.array(Image.open(img_p)).transpose(2, 0, 1) / 255.0
        y = np.array(Image.open(lab_p)).astype('int64')
        return torch.tensor(x, dtype=torch.float32), torch.tensor(y)

model = smp.Unet('resnet34', encoder_weights='imagenet', classes=7).cuda()
opt = torch.optim.Adam(model.parameters(), lr=1e-4)
lossf = smp.losses.DiceLoss('multiclass')  # 对类别不均衡更稳

# pairs = [('img/0001.png', 'lab/0001.png'), ...]
# loader = DataLoader(SegData(pairs), 8, shuffle=True)
# for x, y in loader: 训练同场景分类`,
  refs: [
    ['LoveDA 数据集', 'https://github.com/Junjue-Wang/LoveDA', '城市场景语义分割基准，含下载与评测'],
    ['segmentation_models.pytorch', 'https://github.com/qubvel-org/segmentation_models.pytorch', 'U-Net/DeepLab等模型开箱即用'],
    ['ISPRS Vaihingen', 'https://www.isprs.org/education/benchmarks/UrbanSemLab/default.aspx', '经典机载语义分割数据'],
  ],
  think: '类别不均衡（植被多、车辆少）时mIoU会被哪类拖累？试试DiceLoss与加权交叉熵的差异。'
},
{
  id: 'det', group: 'dl', icon: '检', title: '目标检测：YOLO检测遥感目标',
  level: '进阶', time: '2学时',
  goal: '用YOLOv8检测遥感影像中的飞机、舰船、车辆等目标，掌握"标注格式转换→训练→评估"的目标检测流水线。',
  data: 'DIOR数据集（23463张、20类目标，水平框，官网下载）或DOTA（2806张大图、15类、旋转框）。课堂建议用DIOR的YOLO格式子集。',
  env: 'pip install ultralytics（自动依赖torch）',
  steps: [
    '把标注转换为YOLO格式：每张图一个txt，每行 class cx cy w h（归一化）；',
    '编写data.yaml：类别名与训练/验证路径；',
    '一行命令训练：yolo train model=yolov8n.pt data=data.yaml epochs=50；',
    '验证：yolo val 查看mAP50；',
    '推理一张大图：观察小目标（车辆）漏检情况，思考切片推理（SAHI）。'
  ],
  code: `# data.yaml 示例
# path: ./dior  train: images/train  val: images/val
# names: [plane, ship, vehicle, ...]

from ultralytics import YOLO

model = YOLO('yolov8n.pt')          # 预训练权重
model.train(data='data.yaml', epochs=50, imgsz=640)
model.val()
model.predict('test_big_image.jpg', save=True)  # 结果存 runs/detect/predict

# 大图切片推理（小目标必备）：
# pip install sahi
# from sahi.predict import get_sliced_prediction`,
  refs: [
    ['ultralytics', 'https://github.com/ultralytics/ultralytics', 'YOLOv8/YOLO11官方实现，文档完善'],
    ['DOTA 数据集与评测', 'https://github.com/CAPTAIN-WHU/DOTA', '旋转框检测基准'],
    ['SAHI 切片推理', 'https://github.com/obss/sahi', '大幅面遥感影像小目标检测利器'],
    ['mmrotate', 'https://github.com/open-mmlab/mmrotate', '旋转框检测算法库（进阶）'],
  ],
  think: '遥感影像动辄上万像素，直接缩放到640会发生什么？切片（滑窗）推理为什么能救回小目标？'
},
{
  id: 'cd', group: 'dl', icon: '变', title: '深度学习变化检测：孪生网络',
  level: '进阶', time: '2学时',
  goal: '用孪生（Siamese）网络对比双时相影像，自动输出变化图，理解"特征差值+上采样"的变化检测范式。',
  data: 'LEVIR-CD数据集（637对1024×1024双时相影像，建筑变化标注，官网/GitHub下载）。目录：A（前时相）/B（后时相）/label（变化掩膜）。',
  env: 'pip install torch segmentation-models-pytorch',
  steps: [
    '双时相影像裁剪为256×256小块对；',
    '孪生编码器：同一骨干网络分别提取A、B特征；',
    '特征差（或拼接）后接解码器，输出变化概率图；',
    '训练：DiceLoss/加权交叉熵（变化像元占比少）；',
    '评估F1分数，与模块6"逐像元比较"的传统方法对比。'
  ],
  code: `import torch, segmentation_models_pytorch as smp

# 思路：把 A、B 在通道维拼接成 6 通道输入（最简单有效的基线）
model = smp.Unet('resnet34', encoder_weights='imagenet',
                 in_channels=6, classes=1).cuda()
opt = torch.optim.Adam(model.parameters(), lr=1e-4)
lossf = smp.losses.DiceLoss('binary')

# for (xa, xb), y in loader:
#     x = torch.cat([xa, xb], dim=1)      # 6通道
#     pred = model(x).squeeze(1)
#     loss = lossf(pred.sigmoid(), y.float())
#     ...反向传播同前

# 评估：F1 = 2PR/(P+R)，变化检测最常用指标`,
  refs: [
    ['LEVIR-CD 数据集', 'https://justchenhao.github.io/LEVIR/', '建筑变化检测基准，含下载'],
    ['ChangeFormer', 'https://github.com/wgcban/ChangeFormer', 'Transformer变化检测代表作，代码完整'],
    ['OpenCD', 'https://github.com/likyoo/open-cd', '变化检测算法工具箱（进阶）'],
  ],
  think: '直接拼接6通道 vs 孪生结构共享权重，哪种更省显存？哪种对配准误差的鲁棒性更好？'
},
{
  id: 'uav-track', group: 'dl', icon: '踪', title: '无人机目标跟踪：检测+关联',
  level: '进阶', time: '2学时',
  goal: '掌握多目标跟踪的主流范式"检测+数据关联"：YOLO逐帧检测，ByteTrack跨帧关联，输出带ID的目标轨迹。',
  data: 'VisDrone无人机视频数据集（96段视频、10类目标，官网下载）或自己用手机/无人机拍一段俯视视频。',
  env: 'pip install ultralytics（内置ByteTrack跟踪器）',
  steps: [
    '用YOLOv8对视频逐帧检测目标；',
    'ByteTrack关联：用运动预测（卡尔曼滤波）+外观匹配把相邻帧的同一目标连起来，赋予固定ID；',
    'ultralytics已集成：model.track(source=视频, tracker="bytetrack.yaml")；',
    '输出每帧目标框+ID，画轨迹线；',
    '观察遮挡后ID是否保持（ID switch问题）。'
  ],
  code: `from ultralytics import YOLO
import cv2

model = YOLO('yolov8n.pt')  # 可换VisDrone上微调的权重
cap = cv2.VideoCapture('uav_video.mp4')
trails = {}  # id -> 轨迹点列表

while cap.isOpened():
    ok, frame = cap.read()
    if not ok: break
    results = model.track(frame, persist=True, tracker='bytetrack.yaml')[0]
    if results.boxes.id is not None:
        for box, tid in zip(results.boxes.xyxy, results.boxes.id):
            x1, y1, x2, y2 = map(int, box)
            tid = int(tid)
            trails.setdefault(tid, []).append(((x1+x2)//2, (y1+y2)//2))
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(frame, f'ID{tid}', (x1, y1-4), 0, 0.6, (0, 255, 0), 2)
            for p in trails[tid][-30:]:
                cv2.circle(frame, p, 2, (255, 128, 0), -1)
    cv2.imshow('track', frame); cv2.waitKey(1)`,
  refs: [
    ['VisDrone 数据集', 'https://github.com/VisDrone/VisDrone-Dataset', '无人机视角检测/跟踪基准'],
    ['ByteTrack', 'https://github.com/FoundationVision/ByteTrack', '多目标跟踪代表作'],
    ['ultralytics track 文档', 'https://docs.ultralytics.com/modes/track/', '一行代码跑跟踪'],
  ],
  think: '目标被遮挡几秒后重新出现，ID为什么会变？ReID外观特征能怎么帮忙？'
},
{
  id: 'uav-path', group: 'dl', icon: '航', title: '无人机路径规划：A*搜索',
  level: '进阶', time: '2学时',
  goal: '在栅格化地图上实现A*路径搜索，加入威胁区代价，理解"代价函数设计"对路径形态的影响。本实验完全自包含，无需外部数据。',
  data: '程序生成的栅格地图（障碍区+威胁区），代码内置，直接运行。进阶可用真实DEM/地物分类图替换。',
  env: 'pip install numpy matplotlib',
  steps: [
    '把任务区栅格化：0=可飞，1=障碍（禁飞），威胁区附加穿越代价；',
    'A*搜索：开放列表按 f = g + h 排序，g为已走代价，h为到终点的启发（欧氏距离）；',
    '威胁代价：进入威胁区的格子 g 额外加权；',
    '输出路径并可视化：对比"无威胁代价"与"有威胁代价"两条路径；',
    '思考：权重调大会怎样？（绕得更远但更安全）'
  ],
  code: `import numpy as np, heapq
import matplotlib.pyplot as plt

# ---- 1. 地图：0可飞 1障碍；threat为威胁代价 ----
N = 40
grid = np.zeros((N, N))
grid[12:26, 18:22] = 1                      # 障碍带
threat = np.zeros((N, N))
yy, xx = np.mgrid[0:N, 0:N]
threat[(xx-10)**2 + (yy-28)**2 < 64] = 5    # 圆形威胁区
start, goal = (2, 2), (N-3, N-3)

def astar(grid, threat, w=0.0):
    open_ = [(0, start)]; g = {start: 0}; came = {}
    while open_:
        _, cur = heapq.heappop(open_)
        if cur == goal: break
        for dx, dy in [(1,0),(-1,0),(0,1),(0,-1),(1,1),(1,-1),(-1,1),(-1,-1)]:
            nx, ny = cur[0]+dx, cur[1]+dy
            if not (0 <= nx < N and 0 <= ny < N) or grid[nx, ny]: continue
            ng = g[cur] + np.hypot(dx, dy) * (1 + w * threat[nx, ny])
            if ng < g.get((nx, ny), 1e9):
                g[(nx, ny)] = ng
                came[(nx, ny)] = cur
                h = np.hypot(goal[0]-nx, goal[1]-ny)
                heapq.heappush(open_, (ng + h, (nx, ny)))
    path = [goal]
    while path[-1] != start: path.append(came[path[-1]])
    return path

p1 = astar(grid, threat, w=0.0)   # 无视威胁
p2 = astar(grid, threat, w=2.0)   # 绕开威胁区

fig, ax = plt.subplots(figsize=(6, 6))
ax.imshow(grid + threat/5, cmap='hot')
for p, c, t in [(p1, 'cyan', '无视威胁'), (p2, 'lime', '规避威胁')]:
    ax.plot([q[1] for q in p], [q[0] for q in p], c, lw=2, label=t)
ax.legend(); plt.savefig('path.png', dpi=120); plt.show()`,
  refs: [
    ['PythonRobotics', 'https://github.com/AtsushiSakai/PythonRobotics', 'A*/RRT/DWA等规划算法的Python实现'],
  ],
  think: '把威胁权重w从0调到5，路径如何演变？真实任务中威胁区代价如何标定（雷达探测概率模型）？'
},
{
  id: 'xview', group: 'dl', icon: '配', title: '图像跨视角匹配：无人机↔卫星',
  level: '进阶', time: '2学时',
  goal: '实现跨视角图像检索：给一张无人机拍摄的地面照片，在卫星影像库中找出同一地点——理解度量学习与对比损失。',
  data: 'University-1652数据集（1652栋建筑，每栋含卫星视角1张+无人机环绕视角多张，GitHub提供下载链接）。',
  env: 'pip install torch timm',
  steps: [
    '孪生网络：同一ResNet backbone分别提取无人机图与卫星图的特征向量；',
    '对比损失（InfoNCE）：同一地点的特征拉近，不同地点的推远；',
    '训练后：无人机图特征与整个卫星库特征算余弦相似度；',
    '评估Recall@1/Recall@5：正确地点是否排在最前；',
    '应用讨论：无GNSS环境下的无人机视觉定位。'
  ],
  code: `import torch, timm
import torch.nn.functional as F

backbone = timm.create_model('resnet18', pretrained=True, num_classes=512).cuda()
opt = torch.optim.Adam(backbone.parameters(), lr=1e-4)

def info_nce(f_uav, f_sat, tau=0.07):
    f_uav = F.normalize(f_uav, dim=1); f_sat = F.normalize(f_sat, dim=1)
    logits = f_uav @ f_sat.T / tau          # 相似度矩阵
    labels = torch.arange(len(f_uav)).cuda() # 对角线为正样本对
    return F.cross_entropy(logits, labels)

# for (uav_img, sat_img) in loader:
#     loss = info_nce(backbone(uav_img.cuda()), backbone(sat_img.cuda()))
#     ...反向传播同前

# 检索：sim = F.normalize(q) @ F.normalize(gallery).T → topk`,
  refs: [
    ['University1652-Baseline', 'https://github.com/layumi/University1652-Baseline', '跨视角地理定位基准，含数据下载与基线代码'],
    ['Sample4Geo', 'https://github.com/Skyy93/Sample4Geo', '跨视角匹配的改进方法（进阶）'],
  ],
  think: '为什么跨视角匹配难？（视角、尺度、光照差异）数据增强里加什么能缓解？'
},

/* ============ C. 大模型相关任务 ============ */
{
  id: 'vlm', group: 'llm', icon: '模', title: '遥感多模态大模型：零样本识别',
  level: '拓展', time: '1学时',
  goal: '体验"用自然语言直接识别遥感影像"：加载遥感预训练的视觉语言模型RemoteCLIP，不给任何训练样本，直接用文本提示做场景识别。',
  data: '任意几张遥感影像（可用前面实验的成果图）。RemoteCLIP模型权重在HuggingFace免费下载（约1.6GB）。',
  env: 'pip install open_clip_torch pillow（RemoteCLIP权重见参考链接）',
  steps: [
    '加载RemoteCLIP（在遥感图文对上预训练的CLIP）；',
    '写候选文本提示：["一张机场遥感影像", "一张农田遥感影像", …]；',
    '影像编码与全部文本编码算相似度，取最大者作为识别结果；',
    '零样本=不训练直接识别：对比模块5监督分类"先采样再分类"的流程差异；',
    '（选做）在线体验GeoChat：对遥感影像直接提问对话。'
  ],
  code: `import open_clip, torch
from PIL import Image

model, _, preprocess = open_clip.create_model_and_transforms('ViT-B-32')
ckpt = torch.load('RemoteCLIP-ViT-B-32.pt', map_location='cpu')
model.load_state_dict(ckpt)
tokenizer = open_clip.get_tokenizer('ViT-B-32')

img = preprocess(Image.open('airport.jpg')).unsqueeze(0)
texts = tokenizer(['一张机场的遥感影像', '一张农田的遥感影像',
                   '一张港口的遥感影像', '一张城市的遥感影像'])
with torch.no_grad():
    fi = model.encode_image(img); ft = model.encode_text(texts)
    prob = (fi @ ft.T).softmax(dim=-1)
print(prob)  # 各类别概率`,
  refs: [
    ['RemoteCLIP', 'https://github.com/ChenDelong1999/RemoteCLIP', '遥感视觉语言预训练模型，支持零样本分类/检索'],
    ['GeoChat', 'https://github.com/mbzuai-oryx/GeoChat', '遥感多模态对话大模型，可在线体验'],
    ['SkyEyeGPT', 'https://github.com/williamium3000/SkyEyeGPT', '遥感影像描述与问答模型'],
  ],
  think: '零样本识别精度不如专门训练的分类器，为什么业界还热衷大模型？（提示：泛化能力、无需标注、交互方式变革）'
},
{
  id: 'codegen', group: 'llm', icon: '码', title: '自然语言驱动代码生成',
  level: '拓展', time: '1学时',
  goal: '掌握"用自然语言让AI大模型编写遥感处理代码"的工作方法——这正是本课程创新报告"举措一"的落地实践，也是本口袋实验室的建设方式。',
  data: '无需数据——本实验的"原料"是需求描述。建议复用前面实验的影像验证生成结果。',
  env: '任意AI大模型对话窗口（如课程指定的平台）+ 本地Python环境',
  steps: [
    '需求描述公式：任务 + 输入数据 + 处理约束 + 输出形式。例："读取Landsat的B4/B5波段GeoTIFF，计算NDVI，用RdYlGn色带显示并统计NDVI>0.4的面积占比，用numpy和rasterio实现"；',
    '把提示词交给大模型，获得初版代码；',
    '本地运行验证：报错就把报错信息回贴给AI迭代；',
    '结果核查：用已知真值（如概念实验室的NDVI演示）交叉验证；',
    '进阶：让AI参照本实验室的demos/模块模式，生成一个新的交互演示网页。'
  ],
  code: `【提示词模板】
你是一名遥感图像处理专家。请用Python实现以下任务：
- 任务：<要做什么，如"直方图均衡化增强">
- 输入：<数据格式与来源，如"单波段GeoTIFF，路径input.tif">
- 约束：<库的限制，如"只用numpy/rasterio/matplotlib">
- 输出：<结果形式，如"保存对比图result.png并打印统计信息">
要求：代码可直接运行，关键步骤加注释。

【迭代技巧】
1. 报错→完整粘贴报错信息让AI修复
2. 结果不对→描述"期望vs实际"，让AI定位
3. 逐步复杂化：先跑通最小版本，再加需求`,
  refs: [
    ['本实验室全部演示的源代码', 'https://github.com/', '本仓库docs/assets/js/——全部由自然语言驱动AI生成，可作为提示词效果的实证'],
  ],
  think: '同一段需求，描述得粗和细，生成代码的可用率差多少？这就是"提示词工程"的价值。'
},
{
  id: 'report-gen', group: 'llm', icon: '报', title: '大模型辅助判读报告生成',
  level: '拓展', time: '1学时',
  goal: '把机器处理结果（检测框、分类统计、变化区域）交给大模型，自动生成结构化的判读报告初稿，人做审核修订——理解"机器处理+大模型成文+人工把关"的新流程。',
  data: '前面实验的输出结果（如目标检测的JSON、变化检测的统计数字）；或直接使用代码内置的示例数据。',
  env: '任意AI大模型对话窗口',
  steps: [
    '把处理结果整理为结构化文本（JSON/表格）：目标类型、数量、位置、置信度；',
    '用报告模板提示词要求大模型生成判读报告：概况→目标清单→异常分析→建议；',
    '人工核查：数字必须与机器结果一致（防"幻觉"），涉密信息不得输入；',
    '讨论：哪些环节可以交给机器，哪些必须人把关？'
  ],
  code: `【提示词模板】
你是遥感影像判读助理。根据以下机器处理结果，生成一份判读报告初稿：
- 影像信息：<时相、区域、分辨率>
- 检测结果：<JSON：目标类型/数量/位置/置信度>
- 变化区域：<面积、位置、类型>
报告结构：一、区域概况；二、目标清单（表格）；三、异常与重点关注；四、处置建议。
要求：所有数字严格引用输入数据，不得编造；不确定处标注"待人工核实"。

【输入示例】
{"plane": {"count": 12, "conf": 0.91}, "hangar": {"count": 3, "conf": 0.87},
 "change": [{"type": "新增建筑", "area_m2": 860}]}`,
  refs: [
    ['GeoChat', 'https://github.com/mbzuai-oryx/GeoChat', '可在线体验遥感影像问答，感受多模态大模型的判读能力'],
  ],
  think: '大模型可能"一本正经地编造"（幻觉）。报告中哪些内容必须机器直出、哪些可由模型润色？保密红线在哪里？'
},
];
