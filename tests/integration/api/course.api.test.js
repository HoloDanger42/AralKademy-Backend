import request from "supertest";
import app from "../../../src/server.js";
import { sequelize } from "../../../src/config/database.js";
import { expect, jest } from "@jest/globals";
import cache from "memory-cache";
import { Course } from "../../../src/models/Course.js";

jest.setTimeout(10000);

describe("Course Endpoints (Integration Tests)", () => {
  let token;
  let server;

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

  beforeEach(async () => {
    // Clear cache
    cache.clear();

    token = await signupAndLogin(
      "testuser" + Date.now(),
      `testuser${Date.now()}@example.com`,
      "securepassword123"
    );
  });

  beforeAll(async () => {
    try {
      await sequelize.sync({ force: true });
      server = app.listen(0);
    } catch (error) {
      console.error("Setup failed:", error);
      throw error;
    }
  });

  it("should create a new course", async () => {
    const courseName = "Introduction to Programming";
    const courseDesc = "Learn the basics of programming.";

    const res = await request(app)
      .post("/courses")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: courseName,
        description: courseDesc,
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.course).toMatchObject({
      name: courseName,
      description: courseDesc,
    });

    // Verify that the course was actually created in the database
    const createdCourse = await Course.findOne({
      where: { name: courseName },
    });
    expect(createdCourse).not.toBeNull();
  });

  it("should handle course creation errors", async () => {
    const res = await request(app)
      .post("/courses")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "", // Invalid: empty name
        description: "Invalid course",
      });

    expect(res.statusCode).toEqual(400); // Or whatever error code your API returns
    expect(res.body).toHaveProperty("message"); // Check for your error message
  });

  it("should retrieve all courses", async () => {
    token = await signupAndLogin(
      "testuser" + Date.now(),
      `testuser${Date.now()}@example.com`,
      "securepassword123"
    );

    // Create some courses directly in the database
    await Course.create({
      name: "Course 1",
      description: "Desc 1",
    });
    await Course.create({
      name: "Course 2",
      description: "Desc 2",
    });

    const res = await request(app)
      .get("/courses")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2); // Check for at least the courses you created
  });

  it("should handle errors when retrieving courses", async () => {
    token = await signupAndLogin(
      "testuser" + Date.now(),
      `testuser${Date.now()}@example.com`,
      "securepassword123"
    );

    // Simulate an error by temporarily breaking the database connection or query
    jest
      .spyOn(Course, "findAll")
      .mockRejectedValueOnce(new Error("Database error"));

    const res = await request(app)
      .get("/courses")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toEqual(500);
    expect(res.body).toHaveProperty("message");
    Course.findAll.mockRestore();
  });

  afterEach(async () => {
    // Clean up the database after each test
    await Course.destroy({ where: {} }); // This will delete all courses
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
});
