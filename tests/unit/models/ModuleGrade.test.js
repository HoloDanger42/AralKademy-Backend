import { ModuleGrade } from '../../../src/models/ModuleGrade.js';
import { sequelize } from '../../../src/config/database.js';
import { DataTypes } from 'sequelize';

describe('ModuleGrade Model', () => {
    beforeAll(async () => {
        await sequelize.authenticate();
    });

    afterAll(async () => {
        await sequelize.close();
    });

    test('should have correct table name', () => {
        expect(ModuleGrade.tableName).toBe('modulegrades');
    });

    test('should have correct model properties', () => {
        expect(ModuleGrade.rawAttributes).toHaveProperty('module_grade_id');
        expect(ModuleGrade.rawAttributes).toHaveProperty('module_id');
        expect(ModuleGrade.rawAttributes).toHaveProperty('user_id');
        expect(ModuleGrade.rawAttributes).toHaveProperty('grade');
    });

    test('should validate grade is at least 0', async () => {
        await expect(ModuleGrade.create({ module_id: 2, user_id: 2, grade: -5 }))
            .rejects.toThrow('Grade must be at least 0');
    });
});
