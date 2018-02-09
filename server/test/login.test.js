const app = require('../app'),
  chai = require('chai'),
  chaiHttp = require('chai-http'),
  should = chai.should(),
  {resetAllCollections, populateUser, users} = require('../seed'),
  errors = require('../errors.json'),
  jwt = require('jsonwebtoken'),
  JWT_SECRET = process.env.JWT_SECRET

chai.use(chaiHttp)

before('Pre-test DB reset', resetAllCollections)

describe('Sign-up route in API', () => {
  const path = '/signup'
  const user = users[0]

  it(`should register and respond with
        status 200,
        body (_id, publicName, userpic)
        authToken in 'x-auth' header`, done => {
    chai.request(app).post(path)
      .send(user)
      .end((err, res) => {
        res.should.have.status(200)
        res.body.should.be.a('object')
        res.body.should.have.all
          .keys('_id', 'publicName', 'userpic')
        res.body.publicName.should.be.eql(user.publicName)
        res.body.userpic.should.be.eql(user.userpic)
        res.should.have.header('x-auth')
        jwt.decode(res.headers['x-auth'])._id
          .should.be.eql(res.body._id)
        done()
      })
  })

  it('should not register user with existing login', done => {
    chai.request(app).post(path)
      .send(user)
      .end((err, res) => {
        res.should.have.status(400)
        res.body.should.be.a('object')
        res.body.should.be.eql(errors.loginRegistered)
        done()
      })
  })

  it('should not register user without login', done => {
    chai.request(app).post(path)
      .send({password: 'some-legit-password'})
      .end((err, res) => {
        res.should.have.status(400)
        res.body.should.be.a('object')
        res.body.should.be.eql(errors.loginRequired)
        done()
      })
  })

  xit('should not register user with invalid login')

  it('should not register user without password', done => {
    chai.request(app).post(path)
      .send({login: 'some-legit-login'})
      .end((err, res) => {
        res.should.have.status(400)
        res.body.should.be.a('object')
        res.body.should.be.eql(errors.passwordRequired)
        done()
      })
  })

  xit('should not register user with invalid password')
})

