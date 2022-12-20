<script setup lang="ts">
import { storeToRefs } from "pinia";
import { ref, computed } from "vue";
import { useOAStoreHook } from "@/store/modules/oa";

import OrgPicker from "@/components/common/OrgPicker.vue";
import OrgItems from "../OrgItems.vue";

defineOptions({
  name: "CcNodeConfig.vue"
});

const config = computed(() => {
  return selectedNode.value.props;
});

const orgPickerRef = ref();
const { selectedNode } = storeToRefs(useOAStoreHook());

const select = computed(() => {
  return config.value.assignedUser || [];
});

function selectOrg() {
  orgPickerRef.value.show();
}
function selected(select) {
  console.log(select);
  select.value = Object.assign([], select);
}
// function removeOrgItem(index) {
//   this.select.splice(index, 1);
// }
</script>

<template>
  <div>
    <el-button
      size="small"
      icon="el-icon-plus"
      type="primary"
      @click="selectOrg"
      round
      >选择抄送人</el-button
    >
    <div class="option">
      <el-checkbox label="允许发起人添加抄送人" v-model="config.shouldAdd" />
    </div>
    <OrgItems v-model="select" />
    <OrgPicker multiple ref="orgPickerRef" :selected="select" @ok="selected" />
  </div>
</template>

<style lang="scss" scoped>
.option {
  color: #606266;
  margin-top: 20px;
  font-size: small;
}

.desc {
  font-size: small;
  color: #8c8c8c;
}

.org-item {
  margin: 5px;
}
</style>
