<template>
  <div class="window-container">
    <div class="chat-forms">
      <form @submit.prevent="createRoom" v-if="addNewRoom">
        <input
          type="text"
          placeholder="輸入對方的id"
          v-model="addRoomUserId"
        />
        <button type="submit" :disabled="disableForm || !addRoomUserId">
          創建聊天
        </button>
        <button class="button-cancel" @click="addNewRoom = false">
          取消
        </button>
      </form>

      <form @submit.prevent="addRoomUser" v-if="inviteRoomId">
        <input
          type="text"
          placeholder="Add user to the room"
          v-model="invitedUsername"
        />
        <button type="submit" :disabled="disableForm || !invitedUsername">
          Add User
        </button>
        <button class="button-cancel" @click="inviteRoomId = null">
          Cancel
        </button>
      </form>

      <form @submit.prevent="deleteRoomUser" v-if="removeRoomId">
        <select v-model="removeUserId">
          <option default value="">Select User</option>
          <option v-for="user in removeUsers" :key="user._id" :value="user._id">
            {{ user.username }}
          </option>
        </select>
        <button type="submit" :disabled="disableForm || !removeUserId">
          Remove User
        </button>
        <button class="button-cancel" @click="removeRoomId = null">
          Cancel
        </button>
      </form>
    </div>
    <chat-window
      :current-user-id="1"
      :rooms="rooms"
      :loading-rooms="loadingRooms"
      :messages="messages"
      :theme="theme"
      :messages-loaded="messagesLoaded"
      :show-audio="false"
      :show-files="false"
      @fetch-messages="fetchMessages"
      @send-message="sendMessage"
      @add-room="addRoom"
    />
  </div>
</template>

<script>
import ChatWindow from "vue-advanced-chat";
import "vue-advanced-chat/dist/vue-advanced-chat.css";

import DayJs from "dayjs";

const url = "http://106.52.127.85:7001";

