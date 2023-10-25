const API_KEY = 'AIzaSyA_zTkixiP70AQDFFOAUQe_7NpgXzVIi1o';
const VIDEOS_URL = 'https://www.googleapis.com/youtube/v3/videos';
const SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';

const router = new Navigo('/', { hash: true });

const main = document.querySelector('main');

const favoritIds = JSON.parse(localStorage.getItem('favoriteYT') || '[]');

const preload = {
  elem: document.createElement('div'),
  text: '<p class="preload__text">Загружаем...</p>',
  append() {
    main.style.display = 'flex';
    main.style.margin = 'auto';
    main.append(this.elem)
  },
  remove() {
    this.elem.remove();
    main.style.display = '';
    main.style.margin = '';
  },
  init() {
    this.elem.classList.add('preload');
    this.elem.innerHTML = this.text;
  }
};

preload.init();

const convertedTime = (duration) => {
  const result = duration.replace('PT', '')
    .replace('H', ' ч ')
    .replace('M', ' мин ')
    .replace('S', ' сек');

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
      const videoList = document.querySelector('.video-list');
      // const main = document.querySelector('.video-list__title');
      // const videoSection = document.createElement('section');
      // videoSection.classList.add('video-list');
      // videoSection.innerHTML = `
      //   <div class="container">
      //     <p class="video-list__empty-text">Вы еще ничего не добавили в избранное</p>
      //   </div>
      // `;

      // main.append(videoSection);

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

const fetchSearchVideos = async (searchQuery, page) => {
  try {
    const url = new URL(SEARCH_URL);
    url.searchParams.append('part', 'snippet');
    url.searchParams.append('q', searchQuery);
    url.searchParams.append('type', 'video');
    url.searchParams.append('key', API_KEY);

    if (page) {
      url.searchParams.append('pageToken', page);
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error('error: ', error);
  }
};

const createListVideo = (videos, titleText, pagination) => {
  console.log('pagination: ', pagination);
  const videoListSection = document.createElement('section');
  videoListSection.classList.add('video-list');

  const container = document.createElement('div');
  container.classList.add('container');

  const title = document.createElement('h2');
  title.classList.add('video-list__title', 'title');
  title.textContent = titleText;

  const videoListItems = document.createElement('ul');
  videoListItems.classList.add('video-list__items');

  const listVideos = videos.items.map(video => {
    const li = document.createElement('li');
    li.classList.add('video-list__item');

    const id = video.id.videoId || video.id;

    li.innerHTML = `
      <article class="video-card">
        <a class="video-card__link" href="#/video/${id}">
          <img class="video-card__thumbnail" src="${
            video.snippet.thumbnails.maxres?.url ||
            video.snippet.thumbnails.high?.url
          }" alt="Превью видео ${video.snippet.title}">
          <h3 class="video-card__title">${video.snippet.title}</h3>
          <p class="video-card__channel">${video.snippet.channelTitle}</p>
          ${video.contentDetails ? `<p class="video-card__duration">${convertedTime(video.contentDetails.duration)}</p>` : ''}
        </a>

        <button class="video-card__favorite favorite 
          ${
            favoritIds.includes(id) ? 'active' : ''
          }" type="button"
          aria-label="Добавить в избранное, ${video.snippet.title}"
          data-video-id="${id}">
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

  container.append(title, videoListItems);
  videoListSection.append(container);

  if (pagination) {
    const paginationElem = document.createElement('div');
    paginationElem.classList.add('pagination');

    if (pagination.prev) {
      const arrowPrev = document.createElement('a');
      arrowPrev.classList.add('pagination__arrow', 'pagination__arrow_prev');
      arrowPrev.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8.02542 10L12.8754 5.63902C12.9154 5.60387 12.9469 5.56215 12.9683 5.51626C12.9897 5.47037 13.0005 5.42122 13 5.37167C12.9995 5.32212 12.9878 5.27314 12.9656 5.22756C12.9433 5.18199 12.911 5.14073 12.8704 5.10617C12.8298 5.07161 12.7818 5.04444 12.7291 5.02623C12.6764 5.00802 12.6201 4.99912 12.5635 5.00007C12.5069 5.00101 12.451 5.01177 12.3992 5.03173C12.3473 5.05168 12.3005 5.08043 12.2615 5.11632L7.12133 9.73865C7.04353 9.80862 7 9.90238 7 10C7 10.0976 7.04353 10.1914 7.12133 10.2613L12.2615 14.8837C12.3005 14.9196 12.3473 14.9483 12.3992 14.9683C12.451 14.9882 12.5069 14.999 12.5635 14.9999C12.6201 15.0009 12.6764 14.992 12.7291 14.9738C12.7818 14.9556 12.8298 14.9284 12.8704 14.8938C12.911 14.8593 12.9433 14.818 12.9656 14.7724C12.9878 14.7269 12.9995 14.6779 13 14.6283C13.0005 14.5788 12.9897 14.5296 12.9683 14.4837C12.9469 14.4379 12.9154 14.3961 12.8754 14.361L8.02542 10Z" fill="black"/>
        </svg>
      `;
      arrowPrev.href = `#search?q=${pagination.searchQuery}&page=${pagination.prev}`;

      paginationElem.append(arrowPrev);
    }

    if (pagination.next) {
      const arrowNext = document.createElement('a');
      arrowNext.classList.add('pagination__arrow', 'pagination__arrow_next');
      arrowNext.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11.9746 10L7.12457 5.63902C7.08464 5.60387 7.05307 5.56215 7.03169 5.51626C7.01031 5.47037 6.99954 5.42122 7.00001 5.37167C7.00048 5.32212 7.01218 5.27314 7.03443 5.22756C7.05668 5.18199 7.08904 5.14073 7.12963 5.10617C7.17022 5.07161 7.21824 5.04444 7.27092 5.02623C7.32359 5.00802 7.37987 4.99912 7.4365 5.00007C7.49313 5.00101 7.54898 5.01177 7.60082 5.03173C7.65266 5.05168 7.69947 5.08043 7.73853 5.11632L12.8787 9.73865C12.9565 9.80862 13 9.90238 13 10C13 10.0976 12.9565 10.1914 12.8787 10.2613L7.73853 14.8837C7.69947 14.9196 7.65266 14.9483 7.60082 14.9683C7.54898 14.9882 7.49313 14.999 7.4365 14.9999C7.37987 15.0009 7.32359 14.992 7.27092 14.9738C7.21824 14.9556 7.17022 14.9284 7.12963 14.8938C7.08904 14.8593 7.05668 14.818 7.03443 14.7724C7.01218 14.7269 7.00048 14.6779 7.00001 14.6283C6.99954 14.5788 7.01031 14.5296 7.03169 14.4837C7.05307 14.4379 7.08464 14.3961 7.12457 14.361L11.9746 10Z" fill="black"/>
        </svg>    
      `;
      arrowNext.href = `#search?q=${pagination.searchQuery}&page=${pagination.next}`;

      paginationElem.append(arrowNext);
    }

    videoListSection.append(paginationElem);
  }

  return videoListSection;
};

const createVideo = (video) => {
   const videoSection = document.createElement('section');
   videoSection.classList.add('video');

   videoSection.innerHTML = `
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

   return videoSection;
};

const createHeader = () => {
  const header = document.querySelector('.header');

  if (header) {
    return header;
  };

  const headerElem = document.createElement('header');
  headerElem.classList.add('header');
  headerElem.innerHTML = `
    <div class="container header__container">
      <a class="header__link" href="#">
        <svg class="header__logo" role="img" aria-label="Логотип видеохостинга You-Tvideo">
          <use xlink:href="./img/sprite.svg#logo-orange" />
        </svg>
      </a>

      <a class="header__link header__link_favorite" href="#/favorite">
        <span>Избранное</span>
        <svg class="header__icon">
          <use xlink:href="./img/sprite.svg#star-ob" />
        </svg>
      </a>
    </div>
  `;

  return headerElem;
};

const createHero = () => {
  const header = document.querySelector('.header');
  if (header) {
    header.remove();
  }

  const heroSection = document.createElement('section');
  heroSection.classList.add('hero');
  heroSection.innerHTML = `
    <div class="container">
      <div class="hero__container">
        <a class="hero__link" href="#/favorite">
          <span>Избранное</span>
          <svg class="hero__icon">
            <use xlink:href="./img/sprite.svg#star-ow" />
          </svg>
        </a>

        <svg class="hero__logo" role="img" aria-label="Логотип видеохостинга You-Tvideo">
          <use xlink:href="./img/sprite.svg#logo-white" />
        </svg>

        <h1 class="hero__title">Смотри. Загружай. Создавай</h1>

        <p class="hero__tagline">Удобный видеохостинг для тебя</p>
      </div>
    </div>
  `;

  return heroSection;
};

const createSearch = () => {
  const searchSection = document.createElement('section');
  searchSection.classList.add('search');

  const container = document.createElement('div');
  container.classList.add('container');

  const title = document.createElement('h2');
  title.classList.add('visually-hidden');
  title.textContent = 'Поиск видео';

  const form = document.createElement('form');
  form.classList.add('search__form');
  form.innerHTML = `
    <input class="search__input" type="search" name="search" placeholder="Найти видео..." required>
    <button class="search__btn" type="submit">поиск
      <svg class="search__icon">
        <use xlink:href="./img/sprite.svg#search" />
      </svg>
    </button>
  `;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (form.search.value.trim()) {
      router.navigate(`/search?q=${form.search.value}`)
    }
  });

  container.append(title, form);
  searchSection.append(container);

  return searchSection;
};

const indexRoute = async () => {
  main.textContent = '';
  preload.append();

  const hero = createHero();
  const search = createSearch();
  const videos = await fetchTrendingVideos();

  preload.remove();
  const listVideo = createListVideo(videos, 'В тренде');
  main.append(hero, search, listVideo);
};

const videoRoute = async (ctx) => {
  const id = ctx.data.id;

  main.textContent = '';
  preload.append();
  document.body.prepend(createHeader());
  const search = createSearch();
  const data = await fetchVideoData(id);
  const video = data.items[0];

  preload.remove();
  const videoSection = createVideo(video);
  main.append(search, videoSection);

  const searchQuery = video.snippet.title;
  const videos = await fetchSearchVideos(searchQuery);
  const listVideo = createListVideo(videos, 'Похожие видео');
  main.append(listVideo);
};

const favoriteRoute = async () => {
  document.body.prepend(createHeader());
  main.textContent = '';
  preload.append();

  const search = createSearch();
  const videos = await fetchFavoriteVideos();
  
  preload.remove();
  const listVideo = createListVideo(videos, 'Избранное');
  main.append(search, listVideo);
};

const searchRoute = async (ctx) => {
  const searchQuery = ctx.params.q;
  const page = ctx.params.page;

  if (searchQuery) {
    document.body.prepend(createHeader());
    main.textContent = '';
    preload.append();

    const search = createSearch();
    const videos = await fetchSearchVideos(searchQuery, page);
    
    preload.remove();

    const listVideo = createListVideo(videos, 'Результаты поиска', {
      searchQuery,
      next: videos.nextPageToken,
      prev: videos.prevPageToken,
    });

    main.append(search, listVideo);
  }
};

const init = () => {
  router
    .on({
      '/': indexRoute,
      '/video/:id': videoRoute,
      '/favorite': favoriteRoute,
      '/search': searchRoute,
    })
    .resolve();

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