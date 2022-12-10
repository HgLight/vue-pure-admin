<script setup lang="ts">
import { storeToRefs } from "pinia";
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessageBox } from "element-plus";
import { message } from "@pureadmin/components";
import draggable from "vuedraggable/src/vuedraggable";

import {
  getFormGroups,
  groupItemsSort,
  updateGroup,
  updateForm
} from "@/api/design";
import { useOAStoreHook } from "@/store/modules/oa";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";

defineOptions({
  name: "FormsPanel"
});

const router = useRouter();

const groups = ref([]);
const moveSelect = ref("");
const groupsSort = ref(false);
const { isEdit } = storeToRefs(useOAStoreHook());

function getGroups() {
  getFormGroups()
    .then(rsp => {
      const _data = rsp.data || [];
      groups.value = [_data[0], _data[1]];
      groups.value.forEach(group => {
        group.items.forEach(item => {
          item.logo = JSON.parse(item.logo);
        });
      });
    })
    .catch(_err => {
      message.error("获取分组异常");
      groups.value = [];
    });
}
function newProcess(groupId) {
  isEdit.value = false;
  router.push("/oa/design/index?groupId=" + groupId);
}
function groupSort() {
  groupsSort.value = false;
  groupItemsSort(groups.value)
    .then(rsp => {
      message.success(rsp.data);
      getGroups();
    })
    .catch(err => {
      getGroups();
      message.error(err.response.data);
    });
}
function addGroup() {
  ElMessageBox.prompt("请输入要添加的组名", "新的分组名", {
    confirmButtonText: "提交",
    cancelButtonText: "取消",
    inputPattern: /^[\u4E00-\u9FA5A-Za-z0-9\\-]{1,30}$/,
    inputErrorMessage: "分组名不能为空且长度小于30",
    inputPlaceholder: "请输入分组名"
  }).then(({ value }) => {
    updateGroup({ name: value }, "post")
      .then(rsp => {
        message.success(rsp.data);
        getGroups();
      })
      .catch(err => message.error(err.response.data));
  });
}
function delGroup(group) {
  ElMessageBox.confirm(
    "删除分组并不会删除表单，表单将会被转移到 “其他” 分组，确定要删除分组 " +
      group.name +
      "?",
    "提示",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    }
  ).then(() => {
    updateGroup({ id: group.id }, "delete")
      .then(rsp => {
        message.success(rsp.data);
        getGroups();
      })
      .catch(err => message.error(err.response.data));
  });
}
function editGroup(group) {
  ElMessageBox.prompt("请输入新的组名", "修改分组名", {
    confirmButtonText: "提交",
    cancelButtonText: "取消",
    inputPattern: /^[\u4E00-\u9FA5A-Za-z0-9\\-]{1,30}$/,
    inputErrorMessage: "分组名不能为空且长度小于30",
    inputPlaceholder: "请输入分组名",
    inputValue: group.name
  }).then(({ value }) => {
    updateGroup({ id: group.id, name: value }, "put")
      .then(rsp => {
        message.success(rsp.data);
        getGroups();
      })
      .catch(err => message.error(err.response.data));
  });
}
function handleUpdateForm(item, type) {
  updateForm({ templateId: item.id, type: type })
    .then(rsp => {
      message.success(rsp.data);
      getGroups();
    })
    .catch(err => message.error(err.response.data));
}
function editFrom(item, _group) {
  router.push("/oa/design/index?code=" + item.formId);
}
function stopFrom(item) {
  const tip = item.isStop
    ? " 启用后将会进入 “其他” 分组，是否继续？"
    : " 停用后将会被转移到 “已停用” 分组，您可以再次启用或者删除它，是否继续?";
  ElMessageBox.confirm(item.name + tip, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    handleUpdateForm(item, item.isStop ? "using" : "stop");
  });
}
function moveFrom(item) {
  if (item.isStop) {
    ElMessageBox.confirm(
      "您确定要删除表单 " + item.name + " 吗，删除后无法恢复，是否继续？",
      "提示",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    ).then(() => {
      handleUpdateForm(item, "delete");
    });
  } else {
    if (moveSelect.value === null || moveSelect.value === "") {
      message.error("请选择分组");
      return;
    }
    updateForm({ templateId: item.id, type: "move", groupId: moveSelect.value })
      .then(rsp => {
        message.success(rsp.data);
        getGroups();
        moveSelect.value = null;
      })
      .catch(err => message.error(err.response.data));
  }
}

