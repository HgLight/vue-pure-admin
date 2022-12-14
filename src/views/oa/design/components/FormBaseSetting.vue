<script setup lang="ts">
import { storeToRefs } from "pinia";
import { ref, onMounted } from "vue";
import { isEmpty } from "@pureadmin/utils";
import { message } from "@pureadmin/components";

import { useOAStoreHook } from "@/store/modules/oa";
import iconfont from "@/assets/iconfont/iconfont.json";
import OrgPicker from "@/components/common/OrgPicker.vue";
import { getFormGroups, updateGroup } from "@/api/design";

defineOptions({
  name: "FormBaseSetting"
});

const { design } = storeToRefs(useOAStoreHook());
const nowUserSelect = ref(null);
const showIconSelect = ref(false);
const select = ref([]);
const baseSettingRef = ref();
const orgPickerRef = ref();
const newGroup = ref("");
const fromGroup = ref([]);
const notifyTypes = ref([
  { type: "APP", name: "应用内通知" },
  { type: "EMAIL", name: "邮件通知" },
  { type: "SMS", name: "短信通知" },
  { type: "WX", name: "微信通知" },
  { type: "DING", name: "钉钉通知" }
]);
const colors = ref([
  "#ff4500",
  "#ff8c00",
  "#ffd700",
  "#90ee90",
  "#00ced1",
  "#1e90ff",
  "#c71585",
  "rgba(255, 69, 0, 0.68)",
  "rgb(255, 120, 0)",
  "hsl(181, 100%, 37%)",
  "hsla(209, 100%, 56%, 0.73)",
  "#c7158577"
]);
const icons = ref([
  "el-icon-delete-solid",
  "el-icon-s-tools",
  "el-icon-s-goods",
  "el-icon-warning",
  "el-icon-circle-plus",
  "el-icon-camera-solid",
  "el-icon-s-promotion",
  "el-icon-s-cooperation",
  "el-icon-s-platform",
  "el-icon-s-custom",
  "el-icon-s-data",
  "el-icon-s-check",
  "el-icon-s-claim"
]);
const rules = ref({
  formName: [{}],
  groupId: []
});

function getRule(msg) {
  return [{ required: true, message: msg, trigger: "blur" }];
}
function loadIconfont() {
  if (iconfont && iconfont.id) {
    iconfont.glyphs.forEach(icon => {
      icons.value.push(
        `${iconfont.font_family} ${iconfont.css_prefix_text}${icon.font_class}`
      );
    });
  }
}
function getGroups() {
  getFormGroups()
    .then(rsp => {
      fromGroup.value = rsp.data;
    })
    .catch(_err => message.error("获取分组异常"));
}
function addGroup() {
  if (newGroup.value.trim() !== "") {
    updateGroup({ name: newGroup.value.trim() }, "post")
      .then(rsp => {
        message.success(rsp.data);
        getGroups();
      })
      .catch(err => message.error(err.response.data));
  }
}
function selected(select) {
  design.value.settings.nowUserSelect = select;
  //design.value[nowUserSelect.value] = select
}
function selectUser(key) {
  select.value = design.value.settings[key];
  nowUserSelect.value = key;
  orgPickerRef.value.show();
}
function validate() {
  baseSettingRef.value.validate();
  const err = [];
  if (isEmpty(design.value.formName)) {
    err.push("表单名称未设置");
  }
  if (isEmpty(design.value.groupId)) {
    err.push("表单分组未设置");
  }
  if (design.value.settings.notify.types.length === 0) {
    err.push("审批消息通知方式未设置");
  }
  return err;
}
defineExpose({ validate });

onMounted(() => {
  getGroups();
});

loadIconfont();
</script>

