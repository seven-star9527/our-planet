'use client'

import { useState, useEffect, useMemo } from 'react';
import { addFootprint, updateFootprint } from '@/actions/footprint';
import dynamic from 'next/dynamic';
import * as echarts from 'echarts';

// 动态导入避免 SSR 报错
const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });
const CityMap = dynamic(() => import('./CityMap'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-50/50">加载详细街道中... 🗺️</div>
});

// 📍 内置城市坐标与省份映射字典 (全国主要城市及热门打卡地全收录)
const CITY_MAP: Record<string, { province: string; coord: [number, number] }> = {
  // --- 直辖市 ---
  "北京": { province: "北京", coord: [116.405285, 39.904989] },
  "上海": { province: "上海", coord: [121.472644, 31.231706] },
  "天津": { province: "天津", coord: [117.200983, 39.084158] },
  "重庆": { province: "重庆", coord: [106.504962, 29.533155] },

  // --- 华东地区 ---
  "杭州": { province: "浙江", coord: [120.153576, 30.287459] },
  "宁波": { province: "浙江", coord: [121.550357, 29.873992] },
  "温州": { province: "浙江", coord: [120.699367, 27.994267] },
  "南京": { province: "江苏", coord: [118.767413, 32.041544] },
  "苏州": { province: "江苏", coord: [120.585316, 31.298886] },
  "无锡": { province: "江苏", coord: [120.31191, 31.491169] },
  "福州": { province: "福建", coord: [119.296494, 26.074508] },
  "厦门": { province: "福建", coord: [118.089425, 24.479833] },
  "泉州": { province: "福建", coord: [118.68587, 24.87389] },
  "合肥": { province: "安徽", coord: [117.227239, 31.820586] },
  "黄山": { province: "安徽", coord: [118.317325, 29.709239] },
  "南昌": { province: "江西", coord: [115.892151, 28.682391] },
  "赣州": { province: "江西", coord: [114.93503, 25.831829] },
  "景德镇": { province: "江西", coord: [117.17833, 29.26678] },
  "济南": { province: "山东", coord: [117.120098, 36.6512] },
  "青岛": { province: "山东", coord: [120.382639, 36.067082] },
  "威海": { province: "山东", coord: [122.12042, 37.513068] },

  // --- 华南地区 ---
  "广州": { province: "广东", coord: [113.280637, 23.125178] },
  "深圳": { province: "广东", coord: [114.085947, 22.547] },
  "珠海": { province: "广东", coord: [113.576726, 22.270715] },
  "佛山": { province: "广东", coord: [113.121416, 23.021548] },
  "东莞": { province: "广东", coord: [113.753822, 23.020551] },
  "南宁": { province: "广西", coord: [108.360093, 22.815478] },
  "桂林": { province: "广西", coord: [110.290195, 25.273566] },
  "北海": { province: "广西", coord: [109.119254, 21.48126] },
  "海口": { province: "海南", coord: [110.19989, 20.04422] },
  "三亚": { province: "海南", coord: [109.508268, 18.247872] },

  // --- 华中地区 ---
  "武汉": { province: "湖北", coord: [114.298572, 30.584355] },
  "宜昌": { province: "湖北", coord: [111.28647, 30.691967] },
  "长沙": { province: "湖南", coord: [112.982279, 28.19409] },
  "张家界": { province: "湖南", coord: [110.479191, 29.117096] },
  "郑州": { province: "河南", coord: [113.625368, 34.746599] },
  "洛阳": { province: "河南", coord: [112.454084, 34.619658] },

  // --- 西南地区 ---
  "成都": { province: "四川", coord: [104.065735, 30.659462] },
  "九寨沟": { province: "四川", coord: [104.236116, 33.263056] },
  "贵阳": { province: "贵州", coord: [106.630153, 26.647661] },
  "昆明": { province: "云南", coord: [102.712251, 25.040609] },
  "大理": { province: "云南", coord: [100.229985, 25.591572] },
  "丽江": { province: "云南", coord: [100.233026, 26.872108] },
  "西双版纳": { province: "云南", coord: [100.797941, 22.001724] },
  "拉萨": { province: "西藏", coord: [91.140856, 29.645554] },

  // --- 西北地区 ---
  "西安": { province: "陕西", coord: [108.948024, 34.263161] },
  "延安": { province: "陕西", coord: [109.49081, 36.596537] },
  "兰州": { province: "甘肃", coord: [103.834303, 36.061089] },
  "敦煌": { province: "甘肃", coord: [94.66159, 40.142128] },
  "西宁": { province: "青海", coord: [101.780199, 36.620901] },
  "银川": { province: "宁夏", coord: [106.230909, 38.487193] },
  "乌鲁木齐": { province: "新疆", coord: [87.616848, 43.825592] },
  "喀什": { province: "新疆", coord: [75.989138, 39.467664] },

  // --- 华北地区 ---
  "石家庄": { province: "河北", coord: [114.51486, 38.042307] },
  "秦皇岛": { province: "河北", coord: [119.598, 39.935532] },
  "太原": { province: "山西", coord: [112.548879, 37.87059] },
  "呼和浩特": { province: "内蒙古", coord: [111.74918, 40.842585] },

  // --- 东北地区 ---
  "沈阳": { province: "辽宁", coord: [123.431474, 41.805698] },
  "大连": { province: "辽宁", coord: [121.614682, 38.914003] },
  "长春": { province: "吉林", coord: [125.323544, 43.817071] },
  "哈尔滨": { province: "黑龙江", coord: [126.534967, 45.803775] },

  // --- 港澳台地区 ---
  "香港": { province: "香港", coord: [114.16546, 22.27534] },
  "澳门": { province: "澳门", coord: [113.54913, 22.19875] },
  "台北": { province: "台湾", coord: [121.56517, 25.037798] },

  // 💡 如果未来你们去了更小众的城市，只需按格式在这里添加即可
  // 获取坐标的方法：百度搜索"某某市经纬度"，注意格式为 [经度, 纬度]
};

