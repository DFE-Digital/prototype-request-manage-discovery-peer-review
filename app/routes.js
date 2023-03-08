//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

var NotifyClient = require('notifications-node-client').NotifyClient,
  notify = new NotifyClient(process.env.NOTIFYAPIKEY)

const { v4: uuidv4 } = require('uuid')

var Airtable = require('airtable')
var axios = require('axios')
var base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  'appiBjyMzgmJEGFqn',
)

// Gets data by an AirTable view
async function getData(viewName) {
  return await base('Reviews').select({ view: viewName }).all()
}

async function getPeople(viewName) {
  return await base('Assessors').select({ view: viewName }).all()
}

async function getTeam(id) {
  return await base('ReviewTeam')
    .select({ view: 'People', filterByFormula: `{ReviewID} = "${id}"` })
    .firstPage()
}

async function getPanel(id) {
  return await base('ReviewPanel')
    .select({ view: 'People', filterByFormula: `{ReviewID} = "${id}"` })
    .firstPage()
}

async function getObservers(id) {
  return await base('ReviewObservers')
    .select({ view: 'People', filterByFormula: `{ReviewID} = "${id}"` })
    .firstPage()
}

async function getArtefacts(id) {
  return await base('Artefacts')
    .select({ view: 'Files', filterByFormula: `{ReviewID} = "${id}"` })
    .firstPage()
}

async function getDates(id) {
  return await base('ReviewDateOptions')
    .select({ view: 'All', filterByFormula: `{ReviewID} = "${id}"` })
    .firstPage()
}

async function getDate(id) {
  console.log(id)
  return await base('ReviewDateOptions')
    .select({ maxRecords: 1, filterByFormula: `{ID} = "${id}"` })
    .firstPage()
}

// Gets a record by an ID
async function getDataByID(id) {
  return await base('Reviews')
    .select({ maxRecords: 1, filterByFormula: `{ID} = "${id}"` })
    .firstPage()
}

async function getPerson(id) {
  return await base('ReviewTeam')
    .select({ maxRecords: 1, filterByFormula: `{ID} = "${id}"` })
    .firstPage()
}

async function getArtefact(id) {
  return await base('Artefacts')
    .select({ maxRecords: 1, filterByFormula: `{ID} = "${id}"` })
    .firstPage()
}

async function search(term) {
  term = term.toLowerCase()
  try {
    console.log(term)
    return await base('Reviews')
      .select({
        filterByFormula: `OR( find("${term}", Lower({Name})),
                              find("${term}", Lower({DeputyDirector})),
                              find("${term}", Lower({ProjectCode})))`,
      })
      .firstPage()
  } catch (err) {
    console.log(err)
  }
}

function wait(waitTime) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true)
    }, waitTime)
  })
}

// Gets a record by the main ID
async function getEntryByPrimaryID(id) {
  return await base('Reviews').find(id)
}

router.get('/reset', function (req, res) {
  req.session.data = {}
  res.redirect('/')
})

router.get('/search', function (req, res) {
  var term = req.query.search_field
  axios.all([search(req.query.search_field)]).then(
    axios.spread((results) => {
      res.render('searchresults.html', { results, term })
    }),
  )
})

// OVERVIEW (HOMEPAGE)

router.get('/', function (req, res) {
  req.session.data['xday'] = 'Its Monday'
  res.redirect('/manage/')
})

// SETTINGS

// Add user

router.get('/settings/', function (req, res) {
  axios.all([getPeople('All')]).then(
    axios.spread((people) => {
      res.render('settings/index.html', {
        people,
      })
    }),
  )
})

router.get('/settings/add-user', function (req, res) {
  req.session.data = {}
  return res.render('settings/add-user.html')
})

router.post('/settings/add-user', function (req, res) {
  var name = req.body['person']
  var role = req.session.data['userrole']
  var profession = req.body['profession']
  var xgov = req.body['crossgov']

  console.log(name)
  console.log(role)
  console.log(profession)
  console.log(xgov)

  var containsLead = role.includes('Lead assessor')
  var containsAdmin = role.includes('Administrator')
  var containsAss = role.includes('Assessor')
  var containsJnr = role.includes('Junior assessor')

  var rolead = containsAdmin ? 'Administrator' : null

  console.log(rolead)

  base('Assessors').create(
    [
      {
        fields: {
          Name: name,
          AssessorRole: profession,
          CrossGovAssessor: xgov,
          Administrator: containsAdmin,
          Lead: containsLead,
          Assessor: containsAss,
          Junior: containsJnr,
          Role: rolead,
        },
      },
    ],
    { typecast: true },
    function (err, records) {
      if (err) {
        console.error(err)
        return
      }
      records.forEach(function (record) {
        console.log(record.fields.ID)
      })
    },
  )

  return res.redirect('/settings')
})

router.get('/settings/administrators', function (req, res) {
  axios.all([getPeople('Administrators')]).then(
    axios.spread((people) => {
      res.render('settings/administrators.html', {
        people,
      })
    }),
  )
})

router.get('/settings/lead', function (req, res) {
  axios.all([getPeople('Lead')]).then(
    axios.spread((people) => {
      res.render('settings/lead.html', {
        people,
      })
    }),
  )
})

router.get('/settings/junior', function (req, res) {
  axios.all([getPeople('Junior')]).then(
    axios.spread((people) => {
      res.render('settings/junior.html', {
        people,
      })
    }),
  )
})

router.get('/settings/assessors', function (req, res) {
  axios.all([getPeople('Assessors')]).then(
    axios.spread((people) => {
      res.render('settings/assessors.html', {
        people,
      })
    }),
  )
})

router.get('/settings/cross-gov', function (req, res) {
  axios.all([getPeople('XGov')]).then(
    axios.spread((people) => {
      res.render('settings/xgov.html', {
        people,
      })
    }),
  )
})

// BOOK
router.get('/book', function (req, res) {
  // req.session.data = {}

  req.session.data['retrieved'] = 'No'

  axios.all([getData('Draft')]).then(
    axios.spread((draftrecords) => {
      return res.render('book/index', {
        draftrecords,
      })
    }),
  )
})

