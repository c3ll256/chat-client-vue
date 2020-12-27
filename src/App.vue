<template>
  <div>
    <div class="app-container">
      <div class="login-container">
        <div class="user-logged" v-if="logged">
          <span class="show-login">現在登陸的是 {{ currentUserName }} ({{ currentUserId }})</span>
          <button @click="logout">登出</button>
        </div>
        <div v-if="logged === false">
          <div class="user-login" v-if="regis === false">
            <input type="text" v-model="logId" placeholder="請輸入id" />
            <button @click="login">登陸</button>
            <button @click="clickRegist">註冊</button>
          </div>
          <div class="user-regis" v-if="regis">
            <input type="text" v-model="logName" placeholder="請輸入稱呼" />
            <button @click="regist">建立帳戶</button>
            <button @click="clickBack">返回</button>
          </div>
        </div>
      </div>
      <chat-container
        :current-user-id="currentUserId"
        :theme="theme"
        :reset="reset"
        v-if="showChat"
      />
    </div>
  </div>
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
      logId: "",
      logName: "",
      reset: false,
      regis: false,
      logged: false,
      theme: "dark",
      currentUserId: "",
      currentUserName: "",
      showChat: true,
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
    clickRegist() {
      this.regis = true;
    },
    clickBack() {
			this.regis = false;
			this.logName = "";
    },
    logout() {
      localStorage.currentUserId = "";
      localStorage.currentUserName = "";
      this.logId = "";
      this.currentUserName = "";
      this.currentUserId = "";
      this.showChat = false;
      this.logged = false;
      this.reset = true;
    },
    async login() {
      const result = await this.axios.get(
        url + "/api/users/" + this.logId
      );
      if (result.data !== "") {
        localStorage.currentUserId = result.data._id;
        localStorage.currentUserName = result.data.username;
        this.currentUserId = result.data._id;
        this.currentUserName = result.data.username;
        this.logged = true;
      } else {
        alert("用戶id錯誤或不存在");
        this.logId = "";
      }
    },
    async regist() {
      const result = await this.axios.post(url + "/api/users", {
        username: this.logName,
        avatar: "./assets/114514.jpg",
      });
      localStorage.currentUserId = result.data.insertId;
      localStorage.currentUserName = result.data.username;
      this.currentUserId = result.data.insertId;
      this.currentUserName = result.data.username;
      this.logged = true;
    },
  },
  mounted() {
    if (localStorage.currentUserId == "") {
			this.logged = false;
			this.showChat = false;
    } else {
      this.currentUserId = localStorage.currentUserId;
      this.currentUserName = localStorage.currentUserName;
			this.logged = true;
    }
  },
};
</script>

<style lang="scss">
body {
  background: #131415;
}
.app-container {
  font-family: Avenir, Helvetica, Arial, sans-serif;
}
.login-container {
  margin-left: 15px;
}
.show-login {
  font-size: 15px;
}
input {
  padding: 5px;
  width: 180px;
  height: 21px;
  border-radius: 4px;
  border: 1px solid #d2d6da;
  outline: none;
  font-size: 14px;
  vertical-align: middle;
  &::placeholder {
    color: #9ca6af;
  }
}
button {
  background: #1976d2;
  color: #fff;
  outline: none;
  cursor: pointer;
  border-radius: 4px;
  padding: 8px 12px;
  margin-left: 10px;
  border: none;
  font-size: 14px;
  transition: 0.3s;
  vertical-align: middle;
  &:hover {
    opacity: 0.8;
  }
  &:active {
    opacity: 0.6;
  }
  &:disabled {
    cursor: initial;
    background: #c6c9cc;
    opacity: 0.6;
  }
}

span {
  height: 20px;
  outline: none;
  color: #ffffff;
}
.user-logged {
  font-size: 12px;
}
</style>