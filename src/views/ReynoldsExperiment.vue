<template>
  <div class="experiment-container">
    <h2>雷诺实验数据输入与计算</h2>
    <form id="reynoldsForm" autocomplete="off" @submit.prevent="calc">
      <!-- 1. 有关常数 -->
      <div class="section">
        <h3>1. 有关常数</h3>
        <div class="input-row">
          <label>管径 d (cm)：
            <input v-model.number="constants.d" type="number" step="0.01" required>
          </label>
          <label>水温 t (℃)：
            <input v-model.number="constants.t" type="number" step="0.1" required>
          </label>
          <label>运动粘度 ν (cm²/s)：
            <input v-model.number="constants.nu" type="number" step="0.000001" required placeholder="查表输入">
          </label>
        </div>
        <div class="info-row">
          <span>断面面积 A (cm²)：{{ area.toFixed(4) }}</span>
        </div>
      </div>

      <!-- 2. 测量记录与计算 -->
      <div class="section">
        <h3>2. 测量记录与计算表</h3>
        <table>
          <thead>
            <tr>
              <th rowspan="3">序号</th>
              <th colspan="3">测压管液面高程读数</th>
              <th colspan="2">量水质量</th>
              <th colspan="2">量水时间</th>
              <th colspan="2">流量</th>
              <th rowspan="3">操作</th>
            </tr>
            <tr>
              <th>∇1</th>
              <th>∇2</th>
              <th>Δh</th>
              <th>m1</th>
              <th>m2</th>
              <th>T1</th>
              <th>T2</th>
              <th>Q1</th>
              <th>Q2</th>
            </tr>
            <tr>
              <th>cm</th>
              <th>cm</th>
              <th>cm</th>
              <th>g</th>
              <th>g</th>
              <th>s</th>
              <th>s</th>
              <th>cm³/s</th>
              <th>cm³/s</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in tableData" :key="index">
              <td>{{ index + 1 }}</td>
              <td><input :id="`cell-${index}-0`" @keydown="onKeydown($event, index, 0)" v-model.number="row.h1" type="number" step="0.01"></td>
              <td><input :id="`cell-${index}-1`" @keydown="onKeydown($event, index, 1)" v-model.number="row.h2" type="number" step="0.01"></td>
              <td class="read-only">{{ row.dh || '-' }}</td>
              <td><input :id="`cell-${index}-2`" @keydown="onKeydown($event, index, 2)" v-model.number="row.m1" type="number" step="0.01"></td>
              <td><input :id="`cell-${index}-3`" @keydown="onKeydown($event, index, 3)" v-model.number="row.m2" type="number" step="0.01"></td>
              <td><input :id="`cell-${index}-4`" @keydown="onKeydown($event, index, 4)" v-model.number="row.t1" type="number" step="0.01"></td>
              <td><input :id="`cell-${index}-5`" @keydown="onKeydown($event, index, 5)" v-model.number="row.t2" type="number" step="0.01"></td>
              <td class="read-only">{{ row.q1 || '-' }}</td>
              <td class="read-only">{{ row.q2 || '-' }}</td>
              <td>
                <button type="button" @click="removeRow(index)" v-if="tableData.length > 1">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
        <button type="button" @click="addRow" class="add-btn">+ 添加一行</button>
      </div>

      <div class="action-bar">
        <button type="submit" class="calc-btn">计算并输出结果</button>
      </div>
    </form>

    <!-- 3. 计算结果 -->
    <div v-if="results.length > 0" class="section result-section">
      <h3>3. 计算结果</h3>
      <table>
        <thead>
          <tr>
            <th>序号</th>
            <th>流量 Q平均 (cm³/s)</th>
            <th>流速 v (cm/s)</th>
            <th>测压管高差 Δh (cm)</th>
            <th>沿程水头损失 hf (cm)</th>
            <th>lg v</th>
            <th>lg hf</th>
            <th>雷诺数 Re</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(res, index) in results" :key="index">
            <td>{{ index + 1 }}</td>
            <td>{{ res.qAvg }}</td>
            <td>{{ res.v }}</td>
            <td>{{ res.dh }}</td>
            <td>{{ res.hf }}</td>
            <td>{{ res.lgv }}</td>
            <td>{{ res.lghf }}</td>
            <td>{{ res.re }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 4. 绘图分析 (新增) -->
    <div v-if="results.length > 0" class="section chart-section">
      <h3>4. 绘图分析 (lg hf - lg v 关系曲线)</h3>
      <div class="chart-container">
        <v-chart class="chart" :option="chartOption" autoresize />
      </div>
      <div class="analysis-result" v-if="slopes.laminar || slopes.turbulent">
        <p><strong>分析结果：</strong></p>
        <p v-if="slopes.laminar">层流区 (Re &lt; 2300) 斜率 m1 = {{ slopes.laminar }} (理论值 ≈ 1.0)</p>
        <p v-if="slopes.turbulent">紊流区 (Re &gt; 2300) 斜率 m2 = {{ slopes.turbulent }} (理论值 1.75 ~ 2.0)</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, reactive } from 'vue'

