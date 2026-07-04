/**
 * 技术指标展示名（data.ts 英文 id）→ 中文简称，用于列表 `英文名 (中文)`。
 */
export const TECHNICAL_LABEL_ZH: Record<string, string> = {
  "Accelerator Oscillator": "加速振荡器",
  "Accumulation/Distribution": "累积/派发线",
  "Accumulative Swing Index": "累积摆动指数",
  "Advance/Decline": "涨跌线",
  "Arnaud Legoux Moving Average": "ALMA 移动平均",
  Aroon: "阿隆指标",
  "Average Directional Index": "平均趋向指数",
  "Average Price": "平均价",
  "Average True Range": "平均真实波幅",
  "Balance of Power": "多空力量",
  "Bollinger Bands": "布林带",
  "Bollinger Bands %B": "布林带 %B",
  "Bollinger Bands Width": "布林带宽度",
  "Chaikin Money Flow": "蔡金资金流量",
  "Chaikin Oscillator": "蔡金振荡器",
  "Chaikin Volatility": "蔡金波动率",
  "Chande Kroll Stop": "Chande Kroll 止损",
  "Chande Momentum Oscillator": "Chande 动量振荡",
  "Chop Zone": "震荡区间",
  "Choppiness Index": "震荡指数",
  "Commodity Channel Index": "商品通道指数",
  "Connors RSI": "Connors RSI",
  "Coppock Curve": "Coppock 曲线",
  "Correlation Coefficient": "相关系数",
  "Detrended Price Oscillator": "去趋势价格振荡",
  "Directional Movement": "趋向变动",
  "Donchian Channels": "唐奇安通道",
  "EMA Cross": "EMA 交叉",
  "Ease Of Movement": "简易波动",
  Envelopes: "包络线",
  "Fisher Transform": "Fisher 变换",
  "Historical Volatility": "历史波动率",
  "Hull Moving Average": "Hull 移动平均",
  "Ichimoku Cloud": "一目均衡表",
  "Keltner Channels": "肯特纳通道",
  "Klinger Oscillator": "Klinger 振荡器",
  "Know Sure Thing": "KST 指标",
  "Least Squares Moving Average": "最小二乘移动平均",
  "Linear Regression Curve": "线性回归曲线",
  "Linear Regression Slope": "线性回归斜率",
  "MA Cross": "均线交叉",
  "MA with EMA Cross": "MA 与 EMA 交叉",
  MACD: "MACD",
  "Majority Rule": "多数规则",
  "Mass Index": "梅斯线",
  "McGinley Dynamic": "McGinley 动态",
  "Median Price": "中位价",
  Momentum: "动量",
  "Money Flow Index": "资金流量指数",
  "Moving Average": "移动平均线",
  "Moving Average Adaptive": "自适应移动平均",
  "Moving Average Channel": "移动平均通道",
  "Moving Average Double": "双移动平均",
  "Moving Average Exponential": "指数移动平均",
  "Moving Average Hamming": "Hamming 移动平均",
  "Moving Average Multiple": "多重移动平均",
  "Moving Average Triple": "三重移动平均",
  "Moving Average Weighted": "加权移动平均",
  "Net Volume": "净成交量",
  "On Balance Volume": "能量潮",
  "Parabolic SAR": "抛物线 SAR",
  "Pivot Points Standard": "标准枢轴点",
  "Price Channel": "价格通道",
  "Price Oscillator": "价格振荡器",
  "Price Volume Trend": "价量趋势",
  "Rate Of Change": "变动率",
  Ratio: "比率",
  "Relative Strength Index": "相对强弱指数",
  "Relative Vigor Index": "相对活力指数",
  "Relative Volatility Index": "相对波动指数",
  "SMI Ergodic Indicator/Oscillator": "SMI 遍历指标/振荡",
  "Smoothed Moving Average": "平滑移动平均",
  Spread: "价差",
  "Standard Deviation": "标准差",
  "Standard Error": "标准误差",
  "Standard Error Bands": "标准误差带",
  Stochastic: "随机指标",
  "Stochastic RSI": "随机 RSI",
  SuperTrend: "超级趋势",
  TRIX: "TRIX",
  "Trend Strength Index": "趋势强度指数",
  "Triple EMA": "三重 EMA",
  "True Strength Index": "真实强度指数",
  "Typical Price": "典型价格",
  "Ultimate Oscillator": "终极振荡器",
  VWAP: "成交量加权均价",
  VWMA: "成交量加权移动平均",
  "Volatility Close-to-Close": "收盘波动率",
  "Volatility Index": "波动率指数",
  "Volatility O-H-L-C": "OHLC 波动率",
  "Volatility Zero Trend Close-to-Close": "零趋势收盘波动率",
  Volume: "成交量",
  "Volume Oscillator": "成交量振荡器",
  "Vortex Indicator": "涡旋指标",
  "Williams %R": "威廉指标",
  "Williams Alligator": "威廉鳄鱼线",
};

/** 展示：`英文名 (中文)`；业务指标用 name + description */
export function formatIndicatorDisplayLabel(item: {
  labelEn: string;
  labelZh: string;
}): string {
  const en = item.labelEn.trim();
  let zh = item.labelZh.trim();

  if (!/[\u4e00-\u9fff]/.test(zh)) {
    zh = TECHNICAL_LABEL_ZH[en] ?? "";
  }

  if (zh && zh !== en) {
    return `${en} (${zh})`;
  }

  return en;
}
