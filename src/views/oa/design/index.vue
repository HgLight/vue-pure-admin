<script setup lang="ts">
import { storeToRefs } from "pinia";
import { isEmpty } from "@pureadmin/utils";
import { ElMessageBox } from "element-plus";
import { message } from "@pureadmin/components";
import { useRoute, useRouter } from "vue-router";
import { ref, computed, onBeforeUnmount } from "vue";

import { useOAStoreHook } from "@/store/modules/oa";
import FormDesign from "./components/FormDesign.vue";
import LayoutHeader from "./components/LayoutHeader.vue";
import ProcessDesign from "./components/ProcessDesign.vue";
import FormProSetting from "./components/FormProSetting.vue";
import FormBaseSetting from "./components/FormBaseSetting.vue";
import { getFormDetail, createForm, updateFormDetail } from "@/api/design";

defineOptions({
  name: "FormProcessDesign"
});

type ValidResult = {
  errs: any[];
  finished: boolean;
  success: boolean;
  title: string;
  action: string;
  desc: string;
};

const route = useRoute();
const router = useRouter();

const isNew = ref(true);
const validStep = ref(0);
const timer = ref(null);
const activeSelect = ref("baseSetting");
const validVisible = ref(false);
const validResult = ref<ValidResult>();
const validOptions = ref([
  { title: "基础信息", description: "", icon: "", status: "" },
  { title: "审批表单", description: "", icon: "", status: "" },
  { title: "审批流程", description: "", icon: "", status: "" },
  { title: "扩展设置", description: "", icon: "", status: "" }
]);
const validComponents = ref([
  "baseSetting",
  "formSetting",
  "processDesign",
  "proSetting"
]);
const { design } = storeToRefs(useOAStoreHook());

const errTitle = computed(() => {
  if (validResult.value.finished && !validResult.value.success) {
    return (
      validResult.value.title + ` (${validResult.value.errs.length}项错误) 😥`
    );
  }
  return validResult.value.title;
});
const validIcon = computed(() => {
  if (!validResult.value.finished) {
    return "el-icon-loading";
  } else if (validResult.value.success) {
    return "success";
  } else {
    return "warning";
  }
});

function loadFormInfo(formId) {
  getFormDetail(formId)
    .then(rsp => {
      console.log(rsp.data);
      const form = rsp.data;
      form.logo = JSON.parse(form.logo);
      form.settings = JSON.parse(form.settings);
      form.formItems = JSON.parse(form.formItems);
      form.process = JSON.parse(form.process);
      design.value = form;
    })
    .catch(err => {
      message.error(err);
    });
}
function loadInitFrom() {
  design.value = {
    formId: null,
    formName: "未命名表单",
    logo: {
      icon: "el-icon-eleme",
      background: "#1e90ff"
    },
    settings: {
      commiter: [],
      admin: [],
      sign: false,
      notify: {
        types: ["APP"],
        title: "消息通知标题"
      }
    },
    groupId: undefined,
    formItems: [],
    process: {
      id: "root",
      parentId: null,
      type: "ROOT",
      name: "发起人",
      desc: "任何人",
      props: {
        assignedUser: [],
        formPerms: []
      },
      children: {}
    },
    remark: "备注说明"
  };
}
function validateDesign() {
  validVisible.value = true;
  validStep.value = 0;
  showValiding();
  stopTimer();
  timer.value = setInterval(() => {
    validResult.value.errs =
      this.$refs[validComponents.value[validStep.value]].validate();
    if (
      Array.isArray(validResult.value.errs) &&
      validResult.value.errs.length === 0
    ) {
      validStep.value++;
      if (validStep.value >= validOptions.value.length) {
        stopTimer();
        showValidFinish(true, null);
      }
    } else {
      stopTimer();
      validOptions.value[validStep.value].status = "error";
      showValidFinish(false, getDefaultValidErr());
    }
  }, 300);
}
function getDefaultValidErr() {
  switch (validStep.value) {
    case 0:
      return "请检查基础设置项";
    case 1:
      return "请检查审批表单相关设置";
    case 2:
      return "请检查审批流程，查看对应标注节点错误信息";
    case 3:
      return "请检查扩展设置";
    default:
      return "未知错误";
  }
}
function showValidFinish(success, err) {
  validResult.value.success = success;
  validResult.value.finished = true;
  validResult.value.title = success ? "校验完成 😀" : "校验失败 ";
  validResult.value.desc = success ? "设置项校验成功，是否提交？" : err;
  validResult.value.action = success ? "提 交" : "去修改";
}
function showValiding() {
  validResult.value = {
    errs: [],
    finished: false,
    success: false,
    title: "检查中...",
    action: "处理",
    desc: "正在检查设置项"
  };
  validStep.value = 0;
  validOptions.value.forEach(op => {
    op.status = "";
    op.icon = "";
    op.description = "";
  });
}
function doAfter() {
  if (validResult.value.success) {
    doPublish();
  } else {
    activeSelect.value = validComponents.value[validStep.value];
    validVisible.value = false;
  }
}
function stopTimer() {
  if (timer.value) {
    clearInterval(timer.value);
  }
}
function preview() {
  validateDesign();
}
function publishProcess() {
  validateDesign();
}
function doPublish() {
  ElMessageBox.confirm(
    "如果您只想预览请选择预览，确认发布后流程立即生效，是否继续?",
    "提示",
    {
      confirmButtonText: "发布",
      cancelButtonText: "取消",
      type: "warning"
    }
  ).then(() => {
    console.log(design.value);
    const template = {
      formId: design.value.formId,
      formName: design.value.formName,
      logo: JSON.stringify(design.value.logo),
      settings: JSON.stringify(design.value.settings),
      groupId: design.value.groupId,
      formItems: JSON.stringify(design.value.formItems),
      process: JSON.stringify(design.value.process),
      remark: design.value.remark
    };
    if (isNew.value || isEmpty(design.value.formId)) {
      createForm(template)
        .then(_rsp => {
          message.success("创建表单成功");
          router.push("/formsPanel");
        })
        .catch(err => {
          message.error(err);
        });
    } else {
      updateFormDetail(template)
        .then(_rsp => {
          message.success("更新表单成功");
          router.push("/formsPanel");
        })
        .catch(err => {
          message.error(err);
        });
    }
  });
}

