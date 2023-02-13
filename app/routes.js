//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

const { Client } = require('@microsoft/microsoft-graph-client')
  const {
    TokenCredentialAuthenticationProvider,
  } = require('@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials')
  const { DeviceCodeCredential } = require('@azure/identity')

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

// router.get('/sprint-3/request/dd', function (req, res) {
  

//   const credential = new DeviceCodeCredential(tenantId, clientId, clientSecret)
//   const authProvider = new TokenCredentialAuthenticationProvider(credential, {
//     scopes: [scopes],
//   })

//   const client = Client.initWithMiddleware({
//     debugLogging: true,
//     authProvider,
//     // Use the authProvider object to create the class.
//   })

//   res.render('sprint-3/request/dd/index.html', { dds })
// })

router.get('/sprint-3/request/dates', function (req, res) {
  // Whats todays date?

  var today = new Date()

  // What date have they put as an end date?

  var endDateString =
    req.session.data['disco-end-year'] +
    '-' +
    req.session.data['disco-end-month'] +
    '-' +
    req.session.data['disco-end-day']

  var endDateEstimated = new Date(endDateString)

  console.log(endDateEstimated)

  // What are the weeks 5-10 from now?

  var weeks5 = getMonday(addWeeksToDate(new Date(), 5).toISOString())
  var weeks6 = getMonday(addWeeksToDate(new Date(), 6).toISOString())
  var weeks7 = getMonday(addWeeksToDate(new Date(), 7).toISOString())
  var weeks8 = getMonday(addWeeksToDate(new Date(), 8).toISOString())
  var weeks9 = getMonday(addWeeksToDate(new Date(), 9).toISOString())
  var weeks10 = getMonday(addWeeksToDate(new Date(), 10).toISOString())

  //Get monday of the week

  let dates = []

  // Is estimated end date before end of week????

  if (endDateEstimated >= weeks5) {
    dates.push({
      week: weeks5.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
      }),
    })
  }
  if (endDateEstimated >= weeks6) {
    dates.push({
      week: weeks6.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
      }),
    })
  }
  if (endDateEstimated >= weeks7) {
    dates.push({
      week: weeks7.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
      }),
    })
  }
  if (endDateEstimated >= weeks8) {
    dates.push({
      week: weeks8.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
      }),
    })
  }
  if (endDateEstimated >= weeks9) {
    dates.push({
      week: weeks9.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
      }),
    })
  }
  if (endDateEstimated >= weeks10) {
    dates.push({
      week: weeks10.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
      }),
    })
  }

  console.log(dates)
  res.render('sprint-3/request/dates/index.html', { dates })
})

function addWeeksToDate(date, weeks) {
  console.log('Adding ' + weeks + ' weeks to ' + date)
  console.log(date)
  date.setDate(date.getDate() + 7 * weeks)
  return date
}

function getMonday(d) {
  d = new Date(d)
  var day = d.getDay(),
    diff = d.getDate() - day + (day == 0 ? -6 : 1)
  return new Date(d.setDate(diff))
}

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
  let month = date_ob.toLocaleString('default', { month: 'short' })
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
    addedOn: date + ' ' + month + ' ' + year + ' at ' + hours + ':' + minutes,
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