// --- 新增 ECharts 引入 ---
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { ScatterChart, LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  MarkLineComponent
} from 'echarts/components'

use([
  CanvasRenderer,
  ScatterChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  MarkLineComponent
])
// -----------------------

// 常数接口
interface Constants {
  d: number | null
  t: number | null
  nu: number | null // 新增运动粘度
}

// 输入数据行接口
interface DataRow {
  h1: number | null
  h2: number | null
  m1: number | null
  t1: number | null
  m2: number | null
  t2: number | null
  // 计算出的中间值
  dh?: string
  q1?: string
  q2?: string
}

// 结果行接口
interface ResultRow {
  qAvg: string
  v: string
  dh: string
  hf: string
  lgv: string
  lghf: string
  re: string
  // 新增原始数值用于绘图
  rawLgv?: number
  rawLghf?: number
  rawRe?: number
}

// 状态定义
const constants = reactive<Constants>({
  d: null,
  t: null,
  nu: null
})

const tableData = ref<DataRow[]>([
  { h1: null, h2: null, m1: null, t1: null, m2: null, t2: null },
  { h1: null, h2: null, m1: null, t1: null, m2: null, t2: null },
  { h1: null, h2: null, m1: null, t1: null, m2: null, t2: null },
  { h1: null, h2: null, m1: null, t1: null, m2: null, t2: null },
  { h1: null, h2: null, m1: null, t1: null, m2: null, t2: null },
  { h1: null, h2: null, m1: null, t1: null, m2: null, t2: null }
])

const results = ref<ResultRow[]>([])
// 新增图表配置和斜率状态
const chartOption = ref({})
const slopes = reactive({
  laminar: '',
  turbulent: ''
})

// 计算属性：断面面积 (cm²)
const area = computed(() => {
  if (constants.d === null) return 0
  return (Math.PI * Math.pow(constants.d, 2)) / 4
})

// 方法：添加行
const addRow = () => {
  tableData.value.push({ h1: null, h2: null, m1: null, t1: null, m2: null, t2: null })
}

// 方法：删除行
const removeRow = (index: number) => {
  tableData.value.splice(index, 1)
}

