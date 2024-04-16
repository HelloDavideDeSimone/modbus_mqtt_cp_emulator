<template>
    <div class="rfid-management">
      <h2>RFID Tag Management</h2>              
      <button @click="addNewRfidTag" class="btn btn-primary">Add New RFID Tag</button>
      <table class="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th v-for="address in uniqueAddresses" :key="address">{{ address }}</th>
            <th>RFID</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(group, groupIndex) in rfidTags" :key="groupIndex">
            <td>
                <input v-model="group.name" type="text" class="form-control" @input="updateGroup(group, groupIndex)"/>
            </td>
            <td>
                <select v-model="group.type" class="form-select w-100" @change="updateGroup(group, groupIndex)">
                    <option value="master">Master</option>
                    <option value="common">Common</option>
                    <option value="fixed">Fixed</option>
                </select>
            </td>
            <td v-for="address in uniqueAddresses" :key="address">
              <input
                :value="findTagValue(group.rfidValues, address)"
                @input="updateTagValue($event, groupIndex, address, group)"
                type="number"
                class="form-control"
              />
            </td>
            <td>
                {{ getRfid(group) }}
            </td>
            <td>
              <button class="btn btn-danger" @click="deleteGroup(groupIndex)">Delete Tag</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
  
  
  
  <script>
  export default {
    props: {
      rfidTags: Array
    },
    computed: {
      uniqueAddresses() {
        const addresses = new Set();
        const exampleval = [
            { value: 12598, registerAddress: '005F' },
            { value: 17204, registerAddress: '006F' },
            { value: 13380, registerAddress: '007F' },
            { value: 16952, registerAddress: '008F' },
        ]

        exampleval.forEach(tag => addresses.add(tag.registerAddress));
        return Array.from(addresses);
      }
    },
    methods: {
        addNewRfidTag() {
            this.$emit('addNewRfidTag');
        },
        findTagValue(rfidValues, address) {
            const tag = rfidValues.find(tag => tag.registerAddress === address);
            return tag ? tag.value : '';
        },
        updateTagValue(event, groupIndex, address, group) {
            const newValue = Number(event.target.value);
            const tagIndex = group.rfidValues.findIndex(tag => tag.registerAddress === address);
            if (tagIndex !== -1) {
                group.rfidValues[tagIndex].value = newValue;
            }
            this.updateGroup(group, groupIndex);
        },
        updateGroup(group, groupIndex) {
            this.$emit('updateGroup', { groupIndex, newGroup: group });
        },
        deleteGroup(groupIndex) {
            this.$emit('deleteGroup', groupIndex);
        },
        hex2a(hexx) {
            let hex = hexx.toString();
            let str = '';
            for (let i = 0; i < hex.length; i += 2)
                str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
            return str;
        },
        getRfid(rfidRow) {
            const rfidAddresses = ['005F', '006F', '007F', '008F'];
            const ascii = []
  
            rfidAddresses.forEach(address => {
                let register = rfidRow.rfidValues.find(r => r.registerAddress == address)
                const hexVal = Number(register?.value ?? 0).toString(16);
                
                let first = hexVal.slice(0, 2);
                let second = hexVal.slice(2, 4);
  
                ascii.push(this.hex2a(second))
                ascii.push(this.hex2a(first))
            });
  
            return ascii.join('') == '\x00\x00\x00\x00' ? 'NO TAG' : ascii.join('')
        }
    }
  };
  </script>
  
