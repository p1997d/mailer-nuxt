<template>
  <div class="loginForm">
    <div class="mb-3">
      <label for="username" class="form-label">Придумайте логин</label>
      <input id="username" type="text" class="form-control" v-model="registration.username">
    </div>
    <div class="mb-3">
      <label for="password" class="form-label">Придумайте пароль</label>
      <input id="password" type="password" class="form-control" v-model="registration.password">
    </div>
    <div class="mb-3">
      <label for="password" class="form-label">Повторите пароль</label>
      <input id="repeatPassword" type="password" class="form-control" v-model="registration.repeatPassword">
    </div>
    <div class="mb-3">
      {{message}}
    </div>
    <div class="mb-3" style="display: flex; justify-content: space-between">
      <button class="btn btn-primary" type="submit" v-on:click="userRegistration">Зарегистрироваться</button>
      <button class="btn btn-primary" v-on:click="$router.push( '/login' )">Войти</button>
    </div> 
  </div>        
</template>

<script>
export default {
  data() {
    return {
      registration: {
        username: '',
        password: '',
        repeatPassword: ''
      },      
      message: ''
    }
  },
  methods: {
    async userRegistration() {
      try {        
        if ( this.registration.username.length == 0 ){
          this.message = "Необходимо выбрать логин";
          return false;
        }
        if ( this.registration.password.length < 6 ){
          this.message = "Пароль слишком короткий";
          return false;
        }
        if ( this.registration.password != this.registration.repeatPassword ){
          this.message = "Подтверждение не совпадает с паролем";
          return false;
        }
        await this.$http.$post( '/api/auth/registration', this.registration ).then( result => {
          if ( result.status ) {
            this.$router.push( '/login' );
          }
          else {
            this.message = result.message;
          }
        });
      } catch ( err ) {
        console.log( err );
      }
    }
  }
}
</script>