onBeforeUnmount(() => {
  stopTimer();
});

showValiding();
const formId = route.query.code;
//判断传参，决定是新建还是加载原始数据
loadInitFrom();
if (!isEmpty(formId)) {
  isNew.value = false;
  loadFormInfo(formId);
}
const group = route.query.group;
design.value.groupId = !isEmpty(group) ? parseInt(group) : null;
</script>

<template>
  <el-container>
    <el-header>
      <LayoutHeader
        v-model="activeSelect"
        @publish="publishProcess"
        @preview="preview"
      />
    </el-header>
    <div class="layout-body">
      <FormBaseSetting
        ref="baseSetting"
        v-show="activeSelect === 'baseSetting'"
      />
      <FormDesign ref="formSetting" v-show="activeSelect === 'formSetting'" />
      <ProcessDesign
        ref="processDesign"
        v-show="activeSelect === 'processDesign'"
      />
      <FormProSetting ref="proSetting" v-show="activeSelect === 'proSetting'" />
    </div>
    <WDialog :showFooter="false" v-model="validVisible" title="设置项检查">
      <el-steps align-center :active="validStep" finish-status="success">
        <el-step
          v-for="(step, i) in validOptions"
          :title="step.title"
          :key="i"
          :icon="step.icon"
          :status="step.status"
          :description="step.description"
        />
      </el-steps>
      <el-result
        :icon="validIcon"
        :title="errTitle"
        :subTitle="validResult.desc"
      >
        <template #icon>
          <i
            style="font-size: 30px"
            v-if="!validResult.finished"
            class="el-icon-loading"
          />
        </template>
        <template #subTitle>
          <div class="err-info" v-if="validResult.errs.length > 0">
            <ellipsis
              hover-tip
              v-for="(err, i) in validResult.errs"
              :key="i + '_err'"
              :content="err"
            >
              <template #pre>
                <i class="el-icon-warning-outline" />
              </template>
            </ellipsis>
          </div>
        </template>

        <template v-slot:extra>
          <el-button
            type="primary"
            v-if="validResult.finished"
            size="small"
            @click="doAfter"
          >
            {{ validResult.action }}
          </el-button>
        </template>
      </el-result>
    </WDialog>
  </el-container>
</template>

<style lang="scss" scoped>
.layout-body {
  min-width: 980px;
}

:deep(.el-step) {
  .is-success {
    color: #2a99ff;
    border-color: #2a99ff;
  }
}

.err-info {
  max-height: 180px;
  overflow-y: auto;

  & > div {
    padding: 5px;
    margin: 2px 0;
    width: 220px;
    text-align: left;
    border-radius: 3px;
    background: rgb(242 242 242);
  }

  i {
    margin: 0 5px;
  }
}

::-webkit-scrollbar {
  width: 2px;
  height: 2px;
  background-color: white;
}

::-webkit-scrollbar-thumb {
  border-radius: 16px;
  background-color: #e8e8e8;
}
</style>
