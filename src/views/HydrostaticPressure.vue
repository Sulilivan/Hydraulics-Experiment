<template>
  <div class="experiment-container">
    <h2>静水压强实验数据输入与计算</h2>
    <form id="expForm" autocomplete="off" @submit.prevent="calc">
      <!-- 1. 常数输入 -->
      <div class="section">
        <h3>1. 实验常数</h3>
        <div class="input-row">
          <label>A点高程 fa (cm)：
            <input v-model.number="constants.fa" type="number" step="0.01" required>
          </label>
          <label>B点高程 fb (cm)：
            <input v-model.number="constants.fb" type="number" step="0.01" required>
          </label>
        </div>
      </div>

      <!-- 2. 测量记录 -->
      <div class="section">
        <h3>2. 测量记录表</h3>
        <table>
          <thead>
            <tr>
              <th rowspan="2">实验项</th>
              <th colspan="6">测压管液面高程 f (cm)</th>
            </tr>
            <tr>
              <th>f1</th><th>f2</th><th>f3</th><th>f4</th><th>f5</th><th>f6</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, rIndex) in tableData" :key="rIndex">
              <td>{{ row.name }}</td>
              <td><input :id="`cell-${rIndex}-0`" @keydown="onKeydown($event, rIndex, 0)" v-model.number="row.f1" type="number" step="0.01"></td>
              <td><input :id="`cell-${rIndex}-1`" @keydown="onKeydown($event, rIndex, 1)" v-model.number="row.f2" type="number" step="0.01"></td>
              <td><input :id="`cell-${rIndex}-2`" @keydown="onKeydown($event, rIndex, 2)" v-model.number="row.f3" type="number" step="0.01"></td>
              <td><input :id="`cell-${rIndex}-3`" @keydown="onKeydown($event, rIndex, 3)" v-model.number="row.f4" type="number" step="0.01"></td>
              <td><input :id="`cell-${rIndex}-4`" @keydown="onKeydown($event, rIndex, 4)" v-model.number="row.f5" type="number" step="0.01"></td>
              <td><input :id="`cell-${rIndex}-5`" @keydown="onKeydown($event, rIndex, 5)" v-model.number="row.f6" type="number" step="0.01"></td>
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
            <th rowspan="2">实验项</th>
            <th colspan="5">高程差 (cm)</th>
            <th colspan="5">静水压强 (N/cm²)</th>
            <th rowspan="2">油密度<br>(g/cm³)</th>
          </tr>
          <tr>
            <th>f2-f1</th><th>f4-f3</th><th>f6-f5</th><th>f5-fa<br>=ha</th><th>f3-fb<br>=hb</th>
            <th>p₀</th><th>p'A</th><th>pA</th><th>p'B</th><th>pB</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(res, index) in results" :key="index">
            <td>{{ res.name }}</td>
            <td>{{ res.df21 }}</td>
            <td>{{ res.df43 }}</td>
            <td>{{ res.df65 }}</td>
            <td>{{ res.ha }}</td>
            <td>{{ res.hb }}</td>
            <td>{{ res.p0 }}</td>
            <td>{{ res.pA_ }}</td>
            <td>{{ res.pA }}</td>
            <td>{{ res.pB_ }}</td>
            <td>{{ res.pB }}</td>
            <td>{{ res.rho_oil }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

interface Constants {
  fa: number | null
  fb: number | null
}

interface DataRow {
  name: string
  f1: number | null
  f2: number | null
  f3: number | null
  f4: number | null
  f5: number | null
  f6: number | null
}

interface ResultRow {
  name: string
  df21: string
  df43: string
  df65: string
  ha: string
  hb: string
  p0: string
  pA_: string
  pA: string
  pB_: string
  pB: string
  rho_oil: string
}

const constants = reactive<Constants>({
  fa: null,
  fb: null
})

const tableData = ref<DataRow[]>([
  { name: 'p₀>pₐ-1', f1: null, f2: null, f3: null, f4: null, f5: null, f6: null },
  { name: 'p₀>pₐ-2', f1: null, f2: null, f3: null, f4: null, f5: null, f6: null },
  { name: 'p₀>pₐ-3', f1: null, f2: null, f3: null, f4: null, f5: null, f6: null },
  { name: 'p₀<pₐ-1', f1: null, f2: null, f3: null, f4: null, f5: null, f6: null },
  { name: 'p₀<pₐ-2', f1: null, f2: null, f3: null, f4: null, f5: null, f6: null },
  { name: 'p₀<pₐ-3', f1: null, f2: null, f3: null, f4: null, f5: null, f6: null },
])

const results = ref<ResultRow[]>([])

// 键盘导航逻辑
const onKeydown = (e: KeyboardEvent, r: number, c: number) => {
  const maxR = tableData.value.length - 1
  const maxC = 5 // 0-5 对应 f1-f6

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
  if (constants.fa === null || constants.fb === null) {
    alert("请输入A点和B点高程！")
    return
  }

  const g = 9.81
  const rho_water = 1000
  const fa = constants.fa
  const fb = constants.fb

  results.value = tableData.value.map(row => {
    const f1 = row.f1 || 0
    const f2 = row.f2 || 0
    const f3 = row.f3 || 0
    const f4 = row.f4 || 0
    const f5 = row.f5 || 0
    const f6 = row.f6 || 0

    const df21 = f2 - f1
    const df43 = f4 - f3
    const df65 = f6 - f5
    const ha = f5 - fa
    const hb = f3 - fb
    
    const ha_m = ha / 100
    const hb_m = hb / 100
    const df65_m = df65 / 100
    
    // p = rho * g * h (N/m^2 = Pa). 结果需要 N/cm^2. 1 N/cm^2 = 10000 Pa.
    const p0 = (rho_water * g * df65_m) / 10000
    const pA_ = (rho_water * g * ha_m) / 10000
    const pA = p0 + pA_
    const pB_ = (rho_water * g * hb_m) / 10000
    const pB = p0 + pB_
    
    let rho_oil = ''
    const delta_f = f2 - f1
    if (delta_f !== 0) {
        // rho_oil_kgm3 = p0 * 10000 / (g * delta_f/100)
        const rho_oil_kgm3 = (p0 * 10000) / (g * delta_f / 100)
        rho_oil = (rho_oil_kgm3 / 1000).toFixed(3)
    }

    return {
      name: row.name,
      df21: df21.toFixed(2),
      df43: df43.toFixed(2),
      df65: df65.toFixed(2),
      ha: ha.toFixed(2),
      hb: hb.toFixed(2),
      p0: p0.toFixed(3),
      pA_: pA_.toFixed(3),
      pA: pA.toFixed(3),
      pB_: pB_.toFixed(3),
      pB: pB.toFixed(3),
      rho_oil
    }
  })
}
</script>

<style scoped>
.experiment-container {
  max-width: 1100px;
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

.result-section {
  background-color: #f9f9f9;
}
</style>
