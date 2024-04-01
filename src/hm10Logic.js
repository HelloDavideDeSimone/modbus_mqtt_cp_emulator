export const hm10Logic = {
      watch: {
        modbusRegisters: {
          deep: true,
          handler(newModbusRegisters, oldModbusRegisters) {
            // startTransaction


            const newStartStopCharging = newModbusRegisters.find(el => el.parameter == 'Start/Stop Charging')?.value
            const oldStartStopCharging = oldModbusRegisters.find(el => el.parameter == 'Start/Stop Charging')?.value

            
            if(newStartStopCharging !== oldStartStopCharging ) {

                console.log(`modbusRegisters changed from ${oldStartStopCharging} ${newStartStopCharging}`);
                this.modbusRegisters.find(el => el.parameter == 'RFID Number 0').value = 0;
                this.modbusRegisters.find(el => el.parameter == 'RFID Number 1').value = 0;
                this.modbusRegisters.find(el => el.parameter == 'RFID Number 2').value = 0;
                this.modbusRegisters.find(el => el.parameter == 'RFID Number 3').value = 0;
            }

          }
        },
      }
  };
  