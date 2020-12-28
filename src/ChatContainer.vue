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
      <template v-slot:rooms-header>
        <div class="d-flex ml-4 mt-3">
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
                  <v-divider class="my-3"></v-divider>
                  <v-chip color="grey">ID : {{ currentUserId }}</v-chip>
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
    <v-dialog v-model="dialog" width="500">
      <v-card>
        <v-card-title> Add Friend </v-card-title>
        <v-row class="pl-15 pr-15 pt-5">
          <v-text-field
            @keydown.enter="searchUser"
            v-model="searchUserId"
            :error="notFindUser"
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
        </v-row>
        <v-skeleton-loader
          class="pl-8 pr-15"
          :boilerplate="searchUserButtonLoading === false"
          type="list-item-avatar-three-line"
          v-if="isSearched === false"
        ></v-skeleton-loader>
        <v-row v-if="isSearched" class="pb-5">
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
        <v-card-actions>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
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
  props: ["currentUserId", "currentUserName","currentUserAvatar", "theme", "reset"],
  data() {
    return {
      addButtonBlock: false,
      errorMessage: "",
      notFindUser: false,
      searchUserButtonLoading: false,
      searchUserButtonBlock: true,
      addRoomButtonLoading: false,
      searchUserId: "",
      searchedUserId: "",
      searchedUserName: "",
      searchedUserAvatar: "",
      isSearched: false,
      dialog: false,
      isClicLogout: 0,
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
  watch: {
    searchUserId() {
      if (this.searchUserId === "") this.searchUserButtonBlock = true;
      else this.searchUserButtonBlock = false;
    },
  },
  sockets: {
    connect() {},
  },
  destroyed() {
    this.resetRooms();
  },
  methods: {
    clickAddRoom() {
      this.dialog = true;
    },
    resetCreateRoom() {
      this.addButtonBlock = false;
      this.notFindUser = false;
      this.searchUserButtonLoading = false;
      this.searchUserButtonBlock = true;
      this.addRoomButtonLoading = false;
      this.isSearched = false;
      this.dialog = false;
      this.errorMessage = "";
      this.searchUserId = "";
      this.searchedUserId = "";
      this.searchedUserName = "";
      this.searchedUserAvatar = "";
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
    },
    async searchUser() {
      this.isSearched = false;
      this.searchUserButtonLoading = true
      const result = await this.axios.get(url + "/api/users/" + this.searchUserId);
      if (result.data != false) {
        // 判斷是否已經是好友
        const isFriend = await this.axios.get(url + "/api/rooms/" + this.currentUserId + "?operate=isfriend&id=" + result.data._id)
        console.log(this.searchUserId);
        if (result.data._id == this.currentUserId || isFriend.data == true) this.addButtonBlock = true;
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
        this.fetchRooms()
      }
      else {
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
        room.users.forEach(user => {
          if (user._id != this.currentUserId) allUsers.push(user);
        })
      });
      this.rooms = this.rooms.concat(result.data);
      if (this.rooms.length !== 0) this.loadingRooms = false;
    },
    async fetchMessages({ room, options = {} }) {
      if (options.reset) this.resetMessages();
      if (this.oldestMessageId === 0) {
        const result = await this.axios.get(
          url + "/api/rooms/" + room.roomId + "?operate=lastmessageid"
        )
        console.log("room", room.roomId)
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
    this.sockets.subscribe("room", (data) => {
      if (data.users[1]._id == this.currentUserId) {
        let rooms = this.rooms;
        rooms.push(data);
        this.rooms = rooms;
      }
    });
  },
};
</script>