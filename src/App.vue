<template>
  <v-app>
    <div class="app-container">
      <chat-container
        :currentUserId="currentUserId"
        :currentUserName="currentUserName"
        :currentUserAvatar="currentUserAvatar"
        :theme="theme"
        v-on:click-logout="clickLogout"
        v-if="showChat"
      />
      <div class="login-signin-container">
        <v-overlay :value="isLoggedIn === false" :absolute="true" :opacity="1">
          <v-img
            src="./assets/icon.png"
            max-height="150"
            max-width="150"
            class="ml-15 mb-15"
          ></v-img>
          <div class="login-container" v-if="isLog">
            <v-row class="ml-3">
              <v-text-field
                @keydown.enter="login"
                v-model="loginId"
                placeholder="ID"
                rounded
                dense
                filled
              ></v-text-field>
              <v-btn
                class="ml-5"
                color="primary"
                small
                :loading="loginButtonLoading"
                :disabled="loginButtonBlock"
                @click="login"
                fab
              >
                <v-icon dark> mdi-arrow-right </v-icon>
              </v-btn>
            </v-row>

            <v-btn
              class="ml-3"
              text
              color="primary"
              @click="clickSignIn"
              :disabled="loginButtonLoading"
              >sign in</v-btn
            >
          </div>
          <div class="signin-container" v-if="isLog === false">
            <v-row class="ml-3">
              <v-text-field
                @keydown.enter="signIn"
                v-model="signInName"
                placeholder="NAME"
                rounded
                dense
                filled
              ></v-text-field>
              <v-btn
                class="ml-5"
                color="primary"
                small
                :loading="signInButtonLoading"
                :disabled="signInButtonBlock"
                @click="signIn"
                fab
              >
                <v-icon dark> mdi-arrow-right </v-icon>
              </v-btn>
            </v-row>
            <v-btn
              class="ml-3"
              text
              color="primary"
              @click="clickBack"
              :disabled="signInButtonLoading"
              >back to login</v-btn
            >
          </div>
        </v-overlay>
      </div>
    </div>
  </v-app>
</template>

<script>
import ChatContainer from "./ChatContainer";

const url = "http://106.52.127.85:7001";

export default {
  components: {
    ChatContainer,
  },
  data() {
    return {
      signInButtonBlock: true,
      loginButtonBlock: true,
      signInButtonLoading: false,
      loginButtonLoading: false,
      signInName: "",
      loginId: "",
      isLoggedIn: false,
      isLog: true,
      theme: "dark",
      currentUserId: "",
      currentUserName: "",
      currentUserAvatar: "",
      showChat: false,
      rules: {
        required: (value) => !!value || "輸入id",
        min: (v) => v.length >= 8 || "Min 8 characters",
        emailMatch: () => `你輸入的id錯誤`,
      },
    };
  },
  watch: {
    signInName() {
      if (this.signInName === "") this.signInButtonBlock = true;
      else this.signInButtonBlock = false;
    },
    loginId() {
      if (this.loginId === "") this.loginButtonBlock = true;
      else this.loginButtonBlock = false;
    }
  },
  methods: {
    resetState() {
      this.signInName = "";
      this.loginId = "";
      // 更新本地存儲
      localStorage.currentUserId = "";
      localStorage.currentUserName = "";
      localStorage.currentUserAvatar = "";
      // 更新data
      this.currentUserId = "";
      this.currentUserName = "";
      this.currentUserAvatar = "";
    },
    resetFlag() {
      this.buttonBlock = true;
      this.signInButtonLoading = false;
      this.loginButtonLoading = false;
      this.isLoggedIn = false;
      this.isLog = true;
      this.showChat = false;
    },
    clickBack() {
      this.resetFlag();
    },
    clickSignIn() {
      this.resetState();
      this.isLog = false;
      this.signIn;
    },
    clickLogout() {
      // 更新狀態
      this.resetFlag();
      // 後一步刪除信息，以免看見空介面
      this.resetState();
    },
    loginSuccess(id, username, avatar) {
      // currentUserId 需要是字符串
      id = id.toString()
      // 更新本地存儲
      localStorage.currentUserId = id;
      localStorage.currentUserName = username;
      localStorage.currentUserAvatar = avatar;
      // 更新data
      this.currentUserId = id;
      this.currentUserName = username;
      this.currentUserAvatar = avatar;

      setTimeout(() => (this.showChat = true), 150);

      // 清空輸入框內容
      this.loginId = "";
      this.signInName = "";

      // 更新狀態
      this.isLog = true;
      this.isLoggedIn = true;
      this.loginButtonLoading = false;
    },
    async login() {
      this.loginButtonLoading = true;
      // 查找用戶
      const result = await this.axios.get(url + "/api/users/" + this.loginId);
      if (result.data != false) {
        this.loginSuccess(result.data._id, result.data.username, result.data.avatar);
      } else {
        alert("Wrong ID or ID does not exist.");
        this.resetState();
        this.resetFlag();
      }
    },
    async signIn() {
      this.signInButtonLoading = true;
      // 創建用戶
      const result = await this.axios.post(url + "/api/users", {
        username: this.signInName,
        avatar: "./assets/114514.jpg",
      });
      this.loginSuccess(result.data.insertId, this.signInName, "./assets/114514.jpg");
    },
  },
  mounted() {
    if (
      localStorage.currentUserId == "" ||
      localStorage.currentUserId == undefined
    ) {
      this.isLoggedIn = false;
      this.showChat = false;
    } else {
      this.currentUserId = localStorage.currentUserId;
      this.currentUserName = localStorage.currentUserName;
      this.currentUserAvatar = localStorage.currentUserAvatar;
      
      this.loginSuccess(this.currentUserId, this.currentUserName, this.currentUserAvatar);
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