import {expect} from 'chai'
import request from 'supertest'
import nock from 'nock'
import initApp from '../src/app.js'

describe('Rate limit test', () => {
    let app
    before(async () => {
        app = await initApp({skipMetrics: true})
        await app.locals.redis.flushall()
    })

    after(() => {
        nock.cleanAll()
    })

    describe('Rate limit', () => {
        it('it should return 429', async () => {
            let response = await request(app).get('/health/readiness')
            expect(response.status).to.equal(200)
            response = await request(app).get('/health/readiness')
            expect(response.status).to.equal(429)
        })
    })
})
