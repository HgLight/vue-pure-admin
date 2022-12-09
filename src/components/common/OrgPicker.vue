<script setup lang="ts">
import { ref, computed } from "vue";
import { isEmpty } from "@pureadmin/utils";
import { ElMessageBox } from "element-plus";
import { message } from "@pureadmin/components";

import { getOrgTree, getUserByName } from "@/api/org";

defineOptions({
  name: "OrgPicker"
});

const emit = defineEmits(["ok", "close"]);

const props = defineProps({
  title: {
    default: "请选择",
    type: String
  },
  type: {
    default: "org", //org选择部门/人员  user-选人  dept-选部门 role-选角色
    type: String
  },
  multiple: {
    //是否多选
    default: false,
    type: Boolean
  },
  selected: {
    default: () => {
      return [];
    },
    type: Array
  }
});

const visible = ref(false);
const loading = ref(false);
const checkAll = ref(false);
const nowDeptId = ref(null);
const searchUsers = ref([]);
const nodes = ref([]);
const select = ref([]);
const search = ref("");
const deptStack = ref([]);

const deptStackStr = computed(() => {
  return String(deptStack.value.map(v => v.name)).replaceAll(",", " > ");
});
const orgs = computed(() => {
  return !search.value || search.value.trim() === ""
    ? nodes.value
    : searchUsers.value;
});
const showUsers = computed(() => {
  return search.value || search.value.trim() !== "";
});

function show() {
  visible.value = true;
  init();
  getOrgList();
}
function close() {
  emit("close");
  recover();
}
defineExpose({ show, close });

function orgItemClass(org) {
  return {
    "org-item": true,
    "org-dept-item": org.type === "dept",
    "org-user-item": org.type === "user",
    "org-role-item": org.type === "role"
  };
}
function disableDept(node) {
  return props.type === "user" && "dept" === node.type;
}
function getOrgList() {
  loading.value = true;
  getOrgTree({ deptId: nowDeptId.value, type: props.type })
    .then(rsp => {
      loading.value = false;
      nodes.value = rsp.data;
      selectToLeft();
    })
    .catch(err => {
      loading.value = false;
      message.error(err.response.data);
    });
}
function getShortName(name) {
  if (name) {
    return name.length > 2 ? name.substring(1, 3) : name;
  }
  return "**";
}
function searchUser() {
  const userName = search.value.trim();
  searchUsers.value = [];
  loading.value = true;
  getUserByName({ userName: userName })
    .then(rsp => {
      loading.value = false;
      searchUsers.value = rsp.data;
      selectToLeft();
    })
    .catch(_err => {
      loading.value = false;
      message.error("接口异常");
    });
}
function selectToLeft() {
  const _nodes = search.value.trim() === "" ? nodes.value : searchUsers.value;
  _nodes.forEach(node => {
    for (let i = 0; i < select.value.length; i++) {
      if (select.value[i].id === node.id) {
        node.selected = true;
        break;
      } else {
        node.selected = false;
      }
    }
  });
}
function selectChange(node) {
  if (node.selected) {
    checkAll.value = false;
    for (let i = 0; i < select.value.length; i++) {
      if (select.value[i].id === node.id) {
        select.value.splice(i, 1);
        break;
      }
    }
    node.selected = false;
  } else if (!disableDept(node)) {
    node.selected = true;
    const _nodes = search.value.trim() === "" ? nodes.value : searchUsers.value;
    if (!props.multiple) {
      _nodes.forEach(nd => {
        if (node.id !== nd.id) {
          nd.selected = false;
        }
      });
    }
    if (node.type === "dept") {
      if (!props.multiple) {
        select.value = [node];
      } else {
        select.value.unshift(node);
      }
    } else {
      if (!props.multiple) {
        select.value = [node];
      } else {
        select.value.push(node);
      }
    }
  }
}
function noSelected(index) {
  let _nodes = nodes.value;
  for (let f = 0; f < 2; f++) {
    for (let i = 0; i < _nodes.length; i++) {
      if (nodes[i].id === select.value[index].id) {
        nodes[i].selected = false;
        checkAll.value = false;
        break;
      }
    }
    _nodes = searchUsers.value;
  }
  select.value.splice(index, 1);
}
function handleCheckAllChange() {
  nodes.value.forEach(node => {
    if (checkAll.value) {
      if (!node.selected && !disableDept(node)) {
        node.selected = true;
        select.value.push(node);
      }
    } else {
      node.selected = false;
      for (let i = 0; i < select.value.length; i++) {
        if (select.value[i].id === node.id) {
          select.value.splice(i, 1);
          break;
        }
      }
    }
  });
}
function nextNode(node) {
  nowDeptId.value = node.id;
  deptStack.value.push(node);
  getOrgList();
}
function beforeNode() {
  if (deptStack.value.length === 0) {
    return;
  }
  if (deptStack.value.length < 2) {
    nowDeptId.value = null;
  } else {
    nowDeptId.value = deptStack.value[deptStack.value.length - 2].id;
  }
  deptStack.value.splice(deptStack.value.length - 1, 1);
  getOrgList();
}
function recover() {
  select.value = [];
  nodes.value.forEach(nd => (nd.selected = false));
}
function selectOk() {
  emit(
    "ok",
    Object.assign(
      [],
      select.value.map(v => {
        v.avatar = undefined;
        return v;
      })
    )
  );
  visible.value = false;
  recover();
}
function clearSelected() {
  ElMessageBox.confirm("您确定要清空已选中的项?", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    recover();
  });
}

