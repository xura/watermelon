import { Model, Q, Query, Relation } from '@nozbe/watermelondb';
import { action, children, field, lazy, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';
import { setGenerator } from '@nozbe/watermelondb/utils/common/randomId';
import { appSchema, tableSchema } from '@nozbe/watermelondb'
import { Database } from '@nozbe/watermelondb'
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs'

class Guid {
  static newGuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0,
        v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

// Create an enum for all Table Names.
// This will help in documenting where all exact table names need to be passed.
enum TableName {
  BLOGS = 'blogs',
  POSTS = 'posts',
}

class Blog extends Model {
  static table = TableName.BLOGS

  static associations: Associations = {
    [TableName.POSTS]: { type: 'has_many', foreignKey: 'blog_id' },
  }

  @field('name') name!: string;

  @children(TableName.POSTS) posts!: Query<Post>;

  @lazy nastyPosts = this.posts
    .extend(Q.where('is_nasty', true));

  @action async moderateAll() {
    await this.nastyPosts.destroyAllPermanently()
  }
}

class Post extends Model {
  static table = TableName.POSTS

  static associations: Associations = {
    [TableName.BLOGS]: { type: 'belongs_to', key: 'blog_id' },
  }

  @field('name') name!: string;
  @field('is_nasty') isNasty!: boolean;

  @relation(TableName.BLOGS, 'blog_id') blog!: Relation<Blog>;
}

// Define a custom ID generator.
function randomString(): string {
  return Guid.newGuid();
}

setGenerator(randomString);

const schema = appSchema({
  version: 2,
  tables: [
    tableSchema({
      name: 'blogs',
      columns: [{ name: 'name', type: 'string' }],
    }),
    tableSchema({
      name: 'posts',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'subtitle', type: 'string' },
        { name: 'body', type: 'string' },
        { name: 'blog_id', type: 'string', isIndexed: true },
      ],
    }),
  ],
})


const adapter = new LokiJSAdapter({
  useWebWorker: false,
  dbName: 'WatermelonDemo',
  schema: schema,
})

const database = new Database({
  adapter,
  modelClasses: [Blog, Post],
  actionsEnabled: true,
})

const blogs = database.collections.get<Blog>('blogs');

const getBlogs = async () => await blogs.query().fetch();
const addBlog = async () => {
  return await database.action(async () => {
    return await blogs.create(blog => {
      blog.name = `New blog ${Math.random()}`
    }).then(b => b.observe())
  })
};

export { getBlogs, addBlog }