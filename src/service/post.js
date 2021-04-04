import { $helper } from "@jx3box/jx3box-common/js/https.js";

// 获取我的文章总数
function get_my_post_total() {
    return $helper()({
        method: "GET",
        url: `/api/my/post/total`,
    });
}
/**
 * 根据文章类型获取文章列表
 * @param type
 * @param params
 * @returns {AxiosPromise}
 */
function get_posts_by_type(type, params) {
    return $helper()({
        method: "GET",
        url: `/api/posts/type/${type}`,
        params: params,
    });
}

export { get_my_post_total, get_posts_by_type };
