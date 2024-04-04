<template>
  <div class="terminal-container">
    <input type="range" min="100" max="700" v-model="terminalHeight" class="slider">
    <div class="terminal" :style="{ height: terminalHeight + 'px' }" ref="terminal" @scroll="checkScroll">
      <div class="message-info">
        <pre>
          <h3>Charging Point Emulator</h3>   ___________
  |  _______  |
  | | == | | |
  | |_____| | |
  |  _______  |\\
  | | == | | |  ))
  | |_____| | |//
__|___________|__
|___________________|
        </pre>
{{ `${this.terminalReadyTimestamp} Terminal ready` }}
      </div>
      <div v-for="(message, index) in messages" :key="index" :class="`message-${message.type}`">
        {{ message.content }}
      </div>
      <button v-if="!isScrolledToBottom" @click="scrollToBottom" class="scroll-to-bottom-btn">Scroll to Bottom</button>
    </div>
  </div>
</template>

<script>
export default {
  mounted() {
    // Retrieve the terminal height from localStorage when the component is mounted
    const savedHeight = localStorage.getItem('terminalHeight');
    if (savedHeight) {
      this.terminalHeight = savedHeight;
    }
    this.scrollToBottom();
  },
  data() {
    return {
      terminalHeight: 200,
      terminalReadyTimestamp: `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
      isScrolledToBottom: true,
    };
  },
  props: {
    messages: Array
  },
  watch: {
    terminalHeight(newHeight) {
      localStorage.setItem('terminalHeight', newHeight);
    },
    messages: {
      immediate: true,
      deep: true,
      handler() {
      if (this.isScrolledToBottom) {
        this.$nextTick(this.scrollToBottom);
      }
    }
    }
  },
  methods: {
    scrollToBottom() {
      this.$nextTick(() => {
        const terminal = this.$refs.terminal;
        terminal.scrollTop = terminal.scrollHeight;
      });
    },
    checkScroll() {
      const terminal = this.$refs.terminal;
      const scrollPosition = terminal.scrollTop + terminal.clientHeight;
      const bottomPosition = terminal.scrollHeight;
      this.isScrolledToBottom = (bottomPosition - scrollPosition) < 5;
    }
  }
}
</script>

<style>
.message-received {
  color: #0f0;
}

.message-sent {
  color: rgb(83, 117, 255);
}

.message-info {
  color: rgb(251, 251, 255);
}

.message-error {
  color: rgb(220, 24, 24);
}

.terminal {
  background-color: #000;
  padding: 20px;
  height: 200px;
  overflow-y: auto;
  font-family: 'Courier New', Courier, monospace;
  white-space: pre-wrap;
}

.terminal > .message-info > pre > h3 {
  font-family: 'Courier New', Courier, monospace;
  margin: 0;
  padding: 0;
}


/* Stili aggiuntivi per il tuo slider */
.slider {
  -webkit-appearance: none; /* Rimuove lo stile predefinito per Chrome, Safari */
  appearance: none;
  width: 100%;
  height: 25px;
  background: #ddd;
  outline: none;
  opacity: 0.7;
  -webkit-transition: .2s;
  transition: opacity .2s;
}

.slider:hover {
  opacity: 1;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 25px;
  height: 25px;
  background: #4CAF50;
  cursor: pointer;
}

.slider::-moz-range-thumb {
  width: 25px;
  height: 25px;
  background: #4CAF50;
  cursor: pointer;
}

.terminal-container {
  position: relative; 
}
.scroll-to-bottom-btn {
  position: absolute; 
  bottom: 10px;
  right: 10px; 
  z-index: 100; 
}

</style>