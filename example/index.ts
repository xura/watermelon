import { getBlogs, addBlog } from '../src/index'

window.getBlogs = () => getBlogs().then(v => {
    debugger;
})

window.addBlog = () => addBlog().then(v => {
    debugger;
})