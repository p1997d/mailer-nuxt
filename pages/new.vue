<template>
    <main>
        <div id="sendSuccess" style="top:-5%; opacity:0">Отправлено</div>
        <div style="display:flex; justify-content: space-between;">
            <div><userinfo/></div>
            <div><button id="buttonClose" class="btn btn-outline-dark btn-sm" @click="buttonClose" aria-label="Close"><i class="bi bi-x"></i></button></div>
        </div><br/>
        <div class="message">
            <label for="to" class="form-label">Кому: </label>
            <input type="text" name="to" id="to" placeholder="example@mail.com" value="" class="form-control">
            <div id="status"></div>
            <br/>				
            <label for="subject" class="form-label">Тема: </label>
            <input type="text" name="subject" id="subject" placeholder="" value="" class="form-control"><br/>
        </div>
        <div class="centered">
            <div class="row row-editor">
                <div class="editor-container">
                    <div class="editor"></div>
                </div>
            </div>
        </div>
        <br/>
        <button @click="send" class="btn btn-primary">Отправить</button>
    </main>
</template>
<script>
import userinfo from '../components/userinfo.vue';
export default {
    components: { userinfo },
    middleware: 'auth',
    data() {
        return {
            messageEditor: '',
        }    
    },
    async mounted() {
		
		ClassicEditor.create( document.querySelector( '.editor' ), {
            
        toolbar: {
            items: [
                'undo',
                'redo',
                '|',
                'bold',
                'italic',
                'underline',
                'strikethrough',
                '|',
                'fontFamily',
                'fontSize',
                'fontBackgroundColor',
                'fontColor',
                '|',
                'specialCharacters',
                'link',
                'imageUpload',
                'blockQuote',
                '|',
                'alignment',
                'bulletedList',
                'numberedList',
                '|',
                'removeFormat'
            ]
        },
        language: 'ru',
            licenseKey: '',
        } )
        .then( editor => {
            window.editor = editor;
            this.messageEditor = editor;
        } )
        .catch( error => {
            console.error( 'Oops, something went wrong!' );
            console.error( 'Please, report the following error on https://github.com/ckeditor/ckeditor5/issues with the build id and the error stack trace:' );
            console.warn( 'Build id: q5ol9uezd0y6-rvy448cdh2nh' );
            console.error( error );
        } );
    },
    methods: {
        async send() {
            this.$nuxt.$loading.start();
            let emailList = to.value.split( ',' );
            function validEmail( element, index, array ) {
                return element.replace( /\s/g, '' ).match( /^[\w-\.]+@[\w-]+\.[a-z]{2,4}$/i );
            }
            if ( emailList.every( validEmail ) ) {
                let messageEditor = this.messageEditor;
                editor = document.querySelector( '.ck-editor__editable' );
                await this.$http.$post( `/api/send`, { to: to.value, subject: subject.value, text: editor.innerText, html: editor.innerHTML } ).then( async function( result ) {
                    if ( result.status == "sendSuccess" ) {                        
						to.value = '';
						subject.value = '';
						messageEditor.setData( '' );
						document.getElementById( 'sendSuccess' ).setAttribute( 'style', 'top: 0; opacity: 1' );
						setTimeout( () => { document.getElementById( 'sendSuccess' ).setAttribute ( 'style', 'top: -5%; opacity: 0' ); }, 1000 );
                    }
                });
                this.$nuxt.$loading.finish();
            }
            else {
                document.getElementById( 'status' ).innerHTML = 'Проверьте правильность ввода всех адресов.'
                setTimeout( () => { document.getElementById( 'status' ).innerHTML = ''; }, 3000 );
            }
        },        
        async buttonClose() {
            this.$router.push( '/' );
        }
    }
}
</script>