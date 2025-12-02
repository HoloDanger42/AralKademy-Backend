import { Content } from '../../../src/models/Content.js'
import { sequelize } from '../../../src/config/database.js'
import { DataTypes } from 'sequelize'

describe('Content Model', () => {
  beforeAll(async () => {
    await sequelize.authenticate()
  })

  afterAll(async () => {
    await sequelize.close()
  })

  test('should have correct table name', () => {
    expect(Content.tableName).toBe('contents')
  })

  test('should have correct attributes', () => {
    const attributes = Content.rawAttributes

    expect(attributes.content_id.type).toBeInstanceOf(DataTypes.INTEGER)
    expect(attributes.content_id.primaryKey).toBeTruthy()
    expect(attributes.content_id.autoIncrement).toBeTruthy()

    expect(attributes.module_id.type).toBeInstanceOf(DataTypes.INTEGER)
    expect(attributes.module_id.allowNull).toBeFalsy()

    expect(attributes.name.type).toBeInstanceOf(DataTypes.STRING)
    expect(attributes.name.allowNull).toBeFalsy()
    expect(attributes.name.validate).toHaveProperty('notNull')
    expect(attributes.name.validate).toHaveProperty('notEmpty')
    expect(attributes.name.validate.len.args).toEqual([1, 255])

    expect(attributes.link.type).toBeInstanceOf(DataTypes.STRING)
    expect(attributes.link.allowNull).toBeFalsy()
    expect(attributes.link.validate).toHaveProperty('notNull')
    expect(attributes.link.validate).toHaveProperty('notEmpty')
  })

  test('should enforce validation rules', async () => {
    await expect(Content.create({})).rejects.toThrow()

    await expect(Content.create({ module_id: 1, name: '', link: 'not-a-url' })).rejects.toThrow()
  })
})
