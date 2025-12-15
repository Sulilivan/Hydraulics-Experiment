<script setup lang="ts">
// 路由模式下，App.vue 不需要引入具体页面组件
// 也不需要手动控制显示逻辑
</script>

<template>
  <!-- 路由出口：匹配到的组件将渲染在这里 -->
  <router-view />
</template>

<style>
/* 全局样式可以放在这里 */
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin-top: 20px;
}
</style>
