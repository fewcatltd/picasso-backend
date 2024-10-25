/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, _) {
    await queryInterface.createSchema('picasso')
  },

  async down(queryInterface, _) {
    await queryInterface.dropSchema('picasso')
  },
}
