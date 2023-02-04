//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

var NotifyClient = require('notifications-node-client').NotifyClient,
  notify = new NotifyClient(process.env.NOTIFYAPIKEY)

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

  // This is the URL the users will be redirected to once the email
  // has been sent
  res.redirect('/sprint-3/request/submitted')
})

router.get('/sprint-3/manage/', function (req, res) {
  res.render('sprint-3/manage/index.html')
})

router.get('/sprint-3/manage/team/:id', function (req, res) {
  res.render('sprint-3/manage/team/index.html')
})

router.get('/sprint-3/manage/review/:id', function (req, res) {
  res.render('sprint-3/manage/review/index.html')
})

router.get('/sprint-3/manage/files/:id', function (req, res) {
    res.render('sprint-3/manage/files/index.html')
  })

// Make sure this is after any routes for /manage
router.get('/sprint-3/manage/:id', function (req, res) {
  res.render('sprint-3/manage/entry/index.html')
})