// Saves the draft on submission of the service name
router.post('/book/service', function (req, res) {
  // Do we have a record in session?

  if (!req.session.data['title']) {
    var err = true
    return res.render('book/service/index', { err })
  }

  if (req.session.data['draftID']) {
    if (req.session.data['cya'] === 'true') {
      return res.redirect('/book/check')
    }

    return res.redirect('/book/summary')
  } else {
    base('Reviews').create(
      [
        {
          fields: {
            Name: req.session.data['title'],
            Status: 'Draft',
            RequestedBy: 'Andy Jones',
          },
        },
      ],
      { typecast: true },
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
          console.log(record.id)
          req.session.data['draftID'] = record.id
          return res.redirect('/book/summary')
        })
      },
    )
  }
})

router.post('/book/summary', function (req, res) {
  // Do we have a record in session?

  if (!req.session.data['purpose']) {
    var err = true
    return res.render('book/summary/index', { err })
  }

  var draftID = req.session.data['draftID']

  base('Reviews').update(
    [
      {
        id: draftID,
        fields: {
          Description: req.session.data['purpose'],
        },
      },
    ],
    { typecast: true },
    function (err, records) {
      if (err) {
        console.error(err)
        return
      }
      records.forEach(function (record) {
        console.log(record.fields.ID)

        if (req.session.data['cya'] === 'true') {
          return res.redirect('/book/check')
        } else {
          return res.redirect('/book/code')
        }
      })
    },
  )
})

router.post('/book/code', function (req, res) {
  if (!req.session.data['code']) {
    var err = true
    return res.render('book/code/index', { err })
  } else if (req.session.data['code'] === 'Yes' && !req.session.data['code_']) {
    var errcode = true
    return res.render('book/code/index', { errcode })
  }

  var draftID = req.session.data['draftID']

  var code =
    req.session.data['code'] === 'Yes' ? req.session.data['code_'] : null

  req.session.data['code_'] = code

  base('Reviews').update(
    [
      {
        id: draftID,
        fields: {
          ProjectCodeYN: req.session.data['code'],
          ProjectCode: code,
        },
      },
    ],
    { typecast: true },
    function (err, records) {
      if (err) {
        console.error(err)
        return
      }
      records.forEach(function (record) {
        console.log(record.fields.ID)
        if (req.session.data['cya'] === 'true') {
          return res.redirect('/book/check')
        } else {
          return res.redirect('/book/start-date')
        }
      })
    },
  )
})

router.get('/book/start-date', function (req, res) {
  if (process.env.abtest === 'b') {
    res.render('book/start-date/b')
  } else {
    res.render('book/start-date/index')
  }
})

router.post('/book/start-date', function (req, res) {
  if (process.env.abtest === 'b') {
    // Yes no and Date
    if (!req.session.data['disco-start']) {
      var err = true
      return res.render('book/start-date/b', { err })
    } else if (
      req.session.data['disco-start'] === 'Yes' &&
      (!req.session.data['disco-start-day'] ||
        !req.session.data['disco-start-month'] ||
        !req.session.data['disco-start-year'])
    ) {
      var errcode = true
      return res.render('book/start-date/b', { errcode })
    }
  } else {
    // Just date
    if (
      !req.session.data['disco-start-day'] ||
      !req.session.data['disco-start-month'] ||
      !req.session.data['disco-start-year']
    ) {
      var err = true
      return res.render('book/start-date/index', { err })
    }
  }

  return res.redirect('/book/end-date')
})

router.post('/book/end-date', function (req, res) {
  if (!req.session.data['disco-end']) {
    var err = true
    return res.render('book/end-date/index', { err })
  } else if (
    req.session.data['disco-end'] === 'Yes' &&
    (!req.session.data['disco-end-day'] ||
      !req.session.data['disco-end-month'] ||
      !req.session.data['disco-end-year'])
  ) {
    var errcode = true
    return res.render('book/end-date/index', { errcode })
  }

  return res.redirect('/book/dates')
})

router.get('/book/dates', function (req, res) {
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

  if (req.session.data['disco-end'] === 'No') {
    dates.push({
      week: weeks5.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
      }),
    })
    dates.push({
      week: weeks6.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
      }),
    })
    dates.push({
      week: weeks7.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
      }),
    })
    dates.push({
      week: weeks8.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
      }),
    })
    dates.push({
      week: weeks9.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
      }),
    })
    dates.push({
      week: weeks10.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
      }),
    })
  } else {
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
  }
  console.log(dates)

  req.session.data['dates'] = dates
  if (dates.length) {
    req.session.data['hasdates'] = 'yes'
  } else {
    req.session.data['hasdates'] = 'no'
  }
  console.log(req.session.data['hasdates'])
  res.render('book/dates/index.html', { dates })
})

router.post('/book/dates', function (req, res) {
  console.log(req.session.data['hasdates'])
  var dates = req.session.data['dates']
  var err = false

  if (
    req.session.data['hasdates'] === 'yes' &&
    !req.session.data['reviewWeek']
  ) {
    err = true
    return res.render('book/dates/index', { dates, err })
  } else {
    return res.redirect('/book/portfolio')
  }
})

router.post('/book/portfolio', function (req, res) {
  if (!req.session.data['portfolio']) {
    var err = true
    return res.render('book/portfolio/index', { err })
  }

  return res.redirect('/book/dd')
})

router.post('/book/dd', function (req, res) {
  if (!req.session.data['dd']) {
    var err = true
    return res.render('book/dd/index', { err })
  }

  return res.redirect('/book/sro')
})

router.post('/book/sro', function (req, res) {
  if (!req.session.data['sro']) {
    var err = true
    return res.render('book/sro/index', { err })
  } else if (
    req.session.data['sro'] === 'No' &&
    !req.session.data['sro-name']
  ) {
    var errcode = true
    return res.render('book/sro/index', { errcode })
  } else {
    return res.redirect('/book/bp')
  }
})

router.post('/book/bp', function (req, res) {
  if (!req.session.data['bp']) {
    var err = true
    return res.render('book/bp/index', { err })
  } else if (req.session.data['bp'] === 'Yes' && !req.session.data['bp-name']) {
    var errcode = true
    return res.render('book/bp/index', { errcode })
  } else {
    return res.redirect('/book/delivery')
  }
})

router.post('/book/delivery', function (req, res) {
  if (!req.session.data['dm']) {
    var err = true
    return res.render('book/delivery/index', { err })
  } else if (req.session.data['dm'] === 'Yes' && !req.session.data['dm-name']) {
    var errcode = true
    return res.render('book/delivery/index', { errcode })
  } else {
    return res.redirect('/book/product')
  }
})

