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
              <div class="avatar-upload-lodaing">
                <v-progress-circular
                  :size="60"
                  color="primary"
                  indeterminate
                  v-if="signInAvatarLoading"
                ></v-progress-circular>
              </div>
              <div class="avatar-upload">
                <v-file-input
                  accept="image/*"
                  hide-input
                  v-model="fileInfo"
                  filled
                  prepend-icon="mdi-camera"
                  :disabled="signInAvatarLoading"
                  :value="fileInfo"
                >
                </v-file-input>
              </div>
              <div class="sign-in-avatar">
                <v-avatar size="60">
                  <img :src="signInAvatar" />
                </v-avatar>
              </div>
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
            <v-btn class="ml-3" text color="primary" @click="clickBack"
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

const COS = require("cos-js-sdk-v5");
const ipcRenderer = window.ipcRenderer;
const url = require("./config.json").url;

export default {
  components: {
    ChatContainer,
  },
  data() {
    return {
      signInAvatarLoading: false,
      signInAvatar: "defualt_avatar.png",
      fileInfo: {},
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
    fileInfo() {
      if (this.fileInfo !== {}) this.uploadAvatar();
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
      this.signInAvatar = "defualt_avatar.png";
      this.fileInfo = {};
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

      // 清空內容
      this.loginId = "";
      this.signInName = "";
      this.signInAvatar = "defualt_avatar.png";
      this.fileInfo = {};

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
        avatar: this.signInAvatar,
      });
      this.loginSuccess(
        result.data.insertId,
        this.signInName,
        this.signInAvatar
      );
    },
    uploadAvatar() {
      this.signInAvatarLoading = true;
      const _this = this;
      const cos = new COS({
        getAuthorization: function (options, callback) {
          // 异步获取临时密钥
          _this.axios.get(url + "/cos/authkey").then((res) => {
            var credentials = res.data.credentials;
            console.log(credentials);
            callback({
              TmpSecretId: credentials.tmpSecretId,
              TmpSecretKey: credentials.tmpSecretKey,
              XCosSecurityToken: credentials.sessionToken,
              // 建议返回服务器时间作为签名的开始时间，避免用户浏览器本地时间偏差过大导致签名错误
              StartTime: res.data.startTime, // 时间戳，单位秒，如：1580000000
              ExpiredTime: res.data.expiredTime, // 时间戳，单位秒，如：1580000900
            });
          });
        },
      });
      cos.putObject(
        {
          Bucket: "chaat-avatar-1251621542" /* 必须 */,
          Region: "ap-guangzhou" /* 存储桶所在地域，必须字段 */,
          Key:
            this.currentUserId +
            DayJs().format("YYYY-DD-MM-HH-mm-ss") +
            this.fileInfo.name,
          StorageClass: "STANDARD",
          Body: this.fileInfo, // 上传文件对象
          onProgress: function (progressData) {
            console.log(JSON.stringify(progressData));
          },
        },
        function (err, data) {
          console.log(err || data);
          _this.signInAvatarLoading = false;
          if (data.statusCode === 200) {
            console.log(
              data.Location + "?imageMogr2/format/webp/interlace/0/quality/100"
            );
            _this.signInAvatar =
              "http://" +
              data.Location +
              "?imageMogr2/format/webp/interlace/0/quality/100";
          } else {
            alert("Upload avatar failed.");
          }
        }
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

.avatar-upload {
  opacity: 0.8;
  position: absolute;
  transform: translate(-180%, -20%);
  z-index: 2;
}

.sign-in-avatar {
  position: absolute;
  transform: translate(-130%, -20%);
  z-index: 1;
}

.avatar-upload-lodaing {
  z-index: 2;
  position: absolute;
  transform: translate(-130%, -20%);
}
</style>