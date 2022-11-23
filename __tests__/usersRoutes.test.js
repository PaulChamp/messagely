process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const Message = require("../models/message");

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");


describe("Users Routes Test", function () {

  beforeEach(async function () {
    await db.query("DELETE FROM messages");
    await db.query("DELETE FROM users");

    let u1 = await User.register({
      username: "test1",
      password: "password",
      first_name: "Test1",
      last_name: "Testy1",
      phone: "+14155550000",
    });

  });


  describe("GET /users", function () {
    test("can't view list", async function () {
      let response = await request(app)
        .get("/users")
        .send({

        });

      expect(response.status).toBe(401);
    });


    test("can view list", async function () {

      const token = jwt.sign({ username: "test1" }, SECRET_KEY);
      let response = await request(app)
        .get("/users")
        .send({
          _token: token
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        users: [
          {
            username: "test1",
            first_name: "Test1",
            last_name: "Testy1",
            phone: "+14155550000",
          }
        ]
      });
    });
  });


  describe("GET /users/test1", function () {
    test("can't view user detail", async function () {
      let response = await request(app)
        .get("/users/test1")
        .send({

        });

      expect(response.status).toBe(401);


      const token = jwt.sign({ username: "test" }, SECRET_KEY);
      response = await request(app)
        .get("/users/test1")
        .send({
          _token: token
        });

      expect(response.status).toBe(401);
    });


    test("can view user detail", async function () {

      const token = jwt.sign({ username: "test1" }, SECRET_KEY);

      let response = await request(app)
        .get("/users/test1")
        .send({
          _token: token
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        user: {
          username: "test1",
          first_name: "Test1",
          last_name: "Testy1",
          phone: "+14155550000",
          last_login_at: expect.any(String),
          join_at: expect.any(String),
        }
      });
    });
  });
});

describe("Test messages part of User routes", function () {
  beforeEach(async function () {
    await db.query("DELETE FROM messages");
    await db.query("DELETE FROM users");
    await db.query("ALTER SEQUENCE messages_id_seq RESTART WITH 1");

    let u1 = await User.register({
      username: "test1",
      password: "password",
      first_name: "Test1",
      last_name: "Testy1",
      phone: "+14155550000",
    });
    let u2 = await User.register({
      username: "test2",
      password: "password",
      first_name: "Test2",
      last_name: "Testy2",
      phone: "+14155552222",
    });
    let m1 = await Message.create({
      from_username: "test1",
      to_username: "test2",
      body: "u1-to-u2"
    });
    let m2 = await Message.create({
      from_username: "test2",
      to_username: "test1",
      body: "u2-to-u1"
    });
  });

  describe("GET /users/test1/to", function () {
    test("can't view list", async function () {
      let response = await request(app)
        .get("/users/test1/to")
        .send({

        });

      expect(response.status).toBe(401);
    });


    test("can view list", async function () {

      const token = jwt.sign({ username: "test1" }, SECRET_KEY);
      let response = await request(app)
        .get("/users/test1/to")
        .send({
          _token: token
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        messages: [{
          id: expect.any(Number),
          body: "u2-to-u1",
          sent_at: expect.any(String),
          read_at: null,
          from_user: {
            username: "test2",
            first_name: "Test2",
            last_name: "Testy2",
            phone: "+14155552222",
          }
        }]
      });
    });
  });

   describe("GET /users/test1/from", function () {
    test("can't view list", async function () {
      let response = await request(app)
        .get("/users/test1/from")
        .send({

        });

      expect(response.status).toBe(401);
    });


    test("can view list", async function () {

      const token = jwt.sign({ username: "test1" }, SECRET_KEY);
      let response = await request(app)
        .get("/users/test1/from")
        .send({
          _token: token
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        messages: [{
          id: expect.any(Number),
          body: "u1-to-u2",
          sent_at: expect.any(String),
          read_at: null,
          to_user: {
            username: "test2",
            first_name: "Test2",
            last_name: "Testy2",
            phone: "+14155552222",
          }
        }]
      });
    });
  });

});

afterAll(async function () {
  await db.end();
});
