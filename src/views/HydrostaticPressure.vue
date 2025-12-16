<template>
  <div>
    <h2>静水压强实验数据输入与计算</h2>
    <form id="expForm" autocomplete="off">
      <div style="margin-bottom:10px;">
        <label>A点高程 fa (cm)：<input name="fa" id="fa" type="number" step="0.01" required tabindex="1"></label>
        &nbsp;&nbsp;
        <label>B点高程 fb (cm)：<input name="fb" id="fb" type="number" step="0.01" required tabindex="2"></label>
      </div>
      <table>
        <tbody>
          <tr>
            <th rowspan="2">实验项</th>
            <th colspan="6">测压管液面高程 f (cm)</th>
          </tr>
          <tr>
            <th>f1</th><th>f2</th><th>f3</th><th>f4</th><th>f5</th><th>f6</th>
          </tr>
          <tr>
            <td>p₀&gt;pₐ-1</td>
            <td><input name="f1_1" type="number" step="0.01" required tabindex="3"></td>
            <td><input name="f2_1" type="number" step="0.01" required tabindex="4"></td>
            <td><input name="f3_1" type="number" step="0.01" required tabindex="5"></td>
            <td><input name="f4_1" type="number" step="0.01" required tabindex="6"></td>
            <td><input name="f5_1" type="number" step="0.01" required tabindex="7"></td>
            <td><input name="f6_1" type="number" step="0.01" required tabindex="8"></td>
          </tr>
          <tr>
            <td>p₀&gt;pₐ-2</td>
            <td><input name="f1_2" type="number" step="0.01" required tabindex="9"></td>
            <td><input name="f2_2" type="number" step="0.01" required tabindex="10"></td>
            <td><input name="f3_2" type="number" step="0.01" required tabindex="11"></td>
            <td><input name="f4_2" type="number" step="0.01" required tabindex="12"></td>
            <td><input name="f5_2" type="number" step="0.01" required tabindex="13"></td>
            <td><input name="f6_2" type="number" step="0.01" required tabindex="14"></td>
          </tr>
          <tr>
            <td>p₀&gt;pₐ-3</td>
            <td><input name="f1_3" type="number" step="0.01" required tabindex="15"></td>
            <td><input name="f2_3" type="number" step="0.01" required tabindex="16"></td>
            <td><input name="f3_3" type="number" step="0.01" required tabindex="17"></td>
            <td><input name="f4_3" type="number" step="0.01" required tabindex="18"></td>
            <td><input name="f5_3" type="number" step="0.01" required tabindex="19"></td>
            <td><input name="f6_3" type="number" step="0.01" required tabindex="20"></td>
          </tr>
          <tr>
            <td>p₀&lt;pₐ-1</td>
            <td><input name="f1_4" type="number" step="0.01" required tabindex="21"></td>
            <td><input name="f2_4" type="number" step="0.01" required tabindex="22"></td>
            <td><input name="f3_4" type="number" step="0.01" required tabindex="23"></td>
            <td><input name="f4_4" type="number" step="0.01" required tabindex="24"></td>
            <td><input name="f5_4" type="number" step="0.01" required tabindex="25"></td>
            <td><input name="f6_4" type="number" step="0.01" required tabindex="26"></td>
          </tr>
          <tr>
            <td>p₀&lt;pₐ-2</td>
            <td><input name="f1_5" type="number" step="0.01" required tabindex="27"></td>
            <td><input name="f2_5" type="number" step="0.01" required tabindex="28"></td>
            <td><input name="f3_5" type="number" step="0.01" required tabindex="29"></td>
            <td><input name="f4_5" type="number" step="0.01" required tabindex="30"></td>
            <td><input name="f5_5" type="number" step="0.01" required tabindex="31"></td>
            <td><input name="f6_5" type="number" step="0.01" required tabindex="32"></td>
          </tr>
          <tr>
            <td>p₀&lt;pₐ-3</td>
            <td><input name="f1_6" type="number" step="0.01" required tabindex="33"></td>
            <td><input name="f2_6" type="number" step="0.01" required tabindex="34"></td>
            <td><input name="f3_6" type="number" step="0.01" required tabindex="35"></td>
            <td><input name="f4_6" type="number" step="0.01" required tabindex="36"></td>
            <td><input name="f5_6" type="number" step="0.01" required tabindex="37"></td>
            <td><input name="f6_6" type="number" step="0.01" required tabindex="38"></td>
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
        const g = 9.81;
        const rho_water = 1000;
        let html = `<h3>计算结果</h3>`;
        html += `<table><tr><th rowspan=2>实验项</th><th colspan=5>高程差 (cm)</th><th colspan=5>静水压强 (N/cm²)</th><th rowspan=2>油密度 (g/cm³)</th></tr>`;
        html += `<tr><th>f2-f1</th><th>f4-f3</th><th>f6-f5</th><th>f5-fa=ha</th><th>f3-fb=hb</th><th>p₀</th><th>p'A</th><th>pA</th><th>p'B</th><th>pB</th></tr>`;
        // TS修复: 断言为 any
        const form = document.getElementById("expForm") as any;
        let fa = +form.elements["fa"].value;
        let fb = +form.elements["fb"].value;
        for(let i=1;i<=6;i++){
            let f1=+form.elements[`f1_${i}`].value;
            let f2=+form.elements[`f2_${i}`].value;
            let f3=+form.elements[`f3_${i}`].value;
            let f4=+form.elements[`f4_${i}`].value;
            let f5=+form.elements[`f5_${i}`].value;
            let f6=+form.elements[`f6_${i}`].value;
            let df21 = (f2-f1).toFixed(2);
            let df43 = (f4-f3).toFixed(2);
            let df65 = (f6-f5).toFixed(2);
            let ha = (f5-fa).toFixed(2);
            let hb = (f3-fb).toFixed(2);
            let ha_m = (f5-fa)/100;
            let hb_m = (f3-fb)/100;
            let df65_m = (f6-f5)/100;
            let p0 = rho_water * g * df65_m / 10000;
            let pA_ = rho_water * g * ha_m / 10000;
            let pA = p0 + pA_;
            let pB_ = rho_water * g * hb_m / 10000;
            let pB = p0 + pB_;
            let delta_f = f2 - f1;
            let rho_oil = '';
            if (delta_f !== 0) {
                let rho_oil_kgm3 = p0 * 10000 / (g * delta_f/100);
                rho_oil = (rho_oil_kgm3 / 1000).toFixed(3);
            }
            let rowName = i<=3 ? `p₀&gt;pₐ-${i}` : `p₀&lt;pₐ-${i-3}`;
            html += `<tr><td>${rowName}</td><td>${df21}</td><td>${df43}</td><td>${df65}</td><td>${ha}</td><td>${hb}</td><td>${p0.toFixed(3)}</td><td>${pA_.toFixed(3)}</td><td>${pA.toFixed(3)}</td><td>${pB_.toFixed(3)}</td><td>${pB.toFixed(3)}</td><td>${rho_oil}</td></tr>`;
        }
        html += `</table>`;
        const resultDiv = document.getElementById('result');
        if(resultDiv) resultDiv.innerHTML = html;
      },
      rawDomLoaded: function() {
        const inputs = Array.from(document.querySelectorAll('input[type="number"]'));
        inputs.forEach((input, idx) => {
            input.addEventListener('keydown', function(e: any) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    let next = inputs[idx + 1] as HTMLElement;
                    if (next) next.focus();
                }
                if (['ArrowDown','ArrowUp','ArrowLeft','ArrowRight'].includes(e.key)) {
                    e.preventDefault();
                    let colLen = 6;
                    let totalRows = 6;
                    let faIdx = 0, fbIdx = 1;
                    let baseIdx = 2;
                    let pos = idx - baseIdx;
                    if (idx === faIdx || idx === fbIdx) return;
                    if (pos >= 0 && pos < totalRows * colLen) {
                        let row = Math.floor(pos / colLen);
                        let col = pos % colLen;
                        let nextIdx = idx;
                        if (e.key === 'ArrowRight' && col < colLen - 1) nextIdx = idx + 1;
                        if (e.key === 'ArrowLeft' && col > 0) nextIdx = idx - 1;
                        if (e.key === 'ArrowDown' && row < totalRows - 1) nextIdx = idx + colLen;
                        if (e.key === 'ArrowUp' && row > 0) nextIdx = idx - colLen;
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
input[type="number"] {
  width: 60px;
}
</style>
