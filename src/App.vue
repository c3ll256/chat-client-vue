<template>
  <v-app>
    <div class="app-container">
      <div class="login-container">
        <v-banner>
           現在登入的帳戶是： {{currentUserName}} ({{currentUserId}})
          <v-btn color="primary" class="ml-5" @click="clickLogout">登出</v-btn>
        </v-banner>
        <chat-container
          :current-user-id="currentUserId"
          :theme="theme"
          v-if="showChat"
        />
        <v-overlay
          :value="isLoggedIn === false"
          :absolute=true
          :opacity=1
        >
        <v-img src="./assets/icon.png" max-height="150" max-width="150" class="ma-10"></v-img>
        <div class="login-container" v-if="isLog">
          <v-text-field v-model="loginId" label="ID" rounded dense filled></v-text-field>
          <v-btn color="primary" :loading="loading" @click="login" class="ml-10">登錄</v-btn>
          <v-btn color="primary" @click="clickSignIn" class="ml-3">註冊</v-btn>
        </div>
        <div class="signin-container" v-if="isLog === false">
          <v-text-field v-model="signInName" label="稱呼" rounded dense filled></v-text-field>
          <v-btn color="primary" :loading="loading" @click="signIn" class="ml-10">註冊</v-btn>
          <v-btn color="primary" @click="clickSignIn = true" class="ml-3">返回</v-btn>
        </div>
        </v-overlay>
      </div>
    </div>
  </v-app>
</template>

<script>
import ChatContainer from './ChatContainer'

const url = "http://106.52.127.85:7001";

export default {
  components: {
    ChatContainer,
  },
  data() {
    return {
      loading: false,
      signInName: "",
      loginId: "",
      isLoggedIn: false,
      isLog: true,
      theme: "dark",
      currentUserId: "",
      currentUserName: "",
      showChat: false,
      updatingData: false,
    };
  },
  watch: {
    currentUserId() {
			this.showChat = false;
			if (this.currentUserId === "") return
			else setTimeout(() => (this.showChat = true), 150);
    },
  },
  methods: {
    clickSignIn() {
      this.isLog = false;
      this.signIn;
    },
    clickLogout() {
      // 更新狀態
      this.isLoggedIn = false;

      // 後一步刪除信息，以免看見空介面
      // 更新本地存儲
      localStorage.currentUserId = "";
      localStorage.currentUserName = "";
      // 更新data
      this.currentUserId = "";
      this.currentUserName = "";
    },
    loginSuccess(id, username) {
      console.log("success", id);
      // 更新本地存儲
      localStorage.currentUserId = id;
      localStorage.currentUserName = username;
      // 更新data
      this.currentUserId = id;
      this.currentUserName = username;

      // 清空輸入框內容
      this.loginId = "";
      this.signInName = "";

      // 更新狀態
      this.isLog = true;
      this.isLoggedIn = true;
      this.loading = false;
    },
    async login() {
      this.loading = true;
      // 查找用戶
      const result = await this.axios.get(
        url + "/api/users/" + this.loginId
      );
      console.log(result)
      if (result.data !== "") {
        this.loginSuccess(result.data._id, result.data.username);
      } else {
        alert("用戶id錯誤或不存在");
        this.loginId = "";
      }
    },
    async signIn() {
      this.loading = true;
      // 創建用戶
      const result = await this.axios.post(url + "/api/users", {
        username: this.signInName,
        avatar: "./assets/114514.jpg",
      });
      this.loginSuccess(result.data.insertId, this.signInName);
    },
  },
  mounted() {
    if (localStorage.currentUserId == "") {
			this.isLoggedIn = false;
			this.showChat = false;
    } else {
      this.currentUserId = localStorage.currentUserId;
      this.currentUserName = localStorage.currentUserName;
			this.isLoggedIn = true;
    }
  },
};
</script>

<style lang="scss">
html {
  overflow: hidden !important;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

html::-webkit-scrollbar {
  width: 0;
  height: 0;
}
</style>