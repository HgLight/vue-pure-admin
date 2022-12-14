<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useOAStoreHook } from "@/store/modules/oa";

defineOptions({
  name: "FormProSetting"
});
const { design } = storeToRefs(useOAStoreHook());
const settings = computed(() => {
  return design.value.settings;
});
function validate() {
  return [];
}
defineExpose({ validate });
</script>

<template>
  <div class="senior-setup bg-bg_color">
    <el-form label-position="top" label-width="80px">
      <el-form-item label="审批同意时是否签字">
        <el-switch
          inactive-text="无需签字"
          active-text="需要签字"
          v-model="settings.sign"
        />
        <div class="sign-tip">
          如果此处设置为 <b>需要签字</b>，则所有审批人“同意时” <b>必须签字</b>
        </div>
      </el-form-item>
    </el-form>
  </div>
</template>

<style lang="scss" scoped>
.senior-setup {
  overflow: auto;
  margin: 0 auto;
  width: 600px;
  height: calc(100vh - 105px);
  margin-top: 10px;
  padding: 15px 20px;

  .sign-tip {
    color: #949495;
    font-size: small;
    margin-left: 20px;
  }
}
</style>