router.post('/book/product', function (req, res) {
  if (!req.session.data['pm']) {
    var err = true
    return res.render('book/product/index', { err })
  } else if (req.session.data['pm'] === 'Yes' && !req.session.data['pm-name']) {
    var errcode = true
    return res.render('book/product/index', { errcode })
  } else {
    return res.redirect('/book/check')
  }
})

// Check page
router.get('/book/check', function (req, res) {
  // We want to know if people have got to this page so that the "change" route sends them back here and not to the next page in the jouurney
  req.session.data['cya'] = 'true'
  return res.render('book/check/index')
})

// On post create AirTable entry and send Notify message to submittor
router.post('/book/process-request', function (req, res) {
  // Send some emails through Notify

  // Create AirTable entry

  var endDate = null
  var startDate = null

  if (req.session.data['disco-end'] === 'Yes') {
    endDate =
      req.session.data['disco-end-month'] +
      '/' +
      req.session.data['disco-end-day'] +
      '/' +
      req.session.data['disco-end-year']
  }

  if (!req.session.data['disco-end']) {
    endDate =
      req.session.data['disco-end-month'] +
      '/' +
      req.session.data['disco-end-day'] +
      '/' +
      req.session.data['disco-end-year']
  }

  if (!req.session.data['disco-start']) {
    startDate =
      req.session.data['disco-start-month'] +
      '/' +
      req.session.data['disco-start-day'] +
      '/' +
      req.session.data['disco-start-year']
  }

  var requestedWeeks = ''

  requestedWeeks = req.session.data['reviewWeek']
    ? req.session.data['reviewWeek'].toString()
    : ''

  var draftID = req.session.data['draftID']

  var sroName = req.session.data['sro-name']

  if (req.session.data['sro'] === 'Yes') {
    sroName = req.session.data['dd']
  }

  base('Reviews').update(
    [
      {
        id: draftID,
        fields: {
          AssignedTo: 'Service Assessment Team',
          BusinessPartnerName: req.session.data['bp-name'],
          BusinessPartnerYN: req.session.data['bp'],
          DeliveryManagerName: req.session.data['dm-name'],
          DeliveryManagerYN: req.session.data['dm'],
          DeputyDirector: req.session.data['dd'],
          Description: req.session.data['purpose'],
          Name: req.session.data['title'],
          EndDate: endDate,
          EndDateYN: req.session.data['disco-end'],
          Portfolio: req.session.data['portfolio'],
          ProductManagerName: req.session.data['pm-name'],
          ProductManagerYN: req.session.data['pm'],
          ProjectCode: req.session.data['code_'],
          ProjectCodeYN: req.session.data['code'],
          RequestedWeeks: requestedWeeks,
          SROName: sroName,
          SROSameAsDD: req.session.data['sro'],
          StartDate: startDate,
          StartDateYN: req.session.data['disco-start'],
          Status: 'New',
          RequestedBy: 'Callum Mckay',
        },
      },
    ],
    { typecast: true },
    function (err, records) {
      if (err) {
        console.error(err)
        return
      }
      records.forEach(function (record) {
        console.log(record.fields.ID)

        notify
          .sendEmail(process.env.SATTemplateId, process.env.recipient, {
            personalisation: {
              title: record.fields.Name,
              summary: record.fields.Description,
              id: record.fields.ID,
            },
          })
          .then((response) =>
            console.log('Notification: ' + response.statusText),
          )
          .catch((err) => console.error(err))
      })
    },
  )

  req.session.data = {}
  // This is the URL the users will be redirected to once the email
  // has been sent
  res.redirect('/book/submitted')
})

// ADMIN

/// Root admin, redirect to the 'new' view route
/// /admin/
router.get('/admin', function (req, res) {
  axios
  .all([
    getData('New'),
    getData('Rejected'),
    getData('Active'),
    getData('Completed'),
    getData('Cancelled'),
  ])
  .then(
    axios.spread(
      (
        newrecords,
        rejectedrecords,
        activerecords,
        completedrecords,
        cancelledrecords,
      ) => {
        res.render('admin/index.html', {
          newrecords,
          rejectedrecords,
          activerecords,
          completedrecords,
          cancelledrecords
        })
      },
    ),
  )
})

/// Gets view by status of the requests
/// For example: /admin/rejected

router.get('/admin/:status', function (req, res) {
  var type = req.params.status

  axios
    .all([
      getData('New'),
      getData('Rejected'),
      getData('Active'),
      getData('Completed'),
      getData('Cancelled'),
    ])
    .then(
      axios.spread(
        (
          newrecords,
          rejectedrecords,
          activerecords,
          completedrecords,
          cancelledrecords,
        ) => {
          res.render('admin/index.html', {
            newrecords,
            rejectedrecords,
            activerecords,
            completedrecords,
            cancelledrecords,
            type,
          })
        },
      ),
    )
})

router.get('/admin/entry/rejected', function (req, res) {
  res.render('admin/entry/rejected.html')
})

router.get('/admin/dismiss-notification/:type/:id', function (req, res) {
  var type = req.params.type
  var id = req.params.id

  req.session.data[type + '-' + id] = {}

  if (type === 'choosedate') {
    return res.redirect('/admin/entry/providedates/' + id)
  }
})

router.post('/admin/send-notification/:type/:id', function (req, res) {
  var type = req.params.type
  var id = req.params.id

  if (type === 'choosedate') {
    // Sends notification to the requestor that they can now select a date
    notify
      .sendEmail(
        process.env.pick_some_dates_template_id,
        process.env.recipient,
        {
          personalisation: {
            id: id,
          },
        },
      )
      .then((response) => console.log('Notification: ' + response.statusText))
      .catch((err) => console.error(err))
  }

  req.session.data[type + '-' + id] = 'Message sent'
  return res.redirect('/admin/entry/providedates/' + id)
})

/// Entry record by ID
/// /admin/entry/1
router.get('/admin/entry/:id', async function (req, res) {
  var id = req.params.id
  var view = 'new'

  console.log(id)
  console.log(view)

  await wait(1000)

  axios
    .all([
      getDataByID(id),
      getTeam(id),
      getArtefacts(id),
      getPanel(id),
      getObservers(id),
      getDates(id)
    ])
    .then(
      axios.spread((entryx, team, artefacts, panel, observers, dates) => {
        entry = entryx[0]
        res.render('admin/entry/taskview.html', {
          entry,
          team,
          artefacts,
          view,
          panel,
          observers,
          dates
        })
      }),
    )
})

