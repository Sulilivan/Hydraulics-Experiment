<template>
  <div>
    <h2>静水总压力实验数据输入与计算</h2>
    <form id="expForm" autocomplete="off">
      <h3>2、有关常数</h3>
      <label>天平臂距离 L₀ (cm)：<input name="L0" type="text" required></label>
      <label>扇形体垂直距离 L (cm)：<input name="L" type="text" required></label>
      <label>扇形体宽度 b (cm)：<input name="b" type="text" required></label>
      <span>扇形体平面高度 H₀ (cm)：<b>10.00</b>（已设为常数）</span>
      <br><br>
      <h3>3、量测记录表格</h3>
      <table>
        <tbody>
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
          <tr>
            <td rowspan="3">三角形分布</td>
            <td>1</td>
            <td><input name="H_tri_1" type="text" required></td>
            <td><input name="m_tri_1" type="text" required></td>
          </tr>
          <tr>
            <td>2</td>
            <td><input name="H_tri_2" type="text" required></td>
            <td><input name="m_tri_2" type="text" required></td>
          </tr>
          <tr>
            <td>3</td>
            <td><input name="H_tri_3" type="text" required></td>
            <td><input name="m_tri_3" type="text" required></td>
          </tr>
          <tr>
            <td rowspan="3">梯形分布</td>
            <td>1</td>
            <td><input name="H_trap_1" type="text" required></td>
            <td><input name="m_trap_1" type="text" required></td>
          </tr>
          <tr>
            <td>2</td>
            <td><input name="H_trap_2" type="text" required></td>
            <td><input name="m_trap_2" type="text" required></td>
          </tr>
          <tr>
            <td>3</td>
            <td><input name="H_trap_3" type="text" required></td>
            <td><input name="m_trap_3" type="text" required></td>
          </tr>
        </tbody>
      </table>
      <br>
      <button type="button" @click="calc">计算并输出结果</button>
    </form>
    <br>
    <div id="result"></div>
  </div>
</template>

<script lang="ts">
export default {
  mounted() {
    // 路由切换后直接初始化逻辑
    this.handleDomLoaded();
  },
  methods: {
    calc() {
      // @ts-ignore
      window.calc = undefined;
      // @ts-ignore
      eval(`(${this.rawCalc})()`);
    },
    handleDomLoaded() {
      // @ts-ignore
      window.calc = undefined;
      // @ts-ignore
      eval(`(${this.rawDomLoaded})()`);
    }
  },
  data() {
    return {
      rawCalc: function calc() {
        const rho = 1000;
        const g = 9.81;
        const H0 = 10.00;
        // TS修复: 断言为 any 以避免类型检查报错
        const form = document.getElementById("expForm") as any;
        const L0 = +form.elements["L0"].value;
        const L = +form.elements["L"].value;
        const b = +form.elements["b"].value;
        let html = `<h3>4、计算表格</h3>
        <table>
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
        `;
        let rows = '';
        for(let i=1;i<=3;i++) {
          let H = +form.elements[`H_tri_${i}`].value;
          let m = +form.elements[`m_tri_${i}`].value;
          let e = (H / 3).toFixed(2);
          let L1 = (L - e).toFixed(2);
          let M0 = (m * g * L0 * 0.001).toFixed(2);
          let P_exp = (L1 != 0 ? (M0 / L1).toFixed(2) : '');
          let H_m = H / 100;
          let b_m = b / 100;
          let P_theory = (0.5 * rho * g * b_m * H_m * H_m).toFixed(2);
          let y = (P_theory != 0 ? (P_exp / P_theory).toFixed(3) : '');
          rows += `<tr>
              <td>三角形分布</td>
              <td>${i}</td>
              <td>${e}</td>
              <td>${L1}</td>
              <td>${M0}</td>
              <td>${P_exp}</td>
              <td>${P_theory}</td>
              <td>${y}</td>
          </tr>`;
        }
        for(let i=1;i<=3;i++) {
          let H = +form.elements[`H_trap_${i}`].value;
          let m = +form.elements[`m_trap_${i}`].value;
          let H0_cm = H0;
          let h = H - H0_cm;
          let a = H0_cm;
          let h1 = H - H0_cm;
          let h2 = H;
          let denominator = h1 + h2;
          let e = (denominator !== 0 ? (a / 3 * (2 * h1 + h2) / denominator).toFixed(2) : '');
          let L1 = (L - e).toFixed(2);
          let M0 = (m * g * L0 * 0.001).toFixed(2);
          let H0_m = H0_cm / 100;
          let h_m = h / 100;
          let b_m = b / 100;
          let P_theory = (0.5 * rho * g * b_m * H0_m * H0_m + rho * g * b_m * H0_m * h_m).toFixed(2);
          let P_exp = (L1 != 0 ? (M0 / L1).toFixed(2) : '');
          let y = (P_theory != 0 ? (P_exp / P_theory).toFixed(3) : '');
          rows += `<tr>
              <td>梯形分布</td>
              <td>${i}</td>
              <td>${e}</td>
              <td>${L1}</td>
              <td>${M0}</td>
              <td>${P_exp}</td>
              <td>${P_theory}</td>
              <td>${y}</td>
          </tr>`;
        }
        html += rows + '</table>';
        const resultDiv = document.getElementById('result');
        if(resultDiv) resultDiv.innerHTML = html;
      },
      rawDomLoaded: function() {
        const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
        inputs.forEach((input, idx) => {
            input.addEventListener('keydown', function(e: any) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    let next = inputs[idx + 1] as HTMLElement;
                    if (next) next.focus();
                }
                if (['ArrowDown','ArrowUp','ArrowLeft','ArrowRight'].includes(e.key)) {
                    e.preventDefault();
                    let constLen = 3;
                    let rowLen = 2;
                    let totalRows = 6;
                    let baseIdx = constLen;
                    let pos = idx - baseIdx;
                    if (idx < baseIdx) return;
                    if (pos >= 0 && pos < totalRows * rowLen) {
                        let row = Math.floor(pos / rowLen);
                        let col = pos % rowLen;
                        let nextIdx = idx;
                        if (e.key === 'ArrowRight' && col < rowLen - 1) nextIdx = idx + 1;
                        if (e.key === 'ArrowLeft' && col > 0) nextIdx = idx - 1;
                        if (e.key === 'ArrowDown' && row < totalRows - 1) nextIdx = idx + rowLen;
                        if (e.key === 'ArrowUp' && row > 0) nextIdx = idx - rowLen;
                        if (inputs[nextIdx]) (inputs[nextIdx] as HTMLElement).focus();
                    }
                }
            });
        });
      }
    }
  }
}
</script>

<style scoped>
table, th, td {
  border: 1px solid #333;
  border-collapse: collapse;
  padding: 4px 8px;
  text-align: center;
}
th {
  background: #f0f0f0;
}
input[type="text"] {
  width: 70px;
}
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type="number"] {
  -moz-appearance: textfield;
}
</style>