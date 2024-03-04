const APP_NAME = 'Curious Crowd'

export default function getPageTitle({ pageTitle, isAppNameIncluded = true }) {
  let finalPageTitle = pageTitle

  if (isAppNameIncluded) {
    finalPageTitle += ` | ${APP_NAME}`
  }

  return finalPageTitle
}
