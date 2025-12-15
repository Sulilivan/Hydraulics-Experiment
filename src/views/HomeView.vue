<template>
  <div class="home-container">
    <h1>水力学实验系统</h1>
    <div class="nav-links">
      <router-link to="/pressure" class="nav-item">
        <button>1. 静水压强实验</button>
      </router-link>
      
      <router-link to="/force" class="nav-item">
        <button>2. 静水总压力实验</button>
      </router-link>

      <router-link to="/reynolds" class="nav-item">
        <button>3. 雷诺实验</button>
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.home-container {
  text-align: center;
  padding: 40px;
}
.nav-links {
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
  margin-top: 30px;
}
button {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  width: 200px;
}
</style>