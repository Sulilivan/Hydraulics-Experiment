<template>
  <div class="experiment-container">
    <h2>沿程阻力系数实验数据输入与计算</h2>
    <form id="frictionForm" autocomplete="off" @submit.prevent="calc">
      <!-- 1. 有关常数 -->
      <div class="section">
        <h3>1. 有关常数</h3>
        <div class="input-row">
          <label>糙后管径 d (cm)：
            <input v-model.number="constants.d" type="number" step="0.01" required>
          </label>
          <label>水温 t (℃)：
            <input v-model.number="constants.t" type="number" step="0.1" required>
          </label>
          <label>运动粘度 ν (cm²/s)：
            <input v-model.number="constants.nu" type="number" step="0.000001" required placeholder="查表输入">
          </label>
        </div>
        <div class="input-row">
          <label>计算长度 l (cm)：
            <input v-model.number="constants.l" type="number" step="0.1" required>
          </label>
          <label>绝对粗糙度 Δ (cm)：
            <input v-model.number="constants.delta" type="number" step="0.0001" required>
          </label>
        </div>
        <div class="info-row">
          <span>断面面积 A (cm²)：{{ area.toFixed(4) }}</span>
          <span>l/d：{{ ldRatio.toFixed(2) }}</span>
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
            <th>流量 Q (cm³/s)</th>
            <th>流速 v (cm/s)</th>
            <th>沿程水头损失 hf (cm)</th>
            <th>沿程阻力系数 λ</th>
            <th>雷诺数 Re</th>
            <th>lg(100λ)</th>
            <th>lg Re</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(res, index) in results" :key="index">
            <td>{{ index + 1 }}</td>
            <td>{{ res.qAvg }}</td>
            <td>{{ res.v }}</td>
            <td>{{ res.hf }}</td>
            <td>{{ res.lambda }}</td>
            <td>{{ res.re }}</td>           
            <td>{{ res.lg100Lambda }}</td>
            <td>{{ res.lgRe }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 4. 绘图分析 -->
    <div v-if="results.length > 0" class="section chart-section">
      <h3>4. 绘图分析 (lg(100λ) - lg Re 关系曲线)</h3>
      <div class="chart-container">
        <v-chart class="chart" :option="chartOption" autoresize />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, reactive } from 'vue'

// --- ECharts 引入 ---
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
  nu: number | null
  l: number | null
  delta: number | null
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
  hf: string
  lambda: string
  re: string
  lgRe: string
  lg100Lambda: string
}

// 状态定义
const constants = reactive<Constants>({
  d: null,
  t: null,
  nu: null,
  l: null,
  delta: null
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
const chartOption = ref({})

// 计算属性：断面面积 A (cm²)
const area = computed(() => {
  if (constants.d === null) return 0
  return (Math.PI * Math.pow(constants.d, 2)) / 4
})

// 计算属性：l/d
const ldRatio = computed(() => {
  if (constants.d === null || constants.l === null || constants.d === 0) return 0
  return constants.l / constants.d
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
  const maxC = 5 

  let nextR = r
  let nextC = c

  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) {
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

// 方法：计算
const calc = () => {
  if (!constants.d || constants.t === null || !constants.nu || !constants.l) {
    alert("请输入完整的常数信息！")
    return
  }

  const rho = 1.0 // 水的密度 g/cm³
  const g = 981.0 // 重力加速度 cm/s²
  const A = area.value
  const v_nu = constants.nu
  const d = constants.d
  const l = constants.l

  const points: number[][] = []

  results.value = tableData.value.map(row => {
    if (row.h1 === null || row.h2 === null || row.m1 === null || row.t1 === null || row.m2 === null || row.t2 === null) {
      row.dh = '-'
      row.q1 = '-'
      row.q2 = '-'
      return { qAvg: '-', v: '-', hf: '-', lambda: '-', re: '-', lgRe: '-', lg100Lambda: '-' }
    }

    // 1. 计算中间值
    const dhVal = Math.abs(row.h1 - row.h2)
    const q1Val = row.m1 / (rho * row.t1)
    const q2Val = row.m2 / (rho * row.t2)

    row.dh = dhVal.toFixed(2)
    row.q1 = q1Val.toFixed(2)
    row.q2 = q2Val.toFixed(2)

    // 2. 计算平均流量
    const qAvgVal = (q1Val + q2Val) / 2

    // 3. 计算流速 v (cm/s)
    const vVal = qAvgVal / A

    // 4. 计算雷诺数 Re
    const reVal = (vVal * d) / v_nu

    // 5. 计算沿程阻力系数 λ = (hf * d * 2g) / (l * v^2)
    // hf = dhVal
    let lambdaVal = 0
    if (vVal > 0 && l > 0) {
      lambdaVal = (dhVal * d * 2 * g) / (l * Math.pow(vVal, 2))
    }

    // 6. 计算对数值
    const lgReVal = reVal > 0 ? Math.log10(reVal) : 0
    const lg100LambdaVal = lambdaVal > 0 ? Math.log10(100 * lambdaVal) : 0

    if (reVal > 0 && lambdaVal > 0) {
      points.push([lgReVal, lg100LambdaVal])
    }

    return {
      qAvg: qAvgVal.toFixed(2),
      v: vVal.toFixed(2),
      hf: dhVal.toFixed(2),
      lambda: lambdaVal.toFixed(4),
      re: reVal.toFixed(0),
       lg100Lambda: lg100LambdaVal.toFixed(3),
      lgRe: lgReVal.toFixed(3),
    }
  })

  // 排序点以便绘制连线
  points.sort((a, b) => {
    if (!a || !b || a[0] === undefined || b[0] === undefined) return 0
    return a[0] - b[0]
  })

  chartOption.value = {
    title: {
      text: 'lg(100λ) - lg Re 关系曲线',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    xAxis: {
      type: 'value',
      name: 'lg Re',
      nameLocation: 'middle',
      nameGap: 30,
      scale: true
    },
    yAxis: {
      type: 'value',
      name: 'lg(100λ)',
      scale: true
    },
    series: [
      {
        name: '实验点',
        type: 'line', // 使用折线图连接点
        data: points,
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: { color: '#5470c6' },
        smooth: true
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
</style>
