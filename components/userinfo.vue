<template>
    <div>
        <img style="border-radius: 60px;" v-bind:src="avatar" /> {{display_name}}
    </div>
</template>
<script>
export default {
    data() {
        return {
            avatar: '',
            display_name: '',
        }    
    },
    async mounted() {        
        await this.$http.$get( `/api/userinfo` ).then( result => {
            this.avatar = `https://avatars.mds.yandex.net/get-yapic/${result.default_avatar_id}/islands-34`;
            this.display_name = result.display_name;
        });
    }
}
</script>