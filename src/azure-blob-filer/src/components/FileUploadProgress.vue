<template>
  <div class="fluid" style="margin-bottom: 5px">
    <ProgressBar :value="value">
      <div style="margin-left: 5px; font-weight: normal; color: #fff; text-align: left; text-shadow: 1px 1px 0 #495057">{{ name }} : {{ value }}%</div>
    </ProgressBar>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, toRefs, watch } from 'vue';

export interface FileUploadItem {
  key: string;
  name: string;
  size: number;
  uploaded: number;
}

export default defineComponent({
  name: 'FileUploadProgress',
  props: {
    keyValue: String,
    name: String,
    size: {
      type: Number,
      default: 0,
    },
    uploaded: {
      type: Number,
      default: 0,
    },
  },
  emits: ['compelete', 'close'],
  setup(props, context) {
    const state = reactive({
      closing: false,
      value: 0,
    });

    watch(
      () => props.uploaded,
      (newValue: number) => {
        state.value = Math.floor((newValue / props.size) * 100);
        if (state.value >= 100 && !state.closing) {
          state.closing = true;
          context.emit('compelete', props.keyValue, props.size);
          setTimeout(() => context.emit('close', props.keyValue), 3000);
        }
      }
    );

    return {
      ...toRefs(state),
    };
  },
});
</script>