/// Gets a view for a given ID based on vertical nav select
/// For example, submission, tasks, peer review, supporting artefacts
/// /admin/entry/submission/1
router.get('/admin/entry/amend/:view/:id/:entry', function (req, res) {
  var id = req.params.id
  var view = req.params.view
  var entry = req.params.entry

  console.log('/admin/entry/amend/' + view + '/' + id + '/' + entry)

  axios
    .all([
      getDataByID(id),
      getPerson(entry),
      getArtefact(entry),
      getPanel(id),
      getObservers(id),
      getDate(entry),
    ])
    .then(
      axios.spread((entryx, person, artefact, panel, observers, datex) => {
        entry = entryx[0]
        res.render('admin/entry/amend/submissionvalue.html', {
          entry,
          person,
          artefact,
          view,
          panel,
          observers,
          datex,
        })
      }),
    )
})

// Saves the submission list value change
router.post('/admin/entry/amend/:view/:id/:entry', function (req, res) {
  var id = req.params.id
  var view = req.params.view
  var entry = req.params.entry

  console.log(view)

  if (view === 'add-date-option') {
    var optiondate, optiontime

    optiondate =
      req.session.data['available-month'] +
      '/' +
      req.session.data['available-day'] +
      '/' +
      req.session.data['available-year']

    //availabletime
    var tempTimes = req.session.data['availabletime']
    optiontime = req.session.data['availabletime'][0]

    if (tempTimes.length === 1) {
      base('ReviewDateOptions').create(
        [
          {
            fields: {
              Date: optiondate,
              ReviewID: parseInt(id),
              Time: optiontime,
            },
          },
        ],
        function (err, records) {
          if (err) {
            console.error(err)
            return
          }
          records.forEach(function (record) {
            console.log(record.get('ID'))
          })
        },
      )
    } else {
      tempTimes.forEach(function (time) {
        base('ReviewDateOptions').create(
          [
            {
              fields: {
                Date: optiondate,
                ReviewID: parseInt(id),
                Time: time,
              },
            },
          ],
          function (err, records) {
            if (err) {
              console.error(err)
              return
            }
            records.forEach(function (record) {
              console.log(record.get('ID'))
            })
          },
        )
      })
    }

    return res.redirect('/admin/entry/providedates/' + id)
  }

  if (view === 'remove-date-option') {
    base('ReviewDateOptions').destroy([entry], function (err, records) {
      if (err) {
        console.error(err)
        return
      }
      records.forEach(function (record) {
        console.log(record.get('ID'))
      })
    })
    return res.redirect('/admin/entry/providedates/' + id)
  }

  if (view === 'add-panel-member') {
    base('ReviewPanel').create(
      [
        {
          fields: {
            Name: req.body.team_,
            ReviewID: parseInt(id),
            Role: req.body.roleinteam,
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
          console.log(record.get('ID'))
        })
      },
    )
    return res.redirect('/admin/entry/panel/' + id)
  }

  if (view === 'remove-panel-member') {
    base('ReviewPanel').destroy([entry], function (err, records) {
      if (err) {
        console.error(err)
        return
      }
      records.forEach(function (record) {
        console.log(record.get('ID'))
      })
    })
    return res.redirect('/admin/entry/panel/' + id)
  }

  if (view === 'add-team-member') {
    base('ReviewTeam').create(
      [
        {
          fields: {
            Name: req.body.team_,
            ReviewID: parseInt(id),
            Role: req.body.roleinteam,
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
          console.log(record.get('ID'))
        })
      },
    )
    return res.redirect('/admin/entry/team/' + id)
  }

  if (view === 'remove-team-member') {
    base('ReviewTeam').destroy([entry], function (err, records) {
      if (err) {
        console.error(err)
        return
      }
      records.forEach(function (record) {
        console.log(record.get('ID'))
      })
    })
    return res.redirect('/admin/entry/team/' + id)
  }

  if (view === 'add-panel-observer') {
    base('ReviewObservers').create(
      [
        {
          fields: {
            Name: req.body.team_,
            ReviewID: parseInt(id),
            Role: req.body.roleinteam,
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
          console.log(record.get('ID'))
        })
      },
    )
    return res.redirect('/admin/entry/panel/' + id)
  }

  if (view === 'remove-panel-observer') {
    base('ReviewObservers').destroy([entry], function (err, records) {
      if (err) {
        console.error(err)
        return
      }
      records.forEach(function (record) {
        console.log(record.get('ID'))
      })
    })
    return res.redirect('/admin/entry/panel/' + id)
  }

  // update entry

  if (view === 'code') {
    base('Reviews').update(
      [
        {
          id: entry,
          fields: {
            ProjectCode: req.body.code_,
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
          console.log(record.get('ProjectCode'))
        })
      },
    )
  }

  if (view === 'title') {
    base('Reviews').update(
      [
        {
          id: entry,
          fields: {
            Name: req.body.title_,
            Description: req.body.purpose_,
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
          console.log(record.get('Name'))
        })
      },
    )
  }

  if (view === 'add-artefact') {
    base('Artefacts').create(
      [
        {
          fields: {
            Name: req.body.description,
            ReviewID: parseInt(id),
            URL: req.body.url,
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
          console.log(record.get('ID'))
        })
      },
    )
    return res.redirect('/admin/entry/files/' + id)
  }

  if (view === 'remove-artefact') {
    base('Artefacts').destroy([entry], function (err, records) {
      if (err) {
        console.error(err)
        return
      }
      records.forEach(function (record) {
        console.log(record.get('ID'))
      })
    })
    return res.redirect('/admin/entry/files/' + id)
  }

  if (view === 'dd') {
    base('Reviews').update(
      [
        {
          id: entry,
          fields: {
            DeputyDirector: req.body.dd,
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
          console.log(record.get('DeputyDirector'))
        })
      },
    )
  }

  if (view === 'delivery') {
    base('Reviews').update(
      [
        {
          id: entry,
          fields: {
            DeliveryManagerName: req.body.dm_,
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
          console.log(record.get('DeliveryManagerName'))
        })
      },
    )
  }

  if (view === 'product') {
    base('Reviews').update(
      [
        {
          id: entry,
          fields: {
            ProductManagerName: req.body.pm_,
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
          console.log(record.get('ProductManagerName'))
        })
      },
    )
  }

  if (view === 'bp') {
    base('Reviews').update(
      [
        {
          id: entry,
          fields: {
            BusinessPartnerName: req.body.bp_,
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
          console.log(record.get('BusinessPartnerName'))
        })
      },
    )
  }

  if (view === 'start-date') {
    startDate =
      req.session.data['disco-start-month'] +
      '/' +
      req.session.data['disco-start-day'] +
      '/' +
      req.session.data['disco-start-year']

    base('Reviews').update(
      [
        {
          id: entry,
          fields: {
            StartDate: startDate,
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
          console.log(record.get('StartDate'))
        })
      },
    )
  }

  if (view === 'end-date') {
    endDate =
      req.session.data['disco-end-month'] +
      '/' +
      req.session.data['disco-end-day'] +
      '/' +
      req.session.data['disco-end-year']

    base('Reviews').update(
      [
        {
          id: entry,
          fields: {
            EndDate: endDate,
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
          console.log(record.get('EndDate'))
        })
      },
    )
  }

  if (view === 'sro') {
    base('Reviews').update(
      [
        {
          id: entry,
          fields: {
            SROName: req.body.sroname_,
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
          console.log(record.get('SROName'))
        })
      },
    )
  }

  if (view === 'portfolio') {
    base('Reviews').update(
      [
        {
          id: entry,
          fields: {
            Portfolio: req.body.portfolio,
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
          console.log(record.get('Portfolio'))
        })
      },
    )
  }

  return res.redirect('/admin/entry/submission/' + id)
})

