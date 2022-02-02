const { User } = require("./models.js");
// 引入express
const express = require("express");

// 获得一个express的instance
const app = express();

const SECRET = "qwertyui";

// 使用中间件，允许express处理json
app.use(express.json());
/***************************Middleware******************************** */
const auth = async (req, res, next) => {
  const raw = String(req.headers.authorization).split(" ").pop();
  const tokenData = require("jsonwebtoken").verify(raw, SECRET);
  const { id } = tokenData;
  // 这里要把user加到req上
  req.user = await User.findById(id);
  // next表示接下来要执行的东西
  next();
};
/*******************************API********************************* */
// 写一个接口路由
app.get("/", async (req, res) => {
  res.send("OK");
});

// register
app.post("/register", async (req, res) => {
  console.log(req.body);
  const user = await User.create({
    username: req.body.username,
    password: req.body.password,
  });
  res.send(user);
});

// get all users
app.get("/users", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// login
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
  // generate token
  const jwt = require("jsonwebtoken");
  const token = jwt.sign(
    {
      id: String(user._id),
    },
    SECRET
  );
  // return user
  res.send({
    user: user,
    token: token,
  });
});

// profile
app.get("/profile", auth, async (req, res) => {
  res.send(req.user);
});

/***************************Listening************************************* */
app.listen(3001, () => {
  console.log("http://localhost:3001");
});