onMounted(() => {
  getGroups();
});
</script>

<template>
  <el-card shadow="hover" :body-style="{ padding: '20px' }">
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <el-button
            :icon="useRenderIcon('back')"
            type="info"
            size="small"
            circle
            plain
            style="margin-right: 15px"
            @click="router.push('/')"
          />
          <span>流程面板</span>
          <span style="color: #c75450; margin-left: 20px"
            >📢
            大家要体验的话，尽量使用已有的分组和流程进行编辑，不要随意新建，数据有点乱哈，谢谢了❤</span
          >
        </div>
        <div>
          <el-button
            type="primary"
            :icon="useRenderIcon('plus')"
            size="small"
            @click="newProcess"
            >新建表单</el-button
          >
          <el-button
            :icon="useRenderIcon('plus')"
            @click="addGroup"
            size="small"
            >新建分组</el-button
          >
        </div>
      </div>
    </template>
    <draggable
      v-if="groups.length > 0"
      v-model="groups"
      group="group"
      item-key="id"
      handle=".el-icon-rank"
      filter=".undrag"
      chosenClass="chosen"
      animation="300"
      forceFallback="true"
      @start="groupsSort = true"
      :options="{
        animation: 300,
        sort: true,
        scroll: true,
        chosenClass: 'choose'
      }"
      @end="groupSort"
    >
      <template #item="{ element }">
        <div
          :class="{
            'form-group': true,
            undrag: element.id === 0 || element.id === undefined
          }"
          v-show="element.id > 1 || element.items.length > 0"
          :key="element.id"
        >
          <div class="form-group-title">
            <span>{{ element.name }}</span>
            <span>({{ element.items.length }})</span>
            <IconifyIconOffline
              icon="rank"
              class="el-icon-rank"
              title="长按拖动可对分组排序"
            />
            <div v-if="!(element.id === 0 || element.id === undefined)">
              <el-dropdown>
                <el-button text :icon="useRenderIcon('setting')"
                  >编辑分组</el-button
                >
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      :icon="useRenderIcon('edit')"
                      @click="editGroup(element)"
                      >修改名称</el-dropdown-item
                    >
                    <el-dropdown-item
                      :icon="useRenderIcon('delete')"
                      @click="delGroup(element)"
                      >删除分组</el-dropdown-item
                    >
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
          <draggable
            style="width: 100%; min-height: 25px"
            v-model="element.items"
            group="from"
            item-key="formId"
            @end="groupSort"
            v-show="!groupsSort"
            filter=".undrag"
            :options="{
              animation: 300,
              delay: 200,
              chosenClass: 'choose',
              scroll: true,
              sort: true
            }"
          >
            <template #item="scope">
              <div
                class="flex flex-wrap items-center"
                :class="{
                  'form-group-item': true,
                  undrag: scope.element.isStop
                }"
                title="长按0.5S后可拖拽表单进行排序"
              >
                <div class="flex-1">
                  <i
                    :class="scope.element.logo.icon"
                    :style="'background: ' + scope.element.logo.background"
                  />
                  <span>{{ scope.element.formName }}</span>
                  <br />
                </div>
                <div class="flex-1 desp">{{ scope.element.remark }}</div>
                <div class="flex-1">
                  <span>最后更新时间：{{ scope.element.updated }}</span>
                </div>
                <div class="flex-1">
                  <el-button
                    text
                    :icon="useRenderIcon('edit')"
                    size="small"
                    @click="editFrom(scope.element, element)"
                    >编辑</el-button
                  >
                  <el-button
                    text
                    :icon="
                      useRenderIcon(scope.element.isStop ? 'check' : 'close')
                    "
                    size="small"
                    @click="stopFrom(scope.element)"
                  >
                    {{ scope.element.isStop ? "启用" : "停用" }}
                  </el-button>

                  <el-button
                    text
                    :icon="useRenderIcon('delete')"
                    size="small"
                    @click="moveFrom(scope.element)"
                    v-if="scope.element.isStop"
                    >删除
                  </el-button>
                  <el-popover
                    placement="left"
                    trigger="click"
                    width="400"
                    style="margin-left: 10px"
                    @show="moveSelect === null"
                    v-else
                  >
                    <el-radio-group v-model="moveSelect" size="small">
                      <el-radio
                        :label="g.id"
                        border
                        v-for="g in groups"
                        :key="g.id"
                        v-show="g.id > 1"
                        :disabled="g.id === element.id"
                        style="margin: 10px"
                        >{{ g.name }}</el-radio
                      >
                    </el-radio-group>
                    <div style="text-align: right; margin: 0">
                      <el-button
                        type="primary"
                        size="small"
                        @click="moveFrom(scope.element)"
                        >提交</el-button
                      >
                    </div>
                    <template #reference>
                      <el-button
                        text
                        :icon="useRenderIcon('promotion')"
                        size="small"
                        >移动</el-button
                      >
                    </template>
                  </el-popover>
                </div>
              </div>
            </template>
          </draggable>
          <div
            style="text-align: center"
            v-if="element.items === undefined || element.items.length === 0"
          >
            <el-button
              style="padding-top: 0"
              text
              :icon="useRenderIcon('plus')"
              @click="newProcess(element.id)"
              >创建新表单</el-button
            >
          </div>
        </div>
      </template>
    </draggable>
  </el-card>
