<template>
  <div class="experiment-container">
    <h2>静水总压力实验数据输入与计算</h2>
    <form id="expForm" autocomplete="off" @submit.prevent="calc">
      <!-- 1. 有关常数 -->
      <div class="section">
        <h3>1. 有关常数</h3>
        <div class="input-row">
          <label>天平臂距离 L₀ (cm)：
            <input v-model.number="constants.L0" type="number" step="0.01" required>
          </label>
          <label>扇形体垂直距离 L (cm)：
            <input v-model.number="constants.L" type="number" step="0.01" required>
          </label>
          <label>扇形体宽度 b (cm)：
            <input v-model.number="constants.b" type="number" step="0.01" required>
          </label>
        </div>
        <div class="info-row">
          <span>扇形体平面高度 H₀ (cm)：<b>10.00</b>（已设为常数）</span>
        </div>
      </div>

      <!-- 2. 量测记录表格 -->
      <div class="section">
        <h3>2. 量测记录表格</h3>
        <table>
          <thead>
            <tr>
              <th rowspan="2">压强分布形式</th>
              <th rowspan="2">测次</th>
              <th colspan="1">水位读数 H (cm)</th>
              <th colspan="1">砝码质量 m (g)</th>
            </tr>
            <tr>
              <th>H</th>
              <th>m</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, rIndex) in tableData" :key="rIndex">
              <td v-if="rIndex % 3 === 0" rowspan="3">{{ row.type === 'triangle' ? '三角形分布' : '梯形分布' }}</td>
              <td>{{ row.index }}</td>
              <td><input :id="`cell-${rIndex}-0`" @keydown="onKeydown($event, rIndex, 0)" v-model.number="row.H" type="number" step="0.01"></td>
              <td><input :id="`cell-${rIndex}-1`" @keydown="onKeydown($event, rIndex, 1)" v-model.number="row.m" type="number" step="0.01"></td>
            </tr>
          </tbody>
        </table>
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
            <th>压强分布形式</th>
            <th>测次</th>
            <th>作用点距底部距离<br>e (cm)</th>
            <th>作用点距支点垂直距离<br>L₁ = L - e (cm)</th>
            <th>实测力矩<br>M₀ = m·g·L₀ (Ncm)</th>
            <th>实测静水压力<br>P实 (N)</th>
            <th>理论静水压力<br>P理 (N)</th>
            <th>相对值<br>y = P实 / P理</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(res, index) in results" :key="index">
            <td v-if="index % 3 === 0" rowspan="3">{{ res.typeLabel }}</td>
            <td>{{ res.index }}</td>
            <td>{{ res.e }}</td>
            <td>{{ res.L1 }}</td>
            <td>{{ res.M0 }}</td>
            <td>{{ res.P_exp }}</td>
            <td>{{ res.P_theory }}</td>
            <td>{{ res.y }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

interface Constants {
  L0: number | null
  L: number | null
  b: number | null
}

interface DataRow {
  type: 'triangle' | 'trapezoid'
  index: number
  H: number | null
  m: number | null
}

interface ResultRow {
  typeLabel: string
  index: number
  e: string
  L1: string
  M0: string
  P_exp: string
  P_theory: string
  y: string
}

const constants = reactive<Constants>({
  L0: null,
  L: null,
  b: null
})

const tableData = ref<DataRow[]>([
  { type: 'triangle', index: 1, H: null, m: null },
  { type: 'triangle', index: 2, H: null, m: null },
  { type: 'triangle', index: 3, H: null, m: null },
  { type: 'trapezoid', index: 1, H: null, m: null },
  { type: 'trapezoid', index: 2, H: null, m: null },
  { type: 'trapezoid', index: 3, H: null, m: null },
])

const results = ref<ResultRow[]>([])

// 键盘导航逻辑
const onKeydown = (e: KeyboardEvent, r: number, c: number) => {
  const maxR = tableData.value.length - 1
  const maxC = 1 // 0 for H, 1 for m

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
      if (el) el.focus()
    }
  }
}

const calc = () => {
  if (constants.L0 === null || constants.L === null || constants.b === null) {
    alert("请输入完整的常数信息！")
    return
  }

  const rho = 1000
  const g = 9.81
  const H0 = 10.00
  const L0 = constants.L0
  const L = constants.L
  const b = constants.b

  results.value = tableData.value.map(row => {
    const H = row.H || 0
    const m = row.m || 0
    
    let e_val = 0
    let P_theory_val = 0
    
    if (row.type === 'triangle') {
        e_val = H / 3
        const H_m = H / 100
        const b_m = b / 100
        P_theory_val = 0.5 * rho * g * b_m * H_m * H_m
    } else {
        const h = H - H0
        const h1 = H - H0
        const h2 = H
        const denominator = h1 + h2
        e_val = denominator !== 0 ? (H0 / 3 * (2 * h1 + h2) / denominator) : 0
        
        const H0_m = H0 / 100
        const h_m = h / 100
        const b_m = b / 100
        P_theory_val = 0.5 * rho * g * b_m * H0_m * H0_m + rho * g * b_m * H0_m * h_m
    }

    const L1_val = L - e_val
    const M0_val = m * g * L0 * 0.001
    const P_exp_val = L1_val !== 0 ? M0_val / L1_val : 0
    
    const y = P_theory_val !== 0 ? (P_exp_val / P_theory_val).toFixed(3) : ''

    return {
        typeLabel: row.type === 'triangle' ? '三角形分布' : '梯形分布',
        index: row.index,
        e: e_val.toFixed(2),
        L1: L1_val.toFixed(2),
        M0: M0_val.toFixed(2),
        P_exp: L1_val !== 0 ? P_exp_val.toFixed(2) : '',
        P_theory: P_theory_val.toFixed(2),
        y
    }
  })
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
</style>