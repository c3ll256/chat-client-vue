<template>
  <v-app class="window-container">
    <chat-window
      height="calc(100vh)"
      :current-user-id="currentUserId"
      :rooms="rooms"
      :loading-rooms="loadingRooms"
      :messages="messages"
      :theme="theme"
      :messages-loaded="messagesLoaded"
      :show-audio="false"
      :show-files="false"
      :show-add-room="true"
      @fetch-messages="fetchMessages"
      @send-message="sendMessage"
      @add-room="clickAddRoom"
    >
      <template v-slot:checkmark-icon><div></div></template>
      <template v-slot:rooms-header>
        <div class="d-flex ml-4 mt-4">
          <v-menu bottom min-width="200px" rounded offset-y>
            <template v-slot:activator="{ on }">
              <v-btn icon x-large v-on="on">
                <v-avatar>
                  <img :src="currentUserAvatar" />
                </v-avatar>
              </v-btn>
            </template>
            <v-card>
              <v-list-item-content class="justify-center">
                <div class="mx-auto text-center">
                  <v-chip color="grey">ID : {{ currentUserId }}</v-chip>
                  <v-divider class="my-3"></v-divider>
                  <v-btn
                    color="primary"
                    rounded
                    small
                    dark
                    @click="clickEditInfo"
                  >
                    Edit Info
                    <v-icon>mdi-pencil</v-icon>
                  </v-btn>
                  <v-divider class="my-3"></v-divider>
                  <v-btn
                    depressed
                    rounded
                    text
                    color="red"
                    v-on:click="$emit('click-logout')"
                  >
                    LOGOUT
                  </v-btn>
                </div>
              </v-list-item-content>
            </v-card>
          </v-menu>
          <v-chip color="secondary" class="ml-2 mt-3 font-weight-bold"
            >{{ currentUserName }}
          </v-chip>
        </div>
      </template>
    </chat-window>

    <v-dialog v-model="showEditInfo" width="300">
      <v-card>
        <div class="id-flex">
          <v-layout column align-center justify-center>

            <div class="edit-avatar-upload-lodaing">
              <v-progress-circular
                :size="85"
                color="primary"
                indeterminate
                v-if="avatarUploading"
              ></v-progress-circular>
            </div>
            <div class="edit-avatar-upload">
              <v-file-input
                accept="image/*"
                hide-input
                v-model="fileInfo"
                filled
                prepend-icon="mdi-camera"
                :disabled="avatarUploading"
              >
              </v-file-input>
            </div>
            <v-avatar size="80" class="mt-5">
              <img :src="editedAvatar" />
            </v-avatar>
              <v-text-field
              :error="editNameError"
              :error-messages="editNameErrorMessage"
              v-model="editedName"
              class="mt-5"
              placeholder="New Name"
              filled
              rounded
              dense
            ></v-text-field>
          </v-layout>
        </div>
        <v-card-actions>
          <v-spacer></v-spacer>
            <v-btn
              :disabled="saveEditBlock"
              :loading="isEditInfoUploading"
              rounded
              color="primary"
              @click="uploadInfo"
            >
            <v-icon>mdi-content-save</v-icon>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showAddRoom" width="500">
      <v-card>
        <v-card-title> Add Friend </v-card-title>
        <div class="id-flex">
          <v-text-field
            @keydown.enter="searchUser"
            v-model="searchUserId"
            :error="isSearched"
            :error-messages="errorMessage"
            placeholder="ID"
            rounded
            dense
            filled
          ></v-text-field>
          <v-btn
            class="ml-2"
            color="primary"
            small
            :loading="searchUserButtonLoading"
            :disabled="searchUserButtonBlock"
            @click="searchUser"
            fab
          >
            <v-icon dark> mdi-magnify </v-icon>
          </v-btn>
        </div>
        <v-skeleton-loader
          class="pl-8 pr-15"
          :boilerplate="searchUserButtonLoading === false"
          type="list-item-avatar-three-line"
          v-if="isSearched === false"
        ></v-skeleton-loader>
        <v-row v-if="isSearched" class="pb-5 mt-1">
          <v-avatar class="ml-15 mt-5 mb-5" size="40">
            <img :src="searchedUserAvatar" />
          </v-avatar>
          <v-chip color="secondary" class="ml-4 mt-6">{{
            searchedUserName
          }}</v-chip>
          <v-chip color="grey" class="ml-4 mt-6"
            >ID : {{ searchedUserId }}</v-chip
          >
          <v-spacer></v-spacer>
          <v-btn
            class="mt-5 mr-15"
            color="primary"
            small
            :disabled="addButtonBlock"
            :loading="addRoomButtonLoading"
            @click="createRoom"
            fab
          >
            <v-icon dark> mdi-account-plus </v-icon>
          </v-btn>
        </v-row>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script>
