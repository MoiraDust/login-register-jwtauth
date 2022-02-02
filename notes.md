## Install

### Initia

```shell
npm init -y
```

### Express

十分精简的 node.js 框架。

```shell
npm i express@next
```

#### 最简单的一个 express 服务器

```js
const express = require("express");
const app = express();
app.listen(port, callback);
```

#### 最简单的一个 api 接口

```js
app.get("url",async(req,res){
    // statements...
})
```

#### nodemon 一定要全局安装

```shell
npm i -g nodemon
```

### MongoDB

- Install in MAC (M11)
  [安装 mongodb](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-os-x/)
- 启动后会有一个 connect string，可以连接上 vs code 的插件

### Mongoose

用于操作 mongodb 数据库

```shell
npm i mongoose
```

### nodemon

```shell
npm i install nodemon
```

## Steps

### Create server.js

```javascript
// 引入express
const express = require("express");

// 获得一个express的instance
const app = express();
// 写一个接口路由
app.get("/", async (req, res) => {
  res.send("OK");
});

// 监听3001端口，然后写一个回调函数来执行服务启动成功后的函数
app.listen(3001, () => {
  console.log("http://localhost:3001");
});
```

使用`nodemon server.js`启动服务

- 可以使用一个工具：rest client 来设计 API

  - 新建一个`test.http`。格式要按照下面的 sample 来，post 下面空一行再写一个 json 代表请求体。三个#才会触发插件的 send request

  ```
  @url = http://localhost:3001
  # 要指明post的参数是json
  @json=Content-Type: application/json

  ###
  get {{url}}

  ### register
  post {{url}}/register
  {{json}}
  # 这里要空一行
  {
      "username":"user1",
      "password":"123456"
  }

  ### login
  {{json}}
  post {{url}}/login
  ```

- 新增一个 post 的路由

```js
// new post route
app.post("/register", async (req, res) => {
  res.send("register");
});
```

- 连接到数据库

  - 但是如果把数据库的连接也写进`server.js`会导致文件有点长，所以新建一个`models.js`来写连接的代码

    ```js
    const mongoose = require("mongoose");
    // uri = mongodb://localhost:2701/数据库名称
    // 数据库名称不用predefined
    mongoose.connect("mongodb://localhost:2701/express-auth");
    ```

    - connect to mongodb atlas

    ```js
    const uri =
      "mongodb+srv://admin:admin@cluster0.1e3bf.mongodb.net/express-auth?retryWrites=true&w=majority";
    mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    ```

- 将 models.js 引入到 server.js 中

  ```js
  require("./models.js");
  ```

- 在 model.js 中开始定义 model

  ```js
  // define models
  // Users
  const modelName = mongoose.model("collection name in mongodb",new mongoose.Schema({
    <!-- schema -->
    filedName:{type: String/Number}
  }))
  <!-- 导出对象 -->
  module.exports = {modelName}
  ```

  ```js
  const User = mongoose.model(
    "User",
    new mongoose.Schema({
      username: { type: String },
      password: { type: String },
    })
  );
  module.exports = { User };
  ```

- 在`server.js`里面引用 module

  ```js
  const { User } = require("./models.js");
  ```

- `server.js`里面写完注册接口
  - 使用中间件，允许 express 处理 json
  ```js
  app.use(express.json());
  ```
  - 接口处理数据
  ```js
  app.post("/register", async (req, res) => {
    console.log(req.body);
    const user = await User.create({
      username: req.body.username,
      password: req.body.password,
    });
    res.send(user);
  });
  ```

### 给密码加密（使用散列）

```shell
npm i bcrypt
```

更改 model.js

```js
password: {
      type: String,
      set(val) {
        // 10为加密的强度
        return require("bcrypt").hashSync(val,10);
      },
    },
```

### 唯一列

在 model.js 里面

```js
username:{type: String,unique:true}
```

### login API

- 校验用户

```js
app.post("/login", async (req, res) => {
  console.log(req.body);
  const { username } = req.body;
  const { password } = req.body;
  // find username
  const user = await User.findOne({ username: username });
  if (!user) {
    // 422:客户端提交的数据有问题
    return res.status(422).send({
      message: "no user",
    });
  }
  // check password
  const isValidPassword = require("bcrypt").compareSync(
    password,
    user.password
  );
  if (!isValidPassword) {
    return res.status(422).send({
      message: "wrong password",
    });
  }
  // generate a token here....
  // return user
  res.send({
    user: user,
    token: "",
  });
});
```

- 生成 token
  - 因为 session 是带有状态的，但是 restful 更加倾向于无状态的连接，所以比较推荐用 token

```shell
npm i jsonwebtoken
```

```js
// generate token
const jwt = require("jsonwebtoken");
const token = jwt.sign({
  id: String(user._id),
  SECRET,
});
```

- `jwt.sign()`

  ```js
  jwt.sign(签名, 密钥);
  ```

  - 签名：拿什么数据进行签名,可以是*一个对象*
  - 密钥：一般设置在环境变量里面，或者是被 gitignore 的文件，最好不要出现在代码库
  - [环境变量](https://segmentfault.com/a/1190000011683741)

### 使用 token 来请求个人信息

- 请求的头部文件.前端需要把 token 加到每一个请求头里面去

```http
Authorization: Bearer 上次登录时的token
```

- get 请求的时候
  - *req.headers.authorization*请求头里面的内容就是 token 的值:`Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYxZjkxMDY3YjM1ZGNiOGNmYTBjOTYzZSIsImlhdCI6MTY0Mzc2NDE1N30.91HFbHYK-xcShrkay1_HSpLfvMNB0LyyxY5QBW5Sdok`
  - 需要对返回值进行 split,再进行 pop()
  ```js
  String(req.headers.authorization).split(" ").pop();
  ```
  - 解密 token。原来加密的时候是 String 就返回 String，是 Obj 就返回 Obj
  ```js
  const tokenData = require("jsonwebtoken").verify(raw, SECRET);
  ```
  - token 永远*不要放密码*

```js
app.get("/profile", async (req, res) => {
  // 获取token
  const raw = String(req.headers.authorization).split(" ").pop();
  // 解密token
  const tokenData = require("jsonwebtoken").verify(raw, SECRET);
  const id = tokenData.id;
  // 刚刚token里面是有一个id参数的，这个参数只有服务端可以读
  const user = await User.findById(id);
  res.send(user);
});
```

### Middleware

- 因为很多地方需要验证客户的登陆。所以可以把验证 token 的接口写成一个 express 的中间件

```js
const auth = async (req, res, next) => {
  const raw = String(req.headers.authorization).split(" ").pop();
  const tokenData = require("jsonwebtoken").verify(raw, SECRET);
  const { id } = tokenData;
  // 这里要把user加到req上
  req.user = await User.findById(id);
  // next表示接下来要执行的东西
  next();
};
```

正常情况还需要处理异常，这里先不写

- 加了中间件的 api

  - 代表了先执行 auth 然后再执行 function

  ```js
  app.get("/profile", auth, async (req, res) => {
    res.send(req.user);
  });
  ```

  - 中间件要写在下一个中间件前面
  - 订单例子

  ```js
  app.get("/orders", auth, async (req, res) => {
    const orders = await Order.find().where({
      user: req.user,
    });
    res.send(orders);
  });
  ```