// Saves the team page value change
// EG: /admin/entry/amend-team/ur/1/fdvi3fr34f34g45
router.post('/admin/entry/amend-team/:view/:id/:entry', function (req, res) {
  var id = req.params.id
  var view = req.params.view
  var entry = req.params.entry

  // update entry

  if (view === 'ur') {
    base('Team').update(
      [
        {
          id: entry,
          fields: {
            ProjectCode: req.body.code_,
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
          console.log(record.get('ProjectCode'))
        })
      },
    )
  }

  return res.redirect('/admin/entry/team/' + id)
})

// Gets entry for submission list
router.get('/admin/entry/:view/:id', async function (req, res) {
  var id = req.params.id
  var view = req.params.view

  await wait(1500)

  axios
    .all([
      getDataByID(id),
      getTeam(id),
      getArtefacts(id),
      getPanel(id),
      getObservers(id),
      getDates(id),
    ])
    .then(
      axios.spread((entryx, team, artefacts, panel, observers, dates) => {
        entry = entryx[0]
        res.render('admin/entry/taskview.html', {
          entry,
          team,
          artefacts,
          view,
          panel,
          observers,
          dates,
        })
      }),
    )
})

/// Posts from actions
router.post('/admin/action/:view/:id/:entry', function (req, res) {
  var id = req.params.id
  var view = req.params.view
  var entry = req.params.entry

  console.log('/admin/action/' + view + '/' + id + '/' + entry)

  // Task action
  // Update the status of the review
  if (view === 'updateoutcome') {
    var outcome = req.body.outcomerag

    base('Reviews').update(
      [
        {
          id: entry,
          fields: {
            Outcome: outcome,
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
          console.log(record.get('Outcome'))
        })
      },
    )

    return res.redirect('/admin/entry/review/' + id)
  }

  // Change status of review

  if (view === 'start-peer-review') {
    if (req.body.openreport === 'Yes') {
      base('Reviews').update(
        [
          {
            id: entry,
            fields: {
              Status: 'Review',
            },
          },
        ],
        function (err, records) {
          if (err) {
            console.error(err)
            return
          }
          records.forEach(function (record) {
            console.log(record.get('Status'))
          })
        },
      )
    }

    return res.redirect('/admin/entry/' + id)
  }

  // Update the status of the review
  if (view === 'updatecomments') {
    var comments = req.body.review_comments

    base('Reviews').update(
      [
        {
          id: entry,
          fields: {
            ReviewComments: comments,
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
          console.log(record.get('ReviewComments'))
        })
      },
    )

    return res.redirect('/admin/entry/review/' + id)
  }

  if (view === 'process') {
    // This is the first task to accept or reject.

    if (req.body.action === 'accept') {
      // Update to accepted and redirect to the task list

      base('Reviews').update(
        [
          {
            id: entry,
            fields: {
              Status: 'Pre-Review',
              RejectedReason: null,
              RejectedDate: null,
            },
          },
        ],
        function (err, records) {
          if (err) {
            console.error(err)
            return
          }
          records.forEach(function (record) {
            console.log(record.get('Status'))
          })
        },
      )

      return res.redirect('/admin/entry/' + id)
    }

    if (req.body.action === 'reject_reason') {
      // redirect to the reject reason page

      return res.redirect('/admin/entry/reject_reason/' + id)
    }
  }

  if (view === 'reject') {
    // This is the reject reason page

    let now = new Date()
    now.toISOString()

    base('Reviews').update(
      [
        {
          id: entry,
          fields: {
            Status: 'Rejected',
            RejectedReason: req.body.reject_reason,
            RejectedDate: now,
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
          console.log(record.get('Status'))
        })
      },
    )
    return res.redirect('/admin/entry/rejected')
  }
})

// ANALYSIS

// Demo View

router.get('/analysis', function (req, res) {
  axios.all([getData('Grid view')]).then(
    axios.spread((entries) => {
      res.render('analysis/index.html', { entries })
    }),
  )
})

// Reports

/// Gets view of reports
/// For example: /reports

router.get('/reports', function (req, res) {
  var type = req.params.status

  axios.all([getData('Completed')]).then(
    axios.spread((entries) => {
      res.render('reports/index.html', {
        entries,
      })
    }),
  )
})

// Gets a report for a given ID
router.get('/report/:id', function (req, res) {
  var id = req.params.id

  axios.all([getDataByID(id)]).then(
    axios.spread((entryx) => {
      entry = entryx[0]
      return res.render('reports/report.html', {
        entry,
      })
    }),
  )
})

// MANAGE

router.get('/list', function (req, res) {
  axios.all([getData('All')]).then(
    axios.spread((all) => {
      res.render('list/index.html', {
        all,
      })
    }),
  )
})

