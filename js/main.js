const API_KEY = 'AIzaSyA_zTkixiP70AQDFFOAUQe_7NpgXzVIi1o';
const VIDEOS_URL = 'https://www.googleapis.com/youtube/v3/videos';
const SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';

const favoritIds = JSON.parse(localStorage.getItem('favoriteYT') || '[]');

const videoListItems = document.querySelector('.video-list__items');

// конвертация времени, 1й способ
const convertedTime = (duration) => {
  let time = duration.slice(2);
  time = time.replace('H', ' ч ');
  time = time.replace('M', ' мин ');
  time = time.replace('S', ' сек');

  return time.trim();
};

// конвертация времени, 2й способ
const convertISOToReadableDuration = (isoDuration) => {
  const hoursMatch = isoDuration.match(/(\d+)H/);
  const minutesMatch = isoDuration.match(/(\d+)M/);
  const secondsMatch = isoDuration.match(/(\d+)S/);

  const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
  const seconds = secondsMatch ? parseInt(secondsMatch[1]) : 0;

  let result = '';

  if (hours > 0) {
    result += `${hours} ч `;
  }

  if (minutes > 0) {
    result += `${minutes} мин `;
  }

  if (seconds > 0) {
    result += `${seconds} сек`;
  }

  return result.trim();
};

const formateDate = (isoString) => {
   const date = new Date(isoString);

   const formatter = new Intl.DateTimeFormat('ru-Ru', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
   });

   return formatter.format(date);
}

const fetchTrendingVideos = async () => {
  try {
    const url = new URL(VIDEOS_URL);
    url.searchParams.append('part', 'contentDetails,id,snippet');
    url.searchParams.append('chart', 'mostPopular');
    url.searchParams.append('regionCode', 'RU');
    url.searchParams.append('maxResults', 12);
    url.searchParams.append('key', API_KEY);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error('error: ', error);
  }
};

const fetchFavoriteVideos = async () => {
  try {
    if (favoritIds.length === 0) {
      return { items: [] };
    }

    const url = new URL(VIDEOS_URL);
    url.searchParams.append('part', 'contentDetails,id,snippet');
    url.searchParams.append('maxResults', 12);
    url.searchParams.append('id', favoritIds.join(','));
    url.searchParams.append('key', API_KEY);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error('error: ', error);
  }
};

const fetchVideoData = async (id) => {
  try {
    const url = new URL(VIDEOS_URL);
    url.searchParams.append('part', 'snippet,statistics');
    url.searchParams.append('id', id);
    url.searchParams.append('key', API_KEY);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error('error: ', error);
  }
};

const displayListVideo = (videos) => {
  videoListItems.textContent = '';

  const listVideos = videos.items.map(video => {
    const li = document.createElement('li');
    li.classList.add('video-list__item');

    li.innerHTML = `
      <article class="video-card">
        <a class="video-card__link" href="/video.html?id=${video.id}">
          <img class="video-card__thumbnail" src="${
            video.snippet.thumbnails.maxres?.url ||
            video.snippet.thumbnails.high?.url
          }" alt="Превью видео ${video.snippet.title}">
          <h3 class="video-card__title">${video.snippet.title}</h3>
          <p class="video-card__channel">${video.snippet.channelTitle}</p>
          <p class="video-card__duration">${convertedTime(video.contentDetails.duration)}</p>
        </a>

        <button class="video-card__favorite favorite 
          ${
            favoritIds.includes(video.id) ? 'active' : ''
          }" type="button"
          aria-label="Добавить в избранное, ${video.snippet.title}"
          data-video-id="${video.id}">
          <svg class="video-card__icon">
            <use class="video-card__star-white" xlink:href="./img/sprite.svg#star-white" />
            <use class="video-card__star-orange" xlink:href="./img/sprite.svg#star-orange" />
          </svg>
        </button>
      </article>
    `;

    return li;
  });

  videoListItems.append(...listVideos);
};

const displayVideo = ({ items: [video] }) => {
   const videoElem = document.querySelector('.video')
   videoElem.innerHTML = `
    <div class="container">
      <div class="video__player">
        <iframe class="video__iframe" src="https://www.youtube.com/embed/${video.id}"
          title="YouTube video player"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen>
        </iframe>
      </div>

      <div class="video__container">
        <div class="video__content">
          <h2 class="video__title">${video.snippet.title}</h2>

          <p class="video__channel">${video.snippet.channelTitle}</p>

          <p class="video__info">
            <span class="video__views">${parseInt(video.statistics.viewCount).toLocaleString()} просмотр</span>
            <span class="video__date">Дата премьеры: ${formateDate(video.snippet.publishedAt)}</span>
          </p>

          <p class="video__description">${video.snippet.description}</p>
        </div>

        <button class="video__link favorite
          ${
            favoritIds.includes(video.id) ? 'active' : ''
          }" 
          type="button"
          data-video-id="${video.id}"
        >
          <span class="video__no-favorite">В избранное</span>
          <span class="video__in-favorit">В избранном</span>
          <svg class="video__icon">
            <use class="video__icon-in" xlink:href="./img/sprite.svg#star-orange" />
            <use class="video__icon-no" xlink:href="./img/sprite.svg#star-ob" />
          </svg>
        </button>
      </div>
    </div>
   `;
}

const init = () => {
  const currentPage = location.pathname.split('/').pop();
  
  const urlSearchParams = new URLSearchParams(location.search);
  const videoId = urlSearchParams.get('id');
  const searchQuery = urlSearchParams.get('q');

  if (currentPage === 'index.html' || currentPage === '') {
    fetchTrendingVideos().then(displayListVideo);
  } else if (currentPage === 'video.html' && videoId) {
    fetchVideoData(videoId).then(displayVideo);
  } else if (currentPage === 'favorite.html') {
    fetchFavoriteVideos().then(displayListVideo);
  } else if (currentPage === 'search.html' && searchQuery) {
    
  }

  document.body.addEventListener('click', ({target}) => {
    const itemFavorite = target.closest('.favorite');

    if (itemFavorite) {
      const videoId = itemFavorite.dataset.videoId;
      
      if (favoritIds.includes(videoId)) {
        favoritIds.splice(favoritIds.indexOf(videoId), 1);
        localStorage.setItem('favoriteYT', JSON.stringify(favoritIds));
        itemFavorite.classList.remove('active');
      } else {
        favoritIds.push(videoId);
        localStorage.setItem('favoriteYT', JSON.stringify(favoritIds));
        itemFavorite.classList.add('active');
      }
    }
  });

};

init();