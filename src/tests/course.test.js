import request from "supertest";
import app from "../server.js";
import { sequelize } from "../config/database.js";
import { expect, jest } from "@jest/globals";
import cache from "memory-cache";
import { Course } from "../models/Course.js";

jest.setTimeout(10000);

describe("Course Endpoints", () => {
  let token;
  let server;
  let createdCourseIds = []; // Track course IDs

  const signupAndLogin = async (username, email, password) => {
    await request(app).post("/users/signup").send({
      username,
      email,
      password,
    });
    const res = await request(app).post("/users/login").send({
      email,
      password,
    });
    return res.body.token;
  };

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

  beforeEach(async () => {
    cache.clear(); // Clear cache before each test
    token = await signupAndLogin(
      "testuser" + Date.now(), // unique usernames
      `testuser${Date.now()}@example.com`, // unique emails
      "securepassword123"
    );
    console.log("Token generated:", token);
    createdCourseIds = []; // Reset tracking for each test
  });

  const createCourse = async (name, description) => {
    const res = await request(app)
      .post("/courses")
      .set("Authorization", `Bearer ${token}`)
      .send({ name, description });

    createdCourseIds.push(res.body.course.id);
    return res;
  };

  it("should create a new course", async () => {
    const res = await createCourse(
      "Introduction to Programming",
      "Learn the basics of programming."
    );
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
    expect(res.body.course).toHaveProperty("createdAt");
    expect(res.body.course).toHaveProperty("updatedAt");
  });

  it("should retrieve all courses", async () => {
    // Create a new course
    await request(app)
      .post("/courses")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Advanced Programming",
        description: "Learn advanced programming concepts.",
      });

    const res = await request(app)
      .get("/courses")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    // Check specific fields in the first course
    expect(res.body[0]).toHaveProperty("id");
    expect(res.body[0]).toHaveProperty("name");
    expect(res.body[0]).toHaveProperty("description");
    expect(res.body[0]).toHaveProperty("createdAt");
    expect(res.body[0]).toHaveProperty("updatedAt");
  });

  it("should return 401 error if no token is provided", async () => {
    const res = await request(app).get("/courses");

    expect(res.statusCode).toEqual(401);
  });

  afterEach(async () => {
    // Delete all courses that were created in the test
    if (createdCourseIds.length > 0) {
      await Course.destroy({
        where: { id: createdCourseIds },
      });
    }
  });
});
