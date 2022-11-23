/** User class for message.ly */
const { BCRYPT_WORK_FACTOR } = require("../config");
const db = require("../db");
const ExpressError = require("../expressError");
const bcrypt = require("bcrypt");
const { password } = require("../db");



/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    try {
      const hashed_password = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

      const result = await db.query(
        `INSERT INTO users VALUES ($1 , $2 , $3 , $4 , $5 , NOW(), NOW())
        RETURNING username, password, first_name, last_name, phone`,
        [
          username,
          hashed_password,
          first_name,
          last_name,
          phone
        ]);

      return result.rows[0];
    }
    catch (e) {
      if (e.code === '23505') {
        throw new ExpressError('username taken. please choose another one.', 400);
      }

      throw new ExpressError('Error when registrating a user', 500)
    }
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    try {
      const result = await db.query(
        `SELECT username, password, first_name, last_name, phone FROM users WHERE username = $1`,
        [username]);

      if (result.rows.length > 0) {
        return await bcrypt.compare(password, result.rows[0].password);
      }
    } catch (e) {
      return false;
    }
  }


  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    try {
      await db.query(
        `UPDATE users SET last_login_at = NOW() WHERE username = $1`,
        [username]);
    } catch (error) {
      throw new ExpressError('Error when updating login timestamp', 500);
    }
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
    try {
      const result = await db.query(`SELECT username, first_name, last_name, phone FROM users`);

      return result.rows;
    } catch (error) {
      throw new ExpressError('Error when getting all users', 500);
    }
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    try {
      const result = await db.query(
        `SELECT 
          username, first_name, last_name, phone , join_at , last_login_at 
        FROM users WHERE username = $1` , [username]);

      if (result.rows.length > 0) {
        return result.rows[0];
      }

      throw new ExpressError('User Not Found' , 404);
    } catch (error) {
      throw new ExpressError('Error when getting user data', 500);
    }
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    try {
      const result = await db.query(
        `SELECT 
          id, body, sent_at, read_at ,username, first_name, last_name, phone
        FROM messages JOIN users ON to_username = username 
        WHERE from_username = $1` ,
        [username]);

      return result.rows.map(r => {
        const { id, body, sent_at, read_at } = r;
        const { username, first_name, last_name, phone } = r;

        const message = { id, body, sent_at, read_at };
        message.to_user = { username, first_name, last_name, phone };

        return message;
      });
    } catch (error) {
      throw new ExpressError("Error when getting messages from user", 500);
    }
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {

    try {
      const result = await db.query(
        `SELECT 
          id, body, sent_at, read_at ,username, first_name, last_name, phone
        FROM messages JOIN users ON from_username = username 
        WHERE to_username = $1` ,
        [username]);

      return result.rows.map(r => {
        const { id, body, sent_at, read_at } = r;
        const { username, first_name, last_name, phone } = r;

        const message = { id, body, sent_at, read_at };
        message.from_user = { username, first_name, last_name, phone };

        return message;
      });
    } catch (error) {
      throw new ExpressError("Error when getting messages to user", 500);
    }
  }
}


module.exports = User;