export default {
  components: {
    ChatWindow,
  },
  props: ["current-user-id", "theme", "reset"],
  data() {
    return {
      oldestMessageId: 0,
      rooms: [],
      allUsers: [],
      loadingRooms: true,
      loadingLastMessageByRoom: 0,
      selectedRoom: null,
      messages: [],
      messagesLoaded: false,
      roomMessage: "",
      typingMessageCache: "",
      disableForm: false,
      addNewRoom: null,
      addRoomUserId: "",
      inviteRoomId: null,
      invitedUsername: "",
      removeRoomId: null,
      removeUserId: "",
      removeUsers: [],
      menuActions: [
        { name: "inviteUser", title: "Invite User" },
        { name: "removeUser", title: "Remove User" },
        { name: "deleteRoom", title: "Delete Room" },
      ],
      styles: { container: { borderRadius: "4px" } },
    };
  },
  sockets: {
    connect() {},
  },
  destroyed() {
		this.resetRooms()
	},
  methods: {
    resetForms() {
      this.disableForm = false;
      this.addNewRoom = null;
      this.addRoomUsername = "";
      this.inviteRoomId = null;
      this.invitedUsername = "";
      this.removeRoomId = null;
      this.removeUserId = "";
    },
    resetRooms() {
      this.loadingRooms = true;
      this.loadingLastMessageByRoom = 0;
      this.rooms = [];
      this.allUsers = [];
      this.resetMessages();
    },
    resetMessages() {
      this.messages = [];
      this.oldestMessageId = 0;
      this.messagesLoaded = false;
      console.log("is reset")
    },
    async fetchRooms() {
      this.resetRooms();
      if(this.currentUserId === '') return (this.loadingRooms = false)
      const userResult = await this.axios.get(
        url + "/api/users/" + this.currentUserId
      );
      this.allUsers.push({
        _id: this.currentUserId,
        username: userResult.data.username,
        avatar: userResult.data.avatar,
        status: {
          state: userResult.data.status,
          last_changed: "Now",
        },
      });
      
      const result = await this.axios.get(
        url + "/api/rooms/" + this.currentUserId
      );
      let rooms = result.data;
      if (result.data.length === 0) return (this.loadingRooms = false);
      rooms.forEach((room) => {
        let roomUsers = [];
        const users = room.users.split("%");
        users.forEach((user) => {
          if (user === "") return;
          this.axios
            .get(url + "/api/users/" + user)
            .then((response) => {
              const foundUser = this.allUsers.find((user) => user._id === user);
              if (!foundUser) {
                this.allUsers.push({
                  _id: user,
                  username: response.data.username,
                  avatar: response.data.avatar,
                  status: {
                    state: response.data.status,
                    last_changed: "Now",
                  },
                });
              }
              roomUsers.push({
                _id: user,
                username: response.data.username,
                avatar: response.data.avatar,
                status: {
                  state: response.data.status,
                  last_changed: "Now",
                },
              });
            });
        });
        room.users = roomUsers;
      });
      this.rooms = this.rooms.concat(result.data);
      if (this.rooms.length !== 0) this.loadingRooms = false;
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
    async fetchMessages({ room, options = {} }) {
      if (options.reset) this.resetMessages();

      if (this.oldestMessageId === 0) {
        this.oldestMessageId = parseInt(room.lastMessageId) + 1;
      }

      const oldest = await this.axios.get(url + "/api/messages/" + room.roomId + "?operate=oldest");

      const result = await this.axios.get(
        url + "/api/messages/" +
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
      console.log(messages[0]._id);
      this.oldestMessageId = messages[0]._id;
      // console.log("result[0]",result.data[0]._id)
      // console.log("oldest",oldest.data._id)
      if (result.data[0]._id === oldest.data._id) return (this.messagesLoaded = true);
    },
    async createRoom() {
      this.disableForm = true;
      if (this.currentUserId === this.addRoomUserId) {
        alert("你大可不必和自己聊天。");
        this.addNewRoom = false;
        this.addRoomUserId = "";
        return;
      }
      const user = this.allUsers.find(
        (user) => user._id === this.addRoomUserId
      );
      if (user != null) {
        alert("你們已經是好友了。");
        this.addNewRoom = false;
        this.addRoomUserId = "";
        return;
      }
      const users = this.currentUserId + "%" + this.addRoomUserId;
      const addUser = await this.axios.get(
        url + "/api/users/" + this.addRoomUserId
      );
      if (addUser.data === "") {
        alert("不存在這個用戶");
        this.addNewRoom = false;
        this.addRoomUsername = "";
        return;
      }
      const currentUser = this.allUsers.find(
        (user) => user._id === this.currentUserId
      );
      await this.axios.post(url + "/api/rooms/", {
        roomName: currentUser.username + " " + addUser.data.username,
        avatar: "./assets/810.jpeg",
        users: users,
      });
      this.addRoomUserId = "";
      this.addNewRoom = false;
      this.fetchRooms();
    },
    addRoom() {
      this.resetForms();
      this.addNewRoom = true;
    },
  },
  mounted() {
    this.fetchRooms();
    this.sockets.subscribe("chaat", (data) => {
      const timestamp = DayJs(data.time).format("HH:mm");
      const date = DayJs(data.time).format("MM-DD-YYYY");
      data.timestamp = timestamp;
      data.date = date;
      let messages = this.messages;
      messages.push(data);
      this.messages = messages;
      this.oldestMessageId = data._id;
    });
  },
};
</script>


<style lang="scss" scoped>
.window-container {
  width: 100%;
}
.chat-forms {
  padding-bottom: 20px;
  form {
    padding-top: 20px;
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
  .button-cancel {
    color: #a8aeb3;
    background: none;
    margin-left: 5px;
  }
  select {
    vertical-align: middle;
    height: 33px;
    width: 120px;
    font-size: 13px;
  }
}
</style>