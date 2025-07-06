const axios = require('axios')

exports.handler = async (event) => {
  const baseUrl = 'https://fd.api.iris.microsoft.com/v4/api/selection'

  const {
    placement = '88000820',
    fmt = 'json',
    locale = 'en-US',
    country = 'vi',
  } = event.queryStringParameters || {}

  const url = `${baseUrl}?placement=${placement}&fmt=${fmt}&locale=${locale}&country=${country}`

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'NetlifyProxyFunction/1.0',
      },
    })

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(response.data),
    }
  } catch (error) {
    return {
      statusCode: error.response?.status || 500,
      body: JSON.stringify({
        error: 'Failed to fetch from Microsoft API',
        message: error.message,
      }),
    }
  }
}
