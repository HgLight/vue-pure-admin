import { storeToRefs } from "pinia";
import { clone } from "@pureadmin/utils";
import { message } from "@pureadmin/components";
import {
  h,
  ref,
  defineComponent,
  computed,
  resolveComponent,
  defineExpose,
  getCurrentInstance
} from "vue";

import DefaultProps from "./DefaultNodeProps";
import { useOAStoreHook } from "@/store/modules/oa";
import Node from "./nodes/Node.vue";
import Root from "./nodes/Root.vue";

import "./process.css";
export default defineComponent({
  name: "ProcessTree",
  emits: ["selectedNode"],
  components: { Root, Node },
  setup(props, { emit }) {
    const { ctx } = getCurrentInstance();
    const valid = ref(true);
    const _root = ref<any>(null);
    const { nodeMap, selectedNode, design } = storeToRefs(useOAStoreHook());

    const dom = computed(() => {
      return design.value.process;
    });

    function getDomTree(node) {
      console.log("node", node);
      toMapping(node);
      if (isPrimaryNode(node)) {
        //普通业务节点
        const childDoms = getDomTree(node.children);
        console.log("childDoms", childDoms);
        decodeAppendDom(node, childDoms);
        console.log("childDoms1", childDoms);
        return [h("div", { class: { "primary-node": true } }, childDoms)];
      } else if (isBranchNode(node)) {
        let index = 0;
        //遍历分支节点，包含并行及条件节点
        const branchItems = node.branchs.map(branchNode => {
          //处理每个分支内子节点
          toMapping(branchNode);
          const childDoms = getDomTree(branchNode.children);
          decodeAppendDom(branchNode, childDoms, {
            level: index + 1,
            size: node.branchs.length
          });
          //插入4条横线，遮挡掉条件节点左右半边线条
          insertCoverLine(index, childDoms, node.branchs);
          //遍历子分支尾部分支
          index++;
          return h("div", { class: { "branch-node-item": true } }, childDoms);
        });
        //插入添加分支/条件的按钮
        branchItems.unshift(
          h("div", { class: { "add-branch-btn": true } }, [
            h(
              "el-button",
              {
                class: { "add-branch-btn-el": true },
                props: { size: "small", round: true },
                on: { click: () => addBranchNode(node) },
                domProps: {
                  innerHTML: `添加${isConditionNode(node) ? "条件" : "分支"}`
                }
              },
              []
            )
          ])
        );
        const bchDom = [
          h("div", { class: { "branch-node": true } }, branchItems)
        ];
        //继续遍历分支后的节点
        const afterChildDoms = getDomTree(node.children);
        return [h("div", {}, [bchDom, afterChildDoms])];
      } else if (isEmptyNode(node)) {
        //空节点，存在于分支尾部
        const childDoms = getDomTree(node.children);
        decodeAppendDom(node, childDoms);
        return [h("div", { class: { "empty-node": true } }, childDoms)];
      } else {
        //遍历到了末端，无子节点
        return [];
      }
    }
    //解码渲染的时候插入dom到同级
    function decodeAppendDom(node, dom, props = {}) {
      const CustomerComponent = resolveComponent(node.type.toLowerCase());
      console.log("CustomerComponent", CustomerComponent);
      dom.unshift(
        h(
          CustomerComponent,
          {
            ...props,
            config: node,
            icon: "plus",
            ref: node.id,
            key: node.id,
            //定义事件，插入节点，删除节点，选中节点，复制/移动
            onInsertNode: type => insertNode(type, node),
            onDelNode: () => delNode(node),
            onSelected: () => selectNode(node),
            onCopy: () => copyBranch(node),
            onLeftMove: () => branchMove(node, -1),
            onRightMove: () => branchMove(node, 1)
          },
          []
        )
      );
    }
    //id映射到map，用来向上遍历
    function toMapping(node) {
      if (node && node.id) {
        //console.log("node=> " + node.id + " name:" + node.name + " type:" + node.type)
        nodeMap.value.set(node.id, node);
      }
    }
    function insertCoverLine(index, doms, branchs) {
      if (index === 0) {
        //最左侧分支
        doms.unshift(h("div", { class: { "line-top-left": true } }, []));
        doms.unshift(h("div", { class: { "line-bot-left": true } }, []));
      } else if (index === branchs.length - 1) {
        //最右侧分支
        doms.unshift(h("div", { class: { "line-top-right": true } }, []));
        doms.unshift(h("div", { class: { "line-bot-right": true } }, []));
      }
    }
    function copyBranch(node) {
      const parentNode = nodeMap.value.get(node.parentId);
      const branchNode = clone(node, true);
      branchNode.name = branchNode.name + "-copy";
      forEachNode(parentNode, branchNode, (parent, node) => {
        const id = getRandomId();
        console.log(node, "新id =>" + id, "老nodeId:" + node.id);
        node.id = id;
        node.parentId = parent.id;
      });
      parentNode.branchs.splice(
        parentNode.branchs.indexOf(node),
        0,
        branchNode
      );
      // ctx.$forceUpdate();
    }
    function branchMove(node, offset) {
      const parentNode = nodeMap.value.get(node.parentId);
      const index = parentNode.branchs.indexOf(node);
      const branch = parentNode.branchs[index + offset];
      parentNode.branchs[index + offset] = parentNode.branchs[index];
      parentNode.branchs[index] = branch;
      // ctx.$forceUpdate();
    }
    //判断是否为主要业务节点
    function isPrimaryNode(node) {
      return (
        node &&
        (node.type === "ROOT" ||
          node.type === "APPROVAL" ||
          node.type === "CC" ||
          node.type === "DELAY" ||
          node.type === "TRIGGER")
      );
    }
    function isBranchNode(node) {
      return (
        node && (node.type === "CONDITIONS" || node.type === "CONCURRENTS")
      );
    }
    function isEmptyNode(node) {
      return node && node.type === "EMPTY";
    }
    //是分支节点
    function isConditionNode(node) {
      return node.type === "CONDITIONS";
    }
    //是分支节点
    function isBranchSubNode(node) {
      return node && (node.type === "CONDITION" || node.type === "CONCURRENT");
    }
    // function isConcurrentNode(node) {
    //   return node.type === "CONCURRENTS";
    // }
    function getRandomId() {
      return `node_${new Date().getTime().toString().substring(5)}${Math.round(
        Math.random() * 9000 + 1000
      )}`;
    }
    //选中一个节点
    function selectNode(node) {
      selectedNode.value = node;
      emit("selectedNode", node);
    }
    // //处理节点插入逻辑
    function insertNode(type, parentNode) {
      console.log("insertNode type", type);
      console.log("insertNode parentNode", parentNode);
      _root.value.click();
      //缓存一下后面的节点
      const afterNode = parentNode.children;
      //插入新节点
      parentNode.children = {
        id: getRandomId(),
        parentId: parentNode.id,
        props: {},
        type: type
      };
      switch (type) {
        case "APPROVAL":
          insertApprovalNode(parentNode);
          break;
        case "CC":
          insertCcNode(parentNode);
          break;
        case "DELAY":
          insertDelayNode(parentNode);
          break;
        case "TRIGGER":
          insertTriggerNode(parentNode);
          break;
        case "CONDITIONS":
          insertConditionsNode(parentNode);
          break;
        case "CONCURRENTS":
          insertConcurrentsNode(parentNode);
          break;
        default:
          break;
      }
      debugger;
      //拼接后续节点
      if (isBranchNode({ type: type })) {
        if (afterNode && afterNode.id) {
          afterNode.parentId = parentNode.children.children.id;
        }
        parentNode.children.children.children = afterNode;
      } else {
        if (afterNode && afterNode.id) {
          afterNode.parentId = parentNode.children.id;
        }
        parentNode.children.children = afterNode;
      }
      ctx.$forceUpdate();
    }
    function insertApprovalNode(parentNode) {
      parentNode.children.name = "审批人";
      parentNode.children.props = clone(DefaultProps.APPROVAL_PROPS, true);
    }
    function insertCcNode(parentNode) {
      parentNode.children.name = "抄送人";
      parentNode.children.props = clone(DefaultProps.CC_PROPS, true);
    }
    function insertDelayNode(parentNode) {
      parentNode.children.name = "延时处理";
      parentNode.children.props = clone(DefaultProps.DELAY_PROPS, true);
    }
    function insertTriggerNode(parentNode) {
      parentNode.children.name = "触发器";
      parentNode.children.props = clone(DefaultProps.TRIGGER_PROPS, true);
    }
    function insertConditionsNode(parentNode) {
      parentNode.children.name = "条件分支";
      parentNode.children.children = {
        id: getRandomId(),
        parentId: parentNode.children.id,
        type: "EMPTY"
      };
      parentNode.children.branchs = [
        {
          id: getRandomId(),
          parentId: parentNode.children.id,
          type: "CONDITION",
          props: clone(DefaultProps.CONDITION_PROPS, true),
          name: "条件1",
          children: {}
        },
        {
          id: getRandomId(),
          parentId: parentNode.children.id,
          type: "CONDITION",
          props: clone(DefaultProps.CONDITION_PROPS, true),
          name: "条件2",
          children: {}
        }
      ];
    }
    function insertConcurrentsNode(parentNode) {
      parentNode.children.name = "并行分支";
      parentNode.children.children = {
        id: getRandomId(),
        parentId: parentNode.children.id,
        type: "EMPTY"
      };
      parentNode.children.branchs = [
        {
          id: getRandomId(),
          name: "分支1",
          parentId: parentNode.children.id,
          type: "CONCURRENT",
          props: {},
          children: {}
        },
        {
          id: getRandomId(),
          name: "分支2",
          parentId: parentNode.children.id,
          type: "CONCURRENT",
          props: {},
          children: {}
        }
      ];
    }
    function getBranchEndNode(conditionNode) {
      if (!conditionNode.children || !conditionNode.children.id) {
        return conditionNode;
      }
      return getBranchEndNode(conditionNode.children);
    }
    function addBranchNode(node) {
      if (node.branchs.length < 8) {
        node.branchs.push({
          id: getRandomId(),
          parentId: node.id,
          name:
            (isConditionNode(node) ? "条件" : "分支") +
            (node.branchs.length + 1),
          props: isConditionNode(node)
            ? clone(DefaultProps.CONDITION_PROPS, true)
            : {},
          type: isConditionNode(node) ? "CONDITION" : "CONCURRENT",
          children: {}
        });
      } else {
        message.warning("最多只能添加 8 项😥");
      }
    }
    //删除当前节点
    function delNode(node) {
      console.log("删除节点", node);
      //获取该节点的父节点
      const parentNode = nodeMap.value.get(node.parentId);
      if (parentNode) {
        //判断该节点的父节点是不是分支节点
        if (isBranchNode(parentNode)) {
          //移除该分支
          parentNode.branchs.splice(parentNode.branchs.indexOf(node), 1);
          //处理只剩1个分支的情况
          if (parentNode.branchs.length < 2) {
            //获取条件组的父节点
            const ppNode = nodeMap.value.get(parentNode.parentId);
            //判断唯一分支是否存在业务节点
            if (
              parentNode.branchs[0].children &&
              parentNode.branchs[0].children.id
            ) {
              //将剩下的唯一分支头部合并到主干
              ppNode.children = parentNode.branchs[0].children;
              ppNode.children.parentId = ppNode.id;
              //搜索唯一分支末端最后一个节点
              const endNode = getBranchEndNode(parentNode.branchs[0]);
              //后续节点进行拼接, 这里要取EMPTY后的节点
              endNode.children = parentNode.children.children;
              if (endNode.children && endNode.children.id) {
                endNode.children.parentId = endNode.id;
              }
            } else {
              //直接合并分支后面的节点，这里要取EMPTY后的节点
              ppNode.children = parentNode.children.children;
              if (ppNode.children && ppNode.children.id) {
                ppNode.children.parentId = ppNode.id;
              }
            }
          }
        } else {
          //不是的话就直接删除
          if (node.children && node.children.id) {
            node.children.parentId = parentNode.id;
          }
          parentNode.children = node.children;
        }
        // ctx.$forceUpdate();
      } else {
        message.warning("出现错误，找不到上级节点😥");
      }
    }
    function validateNode(err, node) {
      if (this.$refs[node.id].validate) {
        valid.value = this.$refs[node.id].validate(err);
      }
    }
    function validateProcess() {
      valid.value = true;
      const err = [];
      validate(err, dom.value);
      return err;
    }
    //更新指定节点的dom
    function nodeDomUpdate(node) {
      this.$refs[node.id].$forceUpdate();
    }
    defineExpose({ nodeDomUpdate, validateProcess });

    //给定一个起始节点，遍历内部所有节点
    function forEachNode(parent, node, callback) {
      if (isBranchNode(node)) {
        callback(parent, node);
        forEachNode(node, node.children, callback);
        node.branchs.map(branchNode => {
          callback(node, branchNode);
          forEachNode(branchNode, branchNode.children, callback);
        });
      } else if (
        isPrimaryNode(node) ||
        isEmptyNode(node) ||
        isBranchSubNode(node)
      ) {
        callback(parent, node);
        forEachNode(node, node.children, callback);
      }
    }
    //校验所有节点设置
    function validate(err, node) {
      if (isPrimaryNode(node)) {
        validateNode(err, node);
        validate(err, node.children);
      } else if (isBranchNode(node)) {
        //校验每个分支
        node.branchs.map(branchNode => {
          //校验条件节点
          validateNode(err, branchNode);
          //校验条件节点后面的节点
          validate(err, branchNode.children);
        });
        validate(err, node.children);
      } else if (isEmptyNode(node)) {
        validate(err, node.children);
      }
    }

    nodeMap.value.clear();

    const processTrees = getDomTree(dom.value);
    console.log("processTrees", processTrees);

    return () => {
      return (
        <div class="_root" ref={_root}>
          {processTrees.map(item => {
            return item;
          })}
          <div style={{ "text-align": "center" }}>
            <div class="process-end">流程结束</div>
          </div>
        </div>
      );
    };
  }
});