router.get('/manage/', function (req, res) {
  var type = req.params.status

  axios
    .all([
      getData('Draft'),
      getData('New'),
      getData('Rejected'),
      getData('Active'),
      getData('Completed'),
      getData('Cancelled'),
    ])
    .then(
      axios.spread(
        (
          draftrecords,
          newrecords,
          rejectedrecords,
          activerecords,
          completedrecords,
          cancelledrecords,
        ) => {
          res.render('manage/index.html', {
            draftrecords,
            newrecords,
            rejectedrecords,
            activerecords,
            completedrecords,
            cancelledrecords,
            type,
          })
        },
      ),
    )
})

router.get('/manage/entry/:id', function (req, res) {
  var id = req.params.id
  var view = 'new'

  axios
    .all([
      getDataByID(id),
      getTeam(id),
      getArtefacts(id),
      getPanel(id),
      getObservers(id),
    ])
    .then(
      axios.spread((entryx, team, artefacts, panel, observers) => {
        entry = entryx[0]
        res.render('manage/entry/taskview.html', {
          entry,
          team,
          artefacts,
          view,
          panel,
          observers,
        })
      }),
    )
})

// Gets a report for a given ID
router.get('/manage/draft/:record', function (req, res) {
  var id = req.params.record

  axios.all([getEntryByPrimaryID(id)]).then(
    axios.spread((entry) => {
      console.log(entry)

      // Load the draft into session
      req.session.data['draftID'] = entry.id
      req.session.data['title'] = entry.fields.Name

      req.session.data['retrieved'] = 'Yes'

      return res.redirect('/book/check')
    }),
  )
})

/// Gets view by status of the requests
/// For example: /admin/rejected

router.get('/manage/:status', function (req, res) {
  var type = req.params.status

  axios
    .all([
      getData('Draft'),
      getData('New'),
      getData('Rejected'),
      getData('Active'),
      getData('Completed'),
      getData('Cancelled'),
    ])
    .then(
      axios.spread(
        (
          draftrecords,
          newrecords,
          rejectedrecords,
          activerecords,
          completedrecords,
          cancelledrecords,
        ) => {
          res.render('manage/index.html', {
            draftrecords,
            newrecords,
            rejectedrecords,
            activerecords,
            completedrecords,
            cancelledrecords,
            type,
          })
        },
      ),
    )
})

// Gets entry for submission list
router.get('/manage/entry/:view/:id', async function (req, res) {
  var id = req.params.id
  var view = req.params.view

  await wait(1500)

  axios
    .all([
      getDataByID(id),
      getTeam(id),
      getArtefacts(id),
      getPanel(id),
      getObservers(id),
    ])
    .then(
      axios.spread((entryx, team, artefacts, panel, observers) => {
        entry = entryx[0]
        res.render('manage/entry/taskview.html', {
          entry,
          team,
          artefacts,
          view,
          panel,
          observers,
        })
      }),
    )
})

/// Gets a view for a given ID based on vertical nav select
/// For example, submission, tasks, peer review, supporting artefacts
/// /manage/entry/submission/1
router.get('/manage/entry/amend/:view/:id/:entry', function (req, res) {
  var id = req.params.id
  var view = req.params.view
  var entry = req.params.entry

  console.log('/manage/entry/amend/' + view + '/' + id + '/' + entry)

  axios.all([getDataByID(id), getPerson(entry), getArtefact(entry)]).then(
    axios.spread((entryx, person, artefact) => {
      entry = entryx[0]
      res.render('manage/entry/amend/submissionvalue.html', {
        entry,
        person,
        artefact,
        view,
      })
    }),
  )
})

// Saves the submission list value change
router.post('/manage/entry/amend/:view/:id/:entry', function (req, res) {
  var id = req.params.id
  var view = req.params.view
  var entry = req.params.entry

  // update entry

  if (view === 'add-team-member') {
    base('ReviewTeam').create(
      [
        {
          fields: {
            Name: req.body.team_,
            ReviewID: parseInt(id),
            Role: req.body.roleinteam,
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
          console.log(record.get('ID'))
        })
      },
    )
    return res.redirect('/manage/entry/team/' + id)
  }

  if (view === 'remove-team-member') {
    base('ReviewTeam').destroy([entry], function (err, records) {
      if (err) {
        console.error(err)
        return
      }
      records.forEach(function (record) {
        console.log(record.get('ID'))
      })
    })
    return res.redirect('/manage/entry/team/' + id)
  }

  if (view === 'add-artefact') {
    base('Artefacts').create(
      [
        {
          fields: {
            Name: req.body.description,
            ReviewID: parseInt(id),
            URL: req.body.url,
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
          console.log(record.get('ID'))
        })
      },
    )
    return res.redirect('/manage/entry/files/' + id)
  }

  if (view === 'remove-artefact') {
    base('Artefacts').destroy([entry], function (err, records) {
      if (err) {
        console.error(err)
        return
      }
      records.forEach(function (record) {
        console.log(record.get('ID'))
      })
    })
    return res.redirect('/manage/entry/files/' + id)
  }

  if (view === 'code') {
    base('Reviews').update(
      [
        {
          id: entry,
          fields: {
            ProjectCode: req.body.code_,
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
          console.log(record.get('ProjectCode'))
        })
      },
    )
  }

  if (view === 'title') {
    base('Reviews').update(
      [
        {
          id: entry,
          fields: {
            Name: req.body.title_,
            Description: req.body.purpose_,
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
          console.log(record.get('Name'))
        })
      },
    )
  }

  if (view === 'dd') {
    base('Reviews').update(
      [
        {
          id: entry,
          fields: {
            DeputyDirector: req.body.dd_,
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
          console.log(record.get('DeputyDirector'))
        })
      },
    )
  }

  if (view === 'delivery') {
    base('Reviews').update(
      [
        {
          id: entry,
          fields: {
            DeliveryManagerName: req.body.dm_,
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
          console.log(record.get('DeliveryManagerName'))
        })
      },
    )
  }

  if (view === 'product') {
    base('Reviews').update(
      [
        {
          id: entry,
          fields: {
            ProductManagerName: req.body.pm_,
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
          console.log(record.get('ProductManagerName'))
        })
      },
    )
  }

  if (view === 'bp') {
    base('Reviews').update(
      [
        {
          id: entry,
          fields: {
            BusinessPartnerName: req.body.bp_,
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
          console.log(record.get('BusinessPartnerName'))
        })
      },
    )
  }

  if (view === 'start-date') {
    startDate =
      req.session.data['disco-start-month'] +
      '/' +
      req.session.data['disco-start-day'] +
      '/' +
      req.session.data['disco-start-year']

    base('Reviews').update(
      [
        {
          id: entry,
          fields: {
            StartDate: startDate,
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
          console.log(record.get('StartDate'))
        })
      },
    )
  }

  if (view === 'end-date') {
    endDate =
      req.session.data['disco-end-month'] +
      '/' +
      req.session.data['disco-end-day'] +
      '/' +
      req.session.data['disco-end-year']

    base('Reviews').update(
      [
        {
          id: entry,
          fields: {
            EndDate: endDate,
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
          console.log(record.get('EndDate'))
        })
      },
    )
  }

  if (view === 'sro') {
    base('Reviews').update(
      [
        {
          id: entry,
          fields: {
            SROName: req.body.sroname_,
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
          console.log(record.get('SROName'))
        })
      },
    )
  }

  if (view === 'portfolio') {
    base('Reviews').update(
      [
        {
          id: entry,
          fields: {
            Portfolio: req.body.portfolio,
          },
        },
      ],
      function (err, records) {
        if (err) {
          console.error(err)
          return
        }
        records.forEach(function (record) {
          console.log(record.get('Portfolio'))
        })
      },
    )
  }

  return res.redirect('/manage/entry/submission/' + id)
})

