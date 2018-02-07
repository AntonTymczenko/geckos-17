const app = require('../app'),
  chai = require('chai'),
  chaiHttp = require('chai-http'),
  should = chai.should(),
  {resetAllCollections, users} = require('../seed'),
  errors = require('../errors.json'),
  jwt = require('jsonwebtoken'),
  JWT_SECRET = process.env.JWT_SECRET

chai.use(chaiHttp)

before('Pre-test DB reset', resetAllCollections)

describe('Sign-up route in API', () => {
  const path = '/signup'

  it(`should register and respond with
        status 200,
        body (_id, publicName, boards)
        give AuthToken in headers`, done => {
    chai.request(app)
      .post(path)
      .send(users[0])
      .end((err, res) => {
        res.should.have.status(200)
        res.body.should.have.all.keys('_id', 'publicName', 'boards', 'userpic')
        res.should.have.header('x-auth')
        jwt.decode(res.headers['x-auth'])._id
          .should.be.eql(res.body._id)
        done()
      })
  })

  it('should not register user with existing login', done => {
    chai.request(app)
      .post(path)
      .send(users[0])
      .end((err, res) => {
        res.should.have.status(400)
        res.body.should.be.a('object')
        res.body.should.be.eql(errors.loginRegistered)
        done()
      })
  })

  it('should not register user without login', done => {
    chai.request(app)
      .post(path)
      .send({password: 'some-legit-password'})
      .end((err, res) => {
        res.should.have.status(400)
        res.body.should.be.a('object')
        res.body.should.be.eql(errors.loginRequired)
        done()
      })
  })
})
