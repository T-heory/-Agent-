<script setup lang="ts">
import zhCn from 'element-plus/es/locale/lang/zh-cn'
</script>

<template>
  <!-- 全局中文语言包：分页、日期、空态等内置文案走中文 -->
  <el-config-provider :locale="zhCn">
    <router-view />
  </el-config-provider>
</template>
