<<<<<<< HEAD
import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

const Content = sequelize.define(
  'Content',
  {
    content_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    module_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'modules',
        key: 'module_id',
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Content name is required.',
        },
        notEmpty: {
          msg: 'Content name is required.',
        },
        len: {
          args: [1, 255],
          msg: 'Content name must be between 1 and 255 characters',
        },
      },
    },
    link: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Content link is required.',
        },
        notEmpty: {
          msg: 'Content link cannot be empty.',
        },
        // isUrl: {
        //     msg: 'Content link must be a valid URL.',
        // },
      },
    },
  },
  {
    tableName: 'contents',
    timestamps: true,
    underscored: true,
    paranoid: true,
  }
)

export { Content }
=======
import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

const Content = sequelize.define(
  'Content',
  {
    content_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    module_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'modules',
        key: 'module_id',
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Content name is required.',
        },
        notEmpty: {
          msg: 'Content name is required.',
        },
        len: {
          args: [1, 255],
          msg: 'Content name must be between 1 and 255 characters',
        },
      },
    },
    link: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Content link is required.',
        },
        notEmpty: {
          msg: 'Content link cannot be empty.',
        },
        // isUrl: {
        //     msg: 'Content link must be a valid URL.',
        // },
      },
    },
  },
  {
    tableName: 'contents',
    timestamps: true,
    underscored: true,
    paranoid: true,
  }
)

export { Content }
>>>>>>> 627466f638de697919d077ca56524377d406840d
