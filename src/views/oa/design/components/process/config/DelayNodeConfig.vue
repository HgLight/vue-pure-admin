<script setup lang="ts">
import { computed } from "vue";

import { storeToRefs } from "pinia";
import { useOAStoreHook } from "@/store/modules/oa";

defineOptions({
  name: "DelayNodeConfig"
});
const { selectedNode } = storeToRefs(useOAStoreHook());

const config = computed(() => {
  return selectedNode.value.props;
});
</script>

<template>
  <div>
    <div style="margin-bottom: 20px">
      <p class="item-desc">延时方式</p>
      <el-radio-group v-model="config.type" size="small">
        <el-radio-button label="FIXED">固定时长</el-radio-button>
        <el-radio-button label="AUTO">自动计算</el-radio-button>
      </el-radio-group>
    </div>
    <div v-if="config.type === 'FIXED'">
      <el-input
        style="width: 180px"
        placeholder="时间单位"
        size="small"
        type="number"
        v-model="config.time"
      >
        <template #append>
          <el-select
            style="width: 75px"
            v-model="config.unit"
            placeholder="请选择"
          >
            <el-option label="天" value="D" />
            <el-option label="小时" value="H" />
            <el-option label="分钟" value="M" />
          </el-select>
        </template>
      </el-input>
      <span class="item-desc"> 后进入下一步</span>
    </div>
    <div class="item-desc" v-else>
      <el-time-picker
        value-format="HH:mm:ss"
        style="width: 150px"
        size="small"
        v-model="config.dateTime"
        placeholder="任意时间点"
      />
      <span class="item-desc"> 后进入下一步</span>
    </div>
  </div>
</template>
