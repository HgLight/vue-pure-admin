import { RouteRecordName } from "vue-router";

export type cacheType = {
  mode: string;
  name?: RouteRecordName;
};

export type positionType = {
  startIndex?: number;
  length?: number;
};

export type appType = {
  sidebar: {
    opened: boolean;
    withoutAnimation: boolean;
    // 判断是否手动点击Collapse
    isClickCollapse: boolean;
  };
  layout: string;
  device: string;
};

export type FormPermsType = {
  id: string;
  title: string;
  required: boolean;
  perm: string;
};

export type NodePropsGroupsType = {
  groupType: string;
  cids: string;
  conditions: Array<any>;
};
export type FormItemType = {
  id: string;
  title: string;
  icon: string;
};
export type OAType = {
  nodeMap: Map<any, any>;
  isEdit: boolean;
  selectedNode: {
    id: string;
    parentId: string;
    name: string;
    type: string;
    props: {
      formPerms: Array<FormPermsType>;
      groups: Array<any>;
    };
  };
  selectFormItem: FormItemType;
  design: {
    groupId: string;
    group: string;
    formId: string;
    formName: string;
    logo: {
      icon: string;
      background: string;
    };
    settings: [];
    process: [];
    formItems: [];
    remark: string;
  };
};

export type multiType = {
  path: string;
  parentPath: string;
  name: string;
  meta: any;
  query?: object;
  params?: object;
};

export type setType = {
  title: string;
  fixedHeader: boolean;
  hiddenSideBar: boolean;
};

export type userType = {
  username?: string;
  roles?: Array<string>;
  verifyCode?: string;
  currentPage?: number;
};