import ChatWindow from "vue-advanced-chat";
const ipcRenderer = window.ipcRenderer;
import "vue-advanced-chat/dist/vue-advanced-chat.css";
const COS = require("cos-js-sdk-v5");

import DayJs from "dayjs";

const url = require("./config.json").url;

export default {
  components: {
    ChatWindow,
  },
  props: [
    "currentUserId",
    "currentUserName",
    "currentUserAvatar",
    "theme",
    "reset",
  ],
  data() {
    return {
      saveEditBlock: true,
      showEditInfo: false,
      isEditInfoUploading: false,
      editedAvatar: "",
      editedName: "",
      editNameError: false,
      editNameErrorMessage: "",
      avatarUploading: false,
      fileInfo: {},

      // 查找用户
      showAddRoom: false,
      searchUserButtonLoading: false,
      searchUserButtonBlock: true,
      searchUserId: "",
      searchedUserId: "",
      searchedUserName: "",
      searchedUserAvatar: "",
      isSearched: false,
      notFindUser: false,
      errorMessage: "",

      // 添加房间
      addRoomButtonLoading: false,
      addButtonBlock: false,

      // 现在状态
      currentRoomId: "",
      oldestMessageId: 0,
      rooms: [],
      allUsers: [],
      loadingRooms: true,
      messages: [],
      messagesLoaded: false,
      styles: { container: { borderRadius: "4px" } },
    };
  },
  watch: {
    searchUserId() {
      if (this.searchUserId === "") this.searchUserButtonBlock = true;
      else this.searchUserButtonBlock = false;
    },
    fileInfo() {
      if (this.fileInfo.name !== undefined) {
        this.uploadAvatar();
      }
    },
    editedName() {
      if (this.editedName !== "" && this.editedName.length <= 16) {
        this.editNameError = false;
        this.editNameErrorMessage = "";
        this.saveEditBlock = false;
      }
      if (this.editedName === "") {
        this.editNameError = true;
        this.editNameErrorMessage = "name cannot be empty";
        this.saveEditBlock = true;
      }
      if (this.editedName.length > 16) {
        this.editNameError = true;
        this.editNameErrorMessage = "name is too long";
        this.saveEditBlock = true;
      }
    },
    showAddRoom() {
      if (this.showAddRoom === false) {
        // 重置状态
        setTimeout(() => {
          this.showAddRoom = false;
          this.searchUserButtonLoading = false;
          this.searchUserButtonBlock = true;
          this.isSearched = false;
          this.notFindUser = false;
          this.searchUserId = "";
          this.searchedUserId = "";
          this.searchedUserName = "";
          this.searchedUserAvatar = "";
          this.errorMessage = "";
        }, 100);
      }
    },
    showEditInfo() {
      if (this.showEditInfo === false) {
        setTimeout(() => {
          this.editedAvatar = "";
          this.editedName = "";
          this.showEditInfo = false;
          this.isEditInfoUploading = false;
          this.editNameError = false;
          this.editNameErrorMessage = "";
          this.avatarUploading = false;
          this.fileInfo = {};
        }, 100);
      }
    }
  },
  sockets: {
    connect() {},
  },
  destroyed() {
    this.axios.put(url + "/api/users/" + this.currentUserId, {
      operate: "update_status",
      data: {
        status: "offline",
        last_changed: DayJs().format("YYYY-MM-DD HH:mm:ss"),
      },
    });
    this.resetRooms();
    this.resetCreateRoom();
  },
  methods: {
    clickAddRoom() {
      this.showAddRoom = true;
    },
    resetCreateRoom() {
      this.addButtonBlock = false;
      this.notFindUser = false;
      this.searchUserButtonLoading = false;
      this.searchUserButtonBlock = true;
      this.addRoomButtonLoading = false;
      this.isSearched = false;
      this.showAddRoom = false;
      this.errorMessage = "";
      this.searchUserId = "";
      this.searchedUserId = "";
      this.searchedUserName = "";
      this.searchedUserAvatar = "";
    },
    resetRooms() {
      this.loadingRooms = true;
      this.rooms = [];
      this.allUsers = [];
      this.resetMessages();
    },
    resetMessages() {
      this.messages = [];
      this.oldestMessageId = 0;
      this.messagesLoaded = false;
    },
    async searchUser() {
      this.isSearched = false;
      this.searchUserButtonLoading = true;
      const result = await this.axios.get(
        url + "/api/users/" + this.searchUserId
      );
      if (result.data != false) {
        // 判斷是否已經是好友
        const isFriend = await this.axios.get(
          url +
            "/api/rooms/" +
            this.currentUserId +
            "?operate=isfriend&id=" +
            result.data._id
        );
        if (result.data._id == this.currentUserId || isFriend.data == true)
          this.addButtonBlock = true;
        else this.addButtonBlock = false;

        this.searchedUserId = result.data._id;
        this.searchedUserName = result.data.username;
        this.searchedUserAvatar = result.data.avatar;
        this.notFindUser = false;
        this.errorMessage = "";
        this.isSearched = true;
        this.searchUserButtonLoading = false;
      } else {
        this.notFindUser = true;
        this.searchUserButtonLoading = false;
        this.errorMessage = "can not find user";
      }
    },
    async createRoom() {
      const room = await this.axios.post(url + "/api/rooms/", {
        users: [this.currentUserId, this.searchedUserId],
      });
      if (room != false) {
        this.resetCreateRoom();
        this.fetchRooms();
      } else {
        this.notFindUser = true;
        this.errorMessage = "create room failed";
      }
    },
    async fetchRooms() {
      this.resetRooms();
      if (this.currentUserId === "") return (this.loadingRooms = false);

      // 把自己放入 allUsers
      const userResult = await this.axios.get(
        url + "/api/users/" + this.currentUserId
      );
      this.allUsers.push({
        _id: this.currentUserId,
        username: userResult.data.username,
        avatar: userResult.data.avatar,
        status: {
          state: userResult.data.status,
          last_changed: userResult.data.last_changed,
        },
      });

      // 獲取所有房間
      const result = await this.axios.get(
        url + "/api/rooms/" + this.currentUserId + "?operate=showrooms"
      );
      let rooms = result.data;
      // 如果獲取不到則顯示 no room
      if (result.data.length === 0) return (this.loadingRooms = false);
      // 初始化 allUsers
      rooms.forEach((room) => {
        let allUsers = this.allUsers;
        // 如果不是自己的話就填入 allUsers
        room.users.forEach((user) => {
          if (user._id != this.currentUserId) allUsers.push(user);
        });
      });
      this.rooms = this.rooms.concat(result.data);
      if (this.rooms.length !== 0) this.loadingRooms = false;
    },
    async fetchMessages({ room, options = {} }) {
      if (options.reset) {
        this.currentRoomId = room.roomId;
        this.resetMessages();
      }
      if (this.oldestMessageId === 0) {
        const result = await this.axios.get(
          url + "/api/rooms/" + room.roomId + "?operate=lastmessageid"
        );
        this.oldestMessageId = parseInt(result.data) + 1;
      }

      const oldest = await this.axios.get(
        url + "/api/messages/" + room.roomId + "?operate=oldest"
      );

      const result = await this.axios.get(
        url +
          "/api/messages/" +
          room.roomId +
          "?operate=old&currentmessage=" +
          this.oldestMessageId
      );

      if (result.data.length === 0) return (this.messagesLoaded = true); // 沒有更多歷史消息

      let newMessages = result.data;

      newMessages.forEach((message) => {
        const timestamp = message.timestamp;
        message.date = DayJs(timestamp).format("MM-DD-YYYY");
        message.timestamp = DayJs(timestamp).format("HH:mm");
      });
      let messages = this.messages;
      messages = [...newMessages, ...messages];
      this.messages = messages;
      this.oldestMessageId = messages[0]._id;

      if (result.data[0]._id === oldest.data._id)
        return (this.messagesLoaded = true);
    },
    async sendMessage({ content, roomId }) {
      const user = this.allUsers.find(
        (user) => user._id === this.currentUserId
      );
      let message = {
        content: content,
        sender_id: this.currentUserId,
        username: user.username,
        room_id: roomId,
        time: DayJs().format("YYYY-MM-DD HH:mm:ss"),
        system: false,
        saved: true,
        distributed: true,
        seen: false,
        disable_actions: true,
        disable_reactions: true,
      };
      await this.$socket.emit("chaat", message);
    },
    clickEditInfo() {
      this.showEditInfo = true;
      this.editedAvatar = this.currentUserAvatar;
      this.editedName = this.currentUserName;
    },
    async uploadInfo() {
      let isAvatarOk = false;
      let isNameOk = false;
      this.isEditInfoUploading = true;

      if (this.editedAvatar !== this.currentUserAvatar) {
        const result = await this.axios.put(url + "/api/users/" + this.currentUserId, {
            operate: "update_avatar",
            data: {
              avatar: this.editedAvatar,
            },
        });
        if (result !== false) {
          isAvatarOk = true;
        } else {
          isAvatarOk = true;
        }
      } else {
        isAvatarOk = true;
      }
      if (this.editName !== this.currentUserName) {
        const result = await this.axios.put(url + "/api/users/" + this.currentUserId, {
            operate: "update_username",
            data: {
              username: this.editedName,
            },
        });
        if (result !== false) {
          isNameOk = true;
        } else {
          isNameOk = false;
        }
      } else {
        isNameOk = true;
      }
      if (isAvatarOk && isNameOk) {
        console.log("ok")
        this.isEditInfoUploading = false;
        this.showEditInfo = false;
        this.$emit('update_info', {
          username: this.editedName,
          avatar: this.editedAvatar
        });
      }
    },
    uploadAvatar() {
      this.avatarUploading = true;
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
        (err, data) => {
          console.log(data);
          _this.avatarUploading = false;
          if (data.statusCode === 200) {
            console.log(
              data.Location + "?imageMogr2/format/webp/interlace/0/quality/100"
            );
            _this.editedAvatar =
              "http://" +
              data.Location +
              "?imageMogr2/format/webp/interlace/0/quality/100";
          } else {
            ipcRenderer.send('upload-avavtar-failed', err)
          }
        }
      );
    },
  },
  mounted() {
    this.fetchRooms();
    this.sockets.subscribe("chaat", (data) => {
      // 將有最新消息的放到最前
      const roomIndex = this.rooms.findIndex((room) => {
        return room.roomId === data.room_id;
      });
      if (roomIndex !== -1) {
        const rooms = this.rooms;
        const room = rooms[roomIndex];
        rooms.splice(roomIndex, 1);
        rooms.unshift(room);
        this.rooms = rooms;
        // 發送通知
        ipcRenderer.send('new-message', {data, avatar: room.avatar });
      }
      const user = this.allUsers.find((user) => user._id === data.sender_id);
      if (user !== undefined && data.room_id === this.currentRoomId) {
        const timestamp = DayJs(data.time).format("HH:mm");
        const date = DayJs(data.time).format("MM-DD-YYYY");
        data.timestamp = timestamp;
        data.date = date;
        let messages = this.messages;
        messages.push(data);
        this.messages = messages;
        this.oldestMessageId = data._id;
      }
    });
    this.sockets.subscribe("room", (data) => {
      if (data.users[1]._id == this.currentUserId) {
        let rooms = this.rooms;
        rooms.push(data);
        this.rooms = rooms;
      }
    });
    this.sockets.subscribe("status", (data) => {
      const user = this.allUsers.find((user) => user._id === data._id);
      if (user !== undefined) {
        for (const room of this.rooms) {
          let found = false;
          for (const roomUser of room.users) {
            if (roomUser._id === data._id) {
              roomUser.status.state = data.status;
              roomUser.status.last_changed = data.last_changed;
              found = true;
              console.log(roomUser);
              break;
            }
          }
          if (found) break;
        }
      }
    });
  },
};
</script>

<style lang="scss" scoped>
.id-flex {
  display: flex;
  padding: 5px 45px 0 45px;
}

.change-info {
  position: relative;
}

.edit-avatar {
  z-index: 2;
}

.edit-avatar-upload-lodaing {
  position: absolute;
  transform: translate(0%, -40%);
  z-index: 1;
}

.edit-avatar-upload {
  position: absolute;
  transform: translate(15%, -86%);
  z-index: 3;
}

.name-input {
  width: 120px;
}
</style>