</template>

<style lang="scss" scoped>
body {
  background: #ffffff !important;
}

.undrag {
  background: #ebecee !important;
}

.from-panel {
  padding: 20px;
  min-width: 500px;
  background: #ffffff;

  :deep(.from-title) {
    div {
      float: right;

      .el-button {
        border-radius: 15px;
      }
    }
  }

  //height: 100vh;
}

.choose {
  background: #e9ebee;
}

.form-group {
  margin: 0 0 20px;
  padding: 5px 0px;
  border-radius: 10px;
  box-shadow: 1px 1px 10px 0 #d2d2d2;

  &:hover {
    box-shadow: 1px 1px 12px 0 #b3b3b3;
  }

  .form-group-title {
    padding: 5px 20px;
    height: 40px;
    line-height: 40px;
    border-bottom: 1px solid #d3d3d3;

    .el-icon-rank {
      display: none;
      cursor: move;
    }

    &:hover {
      .el-icon-rank {
        display: inline-block;
      }
    }

    div {
      display: inline-block;
      float: right;
    }

    span:first-child {
      margin-right: 5px;
      font-size: 15px;
      font-weight: bold;
    }

    span:nth-child(2) {
      color: #656565;
      font-size: small;
      margin-right: 10px;
    }

    :deep(.el-button) {
      color: #404040;
      margin-left: 20px;

      &:hover {
        color: #2b2b2b;
      }
    }
  }

  .form-group-item:nth-child(1) {
    border-top: none !important;
  }

  .form-group-item {
    color: #3e3e3e;
    font-size: small;
    padding: 10px 0;
    margin: 0 20px;
    height: 40px;
    position: relative;
    line-height: 40px;
    border-top: 1px solid #d3d3d3;
    box-sizing: content-box;

    div {
      display: flex;
    }

    i {
      border-radius: 10px;
      padding: 7px;
      font-size: 20px;
      color: #ffffff;
      margin-right: 10px;
    }

    div:nth-child(2) {
      color: #7a7a7a;
      font-size: 12px;
      left: 200px;
      max-width: 300px;
      overflow: hidden;
    }
  }
}

@media screen and (max-width: 1000px) {
  .desp {
    display: none !important;
  }
}

@media screen and (max-width: 800px) {
  .from-panel {
    padding: 20px 10px;
  }
}
</style>