export default function FootprintClient({ cityData, rawData }: { cityData: any, rawData: any[] }) {
  const cities = Object.keys(cityData);
  const [activeCity, setActiveCity] = useState<string | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [editingSpot, setEditingSpot] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    const loadMap = async () => {
      // 主 CDN + 备用 CDN 双保险
      const urls = [
        'https://cdn.jsdelivr.net/npm/echarts@4.9.0/map/json/china.json',
        'https://unpkg.com/echarts@4.9.0/map/json/china.json',
      ];
      for (const url of urls) {
        try {
          const res = await fetch(url);
          const data = await res.json();
          echarts.registerMap('china', data);
          setMapLoaded(true);
          return;
        } catch (err) {
          console.warn(`地图加载失败(${url}):`, err);
        }
      }
      console.error('所有地图 CDN 均加载失败');
    };
    loadMap();
  }, []);

  const { provinceData, scatterData } = useMemo(() => {
    const pData: Record<string, number> = {};
    const sData: any[] = [];

    cities.forEach(city => {
      const info = CITY_MAP[city];
      const count = cityData[city].length;
      if (info) {
        pData[info.province] = (pData[info.province] || 0) + count;
        sData.push({ name: city, value: [...info.coord, count] });
      }
    });

    return {
      provinceData: Object.keys(pData).map(p => ({ name: p, value: pData[p] })),
      scatterData: sData
    };
  }, [cities, cityData]);

  const mapOption = useMemo(() => {
    const maxCount = Math.max(...provinceData.map(d => d.value), 3); // 降低最大阈值，让颜色更容易变深
    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          if (params.seriesType === 'effectScatter') return `${params.name}: ${params.data.value[2]}个足迹`;
          return params.name ? `${params.name}: ${params.value || 0}个足迹` : '';
        }
      },
      visualMap: {
        show: false,
        min: 0,
        max: maxCount,
        inRange: { color: ['#e2e8f0', '#6ee7b7', '#10b981'] }
      },
      geo: {
        map: 'china',
        // ✨ 优化：开启拖拽和缩放，但限制最大缩放倍数，降低灵敏度防止手机端乱滚
        roam: true,
        scaleLimit: { min: 1, max: 6 },
        itemStyle: { areaColor: '#f1f5f9', borderColor: '#ffffff', borderWidth: 1 },
        emphasis: { itemStyle: { areaColor: '#fbcfe8' }, label: { show: false } }
      },
      series: [
        { type: 'map', map: 'china', geoIndex: 0, data: provinceData },
        {
          type: 'effectScatter',
          coordinateSystem: 'geo',
          data: scatterData,
          symbolSize: (val: any) => Math.min(val[2] * 3 + 8, 20),
          showEffectOn: 'render',
          rippleEffect: { brushType: 'stroke', scale: 3 },
          itemStyle: { color: '#ec4899', shadowBlur: 10, shadowColor: '#ec4899' },
        }
      ]
    };
  }, [provinceData, scatterData]);

  const onMapClick = (params: any) => {
    if (params.seriesType === 'effectScatter' || params.seriesType === 'map') {
      if (cities.includes(params.name)) {
        setActiveCity(params.name);
      }
    }
  };

  // ✨ 修改：让它同时支持添加和编辑
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    let result;
    if (editingSpot) {
      // 如果有 editingSpot，说明是修改模式
      result = await updateFootprint(editingSpot.id, formData);
    } else {
      // 否则是新增模式
      result = await addFootprint(formData);
    }

    if (result.success) {
      setIsAdding(false);
      setEditingSpot(null); // 清空编辑状态
      const newCity = formData.get('city') as string;
      if (newCity) setActiveCity(newCity);
    } else {
      alert(result.error);
    }
    setIsSubmitting(false);
  };

  return (
    <>
      {/* 左侧区域 */}
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100/50 flex-1">
          {!isAdding && !editingSpot ? (
            <>
              <div className="flex justify-between items-end mb-4 px-2">
                <h2 className="text-sm font-bold text-gray-500">点亮的城市</h2>
                <button onClick={() => setActiveCity(null)} className="text-xs text-emerald-500 hover:underline">
                  返回全国图
                </button>
              </div>

              <div className="flex flex-col gap-2 max-h-[45vh] overflow-y-auto pr-1">
                {cities.map(city => (
                  <button
                    key={city}
                    onClick={() => setActiveCity(city)}
                    className={`text-left px-4 py-3 rounded-2xl transition-all font-bold ${activeCity === city
                      ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-white shadow-md transform scale-[1.02]'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    📍 {city}
                    <span className={`float-right text-xs font-medium px-2 py-0.5 rounded-full ${activeCity === city ? 'bg-white/20' : 'bg-gray-200 text-gray-500'}`}>
                      {cityData[city].length} 个地点
                    </span>
                  </button>
                ))}
              </div>

              <button onClick={() => setIsAdding(true)} className="w-full mt-6 border-2 border-dashed border-gray-200 text-gray-400 hover:border-emerald-300 hover:text-emerald-500 font-bold py-3.5 rounded-2xl transition-colors">
                + 点亮新城市
              </button>
            </>
          ) : (
            <div className="animate-fade-in">
              <div className="flex justify-between items-center mb-6 px-2">
                <h2 className="text-sm font-bold text-gray-700">
                  {editingSpot ? '修改足迹 ✍️' : '添加新足迹 🌍'}
                </h2>
                <button
                  onClick={() => { setIsAdding(false); setEditingSpot(null); }}
                  className="text-gray-400 hover:text-gray-600 text-sm font-medium bg-gray-50 px-3 py-1 rounded-full"
                >
                  取消
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input name="city" defaultValue={editingSpot?.city || ''} placeholder="城市 (如: 南昌)" className="w-full p-3.5 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-emerald-100 focus:outline-none text-sm" required />
                <input name="location" defaultValue={editingSpot?.location || ''} placeholder="详细地点 (如: 万寿宫)" className="w-full p-3.5 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-emerald-100 focus:outline-none text-sm" />
                <input
                  type="date"
                  name="date"
                  defaultValue={editingSpot?.date ? new Date(editingSpot.date).toISOString().split('T')[0] : ''}
                  className="w-full p-3.5 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-emerald-100 focus:outline-none text-sm text-gray-600"
                />
                <textarea name="notes" defaultValue={editingSpot?.notes || ''} placeholder="写点回忆吧..." rows={4} className="w-full p-3.5 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-emerald-100 focus:outline-none text-sm resize-none" />
                <button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-emerald-400 to-teal-500 text-white font-bold py-3.5 rounded-2xl shadow-md disabled:opacity-50">
                  {isSubmitting ? '保存中...' : (editingSpot ? '保存修改 ✨' : '确认点亮 ✨')}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* 右侧：地图区域与详细地点流 */}
      <div className="w-full md:w-2/3 flex flex-col gap-4">

        {/* 地图容器：移动端用固定像素高度确保渲染 */}
        <div className="bg-white rounded-3xl relative overflow-hidden shadow-sm border border-gray-100/50 p-2" style={{ height: '320px', minHeight: '280px' }}>
          {!activeCity ? (
            !mapLoaded ? (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-medium text-sm">地图卫星连线中... 🛰️</div>
            ) : (
              <ReactECharts
                option={mapOption as any}
                opts={{ renderer: 'svg' }}
                style={{ height: '100%', width: '100%', touchAction: 'auto' }}
                onEvents={{ click: onMapClick }}
              />
            )
          ) : (
            <CityMap
              center={CITY_MAP[activeCity]?.coord || [116.405285, 39.904989]}
              cityName={activeCity}
              spots={cityData[activeCity]}
            />
          )}

          <div className="absolute top-4 left-4 pointer-events-none z-[1000]">
            <span className="bg-white/90 backdrop-blur-sm text-xs font-bold text-gray-600 px-3 py-1.5 rounded-full shadow-sm border border-gray-100">
              {activeCity ? `当前定位: ${activeCity} (可自由缩放查看街道)` : '全中国足迹总览 (点亮城市越多颜色越深)'}
            </span>
          </div>
        </div>

        {activeCity && cityData[activeCity] && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100/50 animate-fade-in-up">
            <h3 className="font-bold text-gray-700 mb-6 flex items-center gap-2">
              <span className="text-pink-500 text-lg">📍</span> 在 {activeCity} 的专属记忆
            </h3>
            <div className="space-y-6 pl-2">
              {cityData[activeCity].map((spot: any) => (
                <div key={spot.id} className="relative pl-6 border-l-2 border-emerald-100 last:border-transparent">
                  <div className="absolute -left-[9px] top-0.5 w-4 h-4 rounded-full bg-white border-4 border-emerald-400 shadow-sm"></div>
                  <div className="-mt-1.5 pb-2">
                    <div className="flex items-baseline gap-2 mb-1 relative">
                      <h4 className="font-bold text-gray-800 text-base">{spot.location || '某处'}</h4>
                      {spot.date && (
                        <span className="text-xs text-gray-400 font-medium bg-gray-50 px-2 py-0.5 rounded-md">
                          {new Date(spot.date).toLocaleDateString()}
                        </span>
                      )}
                      {/* ✨ 新增的编辑按钮 */}
                      <button
                        onClick={() => setEditingSpot(spot)}
                        className="ml-2 text-[10px] text-gray-400 hover:text-emerald-500 bg-gray-100 hover:bg-emerald-50 px-2.5 py-1 rounded-full font-medium active:scale-95 transition-all"
                      >
                        编辑
                      </button>
                    </div>
                    {spot.notes && (
                      <div className="text-sm text-gray-600 bg-gray-50/80 p-3.5 rounded-2xl rounded-tl-sm mt-2 leading-relaxed border border-gray-100">
                        {spot.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}