function init() {
  checkAll.value = false;
  nowDeptId.value = null;
  deptStack.value = [];
  nodes.value = [];
  select.value = Object.assign([], props.selected);
  selectToLeft();
}
</script>

<template>
  <WDialog
    :border="false"
    closeFree
    width="600px"
    @ok="selectOk"
    :title="title"
    v-model="visible"
  >
    <div class="picker">
      <div class="candidate" v-loading="loading">
        <div v-if="type !== 'role'">
          <el-input
            v-model="search"
            @input="searchUser"
            style="width: 95%"
            size="small"
            clearable
            placeholder="搜索人员，支持拼音、姓名"
            prefix-icon="el-icon-search"
          />
          <div v-show="!showUsers">
            <Ellipsis
              hoverTip
              style="height: 18px; color: #8c8c8c; padding: 5px 0 0"
              :row="1"
              :content="deptStackStr"
            >
              <template #pre>
                <i class="el-icon-office-building" />
              </template>
            </Ellipsis>
            <div style="margin-top: 5px">
              <el-checkbox
                v-model="checkAll"
                @change="handleCheckAllChange"
                :disabled="!multiple"
                >全选</el-checkbox
              >
              <span
                v-show="deptStack.length > 0"
                class="top-dept"
                @click="beforeNode"
                >上一级</span
              >
            </div>
          </div>
        </div>
        <div class="role-header" v-else>
          <div>系统角色</div>
        </div>
        <div class="org-items" :style="type === 'role' ? 'height: 350px' : ''">
          <el-empty
            :image-size="100"
            description="似乎没有数据"
            v-show="orgs.length === 0"
          />
          <div
            v-for="(org, index) in orgs"
            :key="index"
            :class="orgItemClass(org)"
            @click="selectChange(org)"
          >
            <el-checkbox v-model="org.selected" :disabled="disableDept(org)" />
            <div v-if="org.type === 'dept'">
              <i class="el-icon-folder-opened" />
              <span class="name">{{ org.name }}</span>
              <span
                @click.stop="nextNode(org)"
                :class="`next-dept${org.selected ? '-disable' : ''}`"
              >
                <i class="iconfont icon-map-site" />下级
              </span>
            </div>
            <div
              v-else-if="org.type === 'user'"
              style="display: flex; align-items: center"
            >
              <el-avatar
                :size="35"
                :src="org.avatar"
                v-if="!isEmpty(org.avatar)"
              />
              <span v-else class="avatar">{{ getShortName(org.name) }}</span>
              <span class="name">{{ org.name }}</span>
            </div>
            <div style="display: inline-block" v-else>
              <i class="iconfont icon-bumen" />
              <span class="name">{{ org.name }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="selected">
        <div class="count">
          <span>已选 {{ select.length }} 项</span>
          <span @click="clearSelected">清空</span>
        </div>
        <div class="org-items" style="height: 350px">
          <el-empty
            :image-size="100"
            description="请点击左侧列表选择数据"
            v-show="select.length === 0"
          />
          <div
            v-for="(org, index) in select"
            :key="index"
            :class="orgItemClass(org)"
          >
            <div v-if="org.type === 'dept'">
              <i class="el-icon-folder-opened" />
              <span style="position: static" class="name">{{ org.name }}</span>
            </div>
            <div
              v-else-if="org.type === 'user'"
              style="display: flex; align-items: center"
            >
              <el-avatar
                :size="35"
                :src="org.avatar"
                v-if="!isEmpty(org.avatar)"
              />
              <span v-else class="avatar">{{ getShortName(org.name) }}</span>
              <span class="name">{{ org.name }}</span>
            </div>
            <div v-else>
              <i class="iconfont icon-bumen" />
              <span class="name">{{ org.name }}</span>
            </div>
            <i class="el-icon-close" @click="noSelected(index)" />
          </div>
        </div>
      </div>
    </div>
  </WDialog>
</template>

<style lang="scss" scoped>
$containWidth: 278px;

.candidate,
.selected {
  position: absolute;
  display: inline-block;
  width: $containWidth;
  height: 400px;
  border: 1px solid #e8e8e8;
}

.picker {
  height: 402px;
  position: relative;
  text-align: left;

  .candidate {
    left: 0;
    top: 0;

    .role-header {
      padding: 10px !important;
      margin-bottom: 5px;
      border-bottom: 1px solid #e8e8e8;
    }

    .top-dept {
      margin-left: 20px;
      cursor: pointer;
      color: #38adff;
    }

    .next-dept {
      float: right;
      color: $menuHover;
      cursor: pointer;
    }

    .next-dept-disable {
      float: right;
      color: #8c8c8c;
      cursor: not-allowed;
    }

    & > div:first-child {
      padding: 5px 10px;
    }
  }

  .selected {
    right: 0;
    top: 0;
  }

  .org-items {
    overflow-y: auto;
    height: 310px;

    .el-icon-close {
      position: absolute;
      right: 5px;
      cursor: pointer;
      font-size: larger;
    }

    .org-dept-item {
      padding: 10px 5px;

      & > div {
        display: inline-block;

        & > span:last-child {
          position: absolute;
          right: 5px;
        }
      }
    }

    .org-role-item {
      display: flex;
      align-items: center;
      padding: 10px 5px;
    }

    :deep(.org-user-item) {
      display: flex;
      align-items: center;
      padding: 5px;

      & > div {
        display: inline-block;
      }

      .avatar {
        width: 35px;
        text-align: center;
        line-height: 35px;
        background: $menuHover;
        color: white;
        border-radius: 50%;
      }
    }

    :deep(.org-item) {
      margin: 0 5px;
      border-radius: 5px;
      position: relative;

      .el-checkbox {
        margin-right: 10px;
      }

      .name {
        margin-left: 5px;
      }

      &:hover {
        background: #f1f1f1;
      }
    }
  }
}

.selected {
  border-left: none;

  .count {
    width: calc($containWidth - 20px);
    padding: 10px;
    display: inline-block;
    border-bottom: 1px solid #e8e8e8;
    margin-bottom: 5px;

    & > span:nth-child(2) {
      float: right;
      color: #c75450;
      cursor: pointer;
    }
  }
}

:deep(.el-dialog__body) {
  padding: 10px 20px;
}

.disabled {
  cursor: not-allowed !important;
  color: #8c8c8c !important;
}

::-webkit-scrollbar {
  float: right;
  width: 4px;
  height: 4px;
  background-color: white;
}

::-webkit-scrollbar-thumb {
  border-radius: 16px;
  background-color: #efefef;
}
</style>
