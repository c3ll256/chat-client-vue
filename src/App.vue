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
          <div class="pop-warning">
            <v-alert v-if="popWarning" dense outlined dismissible type="error">
              ID <strong>{{ warningID }}</strong> is logged elsewhere
            </v-alert>
          </div>
          <div class="icon">
            <v-img
              src="./assets/icon.png"
              max-height="150"
              max-width="150"
            ></v-img>
          </div>
          <div class="login-container" v-if="isLog">
            <v-row class="ml-3">
              <v-text-field
                @keydown.enter="login"
                v-model="loginId"
                placeholder="ID"
                :error="loginError"
                :error-messages="errorMessage"
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
              >
              </v-text-field>
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
import DayJs from "dayjs";

const ipcRenderer = window.ipcRenderer;

const url = require("./config.json").url;

export default {
  components: {
    ChatContainer,
  },
  data() {
    return {
      warningID: "",
      popWarning: false,
      errorMessage: "",
      loginError: false,
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
    },
    currentUserId() {
      ipcRenderer.send("currentUserId", this.currentUserId);
    },
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

      this.warningID = "";
    },
    resetFlag() {
      this.popWarning = false;
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
      // 更新用戶狀態
      this.axios.put(url + "/api/users/" + this.currentUserId, {
        operate: "update_status",
        data: {
          status: "offline",
          last_changed: DayJs().format("YYYY-MM-DD HH:mm:ss"),
        },
      });
      // 更新狀態
      this.resetFlag();
      // 後一步刪除信息，以免看見空介面
      this.resetState();
    },
    loginSuccess(id, username, avatar) {
      // currentUserId 需要是字符串
      id = id.toString();
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
      // 取消錯誤狀態
      this.loginError = false;
      this.errorMessage = "";

      this.loginButtonLoading = true;
      // 查找用戶
      const result = await this.axios.get(url + "/api/users/" + this.loginId);
      if (result.data != false && result.data.status === "offline") {
        // 更新用戶狀態
        await this.axios.put(url + "/api/users/" + this.loginId, {
          operate: "update_status",
          data: {
            status: "online",
            last_changed: DayJs().format("YYYY-MM-DD HH:mm:ss"),
          },
        });
        this.loginSuccess(
          result.data._id,
          result.data.username,
          result.data.avatar
        );
      } else {
        this.loginError = true;
        this.errorMessage = "wrong ID or ID is logged in.";
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
      this.loginSuccess(
        result.data.insertId,
        this.signInName,
        "./assets/114514.jpg"
      );
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
      this.axios
        .get(url + "/api/users/" + localStorage.currentUserId)
        .then((res) => {
          if (res.data.status === "offline") {
            this.currentUserId = localStorage.currentUserId;
            this.currentUserName = localStorage.currentUserName;
            this.currentUserAvatar = localStorage.currentUserAvatar;
            // 更新用戶狀態
            this.axios.put(url + "/api/users/" + this.currentUserId, {
              operate: "update_status",
              data: {
                status: "online",
                last_changed: DayJs().format("YYYY-MM-DD HH:mm:ss"),
              },
            });

            this.loginSuccess(
              this.currentUserId,
              this.currentUserName,
              this.currentUserAvatar
            );
            this.isLoggedIn = true;
          } else {
            this.warningID = localStorage.currentUserId;
            this.popWarning = true;
            this.isLoggedIn = false;
            this.showChat = false;
          }
        });
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

::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.pop-warning {
  position: absolute;
  transform: translate(0%, 0%);
  width: 350px;
  top: -150px;
}

.icon {
  transform: translate(25%, -10%);
}

.login-container {
  transform: translate(10%, 30%);
}

.signin-container {
  transform: translate(10%, 30%);
}
</style>