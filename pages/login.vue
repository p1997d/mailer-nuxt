<template>
  <div class="loginForm">
    <div class="mb-3">
      <label for="username" class="form-label">Логин</label>
      <input id="username" type="text" class="form-control"  v-model="login.username">
    </div>
    <div class="mb-3">
      <label for="password" class="form-label">Пароль</label>
      <input id="password" type="password" class="form-control" v-model="login.password">
    </div>
    <div class="mb-3">
      {{message}}
    </div>
    <div class="mb-3" style="display: flex; justify-content: space-between">
      <button class="btn btn-primary" type="submit" v-on:click="userLogin">Войти</button>
      <button class="btn btn-primary" v-on:click="$router.push( '/registration' )">Регистрация</button>
    </div>
  </div>        
</template>

<script>
export default {
  data() {
    return {
      login: {
        username: '',
        password: ''
      },
      message: ''
    }
  },
  methods: {
    async userLogin() {
      try {
        let response = await this.$auth.loginWith( 'local', { data: this.login } ).then( result => {
          if ( result.data.status ){
            this.$router.push( '/' );
          }
          else {
            this.message = result.data.message;
          };
        });
      } catch ( err ) {
        console.log( err );
      }
    }
  }
}
</script>