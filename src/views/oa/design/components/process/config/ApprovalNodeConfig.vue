<script setup lang="ts">
import { storeToRefs } from "pinia";
import { ref, computed } from "vue";

import { useOAStoreHook } from "@/store/modules/oa";
import OrgPicker from "@/components/common/OrgPicker.vue";
import OrgItems from "../OrgItems.vue";

defineOptions({
  name: "ApprovalNodeConfig"
});
const props = defineProps({
  config: {
    type: Object,
    default: () => {
      return {};
    }
  }
});
const approvalTypes = [
  { name: "指定人员", type: "ASSIGN_USER" },
  { name: "发起人自选", type: "SELF_SELECT" },
  { name: "连续多级主管", type: "LEADER_TOP" },
  { name: "主管", type: "LEADER" },
  { name: "角色", type: "ROLE" },
  { name: "发起人自己", type: "SELF" },
  { name: "表单内联系人", type: "FORM_USER" }
];

const { selectedNode, design, nodeMap } = storeToRefs(useOAStoreHook());
const orgPickerSelected = ref([]);
const orgPickerType = ref("user");
const orgPickerRef = ref();

const nodeProps = computed(() => {
  return selectedNode.value.props;
});
const select = computed(() => {
  return props.config.assignedUser || [];
});
const forms = computed(() => {
  return design.value.formItems.filter(f => {
    return f.name === "UserPicker";
  });
});
const pickerTitle = computed(() => {
  switch (orgPickerType.value) {
    case "user":
      return "请选择人员";
    case "role":
      return "请选择系统角色";
    default:
      return null;
  }
});
const nodeOptions = computed(() => {
  const values = [];
  const excType = [
    "ROOT",
    "EMPTY",
    "CONDITION",
    "CONDITIONS",
    "CONCURRENT",
    "CONCURRENTS"
  ];
  nodeMap.value.forEach(v => {
    if (excType.indexOf(v.type) === -1) {
      values.push({ id: v.id, name: v.name });
    }
  });
  return values;
});
const showMode = computed(() => {
  switch (nodeProps.value.assignedType) {
    case "ASSIGN_USER":
      return nodeProps.value.assignedUser.length > 0;
    case "SELF_SELECT":
      return nodeProps.value.selfSelect.multiple;
    case "LEADER_TOP":
      return nodeProps.value.formUser !== "";
    case "FORM_USER":
      return true;
    case "ROLE":
      return true;
    default:
      return false;
  }
});

function selectUser() {
  orgPickerSelected.value = select.value;
  orgPickerType.value = "user";
  orgPickerRef.value.show();
}
function selectNoSetUser() {
  orgPickerSelected.value = props.config.nobody.assignedUser;
  orgPickerType.value = "user";
  orgPickerRef.value.show();
}
function selectRole() {
  orgPickerSelected.value = select.value;
  orgPickerType.value = "role";
  orgPickerRef.value.show();
}
function selected(select) {
  console.log(select);
  orgPickerSelected.value.length = 0;
  select.forEach(val => orgPickerSelected.value.push(val));
}
// function removeOrgItem(index) {
//   select.value.splice(index, 1);
// }
</script>