// 键盘导航处理
const onKeydown = (e: KeyboardEvent, r: number, c: number) => {
  const maxR = tableData.value.length - 1
  const maxC = 5 // 列索引 0-5 (h1, h2, m1, m2, t1, t2)

  let nextR = r
  let nextC = c

  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) {
    // 阻止默认行为（如滚动、光标移动），改为切换焦点
    if (e.key === 'Enter' || e.key === 'ArrowRight') {
      e.preventDefault()
      if (c < maxC) {
        nextC++
      } else if (r < maxR) {
        nextR++
        nextC = 0
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      if (c > 0) {
        nextC--
      } else if (r > 0) {
        nextR--
        nextC = maxC
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (r < maxR) {
        nextR++
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (r > 0) {
        nextR--
      }
    }

    if (nextR !== r || nextC !== c) {
      const el = document.getElementById(`cell-${nextR}-${nextC}`)
      if (el) {
        el.focus()
      }
    }
  }
}

// 线性回归辅助函数：计算斜率和截距 y = kx + b
const linearRegression = (data: number[][]) => {
  const n = data.length
  if (n < 2) return null

  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumXX = 0

  for (let i = 0; i < n; i++) {
    const point = data[i]
    // 添加空值检查
    if (!point) continue
    
    const x = point[0]
    const y = point[1]
    
    // 确保 x 和 y 都是有效数字
    if (x === undefined || y === undefined) continue

    sumX += x
    sumY += y
    sumXY += x * y
    sumXX += x * x
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  return { slope, intercept }
}

// 方法：计算
const calc = () => {
  if (!constants.d || constants.t === null || !constants.nu) {
    alert("请输入完整的常数信息（包括查表得出的运动粘度）！")
    return
  }

  const rho = 1.0 // 水的密度 g/cm³
  const A = area.value
  const v_nu = constants.nu // 直接使用输入的运动粘度
  const d = constants.d

  // 用于绘图的数据点
  const laminarPoints: number[][] = [] // 层流点
  const turbulentPoints: number[][] = [] // 紊流点

  results.value = tableData.value.map(row => {
    // 检查必填项
    if (row.h1 === null || row.h2 === null || row.m1 === null || row.t1 === null || row.m2 === null || row.t2 === null) {
      row.dh = '-'
      row.q1 = '-'
      row.q2 = '-'
      return { qAvg: '-', v: '-', dh: '-', hf: '-', lgv: '-', lghf: '-', re: '-' }
    }

    // 1. 计算中间值
    const dhVal = Math.abs(row.h1 - row.h2)
    const q1Val = row.m1 / (rho * row.t1)
    const q2Val = row.m2 / (rho * row.t2)

    // 更新表格显示
    row.dh = dhVal.toFixed(2)
    row.q1 = q1Val.toFixed(2)
    row.q2 = q2Val.toFixed(2)

    // 2. 计算平均流量
    const qAvgVal = (q1Val + q2Val) / 2

    // 3. 计算流速 v (cm/s) = Q / A
    const vVal = qAvgVal / A

    // 4. 计算雷诺数 Re = v * d / ν
    const reVal = (vVal * d) / v_nu

    // 5. 计算对数值
    // 注意：vVal 和 dhVal 必须大于 0 才能取对数
    const lgvVal = vVal > 0 ? Math.log10(vVal) : 0
    const lghfVal = dhVal > 0 ? Math.log10(dhVal) : 0

    // 收集绘图数据 (排除无效数据)
    if (vVal > 0 && dhVal > 0) {
      const point = [lgvVal, lghfVal]
      if (reVal < 2300) {
        laminarPoints.push(point)
      } else {
        turbulentPoints.push(point)
      }
    }

    return {
      qAvg: qAvgVal.toFixed(2),
      v: vVal.toFixed(2),
      dh: dhVal.toFixed(2),
      hf: dhVal.toFixed(2), // 沿程水头损失 hf 等于测压管高差 Δh
      lgv: vVal > 0 ? lgvVal.toFixed(3) : '-',
      lghf: dhVal > 0 ? lghfVal.toFixed(3) : '-',
      re: reVal.toFixed(2), // 雷诺数保留两位小数
      rawLgv: lgvVal,
      rawLghf: lghfVal,
      rawRe: reVal
    }
  })

  // --- 生成图表配置 ---
  
  // 1. 计算回归线
  const lamReg = linearRegression(laminarPoints)
  const turbReg = linearRegression(turbulentPoints)

  slopes.laminar = lamReg ? lamReg.slope.toFixed(3) : ''
  slopes.turbulent = turbReg ? turbReg.slope.toFixed(3) : ''

  // 生成回归线的两端点用于绘制直线
  const getLinePoints = (points: number[][], reg: any) => {
    if (!reg || points.length < 2) return []
    // 找到x的最小值和最大值
    // 使用 filter 过滤掉 undefined，并使用类型谓词 (x is number) 告诉 TS 结果是纯数字数组
    const xs = points.map(p => p[0]).filter((x): x is number => typeof x === 'number')
    
    if (xs.length === 0) return []

    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    return [
      [minX, reg.slope * minX + reg.intercept],
      [maxX, reg.slope * maxX + reg.intercept]
    ]
  }

  const lamLine = getLinePoints(laminarPoints, lamReg)
  const turbLine = getLinePoints(turbulentPoints, turbReg)

  chartOption.value = {
    title: {
      text: 'lg hf - lg v 关系曲线',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['层流点', '紊流点', '层流拟合', '紊流拟合'],
      bottom: 0
    },
    xAxis: {
      type: 'value',
      name: 'lg v',
      nameLocation: 'middle',
      nameGap: 30,
      scale: true
    },
    yAxis: {
      type: 'value',
      name: 'lg hf',
      scale: true
    },
    series: [
      {
        name: '层流点',
        type: 'scatter',
        data: laminarPoints,
        itemStyle: { color: '#5470c6' }
      },
      {
        name: '紊流点',
        type: 'scatter',
        data: turbulentPoints,
        itemStyle: { color: '#91cc75' }
      },
      {
        name: '层流拟合',
        type: 'line',
        data: lamLine,
        showSymbol: false,
        itemStyle: { color: '#5470c6' },
        lineStyle: { type: 'dashed' }
      },
      {
        name: '紊流拟合',
        type: 'line',
        data: turbLine,
        showSymbol: false,
        itemStyle: { color: '#91cc75' },
        lineStyle: { type: 'dashed' }
      }
    ]
  }
}
</script>

<style scoped>
.experiment-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
  background-color: #fff;
}

.input-row {
  display: flex;
  gap: 20px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.info-row {
  margin-top: 10px;
  color: #666;
  font-size: 0.9em;
}

.info-row span {
  margin-right: 20px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 10px;
}

th, td {
  border: 1px solid #ccc;
  padding: 8px;
  text-align: center;
}

th {
  background-color: #f5f5f5;
}

input[type="number"] {
  width: 80px;
  padding: 4px;
  text-align: center;
}

.read-only {
  background-color: #f9f9f9;
  color: #333;
}

.add-btn {
  background-color: #e0e0e0;
  border: none;
  padding: 5px 10px;
  cursor: pointer;
}

.calc-btn {
  background-color: #4CAF50;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}

.calc-btn:hover {
  background-color: #45a049;
}

.result-section {
  background-color: #f9f9f9;
}

/* 新增样式 */
.chart-section {
  background-color: #fff;
}

.chart-container {
  height: 400px;
  width: 100%;
}

.chart {
  height: 100%;
  width: 100%;
}

.analysis-result {
  margin-top: 20px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #f9f9f9;
}
</style>
