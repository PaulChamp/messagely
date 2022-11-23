process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const Message = require("../models/message");

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");

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

  describe("GET /messages/1", function () {
    test("can't view message", async function () {
      let response = await request(app)
        .get("/messages/1")
        .send({

        });

      expect(response.status).toBe(401);


      const token = jwt.sign({ username: "test" }, SECRET_KEY);
      response = await request(app)
        .get("/messages/1")
        .send({
          _token: token
        });

      expect(response.status).toBe(401);

    });


    test("can view message", async function () {

      const token = jwt.sign({ username: "test1" }, SECRET_KEY);
      let response = await request(app)
        .get("/messages/1")
        .send({
          _token: token
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: {
          id: expect.any(Number),
          body: "u1-to-u2",
          sent_at: expect.any(String),
          read_at: null,
          from_user: {
            username: "test1",
            first_name: "Test1",
            last_name: "Testy1",
            phone: "+14155550000",
          },
          to_user: {
            username: "test2",
            first_name: "Test2",
            last_name: "Testy2",
            phone: "+14155552222",
          },
        }
      });
    });
  });


  describe("POST /messages", function () {
    test("can't post message", async function () {
      let response = await request(app)
        .post("/messages")
        .send({
          to_username: "test2",
          body: "new"
        });

      expect(response.status).toBe(401);


      const token = jwt.sign({ username: "test1" }, SECRET_KEY) + "1";
      response = await request(app)
        .post("/messages")
        .send({
          to_username: "test2",
          body: "new",
          _token: token
        });

      expect(response.status).toBe(401);
    });


    test("can view message", async function () {

      const token = jwt.sign({ username: "test1" }, SECRET_KEY);
      let response = await request(app)
        .post("/messages")
        .send({
          to_username: "test2",
          body: "new",
          _token: token
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        message: {
          id: expect.any(Number),
          from_username: "test1",
          to_username: "test2",
          body: "new",
          sent_at: expect.any(String),
        }
      });
    });
  });



  describe("POST /messages/:id/read", function () {

    test("can't mark read", async function () {

      let m = await Message.create({
        from_username: "test1",
        to_username: "test2",
        body: "new"
      });
      expect(m.read_at).toBe(undefined);


      let response = await request(app)
        .post(`/messages/${m.id}/read`)
        .send({
        });

      expect(response.status).toBe(401);


      const token = jwt.sign({ username: "test1" }, SECRET_KEY);
      response = await request(app)
        .post(`/messages/${m.id}/read`)
        .send({
          _token: token
        });

      expect(response.status).toBe(401);
    });


    test("can mark read", async function () {

      let m = await Message.create({
        from_username: "test1",
        to_username: "test2",
        body: "new"
      });
      expect(m.read_at).toBe(undefined);

      const token = jwt.sign({ username: "test2" }, SECRET_KEY);
      let response = await request(app)
        .post(`/messages/${m.id}/read`)
        .send({
          _token: token
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: {
          id: m.id,
          read_at: expect.any(String)
        }
      });
    });
  });
});

afterAll(async function () {
  await db.end();
});
