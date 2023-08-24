const list = document.querySelector('ul')
const auth = process.env.AUTH
const form = document.querySelector('form')
const input = document.querySelector('input[type="text"]')
const button = document.querySelector('button')

form.addEventListener('submit', async (e) => {
  e.preventDefault()

  const pattern = /list=([A-Za-z0-9_-]+)/;

  const match = input.value.match(pattern);
  if (match) {
      const playlistId = match[1];  // This will hold the extracted playlist ID
      populateList(playlistId, auth)
  } else {
      populateList(input.value, auth)
  }
})

input.addEventListener('keyup', (e) => {
  if (e.key === 'Enter') {
    input.blur()
  }
})

async function getAllPlaylistItems(apiKey, playlistId) {
  const baseUrl = 'https://www.googleapis.com/youtube/v3/playlistItems'
  const allItems = []

  try {
    let nextPageToken = null

    do {
      let params = new URLSearchParams({
        part: 'snippet',
        playlistId: playlistId,
        maxResults: 50,
        key: apiKey
      })

      if (nextPageToken) {
        params.append('pageToken', nextPageToken)
      }

      const response = await fetch(`${baseUrl}?${params.toString()}`)
      console.log(response);
      const data = await response.json()

      allItems.push(...data.items)

      nextPageToken = data.nextPageToken
    } while (nextPageToken)

    return allItems
  } catch (error) {
    isNotSubmitting()
    alert('Error: Invalid playlist ID or playlist is set to private')
    return null
  }
}

async function countVideosFromChannel(playlist) {
  const channelCount = {}

  playlist.forEach((item) => {
    if (item.snippet.videoOwnerChannelId) {
      if (channelCount[item.snippet.videoOwnerChannelId]) {
        channelCount[item.snippet.videoOwnerChannelId].count++
      } else {
        channelCount[item.snippet.videoOwnerChannelId] = {
          count: 1,
          title: item.snippet.videoOwnerChannelTitle
        }
      }
    }
  })

  //sort by count
  const sortable = Object.fromEntries(
    Object.entries(channelCount).sort(([, a], [, b]) => b.count - a.count)
  )

  return sortable
}

async function getChannel(apiKey, channelId) {
  const baseUrl = 'https://www.googleapis.com/youtube/v3/channels'

  try {
    const params = new URLSearchParams({
      part: 'snippet',
      id: channelId,
      key: apiKey
    })

    const response = await fetch(`${baseUrl}?${params.toString()}`)
    const data = await response.json()

    return data
  } catch (error) {
    isNotSubmitting()
    alert('Error:', error)
    return null
  }
}

async function populateList(playlistId, auth) {
  isSubmitting()
  const playlist = await getAllPlaylistItems(auth, playlistId)


  if (playlist) {
    const videoCount = await countVideosFromChannel(playlist)

    async function fetchChannelDetails(auth, channelId) {
      try {
        const details = await getChannel(auth, channelId)
        return details
      } catch (error) {
        isNotSubmitting()
        alert('Error fetching channel details:', error)
        return null
      }
    }

    ;(async () => {
      for (const channelId of Object.keys(videoCount)) {
        const channel = videoCount[channelId]
        const details = await fetchChannelDetails(auth, channelId)
        const channelURL = `https://www.youtube.com/channel/${channelId}`
        let profileImage = details?.items[0]?.snippet?.thumbnails?.default?.url

        const listItem = /*html*/ `
          <li class="flex items-center justify-between group mb-2">
            <a href="${channelURL}" target="_blank" class="flex items-center justify-between w-full group-hover:text-blue-400">
              <div class="flex items-center gap-6">
                <img src="${profileImage}" alt="${channel.title}" onerror="this.src='https://ui-avatars.com/api/?name=${channel.title}&background=random'" class="rounded-full" width="50" height="50">
                <p>${channel.title}</p>
              </div>
              <p><b>${channel.count}</b></p>
            </a>
          </li>
        `
        list.insertAdjacentHTML('beforeend', listItem)
      }

      isNotSubmitting()
    })()
  }
}


function isSubmitting() {
  button.disabled = true
  const loading = document.querySelector('#loading')
  const submitText = document.querySelector('button p')
  submitText.classList.add('hidden')
  loading.classList.remove('hidden')
}

function isNotSubmitting() {
  const loading = document.querySelector('#loading')
  const submitText = document.querySelector('button p')
  loading.classList.add('hidden')
  submitText.classList.remove('hidden')
  button.disabled = false
}