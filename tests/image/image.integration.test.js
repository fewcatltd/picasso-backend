import {expect} from 'chai'
import request from 'supertest'
import nock from 'nock'
import Config from '../../src/common/сonfig.js'
import initApp from '../../src/app.js'
import {getChannel} from "../../src/services/amqpService.js";
import {readFileSync} from 'fs';

const giphyResponse = JSON.parse(readFileSync('./tests/fixtures/giphy.response.json', 'utf-8'));

describe('Route /image tests', () => {
    let app
    let db
    let channel
    const imageId = '00000000-0000-0000-0000-000000000000'
    const invalidImageId = '00000000-0000-0000-0000-000000000001'

    before(async () => {
        app = await initApp({skipMetrics: true})
        db = app.locals.db
        await db.sequelize.sync({force: true})
        channel = await getChannel(Config.rabbitmq.queueName)
    })

    after(() => {
        nock.cleanAll()
    })

    describe('GET /image', () => {

        it('should return 200 and image data', async () => {
            const {Image} = db.sequelize.models
            const image = await Image.create({
                id: imageId,
                giphyId: '0IsvmJu5x',
                title: 'test',
                height: 100,
                width: 100,
                format: 'gif',
                type: 'original',
            })

            let response = await request(app).get(`/image/${imageId}`)

            expect(response.status).to.equal(200)
            expect(response.body.id).to.equal(image.id)
        })

        it('should return 404 if image not found', async () => {
            let response = await request(app).get(`/image/${invalidImageId}`)
            expect(response.status).to.equal(404)
        })
    })

    describe('POST /image', () => {
        it('should return 200 and image data', async () => {
            nock(`${Config.giphy.url}`)
                .get(`/gifs/random?api_key=${Config.giphy.apiKey}`)
                .reply(200, giphyResponse)

            let response = await request(app).post('/image')

            expect(response.status).to.equal(200)
            expect(response.body[0].id).to.equal(giphyResponse.data.id)
            // check if image goes to amqp
            channel.consume(Config.rabbitmq.queueName, (msg) => {
                const data = JSON.parse(msg.content.toString())
                expect(data.id).to.equal(giphyResponse.data.id)
            })
        })

        it('should return 500 if giphy response is invalid', async () => {
            nock(`${Config.giphy.url}`)
                .get(`/gifs/random?api_key=${Config.giphy.apiKey}`)
                .reply(200, {})

            let response = await request(app).post('/image')

            expect(response.status).to.equal(500)
        })

        it('should return 500 if giphy service is unavailable', async () => {
            nock(`${Config.giphy.url}`)
                .get(`/gifs/random?api_key=${Config.giphy.apiKey}`)
                .reply(500)

            let response = await request(app).post('/image')

            expect(response.status).to.equal(500)
        })
    })
})
