import request from 'supertest'
import nock from 'nock'
import app from '../app.js'

describe('API Gateway Integration Tests', () => {
  beforeAll(async () => {
    await app.locals.redis.ping()
  })

  describe('GET /health', () => {
    afterAll(async () => {
      await app.locals.redis.connect()
    })
    it('[readness] should return status 200 and OK', async () => {
      await request(app)
        .get('/health/readness')
        .expect(200)
        .expect('Ok')
    })

    it('[liveness] should return status 200 and OK', async () => {
      await request(app)
        .get('/health/liveness')
        .expect(200)
        .expect('Ok')
    })

    it('[liveness] should return status 500 if redis not connected', async () => {
      await app.locals.redis.disconnect()

      await request(app)
        .get('/health/liveness')
        .expect(500)
    })
  })

  describe('/image', () => {
    describe('GET /image', () => {
      beforeEach(() => {
        nock.restore()
      })

      it('should return status 400 if params are incorrect', async () => {
        await request(app)
          .get('/image/invalid-id')
          .expect(400)
      })
      it.todo('should return status 200 and image stream')
      it.todo('should return status 404 if image not found')
      it.todo('should return status 500 if image service is unavailable')
      it.todo('should return status 500 if s3 service is unavailable')
      it.todo('should return status 403 if user is not authorized')

      //rate limit
      it.todo('should return status 429 if rate limit exceeded')
    })
    describe('POST /image', () => {
      it.todo('should return status 200 and image data')
      it.todo('should return status 500 if image service is unavailable')
      it.todo('should return status 403 if user is not authorized')

      //rate limit
      it.todo('should return status 429 if rate limit exceeded')
    })
  })

  describe('/images', () => {
    describe('GET /images', () => {
      it.todo('should return status 200 and images list')
      it.todo('should return status 400 if query is incorrect')
      it.todo('should return status 500 if image service is unavailable')
      it.todo('should return status 403 if user is not authorized')

      //rate limit
      it.todo('should return status 429 if rate limit exceeded')
    })
  })

})
