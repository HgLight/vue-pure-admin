<script setup lang="ts">
import { storeToRefs } from "pinia";
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessageBox } from "element-plus";

import { useOAStoreHook } from "@/store/modules/oa";

defineOptions({
  name: "LayoutHeader"
});
const emit = defineEmits(["update:modelValue", "publish", "preview"]);
defineProps({
  modelValue: {
    type: String,
    default: "baseSetup"
  }
});
const router = useRouter();

const viewCode = ref(false);
const { design, isEdit } = storeToRefs(useOAStoreHook());

function publish() {
  emit("publish");
}
function preview() {
  emit("preview");
  viewCode.value = true;
}
// function valid() {
//   if (!this.$isNotEmpty(this.design.group)) {
//     this.$message.warning("请选择分组");
//     this.$router.push("/layout/baseSetup");
//     return false;
//   }
//   return true;
// }
function exit() {
  ElMessageBox.confirm("未发布的内容将不会被保存，是否直接退出 ?", "提示", {
    confirmButtonText: "退出",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    //window.location.reload()
    //this.$store.commit('clearTemplate')
    router.push("/formsPanel");
  });
}
function to(path) {
  emit("update:modelValue", path);
}
function handleSelect(key: string, keyPath: string[]) {
  console.log(key, keyPath);
}
function listener() {
  window.onunload = () => false;
  window.onbeforeunload = () => false;
}

function check() {
  if (isEdit.value === null) {
    //router.push("/workPanel");
  }
}

onMounted(() => {
  console.log(document.body.offsetWidth);
  if (document.body.offsetWidth <= 970) {
    ElMessageBox.alert(
      "本设计器未适配中小屏幕，建议您在PC电脑端浏览器进行操作"
    );
  }
  listener();
});

check();
</script>

<template>
  <div>
    <div class="header bg-bg_color">
      <el-menu
        :default-active="modelValue"
        class="el-menu-demo"
        mode="horizontal"
        @select="handleSelect"
      >
        <el-menu-item index="baseSetting" @click="to('baseSetting')"
          >① 基础信息</el-menu-item
        >
        <el-menu-item index="formSetting" @click="to('formSetting')"
          >② 审批表单</el-menu-item
        >
        <el-menu-item index="processDesign" @click="to('processDesign')"
          >③ 审批流程
        </el-menu-item>
        <el-menu-item index="proSetting" @click="to('proSetting')"
          >④ 扩展设置</el-menu-item
        >
      </el-menu>
      <div class="publish">
        <el-button size="small" @click="preview"
          ><i class="el-icon-view" />预览</el-button
        >
        <el-button size="small" type="primary" @click="publish"
          ><i class="el-icon-s-promotion" />发布</el-button
        >
      </div>
      <div class="back">
        <el-button
          @click="exit"
          size="small"
          icon="el-icon-arrow-left"
          circle
        />
        <span>
          <i
            :class="design.logo.icon"
            :style="'background:' + design.logo.background"
          />
          <span>{{ design.formName }}</span>
        </span>
      </div>
    </div>
    <el-dialog
      title="请使用手机扫码预览"
      v-model:visible="viewCode"
      width="300px"
      :close-on-click-modal="false"
      center
    >
      <img src="../../assets/image/code.png" width="250" height="250" />
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
:deep(.header) {
  min-width: 980px;
  position: relative;

  .el-menu {
    top: 0;
    z-index: 999;
    display: flex;
    justify-content: center;
    width: 100%;
  }

  .publish {
    position: absolute;
    top: 15px;
    right: 20px;
    z-index: 1000;

    i {
      margin-right: 6px;
    }

    button {
      border-radius: 15px;
    }
  }

  .back {
    position: absolute;
    z-index: 1000;
    top: 10px;
    left: 20px;
    font-size: small;

    span {
      i {
        border-radius: 10px;
        padding: 7.8px;
        font-size: 20px;
        color: #ffffff;
        margin: 0 10px;
      }
    }
  }
}
</style>
