import {expect} from 'chai'
import request from 'supertest'
import nock from 'nock'
import initApp from '../../src/app.js'

describe('Route /image tests', () => {
    let app
    let db

    before(async () => {
        app = await initApp({skipMetrics: true})
        db = app.locals.db
        await db.sequelize.sync({force: true})
        const {Image} = db.sequelize.models
        const images = Array.from({length: 10}, (_, i) => ({
            id: `00000000-0000-0000-0000-00000000000${i}`,
            giphyId: '0IsvmJu5x',
            title: 'test',
            height: 100 + i,
            width: 100 + i,
            format: 'gif',
            type: 'original',
            s3Url: 'https://example.com',
            createdAt: new Date(Date.now() + i * 1000),
        }))
        await Image.bulkCreate(images)
    })

    after(() => {
        nock.cleanAll()
    })

    describe('GET /images', () => {

        it('should return 200 and image data', async () => {

            let response = await request(app).get(`/images?limit=10&offset=0`)
            expect(response.status).to.equal(200)
            expect(response.body).to.have.length(10)

            response = await request(app).get(`/images?limit=5&offset=5`)
            expect(response.status).to.equal(200)
            expect(response.body).to.have.length(5)

            response = await request(app).get(`/images?maxWidth=100`)
            expect(response.status).to.equal(200)
            expect(response.body).to.have.length(1)

            response = await request(app).get(`/images?maxHeight=100`)
            expect(response.status).to.equal(200)
            expect(response.body).to.have.length(1)

            response = await request(app).get(`/images?format=gif&maxWidth=100`)
            expect(response.status).to.equal(200)
            expect(response.body).to.have.length(1)
        })
    })
})