<template>
  <div>
    <el-form label-position="top" label-width="90px">
      <el-form-item label="⚙ 选择审批对象" prop="text" class="user-type">
        <el-radio-group v-model="nodeProps.assignedType">
          <el-radio v-for="t in approvalTypes" :label="t.type" :key="t.type">{{
            t.name
          }}</el-radio>
        </el-radio-group>
        <div v-if="nodeProps.assignedType === 'ASSIGN_USER'">
          <el-button
            size="small"
            icon="el-icon-plus"
            type="primary"
            @click="selectUser"
            round
            >选择人员</el-button
          >
          <OrgItems v-model="nodeProps.assignedUser" />
        </div>
        <div v-else-if="nodeProps.assignedType === 'SELF_SELECT'">
          <el-radio-group size="small" v-model="nodeProps.selfSelect.multiple">
            <el-radio-button :label="false">自选一个人</el-radio-button>
            <el-radio-button :label="true">自选多个人</el-radio-button>
          </el-radio-group>
        </div>
        <div v-else-if="nodeProps.assignedType === 'LEADER_TOP'">
          <el-divider />
          <el-form-item label="审批终点" prop="text" class="approve-end">
            <el-radio-group v-model="nodeProps.leaderTop.endCondition">
              <el-radio label="TOP">直到最上层主管</el-radio>
              <el-radio label="LEAVE">不超过发起人的</el-radio>
            </el-radio-group>
            <div
              class="approve-end-leave"
              v-if="nodeProps.leaderTop.endCondition === 'LEAVE'"
            >
              <span>第 </span>
              <el-input-number
                :min="1"
                :max="20"
                :step="1"
                size="small"
                v-model="nodeProps.leaderTop.level"
              />
              <span> 级主管</span>
            </div>
          </el-form-item>
        </div>
        <div v-else-if="nodeProps.assignedType === 'LEADER'">
          <el-divider />
          <el-form-item label="指定主管" prop="text">
            <span>发起人的第 </span>
            <el-input-number
              :min="1"
              :max="20"
              :step="1"
              size="small"
              v-model="nodeProps.leader.level"
            />
            <span> 级主管</span>
            <div style="color: #409eff; font-size: small">
              👉 直接主管为 第 1 级主管
            </div>
          </el-form-item>
        </div>
        <div v-else-if="nodeProps.assignedType === 'ROLE'">
          <el-button
            size="small"
            icon="el-icon-plus"
            type="primary"
            @click="selectRole"
            round
            >选择系统角色</el-button
          >
          <OrgItems v-model="nodeProps.role" />
        </div>
        <div v-else-if="nodeProps.assignedType === 'FORM_USER'">
          <el-form-item
            label="选择表单联系人项"
            prop="text"
            class="approve-end"
          >
            <el-select
              style="width: 80%"
              size="small"
              v-model="nodeProps.formUser"
              placeholder="请选择包含联系人的表单项"
            >
              <el-option
                v-for="op in forms"
                :label="op.title"
                :value="op.id"
                :key="op.id"
              />
            </el-select>
          </el-form-item>
        </div>
        <div v-else>
          <span class="item-desc">发起人自己作为审批人进行审批</span>
        </div>
      </el-form-item>

      <el-divider />
      <el-form-item label="👤 审批人为空时" prop="text" class="line-mode">
        <el-radio-group v-model="nodeProps.nobody.handler">
          <el-radio label="TO_PASS">自动通过</el-radio>
          <el-radio label="TO_REFUSE">自动驳回</el-radio>
          <el-radio label="TO_ADMIN">转交审批管理员</el-radio>
          <el-radio label="TO_USER">转交到指定人员</el-radio>
        </el-radio-group>

        <div
          style="margin-top: 10px"
          v-if="nodeProps.nobody.handler === 'TO_USER'"
        >
          <el-button
            size="small"
            icon="el-icon-plus"
            type="primary"
            @click="selectNoSetUser"
            round
            >选择人员</el-button
          >
          <OrgItems v-model="nodeProps.assignedUser" />
        </div>
      </el-form-item>

      <div v-if="showMode">
        <el-divider />
        <el-form-item
          label="👩‍👦‍👦 多人审批时审批方式"
          prop="text"
          class="approve-mode"
        >
          <el-radio-group v-model="nodeProps.mode">
            <el-radio label="NEXT"
              >会签 （按选择顺序审批，每个人必须同意）</el-radio
            >
            <el-radio label="AND">会签（可同时审批，每个人必须同意）</el-radio>
            <el-radio label="OR">或签（有一人同意即可）</el-radio>
          </el-radio-group>
        </el-form-item>
      </div>

      <el-divider>高级设置</el-divider>
      <el-form-item label="✍ 审批同意时是否需要签字" prop="text">
        <el-switch
          inactive-text="不用"
          active-text="需要"
          v-model="nodeProps.sign"
        />
        <el-tooltip
          class="item"
          effect="dark"
          content="如果全局设置了需要签字，则此处不生效"
          placement="top-start"
        >
          <i
            class="el-icon-question"
            style="margin-left: 10px; font-size: medium; color: #b0b0b1"
          />
        </el-tooltip>
      </el-form-item>
      <el-form-item label="⏱ 审批期限（为 0 则不生效）" prop="timeLimit">
        <el-input
          style="width: 180px"
          placeholder="时长"
          size="small"
          type="number"
          v-model="nodeProps.timeLimit.timeout.value"
        >
          <template #append>
            <el-select
              style="width: 75px"
              v-model="nodeProps.timeLimit.timeout.unit"
              placeholder="请选择"
            >
              <el-option label="天" value="D" />
              <el-option label="小时" value="H" />
            </el-select>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item
        label="审批期限超时后执行"
        prop="level"
        v-if="nodeProps.timeLimit.timeout.value > 0"
      >
        <el-radio-group v-model="nodeProps.timeLimit.handler.type">
          <el-radio label="PASS">自动通过</el-radio>
          <el-radio label="REFUSE">自动驳回</el-radio>
          <el-radio label="NOTIFY">发送提醒</el-radio>
        </el-radio-group>
        <div v-if="nodeProps.timeLimit.handler.type === 'NOTIFY'">
          <div style="color: #409eef; font-size: small">默认提醒当前审批人</div>
          <el-switch
            inactive-text="循环"
            active-text="一次"
            v-model="nodeProps.timeLimit.handler.notify.once"
          />
          <span
            style="margin-left: 20px"
            v-if="!nodeProps.timeLimit.handler.notify.once"
          >
            每隔
            <el-input-number
              :min="0"
              :max="10000"
              :step="1"
              size="small"
              v-model="nodeProps.timeLimit.handler.notify.hour"
            />
            小时提醒一次
          </span>
        </div>
      </el-form-item>
      <el-form-item label="🙅‍ 如果审批被驳回 👇">
        <el-radio-group v-model="nodeProps.refuse.type">
          <el-radio label="TO_END">直接结束流程</el-radio>
          <el-radio label="TO_BEFORE">驳回到上级审批节点</el-radio>
          <el-radio label="TO_NODE">驳回到指定节点</el-radio>
        </el-radio-group>
        <div v-if="nodeProps.refuse.type === 'TO_NODE'">
          <span>指定节点:</span>
          <el-select
            style="margin-left: 10px; width: 150px"
            placeholder="选择跳转步骤"
            size="small"
            v-model="nodeProps.refuse.target"
          >
            <el-option
              v-for="(node, i) in nodeOptions"
              :key="i"
              :label="node.name"
              :value="node.id"
            />
          </el-select>
        </div>
      </el-form-item>
    </el-form>
    <OrgPicker
      :title="pickerTitle"
      multiple
      :type="orgPickerType"
      ref="orgPickerRef"
      :selected="orgPickerSelected"
      @ok="selected"
    />
  </div>
</template>

<style lang="scss" scoped>
.user-type {
  :deep(.el-radio) {
    width: 110px;
    margin-top: 10px;
    margin-bottom: 20px;
  }
}

:deep(.line-mode) {
  .el-radio {
    width: 150px;
    margin: 5px;
  }
}

:deep(.el-form-item__label) {
  line-height: 25px;
}

:deep(.approve-mode) {
  .el-radio {
    float: left;
    width: 100%;
    display: block;
    margin-top: 15px;
  }
}

:deep(.approve-end) {
  position: relative;

  .el-radio-group {
    width: 160px;
  }

  .el-radio {
    margin-bottom: 5px;
    width: 100%;
  }

  .approve-end-leave {
    position: absolute;
    bottom: -5px;
    left: 150px;
  }
}

:deep(.el-divider--horizontal) {
  margin: 10px 0;
}
</style>
