<template>
    <input type="range" min="100" max="700" v-model="terminalHeight" class="slider">
    <div class="terminal" :style="{ height: terminalHeight + 'px' }" ref="terminal">
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
{{ `${this.getTimestamp()} Terminal ready` }}
      </div>
      <div v-for="(message, index) in messages" :key="index" :class="`message-${message.type}`">
        {{ `${getTimestamp()} ${message.content}` }}
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
  },
  data() {
    return {
      terminalHeight: 200
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
        this.$nextTick(this.scrollToBottom);
      }
    }
  },
  methods: {
    getTimestamp() {
      return  `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
    },
    scrollToBottom() {
      const element = this.$refs.terminal;
      if (element) {
        // Calcola la distanza dal basso
        const scrollDistanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
        // Se la distanza dal basso è piccola (ad esempio, meno di un certo valore di pixel), allora si procede con l'autoscroll.
        // Puoi regolare il valore '10' in base alle tue esigenze.
        if (scrollDistanceFromBottom <= 50) {
          element.scrollTop = element.scrollHeight;
        }
      }
    }
  }
}
</script>

<style>
.message-received {
  color: #0f0;
}

.message-sent {
  color: rgb(87, 87, 255);
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

</style>