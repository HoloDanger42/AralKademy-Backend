import request from "supertest";
import app from "../server.js";
import { sequelize } from "../config/database.js";
import { jest } from "@jest/globals";

jest.setTimeout(10000);

describe("User Endpoints", () => {
  let token;
  let server;

  beforeAll(async () => {
    try {
      await sequelize.sync({ force: true });
      server = app.listen(0);
    } catch (error) {
      console.error("Setup failed:", error);
      throw error;
    }
  });

  afterAll(async () => {
    try {
      if (server) await server.close();
      await sequelize.close();
    } catch (error) {
      console.error("Cleanup failed:", error);
      throw error;
    }
  });

  it("should sign up a new user", async () => {
    const res = await request(app).post("/users/signup").send({
      username: "testuser",
      email: "testuser@example.com",
      password: "securepassword123",
    });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty("message", "User created successfully");
    expect(res.body.user).toHaveProperty("id");
    expect(res.body.user).toHaveProperty("username", "testuser");
    expect(res.body.user).toHaveProperty("email", "testuser@example.com");
  });

  it("should log in the user and return a token", async () => {
    const res = await request(app).post("/users/login").send({
      email: "testuser@example.com",
      password: "securepassword123",
    });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("message", "Logged in successfully");
    expect(res.body).toHaveProperty("token");
    token = res.body.token;
  });

  it("should retrieve all users", async () => {
    const res = await request(app)
      .get("/users")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});

// describe("Negative-path tests", () => {
//   it("should fail signup with missing fields", async () => {
//     const res = await request(app).post("/users/signup").send({
//       email: "example@example.com",
//     });
//     expect(res.statusCode).not.toEqual(201);
//     expect(res.body).toHaveProperty("error");
//   });
// });
