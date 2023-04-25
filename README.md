# MilkShake

A lightweight RememberTheMilk visualization tool that lets you view your tasks on the calendar as well as other stats and metrics.

## Dependencies

- `md5` - used for signing RememberTheMilk API requests
- `dayz` ([github](https://github.com/nathanstitt/dayz), [demo](https://github.com/nathanstitt/dayz/blob/master/demo.jsx)) - 
  - `node-sass` - dependency for compiling .scss which is needed for rendering dayz calendars
- `react-bootstrap` ([github](https://react-bootstrap.github.io))
- `gh-pages` - used for github pages deployment
- [font awesome](https://fontawesome.com/v4/examples/)
- RememberTheMilk API - mostly the [task API](https://www.rememberthemilk.com/services/milkscript/methods/?ctx=rtm.Task#getList)

## Development

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app)

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### Deploy to GitHub pages

Run `npm run deploy`. This will build your app and deploy it to the `gh-pages` branch of your GitHub repository.

## Appendix

- RememberTheMilk communicated created libraries: https://www.rememberthemilk.com/dairy
- MilkScripts: https://www.rememberthemilk.com/services/milkscript/quickstarts/monthlystats.rtm
- RememberTheMilk API authentication reference: https://www.rememberthemilk.com/services/api/authentication.rtm
- Advanced search filters: https://www.rememberthemilk.com/help/?ctx=basics.search.advanced

