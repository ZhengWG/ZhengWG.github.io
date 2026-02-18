"""城市与区域配置，定义各数据源所需的 ID 映射。"""

import os
from datetime import date

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
CACHE_EXPIRE_HOURS = 24

CURRENT_YEAR = date.today().year

CITIES = {
    "hz": {
        "name": "杭州",
        "gotohui_id": 37,
        "beike_domain": "hz",
        "districts": {
            "xihu":      {"name": "西湖区",   "gotohui_id": 3321, "sub_districts": {
                "cuiyuan": "翠苑", "gudang": "古荡", "huanglong": "黄龙",
                "jialv": "嘉绿", "jiulian": "九莲", "wenjiao": "文教",
                "wensan": "文三", "wensanxilu": "文三西路", "wenyixilu": "文一西路",
                "xuejun": "学军", "zhijiang": "之江", "zhuantang": "转塘",
            }},
            "binjiang":  {"name": "滨江区",   "gotohui_id": 3327, "sub_districts": {
                "baimahu": "白马湖", "binjiangquzhengfu": "滨江区政府",
                "caihongcheng": "彩虹城", "changhe": "长河", "puyan": "浦沿",
            }},
            "shangcheng":{"name": "上城区",   "gotohui_id": 3323, "sub_districts": {
                "caihe1": "采荷", "chengdongxincheng": "城东新城", "chengzhan": "城站",
                "dingqiao": "丁桥", "fuxing": "复兴", "gulou2": "鼓楼",
                "huajiachi": "华家池", "hubin1": "湖滨", "huochedongzhan": "火车东站",
                "jingfang1": "景芳", "jinjiang1": "近江", "qianjiangxincheng": "钱江新城",
                "sijiqing1": "四季青", "wangjiang": "望江", "zhanongkou": "闸弄口",
                "banshan": "半山", "jianqiao": "笕桥", "jiubao": "九堡",
            }},
            "gongshu":   {"name": "拱墅区",   "gotohui_id": 3325, "sub_districts": {
                "shenhua": "申花", "chaohui": "朝晖", "daguan": "大关",
                "desheng": "德胜", "gongchenqiao": "拱宸桥", "hemu": "和睦",
                "hushu1": "湖墅", "santang": "三塘", "shiqiao": "石桥",
                "wulin11": "武林", "xinyifang": "信义坊", "qiaoxi1": "桥西",
            }},
            "xiaoshan":  {"name": "萧山区",   "gotohui_id": 3320, "sub_districts": {
                "aoti": "奥体", "xixing": "西兴", "qianjiangshijicheng": "钱江世纪城",
                "xiaoshanshiqu": "萧山市区", "xiaoshanxinchengqu": "萧山新城区",
                "xianghu": "湘湖", "wenyan": "闻堰", "nanbuwocheng": "南部卧城",
                "xiaoshankaifaqu": "萧山开发区", "dajiangdong": "大江东",
            }},
            "yuhang":    {"name": "余杭区",   "gotohui_id": 3319, "sub_districts": {
                "weilaikejicheng": "未来科技城", "liangzhu": "良渚",
                "xianlin1": "闲林", "gouzhuang": "勾庄", "laoyuhang": "老余杭",
                "pingyao": "瓶窑", "renhe2": "仁和", "zhongtai": "中泰",
                "yunhexincheng": "运河新城",
            }},
            "fuyang":    {"name": "富阳区",   "gotohui_id": 3326, "sub_districts": {
                "fuchun": "富春", "fuyang1": "富阳", "jiangnanxincheng1": "江南新城",
                "lushanxincheng": "鹿山新城", "yinhukejicheng": "银湖科技城",
            }},
            "qiantang":  {"name": "钱塘区",   "gotohui_id": 4155, "sub_districts": {
                "jinshahu": "金沙湖", "daxuechengbei": "大学城北",
                "gaojiaoyuanqudong": "高教园区东", "gaojiaoyuanquxi": "高教园区西",
                "yanjiangbei": "沿江北", "yanjiangnan": "沿江南",
            }},
            "linping":   {"name": "临平区",   "gotohui_id": 4154, "sub_districts": {
                "linpingxincheng": "临平新城", "linpingyunhe": "临平运河",
                "chongxian": "崇贤", "donghu6": "东湖", "xingqiao": "星桥",
                "tangqi1": "塘栖",
            }},
            "linan":     {"name": "临安区",   "gotohui_id": 3328, "sub_districts": {
                "linan1": "临安", "qingshanhukejicheng": "青山湖科技城",
            }},
            "jiande":    {"name": "建德市",   "gotohui_id": 3330},
            "chunan":    {"name": "淳安县",   "gotohui_id": 3331},
            "tonglu":    {"name": "桐庐县",   "gotohui_id": 3329},
        },
    },
    "bj": {
        "name": "北京",
        "gotohui_id": 1,
        "beike_domain": "bj",
        "districts": {
            "dongcheng":  {"name": "东城区",   "gotohui_id": 219},
            "xicheng":    {"name": "西城区",   "gotohui_id": 220},
            "chaoyang":   {"name": "朝阳区",   "gotohui_id": 221},
            "haidian":    {"name": "海淀区",   "gotohui_id": 222},
            "fengtai":    {"name": "丰台区",   "gotohui_id": 223},
            "shijingshan":{"name": "石景山区", "gotohui_id": 224},
            "tongzhou":   {"name": "通州区",   "gotohui_id": 225},
            "changping":  {"name": "昌平区",   "gotohui_id": 226},
            "daxing":     {"name": "大兴区",   "gotohui_id": 227},
            "shunyi":     {"name": "顺义区",   "gotohui_id": 228},
        },
    },
    "sh": {
        "name": "上海",
        "gotohui_id": 3,
        "beike_domain": "sh",
        "districts": {
            "huangpu":  {"name": "黄浦区", "gotohui_id": 237},
            "xuhui":    {"name": "徐汇区", "gotohui_id": 240},
            "changning":{"name": "长宁区", "gotohui_id": 241},
            "jingan":   {"name": "静安区", "gotohui_id": 242},
            "putuo":    {"name": "普陀区", "gotohui_id": 243},
            "hongkou":  {"name": "虹口区", "gotohui_id": 245},
            "yangpu":   {"name": "杨浦区", "gotohui_id": 246},
            "pudong":   {"name": "浦东新区","gotohui_id": 248},
            "minhang":  {"name": "闵行区", "gotohui_id": 247},
            "baoshan":  {"name": "宝山区", "gotohui_id": 249},
        },
    },
}

DEFAULT_CITY = "hz"
HISTORY_START_YEAR = 2018
