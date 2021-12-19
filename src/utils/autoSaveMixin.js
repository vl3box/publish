import { autoSave } from "@/utils/post_draft";
import {saveLocalRevision} from "@/utils/post_revision";
import {pull} from "@/service/cms";
import { webDuration, localDuration } from '@/assets/data/setting.json'
import {addRevision, getRevision} from "@/service/revision";
import hash from 'object-hash'

export const AutoSaveMixin = {
    data() {
        return {
            // 定时器
            localTimer: '',
            webTimer: '',
        }
    },
    computed: {
        isDraft() {
            return this.$route.query?.mode === 'draft'
        },
        isRevision() {
            return this.$route.query?.mode === 'revision'
        },
        db() {
            return this.$store.state.db
        }
    },
    watch: {
        '$route': {
            deep: true,
            handler() {
                this.init()
            }
        }
    },
    mounted() {
        if (!this.isDraft) {
            this.localTimer = setInterval(async () => {
                await this.autoSave()
            }, localDuration)

            this.webTimer = setInterval(() => {
                this.postRevision()
            }, webDuration)
        }
    },
    methods: {
        init: function () {
            this.loading = true;
            // 当 mode = draft 时，先加载本地 IndexedDB 内容
            if (this.isDraft) {
                const key = this.$route?.query?.key
                return this.db.getItem(key).then(res => {
                    this.post = res
                    this.loading = false
                })
            } else if (this.isRevision) {
                return this.getRevision()
            } else {
                // 加载文章
                if (this.$route.params.id) {
                    return pull(this.$route.params.id)
                        .then((res) => {
                            this.post = res.data.data;
                            return res.data.data;
                        })
                        .finally(() => {
                            this.loading = false;
                        });
                } else {
                    return new Promise((resolve, reject) => {
                        resolve();
                    }).finally(() => {
                        this.loading = false;
                    });
                }
            }
        },
        getRevision() {
            getRevision(this.$route.params.id, this.$route.query.id)
                .then((res) => {
                    this.post = res.data.data;
                    return res.data.data;
                })
                .finally(() => {
                    this.loading = false;
                });
        },
        async autoSave() {
            let key = ''
            try {
                if (!this.id) {
                    await this.publish('draft', false)
                    key = this.post.post_type + '_' + this.id

                    saveLocalRevision(this, key, this.post)
                }
            } catch(err) {
                key = this.post.post_type + '_temp-' + new Date().getTime()
            } finally {
                autoSave(this, key, this.post)
            }
        },

        postRevision() {
            const isSame = hash.MD5(sessionStorage.getItem(`${this.post.post_type}_${this.post.ID}`))
                === hash.MD5(JSON.stringify(this.post))
            if (isSame) return
            addRevision(this.post.ID, this.post).then(() => {
                this.$notify({
                    title: '提醒',
                    type: 'success',
                    message: '历史版本保存成功'
                })
            })
        },

        async useDraft() {
            await this.$alert('是否使用该版本发布？', '确认信息', {
                confirmButtonText: "确定",
                callback: (action) => {
                    if (action === 'confirm') {
                        this.publish('publish', true)
                    }
                }
            })
        }
    },
    beforeDestroy() {
        if (!this.isDraft) {
            clearInterval(this.localTimer)
            clearInterval(this.webTimer)
        }
    }
}