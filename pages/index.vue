<template>
  <main>    
    <div style="display:flex; justify-content: space-between;">      
      <div><userinfo/></div>      
      <div><button id="buttonClose" class="btn btn-outline-dark btn-sm" @click="buttonClose" aria-label="Close">Выйти</button></div>
    </div><br/>
    <div style="display: flex;">
      <div style="margin: 0 5px;"><button id="buttonNew" class="btn btn-outline-primary btn-sm" @click="buttonNew" aria-label="New"><i class="bi bi-pencil-square"></i> Написать</button></div>
      <div style="margin: 0 5px;"><button id="buttonRefresh" class="btn btn-outline-primary btn-sm" @click="buttonRefresh" aria-label="Refresh"><i class="bi bi-arrow-repeat"></i> Обновить</button></div>
      <div style="margin: 0 5px;"><button id="buttonSeen" class="btn btn-outline-primary btn-sm" @click="buttonSeen" aria-label="Seen" disabled><i class="bi bi-envelope-open"></i> Прочитано</button></div>
      <div style="margin: 0 5px;"><button id="buttonDelete" class="btn btn-outline-primary btn-sm" @click="buttonDelete" aria-label="Delete" disabled><i class="bi bi-trash"></i> Удалить</button></div>
    </div><br/>
    <div id="messageList" class="list-group">
      <div class="text-center">
        <div id="spinner" class="spinner-border text-primary" role="status"><span  class="visually-hidden">Loading...</span></div>
        <div v-for="item in list" :key="item">
          <div v-if="!item.seen">
            <b><div style="display: flex; align-items: baseline;" class="list-group-item list-group-item-action">
              <input class="form-check-input" type="checkbox" id="checkMessage" @click="checkMessage" v-bind:value="item.uid">
              <div class="message" @click="$router.push( '/message/' + item.uid )">
                <div class="from" v-bind:title="item.fromEmail">{{item.fromName}}</div>
                <div class="subjects"><p>{{item.subjects}}</p></div>
                <div class="time">{{item.messageTime}}</div>
              </div>
            </div></b>
          </div>
          <div v-else>
            <div style="display: flex; align-items: baseline;" class="list-group-item list-group-item-action">
              <input class="form-check-input" type="checkbox" id="checkMessage" @click="checkMessage" v-bind:value="item.uid">
              <div class="message" @click="$router.push( '/message/' + item.uid )">
                <div class="from" v-bind:title="item.fromEmail">{{item.fromName}}</div>
                <div class="subjects"><p>{{item.subjects}}</p></div>
                <div class="time">{{item.messageTime}}</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div><br/>
    <div id="link" style="display:none">
      <div style="width:fit-content">Подключить:</div>
      <button @click="authYandex" class="btn btn-outline-dark btn-circle"><img src="https://yastatic.net/doccenter/images/tech2.yandex.ru/ru/passport/doc/dg/freeze/6rDvXXB38VOBgtxkOExfxnZPUWs.png" /></button>
    </div>
    <div><button id="buttonMore" class="btn btn-outline-dark btn-sm" @click="buttonMore" aria-label="More">Еще письма</button></div>
  </main>
</template>

