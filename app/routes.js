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

// Gets a record by an ID
async function getDataByID(id) {
  return await base('Reviews')
    .select({ maxRecords: 1, filterByFormula: `{ID} = "${id}"` })
    .firstPage()
}


// BOOK

router.get('/book/start-date', function (req, res) {
  if (process.env.abtest === 'b') {
    res.redirect('/book/start-date/b')
  } else {
    res.redirect('/book/start-date/index')
  }
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
  res.render('book/dates/index.html', { dates })
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
          Name: req.session.data['title'],
          EndDate: endDate,
          EndDateYN: req.session.data['disco-end'],
          Portfolio: req.session.data['portfolio'],
          ProductManagerName: req.session.data['pm-name'],
          ProductManagerYN: req.session.data['pm'],
          ProjectCode: req.session.data['code_'],
          ProjectCodeYN: req.session.data['code'],
          RequestedWeeks: '--' + req.session.data['reviewWeek'],
          SROName: req.session.data['sro-name'],
          SROSameAsDD: req.session.data['sro'],
          StartDate: startDate,
          StartDateYN: req.session.data['disco-start'],
          Status: 'New',
          RequestedBy: 'Callum Mckay',
        },
      },
    ],
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
                title: req.session.data['title'],
                summary: req.session.data['purpose'],
                id: record.fields.ID
              },
            })
            .then((response) => console.log('Notification: ' + response.statusText))
            .catch((err) => console.error(err))
        
      })
    },
  )



  // This is the URL the users will be redirected to once the email
  // has been sent
  res.redirect('/book/submitted')
})

// ADMIN

/// Root admin, redirect to the 'new' view route
/// /admin/
router.get('/admin/', function (req, res) {
  return res.redirect('/admin/new')
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

/// Entry record by ID
/// /admin/entry/1
router.get('/admin/entry/:id', function (req, res) {
  var id = req.params.id
  var view = 'new'

  axios.all([getDataByID(id)]).then(
    axios.spread((entryx) => {
      entry = entryx[0]
      res.render('admin/entry/taskview.html', { entry, view })
    }),
  )
})

/// Gets a view for a given ID based on vertical nav select 
/// For example, submission, tasks, peer review, supporting artefacts
/// /admin/entry/submission/1
router.get('/admin/entry/:view/:id', function (req, res) {
  var id = req.params.id
  var view = req.params.view

  axios.all([getDataByID(id)]).then(
    axios.spread((entryx) => {
      entry = entryx[0]
      res.render('admin/entry/taskview.html', { entry, view })
    }),
  )
})

/// Posts from actions
router.post('/admin/action/:view/:id/:entry', function (req, res) {
  var id = req.params.id
  var view = req.params.view
  var entry = req.params.entry

  console.log('/admin/action/' + view + '/' + id + '/' + entry)

  console.log(req.body.action)

  // Task action
  // Update the status of the review
  if (view === 'updateoutcome'){

    var outcome = req.body.outcomerag

    base('Reviews').update(
      [
        {
          id: entry,
          fields: {
            Outcome: outcome
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



    // Update the status of the review
    if (view === 'updatecomments'){

      var comments = req.body.review_comments
  
      base('Reviews').update(
        [
          {
            id: entry,
            fields: {
              ReviewComments: comments
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




// Reports


/// Gets view of reports
/// For example: /reports

router.get('/reports', function (req, res) {
  var type = req.params.status

  axios
    .all([
      getData('Completed')
    ])
    .then(
      axios.spread(
        (
          entries
        ) => {
          res.render('reports/index.html', {
            entries
          })
        },
      ),
    )
})


// Gets a report for a given ID
router.get('/report/:id', function (req, res) {
  var id = req.params.id

  axios
    .all([
      getDataByID(id)
    ])
    .then(
      axios.spread(
        (
          entryx
        ) => {
entry = entryx[0]
          return res.render('reports/report.html', {
            entry
          })
        },
      ),
    )
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
          RequestedWeeks: '--' + req.session.data['reviewWeek'],
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