// Old Sprint 3 stuff

router.get('/sprint-3/request/start-date', function (req, res) {
  if (process.env.abtest === 'b') {
    res.redirect('/sprint-3/request/start-date/b')
  } else {
    res.redirect('/sprint-3/request/start-date/index')
  }
})

router.post('/sprint-3/request/process-request', function (req, res) {
  // Send some emails through Notify

  notify
    .sendEmail(process.env.SATTemplateId, process.env.recipient, {
      personalisation: {
        title: req.session.data['title'],
        summary: req.session.data['purpose'],
      },
    })
    .then((response) => console.log('Notification: ' + response.statusText))
    .catch((err) => console.error(err))

  // Create AirTable entry

  var endDate = null
  var startDate = null

  if (req.session.data['disco-end'] === 'Yes') {
    endDate =
      req.session.data['disco-end-month'] +
      '/' +
      req.session.data['disco-end-day'] +
      '/' +
      req.session.data['disco-end-year']
  }

  if (req.session.data['disco-start'] === 'Yes') {
    startDate =
      req.session.data['disco-start-month'] +
      '/' +
      req.session.data['disco-start-day'] +
      '/' +
      req.session.data['disco-start-year']
  }

  base('Reviews').create(
    [
      {
        fields: {
          AssignedTo: 'Service Assessment Team',
          BusinessPartnerName: req.session.data['bp-name'],
          BusinessPartnerYN: req.session.data['bp'],
          DeliveryManagerName: req.session.data['dm-name'],
          DeliveryManagerYN: req.session.data['dm'],
          DeputyDirector: req.session.data['dd'],
          Description: req.session.data['purpose'],
          DiscoveryName: req.session.data['title'],
          EndDate: endDate,
          EndDateYN: req.session.data['disco-end'],
          Portfolio: req.session.data['portfolio'],
          ProductManagerName: req.session.data['pm-name'],
          ProductManagerYN: req.session.data['pm'],
          ProjectCode: req.session.data['code_'],
          ProjectCodeYN: req.session.data['code'],
          RequestedWeeks: req.session.data['reviewWeek'],
          SROName: req.session.data['sro-name'],
          SROSameAsDD: req.session.data['sro'],
          StartDate: startDate,
          StartDateYN: req.session.data['disco-start'],
          Status: 'New',
        },
      },
    ],
    function (err, records) {
      if (err) {
        console.error(err)
        return
      }
      records.forEach(function (record) {
        console.log(record.getId())
      })
    },
  )

  // This is the URL the users will be redirected to once the email
  // has been sent
  res.redirect('/sprint-3/request/submitted')
})