describe('Login route in API', () => {
  const path = '/login'
  const user = users[0]

  it(`should login by credentials (login & password) and respond with
        status 200,
        body (_id, publicName, userpic)
        authToken in 'x-auth' header`, done => {
    chai.request(app).post(path)
      .send(user)
      .end((err, res) => {
        res.should.have.status(200)
        res.body.should.be.a('object')
        res.body.should.have.all
          .keys('_id', 'publicName', 'userpic')
        res.should.have.header('x-auth')
        user.authToken = res.headers['x-auth']
        users[0].authToken = user.authToken
        user._id = jwt.decode(res.headers['x-auth'])._id.toString()
        users[0]._id = user._id
        res.body._id.toString().should.be.eql(user._id)
        done()
      })
  })

  it('should respond 403 to empty request', done => {
    chai.request(app).post(path)
      .send({})
      .end((err, res) => {
        res.should.have.status(403)
        res.body.should.be.a('object')
        res.body.should.be.eql(errors.accessDenied)
        done()
      })
  })

  it('should respond 403 to wrong login', done => {
    chai.request(app).post(path)
      .send({
        login: 'some-non-existing-login',
        password: 'password'
      })
      .end((err, res) => {
        res.should.have.status(403)
        res.body.should.be.a('object')
        res.body.should.be.eql(errors.wrongCredentials)
        done()
      })
  })

  it('should respond 403 to empty login', done => {
    chai.request(app).post(path)
      .send({
        login: '',
        password: 'password'
      })
      .end((err, res) => {
        res.should.have.status(403)
        res.body.should.be.a('object')
        res.body.should.be.eql(errors.accessDenied)
        done()
      })
  })

  it('should respond 403 to wrong password', done => {
    chai.request(app).post(path)
      .send({
        login: user.login,
        password: 'some-wrong-password'
      })
      .end((err, res) => {
        res.should.have.status(403)
        res.body.should.be.a('object')
        res.body.should.be.eql(errors.wrongCredentials)
        done()
      })
  })

  it('should respond 403 to empty password', done => {
    chai.request(app).post(path)
      .send({
        login: 'some-login',
        password: ''
      })
      .end((err, res) => {
        res.should.have.status(403)
        res.body.should.be.a('object')
        res.body.should.be.eql(errors.accessDenied)
        done()
      })
  })

  it(`should login by authToken and respond with
        status 200,
        body (_id, publicName, userpic)`, done => {
    chai.request(app).post(path)
      .send({})
      .set('x-auth', user.authToken)
      .end((err, res) => {
        res.should.have.status(200)
        res.body.should.be.a('object')
        res.body.should.have.all
          .keys('_id', 'publicName', 'userpic')
        res.body._id.toString().should.be.eql(user._id)
        done()
      })
  })

  it('should respond 403 to a bad authToken', done => {
    const badToken = jwt.sign({
      _id: 'mumbo-jumbo',
      access: 'blah'
    }, 'manah-manah').toString()
    chai.request(app).post(path)
      .send({})
      .set('x-auth', badToken)
      .end((err, res) => {
        res.should.have.status(403)
        res.body.should.be.a('object')
        res.body.should.be.eql(errors.badToken)
        done()
      })
  })

  it('should respond 403 to a token with invalid signature', done => {
    const payload = jwt.decode(user.authToken)
    const badToken = jwt.sign(payload, 'wrong secret').toString()
    chai.request(app).post(path)
      .send({})
      .set('x-auth', badToken)
      .end((err, res) => {
        res.should.have.status(403)
        res.body.should.be.a('object')
        res.body.should.be.eql(errors.badToken)
        done()
      })
  })

  it('should respond 403 to a token with wrong _id', done => {
    const payload = jwt.decode(user.authToken)
    let wrongId = payload._id.toString()
    wrongId = wrongId.substr(0, wrongId.length - 1 )
      + (parseInt(wrongId.substr(-1), 16) + 1).toString(16)
    payload._id = wrongId
    const badToken = jwt.sign(payload, JWT_SECRET).toString()
    chai.request(app).post(path)
      .send({})
      .set('x-auth', badToken)
      .end((err, res) => {
        res.should.have.status(403)
        res.body.should.be.a('object')
        res.body.should.be.eql(errors.badToken)
        done()
      })
  })

  it('should respond 403 to a token with wrong `iat`', done => {
    const payload = jwt.decode(user.authToken)
    payload.iat = Math.floor(new Date().getTime() / 1000) + 8
    const badToken = jwt.sign(payload, JWT_SECRET).toString()
    chai.request(app).post(path)
      .send({})
      .set('x-auth', badToken)
      .end((err, res) => {
        res.should.have.status(403)
        res.body.should.be.a('object')
        res.body.should.be.eql(errors.badToken)
        done()
      })
  })

  xit('should respond 403 to an expired token')
})

xdescribe('User UPDATE route', () => {
  const user = {_id: '1'}
  const path = `/user/${user._id}`

  it('should do something', done => {
    chai.request(app).put(path)
      .send({})
      .set()
      .end((err, res) => {
        done()
      })
  })
})

describe('User\'s index of Boards `/user/:id/boards` route', () => {
  let path = ''
  let user = {}

  before(done => {
    user = users[1]
    populateUser(user)
      .then(() => {
        chai.request(app).post('/login')
          .send(user)
          .end((err, res) => {
            user.authToken = res.headers['x-auth']
            const payload = jwt.decode(user.authToken)
            user.badToken = jwt.sign(payload, 'wrong secret')
            user._id = jwt.decode(user.authToken)._id.toString()
            users[1]._id = user._id
            path = `/user/${user._id}/boards`
            done()
          })
      })
  })

  it(`should answer with an array of boards`, done => {
    chai.request(app).get(path)
      .set('x-auth', user.authToken)
      .end((err, res) => {
        res.should.have.status(200)
        res.body.should.be.an('array')
        res.body[0]
          .should.have.property('boardName')
          .eql(user.boards[0].boardName)
        done()
      })
  })

  it(`should respond with 403 if no authToken`, done => {
    chai.request(app).get(path)
      .end((err, res) => {
        res.should.have.status(403)
        res.body.should.eql(errors.accessDenied)
        done()
      })
  })

  it(`should respond with 403 if bad authToken`, done => {
    chai.request(app).get(path)
      .set('x-auth', user.badToken)
      .end((err, res) => {
        res.should.have.status(403)
        res.body.should.eql(errors.accessDenied)
        done()
      })
  })

  it(`should respond with 401 if User is not an owner`, done => {
    chai.request(app).get(path)
      .set('x-auth', users[0].authToken)
      .end((err, res) => {
        res.should.have.status(401)
        res.body.should.eql(errors.notAuth  )
        done()
      })
  })
})