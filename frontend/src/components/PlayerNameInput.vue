<template>
    <div class="player-name-input">
        <input type="text" v-model="playerName" placeholder="Nhập tên của bạn" @keyup.enter="submitName" />
        <button @click="submitName">Gửi</button>
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
                // Gửi tên người chơi lên server hoặc cập nhật vào store
                this.$emit('name-submitted', this.playerName);
                this.playerName = ''; // Xóa ô nhập sau khi gửi
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
