// connect to database
const mongoose = require("mongoose");
// uri = mongodb://localhost:2701/数据库名称
// 数据库名称不用predefined
const uri =
  "mongodb+srv://admin:admin@cluster0.1e3bf.mongodb.net/express-auth?retryWrites=true&w=majority";
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// define models
// Users
const User = mongoose.model(
  "User",
  new mongoose.Schema({
    username: { type: String, unique: true },
    password: {
      type: String,
      set(val) {
        return require("bcrypt").hashSync(val, 10);
      },
    },
  })
);

module.exports = { User };
