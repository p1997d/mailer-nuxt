<template>
    <main>
        <div style="display:flex; justify-content: space-between;">
            <div><userinfo/></div>
            <div><button id="buttonClose" class="btn btn-outline-dark btn-sm" @click="buttonClose" aria-label="Close"><i class="bi bi-x"></i></button></div>
        </div><br/>
        <div class="message">
            <h3 id="subject"></h3>
            <p id="from"></p>
        </div>
        <div class="editor"></div>
    </main>
</template>
<script>
import userinfo from '../../components/userinfo.vue'
export default {
    components: { userinfo },
    middleware: 'auth',
    asyncData ({ params, $http }) {
        return $http.$get( '/api/open/' + params.messageID )
        .then( ( res ) => {
            return { message: res };
        })
    },
    async mounted() {
        document.getElementById( 'subject' ).innerText = this.message.subject[0];
        document.getElementById( 'from' ).innerText = this.message.from[0];

        this.message.subtype.indexOf( 'html' ) != -1 ?
            document.querySelector( '.editor' ).innerHTML = `${this.message.mail}` :
            document.querySelector( '.editor' ).innerHTML = `<pre>${this.message.mail}</pre>`;
    },
    methods: {
        async buttonClose() {
            this.$router.push( '/' );
        }
    }
}
</script>