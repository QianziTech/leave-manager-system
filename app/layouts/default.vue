<template>
  <a-layout class="default-layout">
    <CommonAppSidebar />
    <a-layout>
      <CommonAppHeader />
      <a-layout-content class="layout-content">
        <slot />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup>
useHead({ titleTemplate: '%s - Leave Manager' })
</script>

<style scoped>
.default-layout {
  min-height: 100vh;
}
.layout-content {
  margin: 24px;
  padding: 24px;
  background: #fff;
  border-radius: 8px;
  min-height: 280px;
}
</style>
