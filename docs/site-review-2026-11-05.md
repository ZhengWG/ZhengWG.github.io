# 博客格式和图片检查（2026-11-05）

检查覆盖 128 篇文章、原始正文中的 491 处图片引用（472 个不同的外部地址）。静态检查未发现本地图片缺失或明显未渲染的 Markdown 标题、表格分隔线。

外部图片检查中 52 个地址访问失败。51 张图片已从博主自己的 `ZhengWG/Imgs_blog` 仓库恢复，存到 `assets/img/recovered/`，并替换 37 篇文章中的对应地址，避免继续受 CDN 访问异常影响。图片内容未改写。另有 1 张 Qt 操作截图使用了过期的百度网盘签名地址，无法恢复原图；已移除失效图片，保留前后操作说明。

修复后静态检查覆盖 490 处图片引用，本地资源均存在。其余 420 个不同的外部图片地址在本次初始检查中返回成功；外部服务未来仍可能变化。

目录改为列表结构，每条链接单独显示，浏览器已验证排列和锚点行为。原 LeanCloud 评论脚本已移除，改用匿名评论服务，维护说明见 [comments-backend.md](comments-backend.md)。

## 恢复图片来源

| 本地资源 | 原图仓库路径 |
| --- | --- |
| `/assets/img/recovered/4017c942c26e190c.png` | `2025-02-02-%E9%95%BF%E6%80%9D%E7%BB%B4%E9%93%BE%E6%A8%A1%E5%9E%8B%28Long-CoT%29%E5%AF%B9AI-Infra%E7%9A%84%E5%90%AF%E5%8F%91/image-20250202214833794.png` |
| `/assets/img/recovered/5f2988507db17bc6.png` | `-/image-20241210131259175.png` |
| `/assets/img/recovered/af69da2d98b55099.png` | `2024-12-04-LLM%E9%95%BF%E6%96%87%E6%9C%AC%E4%BC%98%E5%8C%96%E7%AD%96%E7%95%A5/大模型推理技术栈_20241004_171203.png` |
| `/assets/img/recovered/b353d469fa422314.png` | `2024-11-29-Lora&&Multi-Lora/大模型推理技术栈_20241002_141032.png` |
| `/assets/img/recovered/e00c04dba6d2ca4c.png` | `2024-11-29-Lora&&Multi-Lora/大模型推理技术栈_20241002_141814.png` |
| `/assets/img/recovered/f7c85b4b33045ae0.png` | `2024-10-07-PP&&TP_LLMs%E9%83%A8%E7%BD%B2/大模型推理技术栈_20241004_160747.png` |
| `/assets/img/recovered/5b3cb8f69a58681d.png` | `2024-10-06-Orca-Continuous_Batching%E7%AD%96%E7%95%A5/大模型推理技术栈_20240917_011550.png` |
| `/assets/img/recovered/365c3a60ba4274f5.png` | `2024-01-05-%E5%A4%A7%E6%A8%A1%E5%9E%8B%E8%AE%A1%E7%AE%97%E5%BB%BA%E6%A8%A1/大模型计算建模_20240106_165301.png` |
| `/assets/img/recovered/4cd88679c575d2cb.png` | `2023-10-26-GEMM%E7%AE%97%E5%AD%90%E4%BC%98%E5%8C%96/大模型推理技术栈_20241004_221625.png` |
| `/assets/img/recovered/e26682e8e1364063.png` | `2023-10-25-LLMs%E9%87%8F%E5%8C%96%E7%AE%97%E6%B3%95%E6%A6%82%E8%BF%B0/image-20241220155911239.png` |
| `/assets/img/recovered/9e17bdad680c9d10.png` | `2022-07-17-Goolge-TPU%E8%AE%BA%E6%96%87%E8%A7%A3%E8%AF%BB/Google-TPU论文解读_20220717_162711.png` |
| `/assets/img/recovered/62cfde93bed8981f.png` | `2022-05-14-Transformer%E7%A6%BB%E7%BA%BF%E9%83%A8%E7%BD%B2-GPU%E4%BC%98%E5%8C%96%E7%AD%96%E7%95%A5/transformer离线部署-GPU优化策略_20220514_171254.png` |
| `/assets/img/recovered/cc8f8cfe5abb5bfc.png` | `2022-05-03-Bert:%E8%BF%87%E5%8E%BB-%E7%8E%B0%E5%9C%A8-%E6%9C%AA%E6%9D%A5/BERT:过去-现在-未来_20220503_163014.png` |
| `/assets/img/recovered/6f505f714c2b1982.png` | `2022-02-02-%E8%AE%BE%E8%AE%A1%E6%A8%A1%E5%BC%8F-MVC%E6%A8%A1%E5%BC%8F/20220202_225946.png` |
| `/assets/img/recovered/e0ae68b226bcc1ed.png` | `2022-02-01-%E8%AE%BE%E8%AE%A1%E6%A8%A1%E5%BC%8F-%E8%AE%BF%E9%97%AE%E6%A8%A1%E5%BC%8F/20220202_224822.png` |
| `/assets/img/recovered/78b6387530f4e38c.png` | `2022-02-01-%E8%AE%BE%E8%AE%A1%E6%A8%A1%E5%BC%8F-%E5%B7%A5%E5%8E%82%E6%A8%A1%E5%BC%8F/20220202_224027.png` |
| `/assets/img/recovered/229b545c9213ffd5.png` | `2022-01-31-%E8%AE%BE%E8%AE%A1%E6%A8%A1%E5%BC%8F-%E5%A4%96%E8%A7%82%E6%A8%A1%E5%BC%8F/20220202_223032.png` |
| `/assets/img/recovered/1cd44e600ff56d7d.png` | `2021-12-12-%E8%AE%BE%E8%AE%A1%E6%A8%A1%E5%BC%8F-UML/20211212_000237.png` |
| `/assets/img/recovered/7d57f035dffeef36.png` | `2021-11-07-Transformer%E5%9C%A8CV%E9%A2%86%E5%9F%9F%E7%9A%84%E5%BA%94%E7%94%A8%E4%B8%8E%E9%83%A8%E7%BD%B2/Transfomer_20211031_165529.png` |
| `/assets/img/recovered/28e7e0e6823342ee.png` | `2021-11-07-Transformer%E5%9C%A8CV%E9%A2%86%E5%9F%9F%E7%9A%84%E5%BA%94%E7%94%A8%E4%B8%8E%E9%83%A8%E7%BD%B2/Transfomer_20211107_141411.png` |
| `/assets/img/recovered/0cab87a03319ecfb.png` | `2021-10-04-2D_Detection-%E8%B6%85%E5%8F%82/2d_detection-超参_20211003_164849.png` |
| `/assets/img/recovered/4d3f2b1a78be8cf4.png` | `2021-10-04-2D_Detection-%E8%B6%85%E5%8F%82/2d_detection-超参_20211003_180247.png` |
| `/assets/img/recovered/8b64f5c19d70d127.gif` | `2021-10-04-2D_Detection-%E8%B6%85%E5%8F%82/v2-4a3b4a39ab8e5c556359147b882b4788_b.gif` |
| `/assets/img/recovered/82382e4adc39549c.png` | `2021-09-20-2D_Detection-%E6%A8%A1%E5%9E%8B%E5%8A%A0%E9%80%9F%28%E5%B7%A5%E7%A8%8B%E7%AF%87%29/2d_detection-模型加速(工程篇)_20210920_170213.png` |
| `/assets/img/recovered/c52cd94febf3d87f.png` | `2021-09-20-2D_Detection-%E6%A8%A1%E5%9E%8B%E5%8A%A0%E9%80%9F%28%E5%B7%A5%E7%A8%8B%E7%AF%87%29/2d_detection-模型加速(工程篇)_20210920_173203.png` |
| `/assets/img/recovered/0fc8598761c26277.png` | `2021-08-29-2D_Detection-%E7%BB%8F%E5%85%B8%E6%A3%80%E6%B5%8B%E6%A1%86%E6%9E%B6%E4%BB%8B%E7%BB%8D/2d_detection-经典检测框架_20210829_163622.png` |
| `/assets/img/recovered/a768daae923fcfbf.png` | `2021-08-29-2D_Detection-%E7%BB%8F%E5%85%B8%E6%A3%80%E6%B5%8B%E6%A1%86%E6%9E%B6%E4%BB%8B%E7%BB%8D/2d_detection-经典检测框架_20210829_153846.png` |
| `/assets/img/recovered/5c1753b2ca94e13b.png` | `2021-08-29-2D_Detection-%E7%BB%8F%E5%85%B8%E6%A3%80%E6%B5%8B%E6%A1%86%E6%9E%B6%E4%BB%8B%E7%BB%8D/2d_detection-经典检测框架_20210829_155713.png` |
| `/assets/img/recovered/5f892986d09f9bc1.png` | `2021-08-29-2D_Detection-%E7%BB%8F%E5%85%B8%E6%A3%80%E6%B5%8B%E6%A1%86%E6%9E%B6%E4%BB%8B%E7%BB%8D/2d_detection-经典检测框架_20210829_155859.png` |
| `/assets/img/recovered/2f40f6809bfbeaca.png` | `2021-08-15-2D_Detection-Backbone/2d_detection-Backbone_20210815_152404.png` |
| `/assets/img/recovered/4e3ecf50c5f4b5a5.png` | `2021-08-15-2D_Detection-Backbone/2d_detection-Backbone_20210815_152744.png` |
| `/assets/img/recovered/a6dc5eeb497dce4e.png` | `2021-08-06-2D_Detection-基本深度学习单元/2d_detection-基本数据结构_20210725_181022.png` |
| `/assets/img/recovered/46366a38a7f2c055.png` | `2021-07-04-Pytorch关键模块解读/Pytorch源码解读_20210704_222441.png` |
| `/assets/img/recovered/d7d74b76de035cc5.png` | `2021-01-22-3D单目(mono_3D)目标检测算法综述/31.png` |
| `/assets/img/recovered/4480e38fcf045252.png` | `2021-01-22-3D单目(mono_3D)目标检测算法综述/32.png` |
| `/assets/img/recovered/7391c7e7e14ddca6.png` | `2020-01-27-OneStage经典-SSD论文精读/2020_01_27_SSD_20210710_004704.png` |
| `/assets/img/recovered/de492b50973d829a.png` | `2020-01-12-RoarNet论文解读/2020_01_04_RoarNet_20210710_004337.png` |
| `/assets/img/recovered/014c088009c273c8.png` | `2020-01-04-Cont-Fuse论文解读/2020_01_04_ContFuse_20210710_002139.png` |
| `/assets/img/recovered/fc35bebb554f782d.png` | `2018-10-14-YOLO论文系列解读/2018_10_14_Yolov1_20210709_234224.png` |
| `/assets/img/recovered/5d97db1577e7b609.png` | `2019-10-13-AVOD论文解读/2019_10_13_Joint_3D_Proposal_Generation_and_Object_Detection_from_View_Aggregation_20210710_001451.png` |
| `/assets/img/recovered/884bf8a225378e6a.png` | `Kaggle_Digit Recognizer_svm/1.png` |
| `/assets/img/recovered/2700c757c0840634.png` | `Ubuntu16.04 LTS+Cuda9.0+opencv3+python+tensorflow配置/1.png` |
| `/assets/img/recovered/096535b655810175.png` | `Turtlebot2i软件包的安装与配置/4.png` |
| `/assets/img/recovered/1182525b53d503f7.png` | `Turtlebot2i软件包的安装与配置/5.png` |
| `/assets/img/recovered/0f7e8922c5f15f4c.png` | `Turtlebot2i软件包的安装与配置/6.png` |
| `/assets/img/recovered/85f7fca410346bac.png` | `ROS-kinetic下Astra Pro和RealSense摄像头配置/7.png` |
| `/assets/img/recovered/5246fde85119d677.png` | `ROS与PhantomXArm机械臂配置/5.png` |
| `/assets/img/recovered/7f48eeda6afaca2a.png` | `ROS与PhantomXArm机械臂配置/8.png` |
| `/assets/img/recovered/e3b481d8e8796477.png` | `ROS与PhantomXArm机械臂配置/15.png` |
| `/assets/img/recovered/4f9b236088b0c5b7.jpg` | `2017-05-13-Win7下基于Qt和opencv的程序的运行/6.jpg` |
| `/assets/img/recovered/5a7ad9807a32fba5.png` | `2016-12-10-Ubuntu16LTS+Cuda8+OpenCV3+Maltlab2014a+python+Caffe/1.png` |
