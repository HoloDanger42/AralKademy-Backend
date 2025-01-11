import request from "supertest";
import app from "../server.js";
import { sequelize } from "../config/database.js";
import { jest } from "@jest/globals";

// Set global timeout
jest.setTimeout(10000);

describe("User Endpoints", () => {
  let token;
  let server;

  beforeAll(async () => {
    try {
      await sequelize.sync({ force: true });
      server = app.listen(0); // Use random port
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
      .get("/users/users")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("should create a new course", async () => {
    const res = await request(app)
      .post("/courses")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Introduction to Programming",
        description: "Learn the basics of programming.",
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty("message", "Course created successfully");
    expect(res.body.course).toHaveProperty("id");
    expect(res.body.course).toHaveProperty(
      "name",
      "Introduction to Programming"
    );
    expect(res.body.course).toHaveProperty(
      "description",
      "Learn the basics of programming."
    );
  });

  it("should retrieve all courses", async () => {
    const res = await request(app)
      .get("/courses")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
