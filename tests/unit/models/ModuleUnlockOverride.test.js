import { DataTypes } from 'sequelize'
import { sequelize } from '../../../src/config/database.js'
import { ModuleUnlockOverride } from '../../../src/models/index.js'

describe('ModuleUnlockOverride Model', () => {
  let testUser1
  let testUser2
  let testModule

  beforeAll(async () => {
    // Create temporary versions of the User and Module models for testing
    // These are used to satisfy foreign key constraints when testing the ModuleUnlockOverride model
    const TestUser = sequelize.define(
      'TestUser',
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        password: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        role: {
          type: DataTypes.STRING,
          allowNull: false,
        },
      },
      {
        tableName: 'test_users',
        timestamps: false,
      }
    )

    const TestModule = sequelize.define(
      'TestModule',
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        course_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
      },
      {
        tableName: 'test_modules',
        timestamps: false,
      }
    )

    // Redefine ModuleUnlockOverride for testing with reference to our test tables
    const TestModuleUnlockOverride = sequelize.define(
      'TestModuleUnlockOverride',
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'test_users',
            key: 'id',
          },
        },
        unlocked_module_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'test_modules',
            key: 'id',
          },
        },
        overridden_by_user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'test_users',
            key: 'id',
          },
        },
        reason: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
      },
      {
        tableName: 'test_module_unlock_overrides',
        timestamps: true,
      }
    )

    // Sync test models with database
    await TestUser.sync({ force: true })
    await TestModule.sync({ force: true })
    await TestModuleUnlockOverride.sync({ force: true })

    // Create test data
    testUser1 = await TestUser.create({
      email: 'learner@example.com',
      password: 'password123',
      role: 'learner',
    })

    testUser2 = await TestUser.create({
      email: 'teacher@example.com',
      password: 'password123',
      role: 'teacher',
    })

    testModule = await TestModule.create({
      name: 'Test Module',
      course_id: 1,
    })
  })

  afterAll(async () => {
    // Clean up by dropping test tables
    await sequelize.query('DROP TABLE IF EXISTS test_module_unlock_overrides')
    await sequelize.query('DROP TABLE IF EXISTS test_modules')
    await sequelize.query('DROP TABLE IF EXISTS test_users')
  })

  test('ModuleUnlockOverride model should be defined', () => {
    expect(ModuleUnlockOverride).toBeDefined()
  })

  test('ModuleUnlockOverride should have the correct table name', () => {
    expect(ModuleUnlockOverride.tableName).toBe('module_unlock_overrides')
  })

  test('ModuleUnlockOverride should have the correct attributes', () => {
    const attributes = ModuleUnlockOverride.getAttributes()

    // Check primary key
    expect(attributes.id).toBeDefined()
    expect(attributes.id.primaryKey).toBe(true)
    expect(attributes.id.type instanceof DataTypes.INTEGER).toBe(true)
    expect(attributes.id.autoIncrement).toBe(true)

    // Check user_id (learner)
    expect(attributes.user_id).toBeDefined()
    expect(attributes.user_id.allowNull).toBe(false)
    expect(attributes.user_id.references.model).toBe('users')
    expect(attributes.user_id.references.key).toBe('id')

    // Check unlocked_module_id
    expect(attributes.unlocked_module_id).toBeDefined()
    expect(attributes.unlocked_module_id.allowNull).toBe(false)
    expect(attributes.unlocked_module_id.references.model).toBe('modules')
    expect(attributes.unlocked_module_id.references.key).toBe('module_id')

    // Check overridden_by_user_id (teacher)
    expect(attributes.overridden_by_user_id).toBeDefined()
    expect(attributes.overridden_by_user_id.allowNull).toBe(false)
    expect(attributes.overridden_by_user_id.references.model).toBe('users')
    expect(attributes.overridden_by_user_id.references.key).toBe('id')

    // Check reason
    expect(attributes.reason).toBeDefined()
    expect(attributes.reason.allowNull).toBe(true)
    expect(attributes.reason.type instanceof DataTypes.TEXT).toBe(true)

    // Check timestamps
    expect(attributes.createdAt).toBeDefined()
    expect(attributes.updatedAt).toBeDefined()
  })

  test('ModuleUnlockOverride should create a record with all fields', async () => {
    // We'll test the model structure here, but not perform the actual DB operation
    // since we've already created temporary tables for isolation

    const testData = {
      user_id: 1,
      unlocked_module_id: 1,
      overridden_by_user_id: 2,
      reason: 'Learner demonstrated knowledge through alternative assessment',
    }

    // This validates that the model can create an instance with these fields
    const moduleUnlockOverride = ModuleUnlockOverride.build(testData)

    expect(moduleUnlockOverride.user_id).toBe(testData.user_id)
    expect(moduleUnlockOverride.unlocked_module_id).toBe(testData.unlocked_module_id)
    expect(moduleUnlockOverride.overridden_by_user_id).toBe(testData.overridden_by_user_id)
    expect(moduleUnlockOverride.reason).toBe(testData.reason)
  })

  test('ModuleUnlockOverride should create a record without a reason', () => {
    const testData = {
      user_id: 1,
      unlocked_module_id: 1,
      overridden_by_user_id: 2,
    }

    const moduleUnlockOverride = ModuleUnlockOverride.build(testData)

    expect(moduleUnlockOverride.user_id).toBe(testData.user_id)
    expect(moduleUnlockOverride.unlocked_module_id).toBe(testData.unlocked_module_id)
    expect(moduleUnlockOverride.overridden_by_user_id).toBe(testData.overridden_by_user_id)
    // Use toEqual(null) instead of toBeNull() to handle both undefined and null
    expect(moduleUnlockOverride.reason).toEqual(null)
  })

  test('ModuleUnlockOverride should require user_id', async () => {
    const testData = {
      unlocked_module_id: 1,
      overridden_by_user_id: 2,
      reason: 'Test reason',
    }

    // Sequelize validation is async, so we need to use await and expect.rejects
    await expect(async () => {
      await ModuleUnlockOverride.build(testData).validate()
    }).rejects.toThrow()
  })

  test('ModuleUnlockOverride should require unlocked_module_id', async () => {
    const testData = {
      user_id: 1,
      overridden_by_user_id: 2,
      reason: 'Test reason',
    }

    await expect(async () => {
      await ModuleUnlockOverride.build(testData).validate()
    }).rejects.toThrow()
  })

  test('ModuleUnlockOverride should require overridden_by_user_id', async () => {
    const testData = {
      user_id: 1,
      unlocked_module_id: 1,
      reason: 'Test reason',
    }

    await expect(async () => {
      await ModuleUnlockOverride.build(testData).validate()
    }).rejects.toThrow()
  })
})