router.get('/sprint-3/request/dd', function (req, res) {
  res.render('sprint-3/request/dd/index.html', {})
})

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

  if (req.session.data['disco-end'] === 'No') {
    dates.push({
      week: weeks5.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
      }),
    })
    dates.push({
      week: weeks6.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
      }),
    })
    dates.push({
      week: weeks7.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
      }),
    })
    dates.push({
      week: weeks8.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
      }),
    })
    dates.push({
      week: weeks9.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
      }),
    })
    dates.push({
      week: weeks10.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
      }),
    })
  } else {
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

// New

router.get('/sprint-3/new/12345', function (req, res) {
  res.render('sprint-3/new/index.html')
})

router.get('/sprint-3/new/12345-2', function (req, res) {
  res.render('sprint-3/new/index-2.html')
})

router.get('/sprint-3/new/12345-3', function (req, res) {
  res.render('sprint-3/new/index-3.html')
})

// Admin view (mikes)

router.get('/sprint-3/admin/', function (req, res) {
  base('Reviews')
    .select({
      view: 'New',
    })
    .eachPage(
      function page(records, fetchNextPage) {
        res.render('sprint-3/admin/index.html', { records })
      },
      function done(err) {
        if (err) {
          console.error(err)
          return
        }
      },
    )
})

router.get('/sprint-3/admin/new/tasks/:id', function (req, res) {
  base('Reviews').find(req.params.id, function (err, record) {
    if (err) {
      console.error(err)
      res.render('sprint-3/admin/new/tasks/index.html', { err })
    }
    res.render('sprint-3/admin/new/tasks/index.html', { record })
  })
})

router.get('/sprint-3/admin/new/submission/:id', function (req, res) {
  res.render('sprint-3/admin/new/submission/index.html', {})
})

router.post('/sprint-3/admin/new/submission/:id', function (req, res) {
  if (req.body.action === 'reject') {
    res.render('sprint-3/admin/reject/index.html', {})
  } else {
    req.session.data['active'] = 'true'
    res.redirect('/sprint-3/admin/manage/tasks/index.html')
  }
})

router.post('/sprint-3/admin/new/reject/:id', function (req, res) {
  // Deleted the request so lets show the view of what this now looks like
  req.session.data['rejected'] = 'true'
  res.redirect('/sprint-3/admin/reject/complete.html')
})

router.get('/sprint-3/admin/rejected/rejected-request/:id', function (
  req,
  res,
) {
  res.render('sprint-3/admin/rejected/rejected-request.html')
})

router.get('/sprint-3/admin/manage/tasks/:id', function (req, res) {
  res.render('sprint-3/admin/manage/tasks/index.html', {})
})

// Reporting

router.get('/sprint-3/reporting/report/:id', function (req, res) {
  res.render('sprint-3/reporting/report.html', {})
})

// manage active
router.get('/sprint-3/manage/active', function (req, res) {
  res.render('sprint-3/manage/active/index.html')
})

router.get('/sprint-3/manage/cancelled', function (req, res) {
  res.render('sprint-3/manage/cancelled/index.html')
})

router.get('/sprint-3/manage/completed', function (req, res) {
  res.render('sprint-3/manage/completed/index.html')
})

router.get('/sprint-3/manage/draft', function (req, res) {
  res.render('sprint-3/manage/index.html')
})

//Manage drafts

router.get('/sprint-3/manage/draft/:id', function (req, res) {
  res.render('sprint-3/manage/draft/index.html')
})

router.get('/sprint-3/manage/draft/sure/:id', function (req, res) {
  res.render('sprint-3/manage/draft/sure.html')
})

router.get('/sprint-3/manage/draft/deleted/:id', function (req, res) {
  res.render('sprint-3/manage/draft/deleted.html')
})

// Manage

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

router.get('/sprint-3/manage/panel/:id', function (req, res) {
  var artefacts = []
  if (req.session.data['artefacts'] !== undefined) {
    artefacts = req.session.data['artefacts']
  }
  res.render('sprint-3/manage/panel/index.html', { artefacts })
})

router.get('/sprint-3/manage/tasks/:id', function (req, res) {
  var artefacts = []
  if (req.session.data['artefacts'] !== undefined) {
    artefacts = req.session.data['artefacts']
  }

  if (req.params.id === 'IT18681') {
    res.render('sprint-3/manage/new/tasks/index.html', { artefacts })
  } else {
    res.render('sprint-3/manage/tasks/index.html', { artefacts })
  }
})

router.get('/sprint-3/manage/submission/:id', function (req, res) {
  var artefacts = []
  if (req.session.data['artefacts'] !== undefined) {
    artefacts = req.session.data['artefacts']
  }

  if (req.params.id === 'IT18681') {
    res.render('sprint-3/manage/new/submission/index.html', { artefacts })
  } else {
    res.render('sprint-3/manage/tasks/index.html', { artefacts })
  }
})

router.get('/sprint-3/manage/tasks/:id/2', function (req, res) {
  var artefacts = []
  if (req.session.data['artefacts'] !== undefined) {
    artefacts = req.session.data['artefacts']
  }
  res.render('sprint-3/manage/tasks/index-2.html', { artefacts })
})

router.get('/sprint-3/manage/tasks/:id/3', function (req, res) {
  var artefacts = []
  if (req.session.data['artefacts'] !== undefined) {
    artefacts = req.session.data['artefacts']
  }
  res.render('sprint-3/manage/tasks/index-3.html', { artefacts })
})

router.get('/sprint-3/manage/panel/edit-ur-panel/:id', function (req, res) {
  var artefacts = []
  if (req.session.data['artefacts'] !== undefined) {
    artefacts = req.session.data['artefacts']
  }
  res.render('sprint-3/manage/panel/edit-ur-panel.html', { artefacts })
})

router.post('/sprint-3/manage/panel/edit-ur-panel/:id', function (req, res) {
  notify
    .sendEmail(process.env.addedtopaneltemplateid, process.env.recipient, {
      personalisation: {
        discovery: 'School 4 day week',
        role: 'user researcher',
        date: '12 February 2023, 10am to 12pm',
      },
    })
    .then((response) => console.log(response))
    .catch((err) => console.error(err))

  // This is the URL the users will be redirected to once the email
  // has been sent
  res.redirect('/sprint-3/manage/panel/' + req.params.id)
})

router.get('/sprint-3/manage/review/submitted', function (req, res) {
  var artefacts = []
  if (req.session.data['artefacts'] !== undefined) {
    artefacts = req.session.data['artefacts']
  }
  res.render('sprint-3/manage/review/submitted/index.html', { artefacts })
})

router.get('/sprint-3/manage/review/12345-2', function (req, res) {
  var artefacts = []
  if (req.session.data['artefacts'] !== undefined) {
    artefacts = req.session.data['artefacts']
  }
  res.render('sprint-3/manage/review/index2.html', { artefacts })
})

router.get('/sprint-3/manage/review/:id', function (req, res) {
  var artefacts = []
  if (req.session.data['artefacts'] !== undefined) {
    artefacts = req.session.data['artefacts']
  }
  res.render('sprint-3/manage/review/index.html', { artefacts })
})

router.get('/sprint-3/manage/review/edit-outcome/:id', function (req, res) {
  var artefacts = []
  if (req.session.data['artefacts'] !== undefined) {
    artefacts = req.session.data['artefacts']
  }
  res.render('sprint-3/manage/review/edit-outcome/index.html', { artefacts })
})

router.get('/sprint-3/manage/review/edit-summary/:id', function (req, res) {
  var artefacts = []
  if (req.session.data['artefacts'] !== undefined) {
    artefacts = req.session.data['artefacts']
  }
  res.render('sprint-3/manage/review/edit-summary/index.html', { artefacts })
})

router.get('/sprint-3/manage/review/edit-comments/:id', function (req, res) {
  var artefacts = []
  if (req.session.data['artefacts'] !== undefined) {
    artefacts = req.session.data['artefacts']
  }
  res.render('sprint-3/manage/review/edit-comments/index.html', { artefacts })
})

router.get('/sprint-3/manage/review/edit-done-well/:id', function (req, res) {
  var artefacts = []
  if (req.session.data['artefacts'] !== undefined) {
    artefacts = req.session.data['artefacts']
  }
  res.render('sprint-3/manage/review/edit-done-well/index.html', { artefacts })
})

router.get('/sprint-3/manage/review/edit-improve/:id', function (req, res) {
  var artefacts = []
  if (req.session.data['artefacts'] !== undefined) {
    artefacts = req.session.data['artefacts']
  }
  res.render('sprint-3/manage/review/edit-improve/index.html', { artefacts })
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
  let month = date_ob.toLocaleString('default', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
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
    addedOn: month,
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
