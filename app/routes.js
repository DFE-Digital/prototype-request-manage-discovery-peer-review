//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

var NotifyClient = require('notifications-node-client').NotifyClient,
  notify = new NotifyClient(process.env.NOTIFYAPIKEY)

const { v4: uuidv4 } = require('uuid')

// Add your routes here

router.post('/sprint-3/request/process-request', function (req, res) {
  // Send some emails through Notify

  notify
    .sendEmail(process.env.SATTemplateId, process.env.recipient, {
      personalisation: {
        title: req.session.data['title'],
        summary: req.session.data['purpose'],
      },
    })
    .then((response) => console.log(response))
    .catch((err) => console.error(err))

  notify
    .sendEmail(process.env.SATTemplateId, process.env.recipient2, {
      personalisation: {
        title: req.session.data['title'],
        summary: req.session.data['purpose'],
      },
    })
    .then((response) => console.log(response))
    .catch((err) => console.error(err))

  // This is the URL the users will be redirected to once the email
  // has been sent
  res.redirect('/sprint-3/request/submitted')
})

router.get('/sprint-3/manage/', function (req, res) {
  res.render('sprint-3/manage/index.html')
})

router.get('/sprint-3/manage/team/:id', function (req, res) {
    var artefacts = []
    if (req.session.data['artefacts'] !== undefined) {
      artefacts = req.session.data['artefacts']
    }
  res.render('sprint-3/manage/team/index.html', { artefacts })
})

router.get('/sprint-3/manage/review/:id', function (req, res) {
    var artefacts = []
    if (req.session.data['artefacts'] !== undefined) {
      artefacts = req.session.data['artefacts']
    }
  res.render('sprint-3/manage/review/index.html', { artefacts })
})

router.get('/sprint-3/manage/files/:id', function (req, res) {
  var artefacts = []
  if (req.session.data['artefacts'] !== undefined) {
    artefacts = req.session.data['artefacts']
  }

  res.render('sprint-3/manage/files/index.html', { artefacts })
})

router.get('/sprint-3/manage/actions/:id', function (req, res) {
    var artefacts = []
    if (req.session.data['artefacts'] !== undefined) {
      artefacts = req.session.data['artefacts']
    }
  res.render('sprint-3/manage/actions/index.html', { artefacts })
})

router.get('/sprint-3/manage/artefacts/add/:id', function (req, res) {
    var artefacts = []
    if (req.session.data['artefacts'] !== undefined) {
      artefacts = req.session.data['artefacts']
    }
  res.render('sprint-3/manage/artefacts/add.html', { artefacts })
})

router.post('/sprint-3/manage/artefacts/add/:id', function (req, res) {
  var id = req.params.id

  let date_ob = new Date()
  let date = ('0' + date_ob.getDate()).slice(-2)
  let month = date_ob.toLocaleString('default', { month: 'short' });
  let year = date_ob.getFullYear()
  let hours = date_ob.getHours()
  let minutes = date_ob.getMinutes()

  // Create an empty array
  var artefacts = []

  // Check if there's an array in session
  if (req.session.data['artefacts'] !== undefined) {
    artefacts = req.session.data['artefacts']
  }

  artefacts.push({
    appid: id,
    url: req.session.data['artefact-url'],
    title: req.session.data['artefact-title'],
    addedOn: (date + " " + month + " " + year + " at " + hours + ":" + minutes),
    addedBy: 'Andy Jones',
    id: uuidv4(),
  })

  req.session.data['artefacts'] = artefacts

  // Create item into a session object and redirect to the artefacts page

  console.log(artefacts)

  res.redirect('/sprint-3/manage/files/' + id)
})

// Make sure this is after any routes for /manage
router.get('/sprint-3/manage/:id', function (req, res) {
    var artefacts = []
    if (req.session.data['artefacts'] !== undefined) {
      artefacts = req.session.data['artefacts']
    }
  res.render('sprint-3/manage/entry/index.html', { artefacts })
})
