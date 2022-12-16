<script setup lang="ts">
import { ref, watch } from "vue";
import { storeToRefs } from "pinia";

import { useOAStoreHook } from "@/store/modules/oa";
import ProcessTree from "./process/ProcessTree";
// import NodeConfig from "../../common/process/config/NodeConfig";

defineOptions({
  name: "ProcessDesign"
});

const { selectedNode } = storeToRefs(useOAStoreHook());

const scale = ref(100);
const processTreeRef = ref();
// const selected = ref({});
const showInput = ref(false);
const showConfig = ref(false);

function validate() {
  return processTreeRef.value.validateProcess();
}
defineExpose({ validate });

function nodeSelected(node) {
  console.log("配置节点", node);
  showConfig.value = true;
}
watch(selectedNode, () => {
  /*selectedNode:{
      deep: true,
      handler(node){
        console.log("更新")
        processTreeRef.value.nodeDomUpdate(node)
      }
    }*/
});
</script>

<template>
  <el-main>
    <div class="scale">
      <el-button
        icon="el-icon-plus"
        size="small"
        @click="scale += 10"
        :disabled="scale >= 150"
        circle
      />
      <span>{{ scale }}%</span>
      <el-button
        icon="el-icon-minus"
        size="small"
        @click="scale -= 10"
        :disabled="scale <= 40"
        circle
      />
      <!--      <el-button @click="validate">校验流程</el-button>-->
    </div>
    <div class="design" :style="'transform: scale(' + scale / 100 + ');'">
      <ProcessTree ref="processTreeRef" @selectedNode="nodeSelected" />
    </div>
    <el-drawer
      v-if="selectedNode"
      :title="selectedNode.name"
      v-model:visible="showConfig"
      :modal-append-to-body="false"
      :size="selectedNode.type === 'CONDITION' ? '600px' : '500px'"
      direction="rtl"
      :modal="false"
      destroy-on-close
    >
      <template #title>
        <div>
          <el-input
            v-model="selectedNode.name"
            size="small"
            v-show="showInput"
            style="width: 300px"
            @blur="showInput = false"
          />
          <el-link
            v-show="!showInput"
            @click="showInput = true"
            style="font-size: medium"
          >
            <i class="el-icon-edit" style="margin-right: 10px" />
            {{ selectedNode.name }}
          </el-link>
        </div>
      </template>

      <div class="node-config-content">
        <!-- <NodeConfig /> -->
      </div>
    </el-drawer>
  </el-main>
</template>

<style lang="scss" scoped>
.design {
  margin-top: 100px;
  display: flex;
  transform-origin: 50% 0px 0px;
}

.scale {
  z-index: 999;
  position: fixed;
  top: 80px;
  right: 40px;

  span {
    margin: 0 10px;
    font-size: 15px;
    color: #7a7a7a;
    width: 50px;
  }
}

.node-config-content {
  padding: 0 20px 20px;
}

:deep(.el-drawer__body) {
  overflow-y: auto;
}
</style>