<template>
  <div class="base-setup bg-bg_color" @click="showIconSelect = false">
    <el-form
      ref="baseSettingRef"
      :model="design"
      :rules="rules"
      label-position="top"
      label-width="80px"
    >
      <el-form-item label="表单图标">
        <i
          :class="design.logo.icon"
          :style="'background:' + design.logo.background"
        />
        <span class="change-icon">
          <span>
            <span>选择背景色</span>
            <el-color-picker
              v-model="design.logo.background"
              show-alpha
              :predefine="colors"
            />
          </span>
          <span>
            <span>选择图标</span>
            <el-popover placement="bottom-start" width="390" trigger="click">
              <div class="icon-select">
                <i
                  :class="i"
                  v-for="(i, id) in icons"
                  :key="id"
                  @click="design.logo.icon = i"
                />
              </div>
              <template #reference>
                <i :class="design.logo.icon" />
              </template>
            </el-popover>
            <!--<i :class="design.icon" @click.stop="showIconSelect = true"></i>-->
          </span>
        </span>
      </el-form-item>
      <el-form-item
        label="表单名称"
        :rules="getRule('请输入表单名称')"
        prop="formName"
      >
        <el-input v-model="design.formName" />
      </el-form-item>
      <el-form-item
        label="所在分组"
        :rules="getRule('请选择表单分组')"
        class="group"
        prop="groupId"
      >
        <el-select v-model="design.groupId" placeholder="请选择分组">
          <el-option
            v-for="(op, index) in fromGroup"
            :key="index"
            v-show="op.id > 1"
            :label="op.name"
            :value="op.id"
          />
        </el-select>
        <el-popover
          placement="bottom-end"
          title="新建表单分组"
          width="300"
          trigger="click"
        >
          <el-input v-model="newGroup" placeholder="请输入新的分组名">
            <template #append>
              <el-button type="primary" @click="addGroup">提交</el-button>
            </template>
            <template #reference>
              <el-button icon="el-icon-plus" type="primary">新建分组</el-button>
            </template>
          </el-input>
        </el-popover>
      </el-form-item>
      <el-form-item label="表单说明">
        <el-input
          placeholder="请输入表单说明"
          v-model="design.remark"
          type="textarea"
          show-word-limit
          :autosize="{ minRows: 2, maxRows: 5 }"
          maxlength="500"
        />
      </el-form-item>
      <el-form-item label="消息通知方式" :rules="getRule('请选择消息通知方式')">
        <el-select
          v-model="design.settings.notify.types"
          value-key="name"
          placeholder="选择消息通知方式"
          style="width: 30%"
          clearable
          multiple
          collapse-tags
        >
          <el-option
            v-for="(wc, index) in notifyTypes"
            :label="wc.name"
            :key="index"
            :value="wc"
          />
        </el-select>
        <el-input
          v-model="design.settings.notify.title"
          style="width: 68%; float: right"
          placeholder="消息通知标题"
        />
      </el-form-item>
      <el-form-item label="谁可以管理此表单">
        <el-select
          v-model="design.settings.admin"
          @click="selectUser('admin')"
          value-key="name"
          class="select-u"
          placeholder="请选择可以管理此表单的人员"
          clearable
          multiple
        >
          <el-option
            v-for="(wc, index) in design.settings.admin"
            :label="wc.name"
            :key="index"
            :value="wc"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <OrgPicker
      title="请选择可以管理此表单的人员"
      multiple
      ref="orgPickerRef"
      :selected="select"
      @ok="selected"
    />
  </div>
</template>

<style lang="scss" scoped>
:deep(.el-select-dropdown) {
  display: none;
}

.icon-select {
  display: flex;
  flex-wrap: wrap;

  i {
    cursor: pointer;
    font-size: large;
    padding: 10px;
    max-width: 38px !important;

    &:hover {
      box-shadow: 0 0 10px 2px #c2c2c2;
    }
  }
}

:deep(.select-u) {
  width: 100%;
}

.base-setup {
  overflow: auto;
  margin: 0 auto;
  width: 600px;
  height: calc(100vh - 105px);
  margin-top: 10px;
  padding: 15px 20px;

  i:first-child {
    position: relative;
    cursor: pointer;
    font-size: xx-large;
    color: #ffffff;
    border-radius: 10px;
    padding: 10px;
  }

  .change-icon {
    margin-left: 20px;

    span {
      font-size: small;
      color: #7a7a7a;
      margin-right: 15px;
    }

    i {
      cursor: pointer;
      color: #7a7a7a;
      font-size: x-large;
    }
  }

  :deep(.el-form-item__label) {
    padding: 0;
    font-weight: bold;
  }

  :deep(.el-form-item) {
    margin-bottom: 5px;
  }
}

:deep(.group) {
  .el-select {
    width: calc(100% - 130px);
  }

  .el-button {
    margin-left: 10px;
    width: 120px;
  }
}

::-webkit-scrollbar {
  width: 4px;
  height: 4px;
  background-color: #f8f8f8;
}

::-webkit-scrollbar-thumb {
  border-radius: 16px;
  background-color: #e8e8e8;
}
</style>