<script>
import userinfo from '../components/userinfo.vue';
export default {
  components: { userinfo },
  middleware: 'auth',
  data() {
    return {
      list: [],
      page: 1,
    }    
  },
  created: function() {
    if ( this.$route.hash ) {
      setTimeout(() => {
        this.$router.replace("/").then( () => {
          this.$router.go();
        });
      }, 1000);
    };
  },
  async mounted() {
    if ( this.$route.hash ) {
      let access_token = ( /access_token=([^&]+)/.exec( this.$route.hash )[1] );
      await this.$http.$get( `/api/oauthyandex/?access_token=${access_token}` );      
    }
    await this.$http.$get( `/api/list/?page=${this.page}` ).then( result => {
      let list = [];
      let messageTime = [];
      let fromName = [];
      let fromEmail = [];
      if ( result.status == "ok" ) {
        result.uid.forEach( function ( item, i ) {
          let time = new Date( result.date[i] );
          let month = ( time.getMonth() < 10 ) ? '0' + time.getMonth() : time.getMonth();
          let minutes = ( time.getMinutes() < 10 ) ? '0' + time.getMinutes() : time.getMinutes();
          messageTime[i] = `${time.getDate()}.${month}.${time.getFullYear()} в ${time.getHours()}:${minutes}`;
          fromName[i] = result.from[i][0].replace( / \<.+\>/, "" ).replace( /"/g, '' );
          fromEmail[i] = ( / \<.+\>/ ).exec( result.from[i][0] );
          list.unshift( { subjects: result.subjects[i], uid: item, messageTime: messageTime[i], fromName: fromName[i], fromEmail: fromEmail[i], text: result.text[i], seen: result.seen[i] } );
        });
        document.getElementById( 'spinner' ).setAttribute( 'style', 'display: none' );
        this.$nuxt.$loading.finish();
        this.list = list;
      }
      else if ( result.status == "notAuth" ) {
        document.getElementById( 'spinner' ).setAttribute( 'style', 'display: none' );
        document.getElementById( 'link' ).setAttribute( 'style', 'display: block' );
        buttonNew.setAttribute( 'disabled', 'disabled' );
        buttonRefresh.setAttribute( 'disabled', 'disabled' );
        buttonSeen.setAttribute( 'disabled', 'disabled' );
        buttonDelete.setAttribute( 'disabled', 'disabled' );
        buttonMore.setAttribute( 'disabled', 'disabled' );
      }
      else if ( result.status == "IMAPdisabled" ) {
        location.assign( 'https://mail.yandex.com/#setup/client' );
      }
    });
  }, 
  methods: {
    async buttonNew() {
      this.$router.push( '/new' );
    },
    async buttonRefresh() {
      this.$nuxt.$loading.start();
      await this.$http.$get( `/api/list/?page=${this.page}` ).then( result => {
        let list = [];
        let messageTime = [];
        let fromName = [];
        let fromEmail = [];
        result.uid.forEach( function ( item, i ) {
          let time = new Date( result.date[i] );
          let month = ( time.getMonth() < 10 ) ? '0' + time.getMonth() : time.getMonth();
          let minutes = ( time.getMinutes() < 10 ) ? '0' + time.getMinutes() : time.getMinutes();
          messageTime[i] = `${time.getDate()}.${month}.${time.getFullYear()} в ${time.getHours()}:${minutes}`;
          fromName[i] = result.from[i][0].replace( / \<.+\>/, "" ).replace( /"/g, '' );
          fromEmail[i] = ( / \<.+\>/ ).exec( result.from[i][0] );
          list.unshift( { subjects: result.subjects[i], uid: item, messageTime: messageTime[i], fromName: fromName[i], fromEmail: fromEmail[i], text: result.text[i], seen: result.seen[i] } );
        });
        this.list = list;
        this.$nuxt.$loading.finish();
      });
    },
    async checkMessage() {
      const checkboxes = document.querySelectorAll( `#checkMessage:checked` );
      if ( checkboxes.length != 0 ) {
          document.getElementById( 'buttonSeen' ).removeAttribute( 'disabled' );
          document.getElementById( 'buttonDelete' ).removeAttribute( 'disabled' );
      }
      else {
          document.getElementById( 'buttonSeen' ).setAttribute( 'disabled', 'disabled' );
          document.getElementById( 'buttonDelete' ).setAttribute( 'disabled', 'disabled' );
      };
    },
    async buttonSeen() {
      this.$nuxt.$loading.start();
      const checkboxes = document.querySelectorAll( `#checkMessage:checked` );
      let uids = [];
      checkboxes.forEach( ( checkbox ) => {
          uids.push( checkbox.value );
      });
      this.list = await this.$http.$post( `/api/seen`, { uids: uids, page: this.page } ).then( async function( result ) {
        return await $nuxt.$http.$get( `/api/list/?page=${result.page}` ).then( result => {
          let list = [];
          let messageTime = [];
          let fromName = [];
          let fromEmail = [];
          result.uid.forEach( function ( item, i ) {
            let time = new Date( result.date[i] );
            let month = ( time.getMonth() < 10 ) ? '0' + time.getMonth() : time.getMonth();
            let minutes = ( time.getMinutes() < 10 ) ? '0' + time.getMinutes() : time.getMinutes();
            messageTime[i] = `${time.getDate()}.${month}.${time.getFullYear()} в ${time.getHours()}:${minutes}`;
            fromName[i] = result.from[i][0].replace(/ \<.+\>/, "").replace(/"/g, '');
            fromEmail[i] = ( / \<.+\>/ ).exec( result.from[i][0] );
            list.unshift( { subjects: result.subjects[i], uid: item, messageTime: messageTime[i], fromName: fromName[i], fromEmail: fromEmail[i], text: result.text[i], seen: result.seen[i] } );
          });
          buttonSeen.setAttribute( 'disabled', 'disabled' );
          buttonDelete.setAttribute( 'disabled', 'disabled' );
          return list;
        });
      });
      this.$nuxt.$loading.finish();
    },
    async buttonDelete() {
      this.$nuxt.$loading.start();
      const checkboxes = document.querySelectorAll( `#checkMessage:checked` );
      let uids = [];
      checkboxes.forEach( ( checkbox ) => {
          uids.push( checkbox.value );
      });
      this.list = await this.$http.$post( `/api/delete`, { uids: uids, page: this.page } ).then( async function( result ) {
        return await $nuxt.$http.$get( `/api/list/?page=${result.page}` ).then( result => {
          let list = [];
          let messageTime = [];
          let fromName = [];
          let fromEmail = [];
          result.uid.forEach( function ( item, i ) {
            let time = new Date( result.date[i] );
            let month = ( time.getMonth() < 10 ) ? '0' + time.getMonth() : time.getMonth();
            let minutes = ( time.getMinutes() < 10 ) ? '0' + time.getMinutes() : time.getMinutes();
            messageTime[i] = `${time.getDate()}.${month}.${time.getFullYear()} в ${time.getHours()}:${minutes}`;
            fromName[i] = result.from[i][0].replace(/ \<.+\>/, "").replace(/"/g, '');
            fromEmail[i] = ( / \<.+\>/ ).exec( result.from[i][0] );
            list.unshift( { subjects: result.subjects[i], uid: item, messageTime: messageTime[i], fromName: fromName[i], fromEmail: fromEmail[i], text: result.text[i], seen: result.seen[i] } );
          });
          buttonSeen.setAttribute( 'disabled', 'disabled' );
          buttonDelete.setAttribute( 'disabled', 'disabled' );
          return list;
        });
      });
      this.$nuxt.$loading.finish();
    },
    async buttonMore() {
      this.$nuxt.$loading.start();
			document.getElementById( 'buttonMore' ).setAttribute( 'disabled', 'disabled' );
			document.getElementById( 'buttonMore' ).innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Еще письма';
      this.page++;
      await this.$http.$get( `/api/list/?page=${this.page}` ).then( result => {
        let list = [];
        let messageTime = [];
        let fromName = [];
        let fromEmail = [];
        result.uid.forEach( function ( item, i ) {
          let time = new Date( result.date[i] );
          let month = ( time.getMonth() < 10 ) ? '0' + time.getMonth() : time.getMonth();
          let minutes = ( time.getMinutes() < 10 ) ? '0' + time.getMinutes() : time.getMinutes();
          messageTime[i] = `${time.getDate()}.${month}.${time.getFullYear()} в ${time.getHours()}:${minutes}`;
          fromName[i] = result.from[i][0].replace( / \<.+\>/, "" ).replace( /"/g, '' );
          fromEmail[i] = ( / \<.+\>/ ).exec( result.from[i][0] );
          list.unshift( { subjects: result.subjects[i], uid: item, messageTime: messageTime[i], fromName: fromName[i], fromEmail: fromEmail[i], text: result.text[i], seen: result.seen[i] } );
        });
        this.list = list;
        this.$nuxt.$loading.finish();
				document.getElementById( 'buttonMore' ).removeAttribute( 'disabled' );
				document.getElementById( 'buttonMore' ).innerHTML = 'Еще письма';
      });
    },
    async buttonClose() {
      try {
        let response = await this.$auth.logout().then( () => {
          this.$router.push( '/login' );
        });
      } catch ( err ) {
        console.log( err );
      }
    },
    async authYandex() {
      location.replace( 'https://oauth.yandex.ru/authorize?response_type=token&client_id=5c5165532f344a4097acbc321143d4fa&redirect_uri=https://mailer-20210923.herokuapp.com&force_confirm=yes&display=popup' );
    }
  }
}
</script>
