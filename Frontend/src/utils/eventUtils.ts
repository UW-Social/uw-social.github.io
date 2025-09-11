import { ref } from 'vue';

const selectedEvent = ref(null);

export const setSelectedEvent = (event: any) => {
  selectedEvent.value = event;
};

export const clearSelectedEvent = () => {
  selectedEvent.value = null;
};

export const useSelectedEvent = () => selectedEvent;

// 键盘事件处理函数
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    clearSelectedEvent(); // 按下 Esc 键时清空选中的活动
  }
};

// 挂载事件监听器
export const mountKeyDownListener = () => {
  window.addEventListener('keydown', handleKeyDown);
};

// 卸载事件监听器
export const unmountKeyDownListener = () => {
  window.removeEventListener('keydown', handleKeyDown);
};