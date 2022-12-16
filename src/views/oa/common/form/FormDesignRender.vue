<script setup lang="ts">
import { watch } from "vue";
import components from "@/views/oa/common/form/ComponentExport";

defineOptions({
  name: "FormDesignRender"
});

const props = defineProps({
  mode: {
    type: String,
    default: "DESIGN"
  },
  modelValue: {
    default: undefined
  },
  config: {
    type: Object,
    default: () => {
      return {};
    }
  }
});

function validate(call) {
  this.$refs.form.validate(call);
}
defineExpose({ validate });

watch(
  () => props.config,
  _newVal => {
    // console.log("FormDesignRender watch props.config", _newVal);
  },
  { immediate: true }
);
</script>

<template>
  <component
    ref="form"
    :is="components[config.name]"
    :mode="mode"
    :modelValue="modelValue"
    v-bind="config.props"
  />
</template>
