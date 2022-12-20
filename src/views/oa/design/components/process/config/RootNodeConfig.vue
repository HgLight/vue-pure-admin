<script setup lang="ts">
import { ref, computed } from "vue";

import OrgPicker from "@/components/common/OrgPicker.vue";
import OrgItems from "../OrgItems.vue";

defineOptions({
  name: "RootConfig"
});
const props = defineProps({
  config: {
    type: Object,
    default: () => {
      return {};
    }
  }
});

const orgPickerRef = ref();
const select = computed(() => {
  return props.config.assignedUser;
});

function selectOrg() {
  orgPickerRef.value.show();
}
function selected(select) {
  select.value.length = 0;
  select.forEach(val => select.value.push(val));
}
// function removeOrgItem(index) {
//   select.value.splice(index, 1);
// }
</script>

<template>
  <div>
    <p class="desc">选择能发起该审批的人员/部门，不选则默认开放给所有人</p>
    <el-button
      size="small"
      @click="selectOrg"
      icon="el-icon-plus"
      type="primary"
      round
      >请选择</el-button
    >
    <OrgItems v-model="select" />
    <OrgPicker
      title="请选择可发起本审批的人员/部门"
      multiple
      ref="orgPickerRef"
      :selected="select"
      @ok="selected"
    />
  </div>
</template>

<style lang="scss" scoped>
.desc {
  font-size: small;
  color: #8c8c8c;
}

.org-item {
  margin: 5px;
}
</style>
