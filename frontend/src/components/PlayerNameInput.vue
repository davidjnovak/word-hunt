<template>
    <div class="player-name-input">
        <input type="text" v-model="playerName" placeholder="Enter your name" @keyup.enter="submitName" />
        <button @click="submitName">Submit</button>
    </div>
</template>

<script>
export default {
    data() {
        return {
            playerName: ''
        };
    },
    methods: {
        submitName() {
            if (this.playerName.trim()) {
                // Submit player names to the server or update to the store
                this.$emit('name-submitted', this.playerName);
                this.playerName = ''; // Clear input box after submitting
            }
        }
    }
};
</script>

<style scoped>
.player-name-input {
    margin: 20px;
}

input {
    margin-right: 10px;
}
</style>
