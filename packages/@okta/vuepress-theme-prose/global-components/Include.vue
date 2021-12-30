<template>
    <div>
        {{ content }}
    </div>
</template>
<script>
console.log(document.currentScript)
const INCLUDES_PATH = 'file://'+'/Users/dev/Sites/okta-developer-docs'+'/packages/@okta/vuepress-site/includes/';

export default {
  name: 'include',
  props: {
      path: {
        type: String,
        required: true
      }
  },
  data() {
    return {
      content: null,
    }
  },
  mounted() {
      this.content = this.getContent();
  },
  methods: {
    getContent() {
//         const reader = new FileReader();
//         reader.onload = (res) => {
//           this.content = res.target.result;
//         };
//         reader.onerror = (err) => console.log(err);
// console.log(INCLUDES_PATH + this.path);
//         // TODO check path is realative or absolute
//         reader.readAsText(INCLUDES_PATH + this.path);

        const vm = this;
        function reqListener () {
            console.log(this.responseText);
            vm.content = this.responseText;
        }

        var oReq = new XMLHttpRequest();
        oReq.addEventListener("load", reqListener);
        oReq.open("GET", INCLUDES_PATH + this.path);
        oReq.send();

        // fetch(INCLUDES_PATH + this.path)
        //     .then(response => {
        //         console.log(response);
        //         // this.content = response.text();
        //     })
        //     .then(data => {
        //         // Do something with your data
        //         console.log(data);
        //     });
    }
  }
}
</script>
